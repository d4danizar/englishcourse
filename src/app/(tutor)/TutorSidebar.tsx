"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { SignOutButton } from "../../components/auth/SignOutButton";

const navItems = [
  { label: "Daily Schedule", href: "/tutor/dashboard", emoji: "📋" },
  { label: "Global Schedules", href: "/tutor/schedules", emoji: "🌎" },
  { label: "Evaluations", href: "/tutor/evaluations", emoji: "📝" },
];

export function TutorSidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Top Navbar (Hamburger) */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 text-white sticky top-0 z-40 shadow-md">
        <h2 className="text-base font-bold tracking-tight flex items-center gap-2">
          <span className="text-xl">🎓</span>
          KampungInggris
        </h2>
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          aria-label="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden animate-in fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 min-w-[256px] bg-slate-900 text-white flex flex-col h-screen transform transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="px-6 py-5 border-b border-white/10 shrink-0 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <span className="text-xl">🎓</span>
              KampungInggris
            </h2>
            <p className="text-[11px] font-medium text-slate-400 mt-0.5 tracking-wide uppercase">
              Tutor Panel
            </p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden p-2 text-slate-400 hover:text-white bg-white/5 rounded-lg transition-colors"
            aria-label="Close Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation — scrollable */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-150 group"
            >
              <span className="text-lg group-hover:scale-110 transition-transform">
                {item.emoji}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Sign Out — pinned bottom */}
        <div className="px-3 py-4 border-t border-white/10 shrink-0">
          <SignOutButton className="flex items-center gap-2 px-4 py-2.5 w-full text-sm font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-red-500/20 hover:text-red-300 rounded-xl transition-all justify-center border border-white/5 hover:border-red-500/20" />
        </div>
      </aside>
    </>
  );
}
