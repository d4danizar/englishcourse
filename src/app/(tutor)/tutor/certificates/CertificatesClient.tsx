"use client";

import { useState, useTransition } from "react";
import { approveCertificate } from "./actions";
import { CheckCircle, ExternalLink, GraduationCap, Loader2 } from "lucide-react";

type PendingCertificate = {
  id: string;
  programType: string;
  finalVideoLink: string | null;
  user: {
    name: string;
    email: string;
    StudentEvaluations: {
      listeningScore: number | null;
      speakingScore: number | null;
      readingScore: number | null;
      pronunciationScore: number | null;
      vocabularyScore: number | null;
    }[];
  };
};

export default function CertificatesClient({ pendingCertificates }: { pendingCertificates: PendingCertificate[] }) {
  const [isPending, startTransition] = useTransition();
  const [scores, setScores] = useState<Record<string, string>>({});

  const handleScoreChange = (id: string, value: string) => {
    setScores(prev => ({ ...prev, [id]: value }));
  };

  const handleApprove = async (id: string) => {
    const scoreVal = parseFloat(scores[id]);
    if (isNaN(scoreVal) || scoreVal < 0 || scoreVal > 100) {
      alert("Masukkan nilai akhir yang valid (0-100).");
      return;
    }

    startTransition(async () => {
      const result = await approveCertificate(id, scoreVal);
      if (result.error) {
        alert(result.error);
      } else {
        alert("Sertifikat berhasil disetujui!");
        window.location.reload();
      }
    });
  };

  if (pendingCertificates.length === 0) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center text-slate-500">
        <div className="flex justify-center mb-4">
          <GraduationCap className="w-12 h-12 text-slate-300" />
        </div>
        <p className="font-medium text-lg">Semua sertifikat telah diverifikasi!</p>
        <p className="text-sm mt-1">Tidak ada tugas akhir yang menunggu persetujuan.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {pendingCertificates.map((cert) => {
        // Calculate average exam score from descriptive evaluations
        const evals = cert.user.StudentEvaluations;
        let avgScore = 0;
        let validEvals = 0;

        if (evals.length > 0) {
          const sum = evals.reduce((acc, e) => {
             const s1 = e.listeningScore || 0;
             const s2 = e.speakingScore || 0;
             const s3 = e.readingScore || 0;
             const s4 = e.pronunciationScore || 0;
             const s5 = e.vocabularyScore || 0;
             const eTotal = (s1+s2+s3+s4+s5);
             if(eTotal > 0) validEvals++;
             return acc + eTotal;
          }, 0);
          if (validEvals > 0) {
             // 5 skills, out of 5 each? Wait, if they are 1-5, sum is out of 25.
             // If we need a 0-100 score, maybe sum / 25 * 100?
             // Let's just do average out of 100.
             avgScore = Math.round((sum / (validEvals * 25)) * 100);
          }
        }

        return (
          <div key={cert.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">{cert.user.name}</h3>
              <p className="text-sm text-slate-500">{cert.user.email}</p>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs font-semibold text-slate-500 uppercase">Program</span>
              <span className="text-sm font-bold text-indigo-700">{cert.programType}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs font-semibold text-slate-500 uppercase">Rata-rata Ujian</span>
              <span className="text-lg font-bold text-slate-800">{evals.length > 0 ? avgScore : "-"}</span>
            </div>

            <div className="mt-2">
              <a 
                href={cert.finalVideoLink || "#"} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full p-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-sm rounded-xl transition-colors border border-blue-200"
              >
                <ExternalLink className="w-4 h-4" /> Lihat Video / Tugas Akhir
              </a>
            </div>

            <div className="mt-auto pt-4 border-t border-slate-100 flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase">Input Nilai Akhir (Sertifikat)</label>
                <input 
                  type="number" 
                  min="0" 
                  max="100"
                  placeholder="0 - 100"
                  value={scores[cert.id] || ""}
                  onChange={(e) => handleScoreChange(cert.id, e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>

              <button 
                onClick={() => handleApprove(cert.id)}
                disabled={isPending || !scores[cert.id]}
                className="flex items-center justify-center gap-2 w-full p-2.5 bg-indigo-600 text-white hover:bg-indigo-700 font-bold text-sm rounded-xl transition-colors disabled:opacity-50 shadow-sm"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Approve & Validasi
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
