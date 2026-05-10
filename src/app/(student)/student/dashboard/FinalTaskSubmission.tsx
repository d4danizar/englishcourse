"use client";
import { useState } from "react";
import { submitFinalVideo } from "./actions";
import { CheckCircle, Clock, Link as LinkIcon, Download, Loader2 } from "lucide-react";

export default function FinalTaskSubmission({ enrollment }: { enrollment: any }) {
  const [link, setLink] = useState(enrollment?.finalVideoLink || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Jika tidak ada enrollment yang dilempar, jangan render
  if (!enrollment) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const result = await submitFinalVideo(enrollment.id, link);
      if (result.error) {
        alert(result.error);
      } else {
        alert("Tugas akhir berhasil dikirim! Menunggu verifikasi tutor.");
        window.location.reload();
      }
    } catch (error) {
      alert("Gagal mengirim tugas.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (enrollment.isCertificateApproved) {
    return (
      <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-200 mt-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-emerald-800 text-lg">🎉 Sertifikat Disetujui!</h3>
            <p className="text-sm font-medium text-emerald-600">Nilai Akhir: {enrollment.certificateScore}</p>
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <a 
            href="/api/certificate"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" /> Download Sertifikat
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-200 mt-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
          <GraduationCapIcon className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-blue-900 text-lg">🎓 Tugas Akhir & Sertifikat</h3>
          <p className="text-sm text-blue-700 opacity-90">Kumpulkan tugas untuk penerbitan sertifikat.</p>
        </div>
      </div>

      {enrollment.finalVideoLink ? (
        <div className="mb-5 bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center gap-1.5 bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-md font-bold border border-amber-200">
              <Clock className="w-3.5 h-3.5" /> Menunggu Verifikasi
            </span>
          </div>
          <div className="flex items-start gap-2">
            <LinkIcon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <a href={enrollment.finalVideoLink} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">
              {enrollment.finalVideoLink}
            </a>
          </div>
        </div>
      ) : (
        <div className="mb-5 text-sm text-slate-600 bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
          <p>Kumpulkan link video presentasi (YouTube/Google Drive) atau bukti chat penyelesaian tugas akhir Anda di bawah ini.</p>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row gap-3">
        <input 
          type="url" 
          placeholder="https://youtube.com/watch?v=..." 
          value={link}
          onChange={(e) => setLink(e.target.value)}
          className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
        />
        <button 
          onClick={handleSubmit} 
          disabled={isSubmitting || !link}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shrink-0"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Kirim Tugas"}
        </button>
      </div>
    </div>
  );
}

function GraduationCapIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21.42 10.922a2 2 0 0 1-.019 3.022l-7.1 7.1a2 2 0 0 1-2.796.002l-7.1-7.1a2 2 0 0 1-.019-3.022l7.1-7.1a2 2 0 0 1 2.834 0l7.1 7.1Z" />
      <path d="M12 10V2" />
      <path d="M12 22v-8" />
      <path d="m5.2 6.8 2.6-2.6" />
      <path d="m18.8 17.2-2.6 2.6" />
    </svg>
  );
}
