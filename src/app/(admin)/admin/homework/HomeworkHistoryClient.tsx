"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { MoreVertical, Pencil, Save, X, Loader2 } from "lucide-react";
import { createPortal } from "react-dom";
import { saveHomework } from "@/lib/actions/homework-actions";
import { useRouter } from "next/navigation";

type HomeworkItem = {
  id: string;
  date: Date;
  content: string;
  branch: string;
};

export function HomeworkHistoryClient({ homeworks }: { homeworks: HomeworkItem[] }) {
  const router = useRouter();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  // Modal Edit State
  const [editTarget, setEditTarget] = useState<HomeworkItem | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleEditClick = (hw: HomeworkItem) => {
    setEditTarget(hw);
    setEditContent(hw.content);
    setOpenMenuId(null);
  };

  const handleSave = () => {
    if (!editTarget) return;
    startTransition(async () => {
      // Tanggal diformat ke yyyy-MM-dd lokal agar sesuai algoritma UPSERT server.
      const localDateStr = format(new Date(editTarget.date), "yyyy-MM-dd");
      const result = await saveHomework(localDateStr, editContent, editTarget.id);
      if (result.success) {
        setEditTarget(null);
        router.refresh();
      } else {
        alert(result.error || "Gagal menyimpan PR.");
      }
    });
  };

  if (homeworks.length === 0) return null;

  return (
    <div className="mt-10">
      <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
        Riwayat 14 Hari Terakhir
      </h2>
      <div className="flex flex-col gap-3">
        {homeworks.map((hw) => (
          <div
            key={hw.id}
            className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm relative group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {format(new Date(hw.date), "EEEE, dd MMM yyyy")}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {hw.branch}
                </span>

                {/* Dropdown Menu Asli Native React */}
                <div className="relative">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === hw.id ? null : hw.id)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-md transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {/* Dropdown Content */}
                  {openMenuId === hw.id && (
                    <>
                      {/* Click outside overlay */}
                      <div
                        className="fixed inset-0 z-[60]"
                        onClick={() => setOpenMenuId(null)}
                      />
                      <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-[70] animate-in fade-in zoom-in-95 duration-200">
                        <button
                          onClick={() => handleEditClick(hw)}
                          className="w-full text-left px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                        >
                          <Pencil className="w-4 h-4 text-indigo-500" />
                          Edit PR
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed pr-8">
              {hw.content}
            </p>
          </div>
        ))}
      </div>

      {/* FIXED OVERLAY MODAL UNTUK EDIT */}
      {editTarget && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-none">Edit Homework</h3>
                <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-widest">
                  {format(new Date(editTarget.date), "dd MMM yyyy")} • {editTarget.branch}
                </p>
              </div>
              <button
                onClick={() => setEditTarget(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 bg-white rounded-lg border border-slate-200 shadow-sm transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Isi Teks PR
              </label>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-y leading-relaxed"
                placeholder="Buat PR untuk kelas..."
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={() => setEditTarget(null)}
                disabled={isPending}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={isPending}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm transition-all disabled:opacity-60 disabled:pointer-events-none"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
