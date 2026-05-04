"use client";

import { useState, useTransition } from "react";
import { X, Loader2, CalendarClock, Edit2, Check, Clock } from "lucide-react";
import { format } from "date-fns";
import { updateSessionSchedule } from "./actions";

type SessionOption = {
  id: string;
  title: string;
  date: string | null;
  timeSlot: string | null;
  tutor: { name: string };
};

type ClassGroupProp = {
  id: string;
  name: string;
  program: string;
  sessions: SessionOption[];
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  classGroup: ClassGroupProp | null;
};

export function ManageIndependentClassModal({ isOpen, onClose, classGroup }: Props) {
  const [isPending, startTransition] = useTransition();
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  
  // Form State
  const [editDate, setEditDate] = useState("");
  const [editTimeSlot, setEditTimeSlot] = useState("");

  if (!isOpen || !classGroup) return null;

  // Sort sessions by title ("Pertemuan 1", "Pertemuan 2", etc.)
  const sortedSessions = [...classGroup.sessions].sort((a, b) => {
    // Extract numbers from title if possible
    const numA = parseInt(a.title.replace(/\D/g, "")) || 0;
    const numB = parseInt(b.title.replace(/\D/g, "")) || 0;
    return numA - numB;
  });

  const handleEditClick = (session: SessionOption) => {
    setEditingSessionId(session.id);
    setEditDate(session.date ? session.date.split("T")[0] : "");
    // Default or existing timeslot
    setEditTimeSlot(session.timeSlot || "08:00 - 09:30");
  };

  const handleSave = (sessionId: string) => {
    if (!editDate || !editTimeSlot) {
      alert("Harap isi tanggal dan jam!");
      return;
    }

    startTransition(async () => {
      const res = await updateSessionSchedule({
        sessionId,
        date: editDate,
        timeSlot: editTimeSlot
      });

      if (res.error) {
        alert("Error: " + res.error);
      } else {
        setEditingSessionId(null);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-indigo-500" />
              Manage Slots: {classGroup.name}
            </h2>
            <p className="text-xs font-medium text-slate-500 mt-1">{classGroup.program} • {classGroup.sessions.length} Pertemuan</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-0 overflow-y-auto bg-slate-50/50">
          <ul className="divide-y divide-slate-100">
            {sortedSessions.map((session) => (
              <li key={session.id} className="p-4 hover:bg-white transition-colors">
                {editingSessionId === session.id ? (
                  <div className="flex flex-col sm:flex-row gap-3 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                    <div className="flex-1">
                      <div className="font-bold text-sm text-slate-800 mb-2">{session.title}</div>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="p-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <select
                          value={editTimeSlot}
                          onChange={(e) => setEditTimeSlot(e.target.value)}
                          className="p-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                          <option value="06:00 - 07:30">06:00 - 07:30</option>
                          <option value="08:00 - 09:30">08:00 - 09:30</option>
                          <option value="10:00 - 11:30">10:00 - 11:30</option>
                          <option value="12:30 - 14:00">12:30 - 14:00</option>
                          <option value="13:00 - 14:30">13:00 - 14:30</option>
                          <option value="14:30 - 16:00">14:30 - 16:00</option>
                          <option value="15:00 - 16:30">15:00 - 16:30</option>
                          <option value="16:30 - 18:00">16:30 - 18:00</option>
                          <option value="18:30 - 20:00">18:30 - 20:00</option>
                          <option value="19:00 - 20:30">19:00 - 20:30</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-end gap-2 mt-2 sm:mt-0">
                      <button 
                        onClick={() => setEditingSessionId(null)}
                        disabled={isPending}
                        className="px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                      >
                        Batal
                      </button>
                      <button 
                        onClick={() => handleSave(session.id)}
                        disabled={isPending}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                      >
                        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        Simpan
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs shrink-0">
                        {session.title.replace(/\D/g, "") || "?"}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{session.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          {session.date ? (
                            <>
                              <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                {format(new Date(session.date), "EEE, dd MMM yyyy")}
                              </span>
                              <span className="flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {session.timeSlot}
                              </span>
                            </>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded uppercase tracking-wider border border-amber-200">
                              TBD - Belum Diatur
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleEditClick(session)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:text-indigo-600 hover:border-indigo-200 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Set Jadwal
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
