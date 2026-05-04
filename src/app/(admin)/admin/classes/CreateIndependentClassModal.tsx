"use client";

import { useState, useTransition } from "react";
import { X, Loader2, Sparkles } from "lucide-react";
import { createIndependentClass } from "./actions";

type TutorOption = { id: string; name: string };
type StudentOption = { id: string; name: string };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  tutors: TutorOption[];
  students: StudentOption[];
};

export function CreateIndependentClassModal({ isOpen, onClose, tutors, students }: Props) {
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [program, setProgram] = useState("Private");
  const [tutorId, setTutorId] = useState("");
  const [totalSessions, setTotalSessions] = useState<number | "">(10);
  
  // Basic multi-select
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState("");

  if (!isOpen) return null;

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const toggleStudent = (id: string) => {
    setSelectedStudents(prev => 
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !tutorId || !totalSessions || selectedStudents.length === 0) {
      alert("Harap lengkapi semua field dan pilih minimal 1 murid.");
      return;
    }

    startTransition(async () => {
      const res = await createIndependentClass({
        name,
        program,
        tutorId,
        studentIds: selectedStudents,
        totalSessions: Number(totalSessions),
      });

      if (res.error) {
        alert("Error: " + res.error);
      } else {
        onClose();
        setName("");
        setTutorId("");
        setSelectedStudents([]);
        setTotalSessions(10);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            Add Independent Class
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          <form id="independent-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Kelas (e.g., Private Budi)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            {/* Program */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Program</label>
              <select
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="Private">Private</option>
                <option value="TOEFL Prep">TOEFL Prep</option>
              </select>
            </div>

            {/* Tutor */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Tutor</label>
              <select
                value={tutorId}
                onChange={(e) => setTutorId(e.target.value)}
                required
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="">Pilih Tutor...</option>
                {tutors.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            {/* Total Sessions */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Target Pertemuan</label>
              <input
                type="number"
                min="1"
                value={totalSessions}
                onChange={(e) => setTotalSessions(e.target.value ? Number(e.target.value) : "")}
                required
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            {/* Students Multi-Select */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Murid ({selectedStudents.length} dipilih)</label>
              <input
                type="text"
                placeholder="Cari murid..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-t-xl text-sm mb-0 focus:outline-none focus:bg-slate-50"
              />
              <div className="border border-t-0 border-slate-200 rounded-b-xl max-h-40 overflow-y-auto p-2 bg-slate-50 space-y-1">
                {filteredStudents.length > 0 ? filteredStudents.map(s => (
                  <label key={s.id} className="flex items-center gap-2 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(s.id)}
                      onChange={() => toggleStudent(s.id)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-slate-700">{s.name}</span>
                  </label>
                )) : <p className="text-xs text-slate-500 text-center p-2">Tidak ditemukan</p>}
              </div>
            </div>
          </form>
        </div>

        <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button onClick={onClose} disabled={isPending} type="button" className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
            Batal
          </button>
          <button form="independent-form" type="submit" disabled={isPending} className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buat Kelas"}
          </button>
        </div>
      </div>
    </div>
  );
}
