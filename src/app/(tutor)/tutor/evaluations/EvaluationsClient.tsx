"use client";

import { useState, useTransition, useEffect } from "react";
import { Loader2, Users, FileText, CheckCircle, Search, Star } from "lucide-react";
import { getStudentsForEvaluation, submitDescriptiveEvaluation, type EvaluationGroup } from "./actions";

const GROUPS: { label: string; value: EvaluationGroup }[] = [
  { label: "Conversation (Reg, FD, Asrama, EoS)", value: "Conversation" },
  { label: "English for Kids (EFK)", value: "EFK" },
  { label: "English for Teens (EFT)", value: "EFT" },
  { label: "Private Class", value: "Private" },
];

export function EvaluationsClient({ tutorId }: { tutorId: string }) {
  const [selectedGroup, setSelectedGroup] = useState<EvaluationGroup>("Conversation");
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  
  // Form state
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    fluency: "",
    pronunciation: "",
    vocabulary: "",
    notes: "",
  });

  const fetchStudents = async (group: EvaluationGroup) => {
    setLoading(true);
    try {
      const data = await getStudentsForEvaluation(group, tutorId);
      setStudents(data);
    } catch (error) {
      console.error(error);
      alert("Failed to fetch students.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents(selectedGroup);
  }, [selectedGroup]);

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenModal = (student: any) => {
    setSelectedStudent(student);
    setFormData({
      fluency: "",
      pronunciation: "",
      vocabulary: "",
      notes: "",
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const form = new FormData();
    form.append("tutorId", tutorId);
    form.append("studentId", selectedStudent.id);
    form.append("fluency", formData.fluency);
    form.append("pronunciation", formData.pronunciation);
    form.append("vocabulary", formData.vocabulary);
    form.append("notes", formData.notes);

    startTransition(async () => {
      const res = await submitDescriptiveEvaluation(form);
      if (res.error) {
        alert(res.error);
      } else {
        alert("Evaluation submitted successfully!");
        handleCloseModal();
        // Refresh list to update 'last evaluation' status
        fetchStudents(selectedGroup);
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Group Selector & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto hide-scrollbar">
          {GROUPS.map((group) => (
            <button
              key={group.value}
              onClick={() => setSelectedGroup(group.value)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                selectedGroup === group.value
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {group.label}
            </button>
          ))}
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search student..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Student List Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white rounded-3xl border border-slate-200">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-sm font-medium text-slate-500">Loading active students...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-slate-200">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">No students found</h3>
          <p className="text-sm text-slate-500">Try changing the group or search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => {
            const hasRecentEval = student.StudentEvaluations && student.StudentEvaluations.length > 0;
            const evalDate = hasRecentEval ? new Date(student.StudentEvaluations[0].createdAt).toLocaleDateString() : null;

            return (
              <div key={student.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-4 hover:border-slate-300 hover:shadow-sm transition-all group">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <h4 className="font-bold text-slate-900 leading-tight">{student.name}</h4>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {student.activeProgram || "Unknown Program"}
                      </span>
                    </div>
                  </div>
                  {hasRecentEval && (
                    <div className="bg-emerald-50 text-emerald-600 p-1.5 rounded-lg shrink-0 tooltip" title={`Last evaluated: ${evalDate}`}>
                      <CheckCircle className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-slate-500 font-medium truncate max-w-[120px]">
                    {student.programBatch || student.batchSchedule || "No specific schedule"}
                  </div>
                  <button
                    onClick={() => handleOpenModal(student)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Tulis Evaluasi
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Evaluation Form Modal */}
      {isModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Star className="w-5 h-5 text-indigo-500" />
                  Evaluasi Deskriptif
                </h3>
                <p className="text-sm font-medium text-slate-500">For {selectedStudent.name}</p>
              </div>
              <button onClick={handleCloseModal} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Fluency</label>
                <textarea
                  required
                  rows={2}
                  value={formData.fluency}
                  onChange={(e) => setFormData({ ...formData, fluency: e.target.value })}
                  placeholder="Describe the student's speaking fluency..."
                  className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 hover:bg-white transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Pronunciation</label>
                <textarea
                  required
                  rows={2}
                  value={formData.pronunciation}
                  onChange={(e) => setFormData({ ...formData, pronunciation: e.target.value })}
                  placeholder="Describe the student's pronunciation and accent..."
                  className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 hover:bg-white transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Vocabulary</label>
                <textarea
                  required
                  rows={2}
                  value={formData.vocabulary}
                  onChange={(e) => setFormData({ ...formData, vocabulary: e.target.value })}
                  placeholder="Describe the student's vocabulary range..."
                  className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 hover:bg-white transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center justify-between">
                  <span>Additional Notes</span>
                  <span className="text-[10px] text-slate-400 font-medium normal-case">Optional</span>
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any other comments or suggestions..."
                  className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 hover:bg-white transition-colors"
                />
              </div>

              {/* Form Actions */}
              <div className="mt-2 pt-4 border-t border-slate-100 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isPending}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
                >
                  {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : "Submit Evaluation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
