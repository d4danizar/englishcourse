"use client";

import { useState } from "react";
import { Search, Stethoscope, AlertTriangle } from "lucide-react";

export type MedicalRecord = {
  invoiceNumber: string;
  studentName: string;
  program: string;
  batch: string;
  allergies: string | null;
  illnesses: string | null;
};

export default function MedicalManifesto({ records }: { records: MedicalRecord[] }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRecords = records.filter((r) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      r.studentName.toLowerCase().includes(searchLower) ||
      (r.allergies?.toLowerCase() || "").includes(searchLower) ||
      (r.illnesses?.toLowerCase() || "").includes(searchLower) ||
      r.batch.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="flex flex-col gap-6 animate-in fade-in">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-rose-500" />
              Medical Manifesto
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Data alergi dan riwayat penyakit siswa program Holiday.
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, alergi, atau gelombang..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-3 font-semibold px-4">Nama Siswa</th>
                <th className="pb-3 font-semibold px-4">Program & Gelombang</th>
                <th className="pb-3 font-semibold px-4">Alergi Makanan/Obat</th>
                <th className="pb-3 font-semibold px-4">Riwayat Penyakit Khusus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((r, idx) => {
                  const hasAllergy = r.allergies && r.allergies.trim().length > 0 && r.allergies.toLowerCase() !== "tidak ada";
                  const hasIllness = r.illnesses && r.illnesses.trim().length > 0 && r.illnesses.toLowerCase() !== "tidak ada";
                  const showRowWarning = hasAllergy || hasIllness;

                  return (
                    <tr key={`${r.invoiceNumber}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{r.studentName}</span>
                          {showRowWarning && (
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-medium text-slate-700">{r.program}</p>
                        <p className="text-xs text-slate-500">{r.batch}</p>
                      </td>
                      <td className="py-4 px-4">
                        {hasAllergy ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100 whitespace-normal min-w-[150px]">
                            {r.allergies}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Tidak ada catatan</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {hasIllness ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100 whitespace-normal min-w-[150px]">
                            {r.illnesses}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Tidak ada catatan</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">
                    Tidak ada data medis yang cocok dengan pencarian Anda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
