import { SignOutButton } from "../../components/auth/SignOutButton";
import { LayoutDashboard, CalendarDays, Star } from "lucide-react";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 pb-20 md:pb-0">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 p-4 shadow-sm relative z-10 sticky top-0">
        <nav className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="font-bold text-lg md:text-xl text-slate-900 tracking-tight">Student Portal</div>
          
          {/* DESKTOP NAV */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="/student/dashboard" className="hover:text-slate-900 transition-colors">Dashboard</a>
            <a href="/student/schedules" className="hover:text-slate-900 transition-colors">My Schedule</a>
            <a href="/student/evaluations" className="hover:text-slate-900 transition-colors">Evaluations</a>
            <div className="pl-4 border-l border-slate-200">
              <SignOutButton className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all" />
            </div>
          </div>

          {/* MOBILE LOGOUT BUTTON */}
          <div className="md:hidden">
            <SignOutButton className="flex items-center justify-center px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 bg-slate-100 rounded-lg transition-all" />
          </div>
        </nav>
      </header>
      
      <main className="flex-1">{children}</main>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 flex justify-around items-center px-2 py-3">
        <a href="/student/dashboard" className="flex flex-col items-center gap-1 text-slate-500 hover:text-indigo-600 transition-colors">
          <LayoutDashboard className="w-5 h-5 text-indigo-500" />
          <span className="text-[10px] font-bold text-indigo-600">Home</span>
        </a>
        <a href="/student/schedules" className="flex flex-col items-center gap-1 text-slate-500 hover:text-indigo-600 transition-colors">
          <CalendarDays className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Schedule</span>
        </a>
        <a href="/student/evaluations" className="flex flex-col items-center gap-1 text-slate-500 hover:text-indigo-600 transition-colors">
          <Star className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Scores</span>
        </a>
      </nav>
    </div>
  );
}
