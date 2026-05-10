"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { signOut } from "next-auth/react";
import { COMPANY_INFO } from "@/lib/constants/branding";
import { BranchSwitcher, BranchBadge } from "@/components/layout/BranchSwitcher";
import { BranchLocation } from "@prisma/client";

// Standard ops items accessible to all admin roles
const standardNavItems = [
  { label: "Pendaftaran", href: "/admin/enrollments", emoji: "📝" },
  { label: "Classes", href: "/admin/classes", emoji: "📚" },
  { label: "Users", href: "/admin/users", emoji: "👥" },
  { label: "Announcements", href: "/admin/announcements", emoji: "📢" },
  { label: "Payroll", href: "/admin/payroll", emoji: "💰" },
  { label: "Pengaturan", href: "/admin/settings", emoji: "⚙️" },
  { label: "Off Days", href: "/admin/settings/off-days", emoji: "🗓️" },
];

// Role-gated helpers
const CRM_ROLES = ["SUPER_ADMIN", "CS", "MARKETING"];
const KPI_ROLES = ["SUPER_ADMIN", "MANAGER", "CS", "MARKETING", "CREATOR"];

export function AdminSidebar({
  user,
  activeBranch,
  pendingCertCount = 0,
}: {
  user: { name?: string | null; email?: string | null; role?: string | null };
  activeBranch: BranchLocation;
  pendingCertCount?: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const role = (user?.role ?? "") as string;

  const visibleNavItems = (() => {
    // HEAD_TUTOR only gets access to Classes (Roster Builder) + escape back to Tutor Panel
    if (role === "HEAD_TUTOR") {
      return [
        { label: "Verifikasi Sertifikat", href: "/tutor/certificates", emoji: "🎓", badge: pendingCertCount },
        { label: "Classes", href: "/admin/classes", emoji: "📚" },
        { label: "Back to Tutor Panel", href: "/tutor/dashboard", emoji: "⬅️" },
      ];
    }

    return [
      // Dashboard Bisnis — SUPER_ADMIN only (top priority)
      ...(role === "SUPER_ADMIN" ? [{ label: "Dashboard Bisnis", href: "/admin/dashboard", emoji: "📊" }] : []),
      // Keuangan — SUPER_ADMIN, MANAGER, CS
      ...(["SUPER_ADMIN", "MANAGER", "CS"].includes(role) ? [{ label: "Keuangan", href: "/admin/finance", emoji: "💰" }] : []),
      // Verifikasi Sertifikat
      ...(["SUPER_ADMIN", "MANAGER", "CS", "HEAD_TUTOR"].includes(role) ? [{ label: "Verifikasi Sertifikat", href: "/tutor/certificates", emoji: "🎓", badge: pendingCertCount }] : []),
      // CRM — SUPER_ADMIN, CS, MARKETING
      ...(CRM_ROLES.includes(role) ? [{ label: "CRM", href: "/admin/crm", emoji: "🤝" }] : []),
      // KPI & WIG — SUPER_ADMIN, MANAGER, CS, MARKETING, CREATOR
      ...(KPI_ROLES.includes(role) ? [{ label: "KPI & WIG", href: "/admin/kpi", emoji: "🎯" }] : []),
      // Standard items for everyone in admin panel
      ...standardNavItems,
    ];
  })();

  return (
    <>
      {/* Mobile Top Navbar (Hamburger) */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 text-white sticky top-0 z-40 shadow-md">
        <div className="flex flex-col justify-center">
          <h1 className="text-white font-extrabold text-base tracking-wider leading-tight">
            KAMPUNG INGGRIS
            <span className="block text-blue-400 font-medium text-[10px] tracking-widest mt-0.5">
              SOLO
            </span>
          </h1>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors cursor-pointer block"
          aria-label="Open Menu"
        >
          <Menu className="w-5 h-5 pointer-events-none" />
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden animate-in fade-in cursor-pointer block"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[260px] min-w-[260px] bg-slate-900 text-white flex flex-col h-screen transform transition-transform duration-300 ease-in-out md:sticky md:top-0 md:h-screen md:overflow-y-auto md:translate-x-0 ${isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
          }`}
      >
        {/* Brand */}
        <div className="flex justify-between items-center h-20 px-6 border-b border-white/10 bg-black/20 shrink-0">
          <div className="flex flex-col justify-center">
            <h1 className="text-white font-extrabold text-lg tracking-wider leading-tight m-0">
              KAMPUNG INGGRIS
              <span className="block text-blue-400 font-medium text-sm tracking-widest mt-0.5">
                SOLO
              </span>
            </h1>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden p-2 text-slate-400 hover:text-white bg-white/5 rounded-lg transition-colors cursor-pointer block"
            aria-label="Close Menu"
          >
            <X className="w-5 h-5 pointer-events-none" />
          </button>
        </div>

        {/* Branch Switcher — workspace-level, top of sidebar */}
        <div className="px-3 pt-3 pb-1 shrink-0">
          {(role === "SUPER_ADMIN" || role === "MANAGER") ? (
            <BranchSwitcher initialBranch={activeBranch} />
          ) : (
            <BranchBadge branch={activeBranch} />
          )}
        </div>

        {/* Navigation — scrollable */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1 bg-slate-900">
          {visibleNavItems.map((item) => {
            const hasBadge = item.badge && item.badge > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-150 group no-underline"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg group-hover:scale-110 transition-transform block">
                    {item.emoji}
                  </span>
                  <span className="block">{item.label}</span>
                </div>
                {hasBadge ? (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        {/* User Info & Sign Out */}
        <div className="p-4 border-t border-slate-700/50 shrink-0 bg-slate-900">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-indigo-500 flex justify-center items-center text-sm font-bold shrink-0">
              {user?.name?.charAt(0) || "A"}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium m-0 truncate leading-tight">
                {user?.name || "Admin"}
              </p>
              <p className="text-xs text-slate-400 m-0 truncate mt-0.5 leading-tight">
                {user?.email || "admin@test.com"}
              </p>
            </div>
          </div>
          <button
            onClick={async () => {
              try {
                // 1. Perform the actual backend/auth provider logout
                await signOut({ redirect: false });

                // 2. Nuke Local & Session Storage (destroying any saved branch state, UI state, etc.)
                localStorage.clear();
                sessionStorage.clear();

                // 3. NUKE ALL COOKIES (This is the new addition)
                document.cookie.split(";").forEach((c) => {
                  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
                });

                // 4. NUCLEAR REDIRECT: Do NOT use next/navigation router.push!
                window.location.href = "/login";
              } catch (error) {
                console.error("Logout failed:", error);
                // Force redirect anyway just to be safe
                window.location.href = "/login";
              }
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors w-full text-left"
          >
            <span className="block">🚪</span>
            <span className="block">Sign Out</span>
          </button>

          {/* SaaS Footer Credit */}
          <div className="mt-4 pt-3 border-t border-slate-800 text-center">
            <p className="text-[10px] text-slate-500 font-medium tracking-wide">
              Powered by <span className="font-bold text-slate-400">dspaceweb</span>
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
