"use client";

import { useState, useTransition, useMemo } from "react";
import {
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Save,
  RotateCcw,
  Clock,
  User,
  Plus,
  X,
} from "lucide-react";
import { addDays, format, getDay } from "date-fns";
import { bulkCreateSessions } from "./roster-actions";

type TutorOption = {
  id: string;
  name: string;
};

const TIME_SLOTS = [
  { time: "08:00 - 09:30", program: "Conversation" },
  { time: "10:00 - 11:30", program: "Conversation" },
  { time: "12:30 - 14:00", program: "Conversation" },
  { time: "14:30 - 16:00", program: "Conversation" },
  { time: "18:30 - 20:00", program: "Conversation" },
  { time: "14:30 - 16:00", program: "EFK" },
  { time: "16:30 - 18:00", program: "EFK" },
  { time: "14:30 - 16:00", program: "EFT" },
  { time: "16:30 - 18:00", program: "EFT" },
  { time: "08:00 - 09:30", program: "Holiday Kids" },
  { time: "10:00 - 11:30", program: "Holiday Kids" },
  { time: "12:30 - 14:00", program: "Holiday Kids" },
  { time: "14:30 - 16:00", program: "Holiday Kids" },
  { time: "18:30 - 20:00", program: "Holiday Kids" },
  { time: "08:00 - 09:30", program: "Holiday Teens" },
  { time: "10:00 - 11:30", program: "Holiday Teens" },
  { time: "12:30 - 14:00", program: "Holiday Teens" },
  { time: "14:30 - 16:00", program: "Holiday Teens" },
  { time: "18:30 - 20:00", program: "Holiday Teens" },
] as const;

const DAY_NAMES_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const ROOM_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

