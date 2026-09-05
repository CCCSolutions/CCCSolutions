import { StarFilledIcon } from '@radix-ui/react-icons';

// Shown next to an author's name when their profile role is 'admin'. The backend
// returns author.role on posts and comments; render this only for admins.
export function AdminBadge() {
  return (
    <span className="ml-1 inline-flex items-center gap-0.5 rounded-full bg-brand-200 px-1.5 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-wide text-brand-600">
      <StarFilledIcon width="9" height="9" />
      Admin
    </span>
  );
}
