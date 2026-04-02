import { SignOutButton } from "../../components/auth/SignOutButton";
import { LayoutDashboard, CalendarDays, Star } from "lucide-react";
import Image from "next/image";
import { COMPANY_INFO } from "@/lib/constants/branding";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50 pb-20 md:pb-0">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 py-3 px-4 shadow-sm relative z-50 sticky top-0">
        <nav className="flex items-center justify-between max-w-7xl mx-auto gap-4">
          <div className="flex-1 flex items-center gap-3">
            <Image 
              src={COMPANY_INFO.logoSmallUrl} 
              alt="Logo" 
              width={40} 
              height={40} 
              className="object-contain"
              priority
            />
            <h1 className="text-slate-900 font-extrabold text-sm sm:text-base tracking-wider leading-tight hidden sm:block">
              KAMPUNG INGGRIS
              <span className="block text-indigo-600 font-medium text-[10px] tracking-widest mt-0.5">
                SOLO
              </span>
            </h1>
          </div>
          
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
      
      <main className="flex-1 flex flex-col">
        <div className="flex-1">
          {children}
        </div>
        
        {/* Footer Credit */}
        <footer className="mt-8 py-6 text-center border-t border-slate-200">
           <p className="text-xs text-slate-500 font-medium tracking-wide">
             Powered by <span className="font-bold text-slate-400">dspaceweb</span>
           </p>
        </footer>
      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 flex justify-around items-center px-2 py-3">
        <a href="/student/dashboard" className="flex flex-col items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors">
          <LayoutDashboard className="w-5 h-5 text-slate-900" />
          <span className="text-[10px] font-bold text-slate-900">Home</span>
        </a>
        <a href="/student/schedules" className="flex flex-col items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors">
          <CalendarDays className="w-5 h-5" />
          <span className="text-[10px] font-semibold text-slate-500 hover:text-slate-900 transition-colors">Schedule</span>
        </a>
        <a href="/student/evaluations" className="flex flex-col items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors">
          <Star className="w-5 h-5" />
          <span className="text-[10px] font-semibold text-slate-500 hover:text-slate-900 transition-colors">Scores</span>
        </a>
      </nav>
    </div>
  );
}