// Grid state: each cell holds an ARRAY of tutorIds
// Key: "2026-03-17_08:00 - 09:30" => ["tutor-id-1", "tutor-id-2"]
type GridState = Record<string, string[]>;

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = getDay(d);
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function WeeklyRosterBuilder({ tutors }: { tutors: TutorOption[] }) {
  const [isPending, startTransition] = useTransition();
  const [mondayDate, setMondayDate] = useState<Date>(() => getMondayOfWeek(new Date()));
  const [grid, setGrid] = useState<GridState>({});
  const [programFilter, setProgramFilter] = useState("ALL");

  const weekDates = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => addDays(mondayDate, i));
  }, [mondayDate]);

  const filteredTimeSlots = useMemo(() => {
    if (programFilter === "ALL") return TIME_SLOTS;
    return TIME_SLOTS.filter((slot) => slot.program === programFilter);
  }, [programFilter]);

  // Key includes program to differentiate EFK/EFT at same time
  const cellKey = (date: Date, timeSlot: string, program: string) =>
    `${format(date, "yyyy-MM-dd")}_${timeSlot}_${program}`;

  const getCellTutors = (date: Date, timeSlot: string, program: string): string[] => {
    return grid[cellKey(date, timeSlot, program)] || [""];
  };

  // Update a specific tutor within a cell's array
  const handleTutorChange = (date: Date, timeSlot: string, program: string, index: number, tutorId: string) => {
    const key = cellKey(date, timeSlot, program);
    setGrid((prev) => {
      const current = [...(prev[key] || [""])];
      current[index] = tutorId;
      return { ...prev, [key]: current };
    });
  };

  // Add a new empty tutor slot to a cell
  const addRoom = (date: Date, timeSlot: string, program: string) => {
    const key = cellKey(date, timeSlot, program);
    setGrid((prev) => {
      const current = [...(prev[key] || [""])];
      current.push("");
      return { ...prev, [key]: current };
    });
  };

  // Remove a tutor slot from a cell
  const removeRoom = (date: Date, timeSlot: string, program: string, index: number) => {
    const key = cellKey(date, timeSlot, program);
    setGrid((prev) => {
      const current = [...(prev[key] || [""])];
      current.splice(index, 1);
      // If we removed the last one, keep at least one empty slot
      if (current.length === 0) current.push("");
      return { ...prev, [key]: current };
    });
  };

  const handleReset = () => {
    if (window.confirm("Reset all tutor assignments for this week?")) {
      setGrid({});
    }
  };

  // Count total filled (non-empty) tutor assignments
  const filledCount = useMemo(() => {
    let count = 0;
    for (const arr of Object.values(grid)) {
      count += arr.filter(Boolean).length;
    }
    return count;
  }, [grid]);

  const handleSubmit = () => {
    // Transform multi-tutor grid into flat array of sessions
    const sessions: any[] = [];

    for (const [key, tutorIds] of Object.entries(grid)) {
      const filled = tutorIds.filter(Boolean);
      if (filled.length === 0) continue;

      const [dateStr, timeSlot, program] = key.split("_");
      const slotProgram = program || "Conversation";

      filled.forEach((tutorId, idx) => {
        const title =
          filled.length === 1
            ? slotProgram
            : `${slotProgram} - Room ${ROOM_LETTERS[idx] || String.fromCharCode(65 + idx)}`;

        sessions.push({
          title,
          date: new Date(dateStr),
          timeSlot,
          programType: slotProgram,
          tutorId,
        });
      });
    }

    if (sessions.length === 0) {
      alert("Please assign at least one tutor to a time slot.");
      return;
    }

    if (!window.confirm(`Create ${sessions.length} sessions for the week of ${format(mondayDate, "MMM dd, yyyy")}?`)) {
      return;
    }

    startTransition(async () => {
      const res = await bulkCreateSessions(sessions);
      if (res.error) {
        alert(res.error);
      } else {
        alert(`✅ Successfully created ${res.count} sessions!`);
        setGrid({});
      }
    });
  };

  const navigateWeek = (direction: number) => {
    setMondayDate((prev) => addDays(prev, direction * 7));
    setGrid({});
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
            <CalendarPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Weekly Roster Builder</h2>
            <p className="text-xs font-medium text-slate-500">
              Assign tutors to time slots. Click &quot;+ Room&quot; to split a slot into multiple rooms.
            </p>
          </div>
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="programFilter" className="text-sm font-medium text-slate-700 whitespace-nowrap">Filter Program:</label>
          <select
            id="programFilter"
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
            className="border border-slate-200 rounded-lg shadow-sm text-sm p-2 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
          >
            <option value="ALL">Semua Program</option>
            <option value="Conversation">Conversation</option>
            <option value="EFK">EFK</option>
            <option value="EFT">EFT</option>
            <option value="Holiday Kids">Holiday Kids</option>
            <option value="Holiday Teens">Holiday Teens</option>
          </select>
        </div>

        {/* Week Navigator */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigateWeek(-1)}
            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 min-w-[220px] text-center">
            {format(mondayDate, "MMM dd")} — {format(addDays(mondayDate, 5), "MMM dd, yyyy")}
          </div>
          <button
            type="button"
            onClick={() => navigateWeek(1)}
            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* The Spreadsheet Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest w-[160px] border-r border-slate-100">
                  Time Slot
                </th>
                {weekDates.map((date, i) => {
                  const isToday = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                  return (
                    <th
                      key={i}
                      className={`px-3 py-3 text-center text-[10px] font-bold uppercase tracking-widest border-r border-slate-100 last:border-r-0 ${
                        isToday ? "bg-indigo-50 text-indigo-700" : "text-slate-500"
                      }`}
                    >
                      <div className="text-xs font-bold">{DAY_NAMES_SHORT[i]}</div>
                      <div className={`text-[11px] mt-0.5 ${isToday ? "font-extrabold" : "font-semibold text-slate-400"}`}>
                        {format(date, "dd MMM")}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filteredTimeSlots.map((slot, slotIdx) => (
                <tr
                  key={slotIdx}
                  className={`border-b border-slate-100 last:border-b-0 ${
                    slotIdx % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                  }`}
                >
                  {/* Time Slot Label */}
                  <td className="px-4 py-3 border-r border-slate-100 align-top">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {slot.time}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded w-fit ${
                        slot.program === "EFK"
                          ? "bg-orange-50 text-orange-600"
                          : slot.program === "EFT"
                          ? "bg-pink-50 text-pink-600"
                          : "bg-blue-50 text-blue-600"
                      }`}>
                        {slot.program}
                      </span>
                    </div>
                  </td>

                  {/* Multi-tutor cells for each day */}
                  {weekDates.map((date, dayIdx) => {
                    const cellTutors = getCellTutors(date, slot.time, slot.program);
                    const isToday = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                    return (
                      <td
                        key={dayIdx}
                        className={`px-2 py-2 border-r border-slate-100 last:border-r-0 align-top ${
                          isToday ? "bg-indigo-50/30" : ""
                        }`}
                      >
                        <div className="flex flex-col gap-1.5">
                          {cellTutors.map((tutorId, roomIdx) => (
                            <div key={roomIdx} className="flex items-center gap-1">
                              {/* Room label (only if more than 1 room) */}
                              {cellTutors.length > 1 && (
                                <span className="text-[9px] font-bold text-slate-400 w-3 shrink-0">
                                  {ROOM_LETTERS[roomIdx]}
                                </span>
                              )}
                              <select
                                value={tutorId}
                                onChange={(e) => handleTutorChange(date, slot.time, slot.program, roomIdx, e.target.value)}
                                className={`flex-1 text-xs font-medium rounded-lg border px-1.5 py-1.5 outline-none transition-all cursor-pointer min-w-0 ${
                                  tutorId
                                    ? "border-indigo-200 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100"
                                    : "border-slate-200 bg-white text-slate-400 hover:border-slate-300"
                                }`}
                              >
                                <option value="">— empty —</option>
                                {tutors.map((t) => (
                                  <option key={t.id} value={t.id}>
                                    {t.name}
                                  </option>
                                ))}
                              </select>
                              {/* Remove room button (only if more than 1 room) */}
                              {cellTutors.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeRoom(date, slot.time, slot.program, roomIdx)}
                                  className="p-0.5 text-slate-300 hover:text-red-500 transition-colors shrink-0"
                                  title="Remove room"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ))}
                          {/* Add Room button */}
                          <button
                            type="button"
                            onClick={() => addRoom(date, slot.time, slot.program)}
                            className="inline-flex items-center justify-center gap-0.5 text-[9px] font-semibold text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-dashed border-slate-200 hover:border-indigo-300 rounded-md py-0.5 transition-all"
                          >
                            <Plus className="w-2.5 h-2.5" />
                            Room
                          </button>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs font-medium text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span className="font-bold text-indigo-600">{filledCount}</span> total sessions assigned
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              disabled={isPending || filledCount === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-500 border border-slate-200 rounded-xl hover:bg-white hover:text-slate-700 transition-all disabled:opacity-40"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending || filledCount === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 rounded-xl shadow-sm hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Save Weekly Roster ({filledCount} sessions)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
