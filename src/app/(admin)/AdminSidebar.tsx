"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", emoji: "📊" },
  { label: "Classes", href: "/admin/classes", emoji: "📚" },
  { label: "Users", href: "/admin/users", emoji: "👥" },
  { label: "Announcements", href: "/admin/announcements", emoji: "📢" },
  { label: "Payroll", href: "/admin/payroll", emoji: "💰" },
];

export function AdminSidebar({
  user,
}: {
  user: { name?: string | null; email?: string | null };
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Top Navbar (Hamburger) */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 text-white sticky top-0 z-40 shadow-md">
        <h2 className="text-base font-bold tracking-tight flex items-center gap-2">
          <span className="text-lg">🎓</span>
          KampungInggris
        </h2>
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
        className={`fixed inset-y-0 left-0 z-50 w-[260px] min-w-[260px] bg-slate-900 text-white flex flex-col h-screen transform transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="px-6 py-5 border-b border-slate-700/50 shrink-0 flex justify-between items-center bg-slate-900">
          <div>
            <h2 className="text-lg font-bold tracking-tight flex items-center gap-2 m-0 leading-tight">
              <span className="text-xl">🎓</span>
              KampungInggris
            </h2>
            <p className="text-xs font-medium text-slate-400 mt-1 tracking-wide uppercase">
              Admin Panel
            </p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden p-2 text-slate-400 hover:text-white bg-white/5 rounded-lg transition-colors cursor-pointer block"
            aria-label="Close Menu"
          >
            <X className="w-5 h-5 pointer-events-none" />
          </button>
        </div>

        {/* Navigation — scrollable */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1 bg-slate-900">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-150 group no-underline"
            >
              <span className="text-lg group-hover:scale-110 transition-transform block">
                {item.emoji}
              </span>
              <span className="block">{item.label}</span>
            </Link>
          ))}
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
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors no-underline w-full"
          >
            <span className="block">🚪</span>
            <span className="block">Sign Out</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
