"use client";

import { useState, useTransition } from "react";
import { saveHomework } from "@/lib/actions/homework-actions";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CheckCircle2, Loader2, Save } from "lucide-react";

export function HomeworkEditor({
  initialHomeworkMap,
}: {
  initialHomeworkMap: Record<string, string>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Default to today's date
  const todayKey = format(new Date(), "yyyy-MM-dd");
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [content, setContent] = useState(initialHomeworkMap[todayKey] || "");
  const [saved, setSaved] = useState(false);

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    setContent(initialHomeworkMap[newDate] || "");
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(false);
    startTransition(async () => {
      const result = await saveHomework(selectedDate, content);
      if (result.success) {
        setSaved(true);
        router.refresh();
        // Auto-hide success after 3 seconds
        setTimeout(() => setSaved(false), 3000);
      }
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      {/* Date Picker */}
      <div className="mb-5">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
          Tanggal
        </label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => handleDateChange(e.target.value)}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
        />
      </div>

      {/* Content Textarea */}
      <div className="mb-5">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
          Isi Homework / PR
        </label>
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setSaved(false);
          }}
          rows={5}
          placeholder="Contoh: Open your Student Workbook page 12. Practice reading the dialogue out loud 3 times. Be ready to perform it in class!"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-y leading-relaxed"
        />
        <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
          Kosongkan dan simpan untuk menghapus homework di tanggal ini.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Simpan Homework
            </>
          )}
        </button>

        {saved && (
          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600 animate-in fade-in zoom-in-95 duration-200">
            <CheckCircle2 className="w-4 h-4" />
            Tersimpan!
          </span>
        )}
      </div>
    </div>
  );
}
