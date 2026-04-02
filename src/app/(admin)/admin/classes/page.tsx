import { prisma } from "../../../../lib/prisma";
import { format } from "date-fns";
import { CalendarDays, Clock } from "lucide-react";
import { SchedulePageHeader } from "./SchedulePageHeader";
import { SessionRowActions } from "./SessionRowActions";
import AutoAbsenceButton from "../../../../components/admin/AutoAbsenceButton";
import { ScheduleTabsWrapper } from "./ScheduleTabsWrapper";
import { WeeklyRosterBuilder } from "./WeeklyRosterBuilder";

export default async function ScheduleManagementPage() {
  // 1. Fetch tutors for dropdowns
  const tutors = await prisma.user.findMany({
    where: { role: "TUTOR" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // 2. Fetch all sessions with tutor info
  const sessions = await prisma.session.findMany({
    include: {
      tutor: { select: { name: true } },
      _count: { select: { attendances: true } },
    },
    orderBy: { date: "desc" },
  });

  // Badge colors for program types
  const programStyles: Record<string, string> = {
    Conversation: "bg-blue-100 text-blue-700 border-blue-200",
    Grammar: "bg-indigo-100 text-indigo-700 border-indigo-200",
    Pronunciation: "bg-violet-100 text-violet-700 border-violet-200",
    Listening: "bg-sky-100 text-sky-700 border-sky-200",
    "EFK/EFT": "bg-orange-100 text-orange-700 border-orange-200",
    EFK: "bg-orange-100 text-orange-700 border-orange-200",
    EFT: "bg-pink-100 text-pink-700 border-pink-200",
    "TOEFL Prep": "bg-amber-100 text-amber-700 border-amber-200",
    Private: "bg-emerald-100 text-emerald-700 border-emerald-200",
    TOEFL: "bg-amber-100 text-amber-700 border-amber-200",
    Fullday: "bg-cyan-100 text-cyan-700 border-cyan-200",
    Asrama: "bg-purple-100 text-purple-700 border-purple-200",
  };

  // ---- Active Sessions Table (rendered as JSX, passed as prop) ----
  const activeSessionsTable = (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50/50">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Time Slot
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Room / Title
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Program
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Tutor
              </th>
              <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {sessions.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-16 text-center text-sm text-slate-500"
                >
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="p-4 bg-slate-50 rounded-full">
                      <CalendarDays className="w-12 h-12 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-base font-medium text-slate-900">
                        No sessions scheduled yet
                      </p>
                      <p className="mt-1">
                        Get started by creating your first schedule or use the Roster Builder.
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              sessions.map((session) => {
                const pStyle = programStyles[session.programType] || "bg-slate-100 text-slate-700 border-slate-200";

                return (
                  <tr
                    key={session.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                      {format(new Date(session.date), "EEE, MMM dd")}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {session.timeSlot}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="text-sm font-semibold text-slate-900">
                        {session.title}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold border uppercase tracking-wide ${pStyle}`}
                      >
                        {session.programType}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-600">
                      {session.tutor.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-center">
                      {session.isCompleted ? (
                        <span className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                          Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <SessionRowActions
                        session={{
                          id: session.id,
                          title: session.title,
                          date: session.date.toISOString(),
                          timeSlot: session.timeSlot,
                          programType: session.programType,
                          tutorId: session.tutorId,
                          isCompleted: session.isCompleted,
                        }}
                        tutors={tutors}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="bg-slate-50/80 p-4 border-t border-slate-200 text-xs font-medium text-slate-500 text-center sm:text-left">
        Showing {sessions.length} total sessions
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Page Header (Client Component with single-session modal) */}
      <div className="flex flex-col gap-6">
        <SchedulePageHeader tutors={tutors} />
        
        {/* Sweep / Auto-Alpa Button Tracker */}
        <div className="flex justify-end pr-1 border-b border-slate-100 pb-6">
          <AutoAbsenceButton />
        </div>
      </div>

      {/* Tab Navigation: Active Sessions | Weekly Roster Builder */}
      <ScheduleTabsWrapper
        activeSessionsTable={activeSessionsTable}
        rosterBuilder={<WeeklyRosterBuilder tutors={tutors} />}
      />
    </div>
  );
}
