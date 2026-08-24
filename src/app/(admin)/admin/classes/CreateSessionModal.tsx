"use client";

import { useState, useTransition } from "react";
import { X, Loader2, CalendarPlus } from "lucide-react";
import { createSession } from "./actions";

type TutorOption = {
  id: string;
  name: string;
};

import { CLASS_TIME_SLOTS } from "@/constants/schedules";
const TIME_SLOTS = CLASS_TIME_SLOTS;

const PROGRAM_TYPES = [
  "Conversation",
  "Grammar",
  "Pronunciation",
  "Listening",
  "EFK",
  "EFT",
  "Private",
  "TOEFL Prep",
  "Fullday",
  "Asrama",
];

// Programs that allow freeform time input
const FREEFORM_TIME_PROGRAMS = ["Private", "TOEFL Prep"];

export function CreateSessionModal({
  isOpen,
  onClose,
  tutors,
}: {
  isOpen: boolean;
  onClose: () => void;
  tutors: TutorOption[];
}) {
  const [isPending, startTransition] = useTransition();
  const [selectedProgram, setSelectedProgram] = useState("");
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");

  const isFreeformTime = FREEFORM_TIME_PROGRAMS.includes(selectedProgram);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // For freeform time, combine the two time inputs into one timeSlot string
    if (isFreeformTime) {
      if (!timeStart || !timeEnd) {
        alert("Please fill in both start and end times.");
        return;
      }
      formData.set("timeSlot", `${timeStart} - ${timeEnd}`);
    }

    startTransition(async () => {
      const res = await createSession(formData);
      if (res.error) {
        alert(res.error);
      } else {
        alert("Session created successfully!");
        setSelectedProgram("");
        setTimeStart("");
        setTimeEnd("");
        onClose();
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <CalendarPlus className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">Create Schedule</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="p-1.5 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 shadow-sm disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            
            {/* Title */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Title / Room</label>
              <input
                type="text"
                name="title"
                required
                placeholder="e.g. Conversation - Room A"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-900"
              />
            </div>

            {/* Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Date</label>
              <input
                type="date"
                name="date"
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-900"
              />
            </div>

            {/* Program Type — MUST come before Time Slot to control conditional rendering */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Program Type</label>
              <select
                name="programType"
                required
                value={selectedProgram}
                onChange={(e) => { setSelectedProgram(e.target.value); setTimeStart(""); setTimeEnd(""); }}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium text-slate-700"
              >
                <option value="">Select program...</option>
                {PROGRAM_TYPES.map((pt) => (
                  <option key={pt} value={pt}>{pt}</option>
                ))}
              </select>
            </div>

            {/* Time Slot — CONDITIONAL */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                Time Slot
                {isFreeformTime && (
                  <span className="ml-2 text-[9px] font-semibold text-amber-600 normal-case tracking-normal">(custom time for {selectedProgram})</span>
                )}
              </label>
              
              {isFreeformTime ? (
                /* Freeform: two time inputs side by side */
                <div className="flex items-center gap-1">
                  <input
                    type="time"
                    value={timeStart}
                    onChange={(e) => setTimeStart(e.target.value)}
                    required
                    className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-900 min-w-0"
                  />
                  <span className="text-sm font-bold text-slate-400">—</span>
                  <input
                    type="time"
                    value={timeEnd}
                    onChange={(e) => setTimeEnd(e.target.value)}
                    required
                    className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-900 min-w-0"
                  />
                </div>
              ) : (
                /* Standard: static dropdown */
                <select
                  name="timeSlot"
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium text-slate-700"
                >
                  <option value="">Select time slot...</option>
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Assign Tutor */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Assign Tutor</label>
              <select
                name="tutorId"
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium text-slate-700"
              >
                <option value="">Select tutor...</option>
                {tutors.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Topic Offset */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                Mulai dari Topik Ke-
                <span className="text-[9px] font-semibold text-slate-400 normal-case tracking-normal">(Opsional)</span>
              </label>
              <input
                type="number"
                name="topicOffset"
                min="1"
                defaultValue="1"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl shadow-sm hover:bg-indigo-700 transition-all disabled:opacity-50 inline-flex items-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Schedule"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
