import { useQuery } from '@tanstack/react-query';
import { Contact, GraduationCap, Loader2, UserRoundPlus, Users, Users2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { groupsApi } from '~/api/groups';
import { mentorsApi } from '~/api/mentors';
import { studentsApi } from '~/api/students';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
  CommandSeparator,
  CommandItem,
} from '~/components/ui/command';
import { Action } from '~/config/actions';
import { getSidebarConfig, getVisibleNavigation, type NavItem } from '~/config/navigation';
import { canAccess } from '~/config/permissions';
import { useCan } from '~/hooks/useCan';
import { useDebounce } from '~/hooks/useDebounce';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PageEntry {
  title: string;
  url: string;
  icon?: NavItem['icon'];
}

const MIN_SEARCH_LENGTH = 2;

/**
 * Global Ctrl+K palette. There is no backend search endpoint — pages are
 * filtered client-side from the sidebar config (RBAC via getVisibleNavigation),
 * entities are searched through the existing paginated list endpoints.
 */
export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { can, role } = useCan();

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query);
  const search = debouncedQuery.trim();
  const searchEnabled = open && search.length >= MIN_SEARCH_LENGTH;

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pages = useMemo(() => {
    const flat: PageEntry[] = [];
    const walk = (items: NavItem[]) => {
      for (const item of items) {
        if (item.url && !item.comingSoon) flat.push({ title: item.title, url: item.url, icon: item.icon });
        if (item.items) walk(item.items);
      }
    };
    walk(getVisibleNavigation(getSidebarConfig(t), can));
    return flat;
  }, [t, role]);

  const filteredPages = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pages;
    return pages.filter((page) => page.title.toLowerCase().includes(q));
  }, [pages, query]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const quickActions = useMemo(
    () =>
      [
        { label: t('palette.createStudent'), url: '/students/create', action: Action.STUDENTS_CREATE, icon: UserRoundPlus },
        { label: t('palette.createGroup'), url: '/groups/create', action: Action.GROUPS_CREATE, icon: Users2 },
        { label: t('palette.createMentor'), url: '/mentors/create', action: Action.MENTORS_CREATE, icon: GraduationCap },
        { label: t('palette.createEmployee'), url: '/employees/create', action: Action.EMPLOYEES_CREATE, icon: Contact },
      ].filter((item) => can(item.action)),
    [t, role]
  );

  const filteredActions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return quickActions;
    return quickActions.filter((item) => item.label.toLowerCase().includes(q));
  }, [quickActions, query]);

  const studentsQuery = useQuery({
    queryKey: ['palette-students', search],
    queryFn: () => studentsApi.getAll(1, 5, [{ key: 'fullName', value: search }]),
    enabled: searchEnabled && !!role && canAccess(role, '/students'),
    staleTime: 30_000,
  });

  const groupsQuery = useQuery({
    queryKey: ['palette-groups', search],
    queryFn: () => groupsApi.getAll(1, 5, [{ key: 'Name', value: search }]),
    enabled: searchEnabled && !!role && canAccess(role, '/groups'),
    staleTime: 30_000,
  });

  const mentorsQuery = useQuery({
    queryKey: ['palette-mentors', search],
    queryFn: () => mentorsApi.getAll(1, 5, [{ key: 'FullName', value: search }]),
    enabled: searchEnabled && !!role && canAccess(role, '/mentors'),
    staleTime: 30_000,
  });

  const students = searchEnabled ? (studentsQuery.data?.data ?? []) : [];
  const groups = searchEnabled ? (groupsQuery.data?.data ?? []) : [];
  const mentors = searchEnabled ? (mentorsQuery.data?.data ?? []) : [];
  const isSearching =
    searchEnabled && (studentsQuery.isFetching || groupsQuery.isFetching || mentorsQuery.isFetching);
  const hasEntityResults = students.length > 0 || groups.length > 0 || mentors.length > 0;

  const go = (url: string) => {
    onOpenChange(false);
    navigate(url);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      className="top-[15%] sm:top-1/3 sm:max-w-xl"
      title={t('palette.trigger')}>
      <Command shouldFilter={false}>
        <CommandInput value={query} onValueChange={setQuery} placeholder={t('palette.placeholder')} autoFocus />
        <CommandList>
          {!isSearching && filteredPages.length === 0 && filteredActions.length === 0 && !hasEntityResults && (
            <CommandEmpty>{t('palette.empty')}</CommandEmpty>
          )}

          {filteredActions.length > 0 && (
            <CommandGroup heading={t('palette.actions')}>
              {filteredActions.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem key={`action-${item.url}`} value={`action-${item.url}`} onSelect={() => go(item.url)}>
                    <Icon />
                    <span>{item.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}

          {filteredActions.length > 0 && filteredPages.length > 0 && <CommandSeparator />}

          {filteredPages.length > 0 && (
            <CommandGroup heading={t('palette.pages')}>
              {filteredPages.map((page) => {
                const Icon = page.icon;
                return (
                  <CommandItem key={`page-${page.url}`} value={`page-${page.url}`} onSelect={() => go(page.url)}>
                    {Icon && <Icon />}
                    <span>{page.title}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}

          {query.trim().length > 0 && query.trim().length < MIN_SEARCH_LENGTH && (
            <p className="text-muted-foreground text-2xs px-3 py-2">{t('palette.searchHint')}</p>
          )}

          {isSearching && (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-4 text-sm">
              <Loader2 className="size-4 animate-spin" />
            </div>
          )}

          {students.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading={t('palette.students')}>
                {students.map((student) => (
                  <CommandItem
                    key={`student-${student.id}`}
                    value={`student-${student.id}`}
                    onSelect={() => go(`/students/${student.id}`)}>
                    <Users />
                    <span className="truncate">{student.fullName}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {groups.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading={t('palette.groups')}>
                {groups.map((group) => (
                  <CommandItem
                    key={`group-${group.id}`}
                    value={`group-${group.id}`}
                    onSelect={() => go(`/groups/${group.id}`)}>
                    <Users2 />
                    <span className="truncate">{group.name}</span>
                    <span className="text-muted-foreground text-2xs ml-auto truncate">{group.course?.courseName}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {mentors.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading={t('palette.mentors')}>
                {mentors.map((mentor) => (
                  <CommandItem
                    key={`mentor-${mentor.id}`}
                    value={`mentor-${mentor.id}`}
                    onSelect={() => go(`/mentors/${mentor.id}`)}>
                    <GraduationCap />
                    <span className="truncate">{mentor.fullName}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
