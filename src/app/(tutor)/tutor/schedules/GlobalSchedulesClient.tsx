"use client";

import { useState, useTransition } from "react";
import { format, parseISO } from "date-fns";
import { Clock, ArrowRightLeft, Loader2, CheckCircle, CalendarDays, Building2, ChevronDown } from "lucide-react";
import { takeOverSession, getSessionsByBranch } from "./actions";

export type GlobalSession = {
  id: string;
  title: string;
  date: string; // ISO string
  timeSlot: string;
  programType: string;
  isCompleted: boolean;
  tutorId: string;
  tutorName: string;
  hasAttendance: boolean;
};

const BRANCH_LABELS: Record<string, string> = {
  KARTASURA: "Kartasura (Pusat)",
  CABANG_2: "Cabang 2",
  CABANG_3: "Cabang 3",
};

export function GlobalSchedulesClient({
  currentTutorId,
  sessions: initialSessions,
  homeBranch,
  allBranches,
}: {
  currentTutorId: string;
  sessions: GlobalSession[];
  homeBranch: string;
  allBranches: string[];
}) {
  const [isPending, startTransition] = useTransition();
  const [activeBranch, setActiveBranch] = useState(homeBranch);
  const [sessions, setSessions] = useState(initialSessions);
  const [isFetchingBranch, setIsFetchingBranch] = useState(false);

  // Group sessions by date
  const groupedSessions = sessions.reduce((acc, session) => {
    const dateStr = session.date.slice(0, 10);
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(session);
    return acc;
  }, {} as Record<string, GlobalSession[]>);

  const sortedDates = Object.keys(groupedSessions).sort();

  const handleBranchChange = async (newBranch: string) => {
    setActiveBranch(newBranch);
    setIsFetchingBranch(true);
    try {
      const newSessions = await getSessionsByBranch(newBranch as any);
      setSessions(newSessions);
    } catch (err) {
      console.error("Failed to fetch branch sessions:", err);
    } finally {
      setIsFetchingBranch(false);
    }
  };

  const handleTakeOver = (session: GlobalSession) => {
    if (window.confirm(`Are you sure you want to substitute for ${session.tutorName} in the "${session.title}" class?`)) {
      startTransition(async () => {
        const res = await takeOverSession(session.id, currentTutorId);

        if (res.error) {
          alert(res.error);
        } else {
          alert(`Successfully taken over ${session.title}!`);
          // Refresh list for the current branch
          const refreshed = await getSessionsByBranch(activeBranch as any);
          setSessions(refreshed);
        }
      });
    }
  };

  return (
    <>
      {/* Branch Selector */}
      <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 shrink-0">
          <Building2 className="w-4 h-4 text-indigo-500" />
          <span>Cabang:</span>
        </div>
        <div className="relative flex-1 max-w-xs">
          <select
            value={activeBranch}
            onChange={(e) => handleBranchChange(e.target.value)}
            disabled={isFetchingBranch}
            className="w-full appearance-none bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 rounded-lg pl-3 pr-8 py-2 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer disabled:opacity-50"
          >
            {allBranches.map((br) => (
              <option key={br} value={br}>
                {BRANCH_LABELS[br] || br}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
        {activeBranch !== homeBranch && (
          <span className="text-[10px] font-bold uppercase tracking-widest bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-md shrink-0">
            Cross-Branch
          </span>
        )}
        {isFetchingBranch && (
          <Loader2 className="w-4 h-4 text-indigo-500 animate-spin shrink-0" />
        )}
      </div>

      {/* Sessions Content */}
      {isFetchingBranch ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
          <p className="text-sm font-medium text-slate-500">Loading schedules...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
            <CalendarDays className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">No schedules found</h3>
          <p className="text-sm text-slate-500">
            There are no upcoming classes scheduled for {BRANCH_LABELS[activeBranch] || activeBranch}.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {sortedDates.map((dateStr) => {
            const dateObj = parseISO(dateStr);
            const daySessions = groupedSessions[dateStr];

            return (
              <div key={dateStr} className="flex flex-col gap-4">
                {/* Date Header */}
                <div className="sticky top-0 z-10 flex items-center gap-4 bg-slate-50/90 backdrop-blur-md py-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                  <div className="w-12 h-14 bg-indigo-600 rounded-xl flex flex-col items-center justify-center text-white shadow-sm shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-80 leading-none mb-1">
                      {format(dateObj, "MMM")}
                    </span>
                    <span className="text-xl font-bold leading-none">
                      {format(dateObj, "dd")}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {format(dateObj, "EEEE")}
                    </h3>
                    <p className="text-xs font-medium text-slate-500">
                      {daySessions.length} sessions
                    </p>
                  </div>
                </div>

                {/* Grid of Sessions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {daySessions.map((session) => {
                    const isMyClass = session.tutorId === currentTutorId;
                    const canTakeOver = !isMyClass && !session.isCompleted && !session.hasAttendance;

                    return (
                      <div
                        key={session.id}
                        className={`relative flex flex-col bg-white rounded-2xl border transition-all duration-200 ${isMyClass
                            ? "border-indigo-200 shadow-[0_0_0_1px_rgba(99,102,241,0.1)]"
                            : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                          }`}
                      >
                        {/* Top Bar: Time and Program Badge */}
                        <div className="flex items-start justify-between p-4 pb-0">
                          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-700">
                            <Clock className="w-4 h-4 text-slate-400" />
                            {session.timeSlot}
                          </span>
                          <span className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide border ${isMyClass
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                              : "bg-slate-50 text-slate-600 border-slate-200"
                            }`}>
                            {session.programType}
                          </span>
                        </div>

                        {/* Content: Title and Tutor info */}
                        <div className="p-4 flex-1 flex flex-col">
                          <h4 className="text-base font-bold text-slate-900 line-clamp-2 leading-snug">
                            {session.title}
                          </h4>

                          <div className="mt-4 flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isMyClass ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                              }`}>
                              {session.tutorName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Assigned Tutor</span>
                              <span className={`text-sm font-semibold ${isMyClass ? "text-indigo-600" : "text-slate-700"}`}>
                                {isMyClass ? "You" : session.tutorName}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-2 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
                          {isMyClass ? (
                            <div className="flex items-center justify-center gap-2 py-2 text-sm font-bold text-indigo-600">
                              <CheckCircle className="w-4 h-4" /> Your Class
                            </div>
                          ) : session.isCompleted || session.hasAttendance ? (
                            <div className="flex items-center justify-center gap-2 py-2 text-xs font-semibold text-slate-500 bg-slate-100/50 rounded-xl border border-slate-200/60">
                              Class Started/Completed
                            </div>
                          ) : (
                            <button
                              onClick={() => handleTakeOver(session)}
                              disabled={isPending}
                              className="w-full flex items-center justify-center gap-2 py-2 text-sm font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition-colors disabled:opacity-50 group"
                            >
                              {isPending ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                              ) : (
                                <>
                                  <ArrowRightLeft className="w-4 h-4 group-hover:-rotate-12 transition-transform duration-300" />
                                  Take Over Class
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
