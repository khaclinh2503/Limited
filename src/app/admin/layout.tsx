import { requireMember } from "@/lib/auth-helpers";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireMember();
  return <>{children}</>;
}
