import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
export const CommentAvatar = ({
  name,
  avatar,
}: {
  name: string;
  avatar: string | null;
}) => (
  <Avatar className="size-7 shrink-0">
    <AvatarImage src={avatar ?? undefined} alt={name} />
    <AvatarFallback className="bg-primary text-sm font-semibold text-white">
      {name.charAt(0).toUpperCase() || "?"}
    </AvatarFallback>
  </Avatar>
);