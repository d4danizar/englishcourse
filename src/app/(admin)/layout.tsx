import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";

import { AdminSidebar } from "./AdminSidebar";

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", emoji: "📊" },
  { label: "Classes", href: "/admin/classes", emoji: "📚" },
  { label: "Users", href: "/admin/users", emoji: "👥" },
  { label: "Announcements", href: "/admin/announcements", emoji: "📢" },
  { label: "Payroll", href: "/admin/payroll", emoji: "💰" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-slate-50">
      <AdminSidebar
        user={{
          name: session?.user?.name,
          email: session?.user?.email,
        }}
      />
      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
