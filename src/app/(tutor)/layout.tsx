import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { TutorSidebar } from "./TutorSidebar";

export default async function TutorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role ?? "TUTOR";

  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row bg-slate-50">
      <TutorSidebar userRole={userRole} />
      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
