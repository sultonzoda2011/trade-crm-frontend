import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';

interface UserAvatarProps {
  fullName: string;
  imagePath?: string;
  subInfo?: string;
}

export function UserAvatar({ fullName, imagePath, subInfo }: UserAvatarProps) {
  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-9 w-9">
        <AvatarImage src={imagePath ? imagePath : undefined} className="object-cover" />
        <AvatarFallback>{fullName.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <span className="text-sm font-semibold">{fullName}</span>
        {subInfo && <span className="text-muted-foreground text-xs">{subInfo}</span>}
      </div>
    </div>
  );
}
