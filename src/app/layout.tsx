import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { AuroraBg } from "@/components/AuroraBg";
import { PetalLayer } from "@/components/PetalLayer";
import { Navigation } from "@/components/Navigation";
import { auth } from "@/lib/auth";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-be-vietnam",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Thành Hội: LIMITED",
  description: "Bảng xếp hạng bộ sưu tập hoa công hội",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="vi" className={beVietnamPro.variable}>
      <body className="font-sans antialiased">
        <AuroraBg />
        <PetalLayer />

        <div className="relative z-10 flex flex-col h-screen overflow-hidden">
          <Navigation user={session?.user ?? null} />
          <main className="flex-1 min-h-0 w-full max-w-5xl mx-auto px-4 py-4 flex flex-col">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
