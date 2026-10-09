"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { Loader2, Users, FileText, CheckCircle, Search, Star, Download } from "lucide-react";
import { getStudentsForEvaluation, submitDescriptiveEvaluation, type EvaluationGroup } from "./actions";
import { type PdfData } from "./EvaluationPdfTemplate";
import dynamic from "next/dynamic";

const PdfDownloadButton = dynamic(() => import("./PdfDownloadButton"), {
  ssr: false,
});

const GROUPS: { label: string; value: EvaluationGroup }[] = [
  { label: "Conversation (Reg, FD, Asrama, EoS)", value: "Conversation" },
  { label: "English for Kids (EFK)", value: "EFK" },
  { label: "English for Teens (EFT)", value: "EFT" },
  { label: "Private Class", value: "Private" },
];

export function EvaluationsClient({ tutorId, tutorName }: { tutorId: string; tutorName: string }) {
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
    listeningScore: "", listeningNote: "",
    speakingScore: "", speakingNote: "",
    readingScore: "", readingNote: "",
    pronunciationScore: "", pronunciationNote: "",
    vocabularyScore: "", vocabularyNote: "",
    strengths: "", improvements: "", nextTarget: "", tutorNote: "",
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
      listeningScore: "", listeningNote: "",
      speakingScore: "", speakingNote: "",
      readingScore: "", readingNote: "",
      pronunciationScore: "", pronunciationNote: "",
      vocabularyScore: "", vocabularyNote: "",
      strengths: "", improvements: "", nextTarget: "", tutorNote: "",
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
    Object.entries(formData).forEach(([key, value]) => {
      form.append(key, value);
    });

    startTransition(async () => {
      const res = await submitDescriptiveEvaluation(form);
      if (res.error) {
        alert(res.error);
      } else {
        alert("Evaluation saved successfully!");
        handleCloseModal();
        fetchStudents(selectedGroup);
      }
    });
  };

  // (PdfDownloadButton handles downloading inside a dynamic import with ssr: false)

  return (
    <div className="flex flex-col gap-6 relative">
      
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
          <p className="text-sm font-medium text-slate-500">Loading students...</p>
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

                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-slate-500 font-medium truncate max-w-[120px]">
                    {student.programBatch || student.batchSchedule || "No specific schedule"}
                  </div>
                  <button
                    onClick={() => handleOpenModal(student)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Evaluasi & PDF
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* (EvaluationPdfTemplate is now rendered directly by PdfDownloadButton) */}

      {/* Evaluation Form Modal */}
      {isModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Star className="w-5 h-5 text-indigo-500" />
                  Form Evaluasi & Laporan
                </h3>
                <p className="text-sm font-medium text-slate-500">Siswa: {selectedStudent.name}</p>
              </div>
              <button disabled={isPending} onClick={handleCloseModal} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex flex-col gap-6">
              
              <div className="grid grid-cols-1 gap-4 border-b pb-6">
                <h4 className="font-bold text-slate-800">1. Aspek Penilaian (Skor 1-5 & Catatan)</h4>
                
                {['listening', 'speaking', 'reading', 'pronunciation', 'vocabulary'].map((skill) => (
                  <div key={skill} className="flex flex-col gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-widest capitalize">{skill}</label>
                      <input
                        type="number" step="0.5" min="1" max="5" required
                        placeholder="1-5"
                        value={(formData as any)[`${skill}Score`]}
                        onChange={(e) => setFormData({ ...formData, [`${skill}Score`]: e.target.value })}
                        className="w-20 text-sm p-1.5 rounded-lg border border-slate-300 text-center"
                      />
                    </div>
                    <textarea
                      required rows={2}
                      placeholder={`Catatan perkembangan ${skill}...`}
                      value={(formData as any)[`${skill}Note`]}
                      onChange={(e) => setFormData({ ...formData, [`${skill}Note`]: e.target.value })}
                      className="w-full text-sm p-2 rounded-lg border border-slate-300"
                    />
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-4 border-b pb-6">
                <h4 className="font-bold text-slate-800">2. Catatan Kekuatan & Peningkatan</h4>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">Kekuatan</label>
                  <textarea required rows={2} value={formData.strengths} onChange={(e) => setFormData({ ...formData, strengths: e.target.value })} className="w-full text-sm p-3 rounded-xl border border-slate-200" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">Perlu Ditingkatkan</label>
                  <textarea required rows={2} value={formData.improvements} onChange={(e) => setFormData({ ...formData, improvements: e.target.value })} className="w-full text-sm p-3 rounded-xl border border-slate-200" />
                </div>
              </div>

              <div className="flex flex-col gap-4 border-b pb-6">
                <h4 className="font-bold text-slate-800">3. Target Selanjutnya</h4>
                <textarea required rows={2} value={formData.nextTarget} onChange={(e) => setFormData({ ...formData, nextTarget: e.target.value })} className="w-full text-sm p-3 rounded-xl border border-slate-200" />
              </div>

              <div className="flex flex-col gap-4">
                <h4 className="font-bold text-slate-800">4. Catatan Khusus Tentor</h4>
                <textarea required rows={2} value={formData.tutorNote} onChange={(e) => setFormData({ ...formData, tutorNote: e.target.value })} className="w-full text-sm p-3 rounded-xl border border-slate-200" />
              </div>

              <div className="sticky bottom-0 -mx-5 -mb-5 p-5 bg-white border-t border-slate-100 flex justify-end gap-3 items-center">
                <PdfDownloadButton 
                  student={selectedStudent} 
                  data={{
                    studentName: selectedStudent?.name || "",
                    className: selectedStudent?.activeProgram || "-",
                    period: "Mingguan", // Customizable if needed
                    tutorName: tutorName, // Passed from server session
                    ...formData,
                  }}
                  disabled={isPending}
                />
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-sm transition-colors flex items-center gap-2"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Simpan Data
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
