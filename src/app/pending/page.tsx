import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chờ duyệt — Thành Hội: LIMITED",
};

export default async function PendingPage() {
  const session = await auth();

  // Nếu chưa đăng nhập → về sign-in
  if (!session?.user) redirect("/sign-in");

  // Nếu đã được duyệt → về trang chủ
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { approved: true },
  });
  if (dbUser?.approved) redirect("/");

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="card-gradient w-full max-w-md text-center space-y-6">
        <div className="text-6xl">⏳</div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Đang chờ xét duyệt</h1>
          <p className="text-[var(--zps-text-secondary)]">
            Tài khoản của bạn đã đăng ký thành công. Quản trị viên sẽ
            xem xét và duyệt trong thời gian sớm nhất.
          </p>
        </div>

        <div
          className="rounded-xl px-4 py-3 text-sm text-left space-y-1"
          style={{ background: "var(--zps-bg-elevated)" }}
        >
          <p className="text-[var(--zps-text-secondary)] text-xs uppercase tracking-wider font-medium mb-2">
            Tài khoản đã đăng ký
          </p>
          <div className="flex items-center gap-3">
            {session.user.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt="avatar"
                className="w-9 h-9 rounded-full"
              />
            )}
            <div>
              <p className="font-medium">{session.user.name}</p>
              <p className="text-xs text-[var(--zps-text-secondary)]">
                {session.user.email}
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs text-[var(--zps-text-secondary)]">
          Sau khi được duyệt, hãy quay lại trang này và nhấn nút bên dưới
          để cập nhật trạng thái.
        </p>

        <div className="flex flex-col gap-3">
          <a
            href="/pending"
            className="btn-primary text-center block"
          >
            🔄 Kiểm tra lại
          </a>

          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button type="submit" className="btn-secondary w-full">
              Đăng xuất
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
