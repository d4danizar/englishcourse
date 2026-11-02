"use client";

import { useState, useTransition } from "react";
import { approveCertificate } from "./actions";
import { CheckCircle, ExternalLink, GraduationCap, Loader2 } from "lucide-react";

type PendingCertificate = {
  id: string;
  programType: string;
  finalVideoLink: string | null;
  examAverage: number | null;
  suggestedScores?: {
    fluency: number | null;
    pronunciation: number | null;
    vocabulary: number | null;
  };
  user: {
    name: string;
    email: string;
  };
};

type ScoreInputs = {
  fluency: string;
  pronunciation: string;
  vocabulary: string;
};

export default function CertificatesClient({
  pendingCertificates,
}: {
  pendingCertificates: PendingCertificate[];
}) {
  const [isPending, startTransition] = useTransition();
  const [scores, setScores] = useState<Record<string, ScoreInputs>>(() => {
    const initial: Record<string, ScoreInputs> = {};
    pendingCertificates.forEach((cert) => {
      initial[cert.id] = {
        fluency:
          cert.suggestedScores?.fluency !== null && cert.suggestedScores?.fluency !== undefined
            ? cert.suggestedScores.fluency.toFixed(1)
            : "",
        pronunciation:
          cert.suggestedScores?.pronunciation !== null &&
          cert.suggestedScores?.pronunciation !== undefined
            ? cert.suggestedScores.pronunciation.toFixed(1)
            : "",
        vocabulary:
          cert.suggestedScores?.vocabulary !== null &&
          cert.suggestedScores?.vocabulary !== undefined
            ? cert.suggestedScores.vocabulary.toFixed(1)
            : "",
      };
    });
    return initial;
  });

  const handleScoreChange = (id: string, field: keyof ScoreInputs, value: string) => {
    setScores((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || { fluency: "", pronunciation: "", vocabulary: "" }),
        [field]: value,
      },
    }));
  };

  const calculateFinalScore = (id: string): number | null => {
    const item = scores[id];
    if (!item || item.fluency === "" || item.pronunciation === "" || item.vocabulary === "") {
      return null;
    }
    const f = parseFloat(item.fluency);
    const p = parseFloat(item.pronunciation);
    const v = parseFloat(item.vocabulary);

    if (isNaN(f) || isNaN(p) || isNaN(v)) return null;
    const calculatedAverage = (f + p + v) / 3;
    return Math.round(calculatedAverage * 2) / 2;
  };

  const handleApprove = async (id: string) => {
    const item = scores[id];
    const f = parseFloat(item?.fluency || "");
    const p = parseFloat(item?.pronunciation || "");
    const v = parseFloat(item?.vocabulary || "");

    if (
      isNaN(f) || f < 1 || f > 5 ||
      isNaN(p) || p < 1 || p > 5 ||
      isNaN(v) || v < 1 || v > 5
    ) {
      alert("Masukkan nilai Fluency, Pronunciation, dan Vocabulary yang valid (1 - 5).");
      return;
    }

    const calculatedAverage = (f + p + v) / 3;
    const finalScore = Math.round(calculatedAverage * 2) / 2;

    startTransition(async () => {
      const result = await approveCertificate(id, {
        fluencyScore: f,
        pronunciationScore: p,
        vocabularyScore: v,
        finalScore,
      });
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
        const currentScores = scores[cert.id] || {
          fluency: "",
          pronunciation: "",
          vocabulary: "",
        };
        const computedFinal = calculateFinalScore(cert.id);

        return (
          <div
            key={cert.id}
            className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-4"
          >
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
              <span className="text-lg font-bold text-slate-800">
                {cert.examAverage !== null && cert.examAverage !== undefined
                  ? cert.examAverage.toFixed(1)
                  : "-"}
              </span>
            </div>

            <div className="mt-1">
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
              <p className="text-xs font-bold text-slate-600 uppercase">
                INPUT NILAI KOMPONEN (1 - 5)
              </p>

              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-slate-500">Fluency</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    step={0.5}
                    placeholder="1-5"
                    value={currentScores.fluency}
                    onChange={(e) => handleScoreChange(cert.id, "fluency", e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-sm text-center font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-slate-500">Pronunciation</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    step={0.5}
                    placeholder="1-5"
                    value={currentScores.pronunciation}
                    onChange={(e) => handleScoreChange(cert.id, "pronunciation", e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-sm text-center font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-slate-500">Vocabulary</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    step={0.5}
                    placeholder="1-5"
                    value={currentScores.vocabulary}
                    onChange={(e) => handleScoreChange(cert.id, "vocabulary", e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-sm text-center font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between px-3 py-2 bg-indigo-50/70 rounded-xl border border-indigo-100">
                <span className="text-xs font-bold text-indigo-700 uppercase">
                  NILAI AKHIR (RATA-RATA)
                </span>
                <span className="text-base font-extrabold text-indigo-900">
                  {computedFinal !== null ? computedFinal.toFixed(1) : "-"}
                </span>
              </div>

              <button
                onClick={() => handleApprove(cert.id)}
                disabled={isPending || computedFinal === null}
                className="flex items-center justify-center gap-2 w-full p-2.5 bg-indigo-600 text-white hover:bg-indigo-700 font-bold text-sm rounded-xl transition-colors disabled:opacity-50 shadow-sm"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Approve & Validasi
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
