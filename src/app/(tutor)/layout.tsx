import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { TutorSidebar } from "./TutorSidebar";
import { prisma } from "@/lib/prisma";

export default async function TutorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role ?? "TUTOR";

  const pendingCertCount = await prisma.enrollment.count({
    where: {
      finalVideoLink: { not: null },
      isCertificateApproved: false,
    }
  });

  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row bg-slate-50">
      <TutorSidebar userRole={userRole} pendingCertCount={pendingCertCount} />
      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
