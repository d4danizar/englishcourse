"use client";

import { useState } from "react";
import { Plus, Search, CalendarDays } from "lucide-react";
import { CreateSessionModal } from "./CreateSessionModal";

type TutorOption = {
  id: string;
  name: string;
};

export function SchedulePageHeader({ tutors }: { tutors: TutorOption[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <CalendarDays className="w-7 h-7 text-indigo-500" />
            Schedule Management
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-500 max-w-2xl">
            Create and manage daily session schedules. Assign tutors to rooms and time slots.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors whitespace-nowrap"
          >
            <Plus className="-ml-1 w-4 h-4" />
            Create Schedule
          </button>
        </div>
      </div>

      <CreateSessionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tutors={tutors}
      />
    </>
  );
}
