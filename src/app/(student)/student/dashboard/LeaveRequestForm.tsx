"use client";
import { useState } from "react";
import { submitLeaveRequest } from "./actions";
import { CalendarDays, AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";

export default function LeaveRequestForm({ enrollment }: { enrollment: any }) {
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  if (!enrollment) return null;

  const maxLeaves = enrollment.leaveQuota || 0; 
  const usedLeaves = enrollment.leaveUsed || 0;
  const remainingLeaves = maxLeaves - usedLeaves;

  const handleSubmit = async () => {
    if (!date || !reason) {
      alert("Harap lengkapi tanggal dan alasan izin.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitLeaveRequest(enrollment.id, new Date(date), reason);
      if (result.error) {
        alert("Gagal: " + result.error);
      } else {
        setSuccessMsg("Izin berhasil diajukan! Masa aktif Anda telah diperpanjang secara otomatis.");
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error: any) {
      alert("Gagal memproses izin: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (remainingLeaves <= 0) {
    return (
      <div className="bg-red-50 p-5 rounded-2xl border border-red-200 mt-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg text-red-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-red-800 text-lg">🚫 Kuota Izin Habis</h3>
            <p className="text-sm font-medium text-red-600">Anda telah menggunakan seluruh kuota izin untuk program ini.</p>
          </div>
        </div>
      </div>
    );
  }

  if (successMsg) {
    return (
      <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200 mt-6 shadow-sm flex items-center gap-3">
        <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />
        <p className="font-bold text-emerald-800 text-sm leading-snug">{successMsg}</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-shadow hover:shadow-md mt-6 relative z-20">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3 text-slate-800 font-semibold">
          <div className="p-2 bg-indigo-50 rounded-lg shrink-0">
            <CalendarDays className="w-5 h-5 text-indigo-500" />
          </div>
          <h3 className="text-base sm:text-lg font-bold">Form Izin (Leave Request)</h3>
        </div>
        <span className="text-sm font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl flex items-center justify-center">
          Sisa Kuota: {remainingLeaves} dari {maxLeaves} kali
        </span>
      </div>
      
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-widest pl-1">Tanggal Izin</label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-slate-800" 
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-widest pl-1">Alasan</label>
            <input 
              type="text"
              value={reason} 
              onChange={(e) => setReason(e.target.value)} 
              className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-slate-800" 
              placeholder="Contoh: Sakit, urusan keluarga..." 
            />
          </div>
        </div>
        <button 
          onClick={handleSubmit} 
          disabled={isSubmitting || !date || !reason}
          className="w-full flex justify-center items-center gap-2 bg-indigo-600 text-white font-bold py-3.5 rounded-xl text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm mt-2"
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Ajukan Izin & Extend Otomatis"}
        </button>
      </div>
    </div>
  );
}
