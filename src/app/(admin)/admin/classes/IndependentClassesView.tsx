"use client";

import { useState } from "react";
import { CalendarClock, Users, Sparkles, AlertCircle } from "lucide-react";
import { ManageIndependentClassModal } from "./ManageIndependentClassModal";

type SessionOption = {
  id: string;
  title: string;
  date: string | null;
  timeSlot: string | null;
  tutor: { name: string };
};

type ClassGroupData = {
  id: string;
  name: string;
  program: string;
  classType: string;
  sessions: SessionOption[];
};

export function IndependentClassesView({
  classes,
}: {
  classes: ClassGroupData[];
}) {
  const [selectedClass, setSelectedClass] = useState<ClassGroupData | null>(null);

  return (
    <div className="flex flex-col gap-4 animate-in fade-in">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            Independent Classes
          </h3>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Kelola jadwal kelas Private & TOEFL Prep (TBD Slots).
          </p>
        </div>
        <div className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-100">
          Total: {classes.length} Kelas
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200 border-dashed flex flex-col items-center justify-center gap-2">
            <AlertCircle className="w-8 h-8 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">Belum ada kelas independen.</p>
          </div>
        ) : (
          classes.map((cls) => {
            const totalSessions = cls.sessions.length;
            const scheduledSessions = cls.sessions.filter(s => s.date !== null).length;
            const tbdSessions = totalSessions - scheduledSessions;

            return (
              <div key={cls.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-base font-bold text-slate-900">{cls.name}</h4>
                    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100 mt-1">
                      {cls.program}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500">
                    <Users className="w-5 h-5" />
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-3 border-t border-slate-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-600">Terjadwal</span>
                    <span className="font-bold text-emerald-600">{scheduledSessions} Sesi</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-600">TBD (Belum Diatur)</span>
                    <span className="font-bold text-amber-600">{tbdSessions} Sesi</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-1.5 rounded-full" 
                      style={{ width: `${(scheduledSessions / Math.max(totalSessions, 1)) * 100}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => setSelectedClass(cls)}
                  className="mt-2 w-full inline-flex justify-center items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-slate-50 text-slate-700 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors"
                >
                  <CalendarClock className="w-4 h-4" />
                  Manage Slots
                </button>
              </div>
            );
          })
        )}
      </div>

      <ManageIndependentClassModal
        isOpen={!!selectedClass}
        onClose={() => setSelectedClass(null)}
        classGroup={selectedClass}
      />
    </div>
  );
}
