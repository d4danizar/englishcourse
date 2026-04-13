"use client";

import { useState } from "react";
import { format, parseISO, startOfWeek, addDays } from "date-fns";
import { List, CalendarDays, Clock, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { SessionRowActions } from "./SessionRowActions";
import { TodayTopic } from "@/lib/syllabus-helpers";

type SessionData = {
  id: string;
  title: string;
  date: string; // sent as ISO string to avoid client/server Date mismatch
  timeSlot: string;
  programType: string;
  tutorId: string;
  isCompleted: boolean;
  topicOffset: number;
  tutor: { name: string };
  topicData: TodayTopic | null;
};

type TutorOption = { id: string; name: string };

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

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]; // 1-6 mapping (0 is Sun)
const TIME_SLOTS = [
  "06:00 - 07:30",
  "08:00 - 09:30",
  "10:00 - 11:30",
  "12:30 - 14:00",
  "13:00 - 14:30",
  "14:30 - 16:00",
  "15:00 - 16:30",
  "16:30 - 18:00",
  "18:30 - 20:00",
  "19:00 - 20:30",
];

export function ActiveSessionsView({
  sessions,
  tutors,
}: {
  sessions: SessionData[];
  tutors: TutorOption[];
}) {
  const [viewMode, setViewMode] = useState<"list" | "timetable">("timetable");
  const [currentWeek, setCurrentWeek] = useState(new Date());

  // Week calculation (Monday - Saturday)
  const mondayDate = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const saturdayDate = addDays(mondayDate, 5);
  const sundayDate = addDays(mondayDate, 6);

  const navigateWeek = (dir: number) => {
    setCurrentWeek((prev) => addDays(prev, dir * 7));
  };

  const setToday = () => setCurrentWeek(new Date());

  // Filter sessions for Timetable View
  const gridSessions = sessions.filter((session) => {
    const sDate = new Date(session.date);
    const startObj = new Date(mondayDate);
    startObj.setHours(0, 0, 0, 0);
    const endObj = new Date(sundayDate);
    endObj.setHours(23, 59, 59, 999);
    return sDate >= startObj && sDate <= endObj;
  });

  // Group classes for Timetable View
  // The key will be: "timeSlot|dayIndex" e.g., "08:00 - 09:30|1" for Mon
  const timeSlotItemsMap = new Map<string, SessionData[]>();

  gridSessions.forEach((session) => {
    const d = new Date(session.date);
    const day = d.getDay(); // 0(Sun) - 6(Sat)
    if (day === 0) return; // Skip Sunday
    const key = `${session.timeSlot}|${day}`;
    const list = timeSlotItemsMap.get(key) || [];
    list.push(session);
    timeSlotItemsMap.set(key, list);
  });

  // Unique sorted time slots present in the filtered data
  const existingTimeSlots = Array.from(new Set(gridSessions.map((s) => s.timeSlot))).sort();
  const displayTimeSlots = Array.from(new Set([...TIME_SLOTS, ...existingTimeSlots])).sort();

  return (
    <div className="flex flex-col gap-4">
      {/* Header / Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 ml-2">Active Sessions Explorer</h3>
        
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Week Navigator - Only visible in timetable mode */}
          {viewMode === "timetable" && (
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => navigateWeek(-1)}
                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"
                title="Previous Week"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="px-2 text-[11px] font-bold text-slate-700 min-w-[130px] text-center tracking-wide">
                {format(mondayDate, "dd MMM")} - {format(saturdayDate, "dd MMM yyyy")}
              </div>
              
              <button
                onClick={() => navigateWeek(1)}
                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"
                title="Next Week"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              
              <div className="w-px h-4 bg-slate-300 mx-1" />
              
              <button
                onClick={setToday}
                className="px-2.5 py-1 text-[11px] font-extrabold tracking-wider uppercase text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all"
              >
                Today
              </button>
            </div>
          )}

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl ml-auto sm:ml-0">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                viewMode === "list"
                  ? "bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/50"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              List View
            </button>
            <button
              onClick={() => setViewMode("timetable")}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                viewMode === "timetable"
                  ? "bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/50"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Timetable View
            </button>
          </div>
        </div>
      </div>

      {viewMode === "list" ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Time Slot</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Room / Title</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Program</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tutor</th>
                  <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-sm text-slate-500">
                      No sessions scheduled yet.
                    </td>
                  </tr>
                ) : (
                  sessions.map((session) => {
                    const pStyle = programStyles[session.programType] || "bg-slate-100 text-slate-700 border-slate-200";
                    return (
                      <tr key={session.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                          {format(new Date(session.date), "EEE, MMM dd")}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {session.timeSlot}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-slate-900">{session.title}</td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold border uppercase tracking-wide ${pStyle}`}>
                            {session.programType}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-600">{session.tutor.name}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-center">
                          {session.isCompleted ? (
                            <span className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold bg-green-100 text-green-700 border border-green-200">Completed</span>
                          ) : (
                            <span className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">Pending</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          <SessionRowActions session={session} tutors={tutors} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-slate-50/80 p-4 border-t border-slate-200 text-xs font-medium text-slate-500">
            Showing {sessions.length} total sessions
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
          <div className="overflow-x-auto">
            <div className="min-w-[1000px] grid grid-cols-7 border-b border-slate-200 bg-slate-50/50">
              <div className="px-4 py-3 border-r border-slate-200 text-left text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center">
                Time / Slot
              </div>
              {DAY_NAMES.map((dayName, idx) => (
                <div key={dayName} className="px-4 py-3 border-r border-slate-200 last:border-r-0 text-center text-xs font-bold text-slate-800 uppercase tracking-widest">
                  {dayName}
                </div>
              ))}
            </div>

            <div className="flex flex-col min-w-[1000px]">
              {displayTimeSlots.map((slot, rowIdx) => {
                // Determine if this row actually has ANY data across all 6 days
                let hasAnyData = false;
                for (let d = 1; d <= 6; d++) {
                  if (timeSlotItemsMap.has(`${slot}|${d}`)) hasAnyData = true;
                }
                
                // Hide empty standard rows to keep UI clean, UNLESS they are standard and we just want them? Let's just hide empty rows to save space.
                if (!hasAnyData && displayTimeSlots.length > 5) return null;

                return (
                  <div key={slot} className={`grid grid-cols-7 border-b border-slate-100 ${rowIdx % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`}>
                    <div className="px-4 py-4 border-r border-slate-200 flex flex-col justify-start">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 whitespace-nowrap">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {slot}
                      </span>
                    </div>
                    {/* Iterate through days 1-6 */}
                    {Array.from({ length: 6 }).map((_, dIdx) => {
                      const dayNumber = dIdx + 1;
                      const cellSessions = timeSlotItemsMap.get(`${slot}|${dayNumber}`) || [];
                      return (
                        <div key={dIdx} className="p-2 border-r border-slate-100 last:border-r-0 align-top flex flex-col gap-2 relative group min-h-[80px]">
                          {cellSessions.map((s) => {
                            const pStyle = programStyles[s.programType] || "bg-slate-100 text-slate-600 border-slate-200";
                            return (
                              <div key={s.id} className="relative bg-white border border-slate-200 rounded-xl p-2.5 shadow-sm">
                                <div className="flex justify-between items-start gap-1">
                                  <div className="flex flex-col gap-1.5 w-full">
                                    <div className="flex justify-between items-start gap-2">
                                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${pStyle}`}>
                                        {s.programType}
                                      </span>
                                      <div className="-mt-1 -mr-1 z-10 relative">
                                        <div className="rounded-md bg-white/80 backdrop-blur-sm shadow-sm opacity-50 hover:opacity-100 transition-opacity">
                                          <SessionRowActions session={s} tutors={tutors} />
                                        </div>
                                      </div>
                                    </div>
                                    <h4 className="text-xs font-bold text-slate-900 leading-tight">
                                      {s.title}
                                    </h4>
                                    <p className="text-[10px] font-medium text-slate-500 mt-0.5 border-t border-slate-100 pt-1.5 flex flex-col gap-1">
                                      <span>{s.tutor.name}</span>
                                      {s.topicData && (
                                        <span className="flex items-center gap-1 text-xs text-slate-500 truncate mt-0.5" title={s.topicData.topicTitle}>
                                          <BookOpen className="w-3 h-3 shrink-0" />
                                          <span className="truncate">{s.topicData.topicTitle}</span>
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
