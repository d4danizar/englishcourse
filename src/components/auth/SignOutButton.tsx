"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton({ className }: { className?: string }) {
  const handleLogout = async () => {
    try {
      // 1. Perform the actual backend/auth provider logout
      await signOut({ redirect: false });

      // 2. Nuke Local & Session Storage (destroying any saved branch state, UI state, etc.)
      localStorage.clear();
      sessionStorage.clear();

      // 3. NUCLEAR REDIRECT: Do NOT use next/navigation router.push!
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
      // Force redirect anyway just to be safe
      window.location.href = "/login";
    }
  };

  return (
    <button
      onClick={handleLogout}
      className={
        className ||
        "flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-xl transition-all"
      }
    >
      <LogOut className="w-4 h-4" />
      Sign Out
    </button>
  );
}
