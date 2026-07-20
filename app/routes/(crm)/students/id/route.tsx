import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router';
import { centersApi } from '~/api/centers';
import { studentAccountsApi } from '~/api/studentAccounts';
import { studentJournalApi } from '~/api/studentJournal';
import { studentsApi } from '~/api/students';
import { Panel } from '~/components/layout/Panel';
import { StudentAccountTopUpModal } from '~/components/modals/StudentAccountTopUpModal';
import { StudentAccountWithdrawModal } from '~/components/modals/StudentAccountWithdrawModal';
import { ByIdSkeleton } from '~/components/shared/ByIdSkeleton';
import StudentComments from '~/components/shared/StudentComments';
import StudentGroups from '~/components/shared/StudentGroups';
import StudentHeader from '~/components/shared/StudentHeader';
import StudentPersonalInfo from '~/components/shared/StudentPersonalInfo';
import StudentTransactions from '~/components/shared/StudentTransactions';
import StudentWallet from '~/components/shared/StudentWallet';
import BreadCrumbs from '~/components/ui/bread-crumb';
import { Button } from '~/components/ui/button';

const LOGS_LIMIT = 50;

export default function StudentDetailPage() {
  const { t } = useTranslation(['students', 'common']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const studentId = Number(id);

  const { data: response, isLoading } = useQuery({
    queryKey: ['student', studentId],
    queryFn: () => studentsApi.getById(studentId),
    enabled: !!studentId,
    staleTime: 30_000,
  });

  const student = response?.data;

  const { data: studentAccountLogs } = useQuery({
    queryKey: ['student-account-logs', studentId, LOGS_LIMIT],
    queryFn: () => studentAccountsApi.getLogs(studentId, LOGS_LIMIT),
    enabled: !!studentId,
    staleTime: 30_000,
  });

  const { data: studentAccount } = useQuery({
    queryKey: ['student-account', studentId],
    queryFn: () => studentAccountsApi.getAccount(studentId),
    enabled: !!studentId,
    staleTime: 30_000,
  });

  const { data: studentGroupsOverview, isPending: studentGroupsOverviewPending } = useQuery({
    queryKey: ['student-groups-overview', studentId],
    queryFn: () => studentsApi.getGroupsOverview(String(studentId)),
    enabled: !!studentId,
    staleTime: 30_000,
  });

  const centerId = student?.centerId;
  const { data: center } = useQuery({
    queryKey: ['center', centerId],
    queryFn: () => centersApi.getById(String(centerId)),
    enabled: !!centerId,
    staleTime: 30_000,
  });

  const { data: journalComments } = useQuery({
    queryKey: ['student-journal-comments', studentId],
    queryFn: () => studentJournalApi.getStudentComments(studentId),
    enabled: !!studentId,
    staleTime: 30_000,
  });

  const [openTopUpModal, setOpenTopUpModal] = useState(false);
  const [openWithdrawModal, setOpenWithdrawModal] = useState(false);
  const location = useLocation();
  if (isLoading) return <ByIdSkeleton />;

  if (!student) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center space-y-4">
        <p className="text-muted-foreground">{t('notFound')}</p>
        <Button variant="outline" onClick={() => navigate('/students')}>
          {t('actions.cancel')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col space-y-4 pb-8">
      <StudentAccountTopUpModal
        open={openTopUpModal}
        onClose={() => setOpenTopUpModal(false)}
        accountCode={studentAccount?.data?.accountCode || ''}
        fullName={student.fullName}
      />
      <StudentAccountWithdrawModal
        open={openWithdrawModal}
        onClose={() => setOpenWithdrawModal(false)}
        accountCode={studentAccount?.data?.accountCode || ''}
        fullName={student.fullName}
      />

      <BreadCrumbs
        items={[
          { label: t('navigation.dashboard'), link: '/' },
          { link: location.state?.fromPath, label: location.state?.fromName || t('navigation.students') },
          { label: student?.fullName || '' },
        ]}
      />

      <Panel>
        <StudentHeader student={student} centerName={center?.data.name} />
      </Panel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Panel className="rounded-2xl p-4">
            <StudentPersonalInfo student={student} />
          </Panel>

          <Panel className="space-y-3 rounded-2xl p-4">
            <StudentGroups
              groups={studentGroupsOverview?.data}
              studentGroupsOverviewPending={studentGroupsOverviewPending}
            />
          </Panel>
        </div>

        <div className="space-y-4">
          <StudentWallet
            withActions={true}
            account={studentAccount?.data}
            openTopUpModal={() => setOpenTopUpModal(true)}
            openWithdrawModal={() => setOpenWithdrawModal(true)}
          />

          <Panel className="space-y-3 rounded-2xl p-4">
            <StudentTransactions logs={studentAccountLogs?.data} />
          </Panel>

          <Panel className="space-y-3 rounded-2xl p-4">
            <StudentComments comments={journalComments?.data} />
          </Panel>
        </div>
      </div>
    </div>
  );
}
