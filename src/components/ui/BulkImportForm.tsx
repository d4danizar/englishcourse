"use client";

import { useState, useTransition } from "react";
import * as xlsx from "xlsx";
import { processBulkImport } from "@/lib/actions/bulk-actions";
import { useRouter } from "next/navigation";
import { UploadCloud, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export function BulkImportForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"IDLE" | "READING" | "UPLOADING" | "SUCCESS" | "ERROR">("IDLE");
  const [message, setMessage] = useState("");
  const [importedCount, setImportedCount] = useState(0);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("READING");
    setMessage("Sedang membaca file Excel di browser...");

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        // Buka workbook Excel dari array buffer secara aman
        const wb = xlsx.read(data, { type: "array" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        // Konversi Data Worksheet menjadi Array JSON
        const jsonData = xlsx.utils.sheet_to_json(ws) as any[];

        const sanitizedData = jsonData
          .filter(row => Object.keys(row).length > 0) // Remove empty rows
          .map(row => {
            const cleanRow: any = {};
            for (const key in row) {
              const cleanKey = key.trim(); 
              cleanRow[cleanKey] = typeof row[key] === 'string' ? row[key].trim() : row[key];
            }
            return cleanRow;
          });

        setStatus("UPLOADING");
        setMessage("Sedang sinkronisasi multi-cabang & mengirim ke server...");

        startTransition(async () => {
          const res = await processBulkImport(sanitizedData);
          if (res.success) {
            setStatus("SUCCESS");
            setImportedCount(res.count || 0);
            setMessage(`Berhasil mem-parsing & mengimpor ${res.count} siswa ke Cabang Aktif!`);
            router.refresh(); // Segarkan view tabel di backstack
          } else {
            setStatus("ERROR");
            setMessage(res.error || "Gagal mengimpor data dari server.");
          }
        });
      } catch (err) {
        setStatus("ERROR");
        setMessage("Gagal membaca file. Pastikan formatnya .xlsx atau .xls.");
      }
    };

    // Reset the input value so user can upload the same file again if they want
    e.target.value = '';
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="bg-zinc-50 border text-center border-zinc-200 rounded-2xl p-8 shadow-sm flex flex-col items-center justify-center min-h-[260px] transition-all text-zinc-800">
      {status === "IDLE" && (
        <>
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4">
            <FileSpreadsheet className="w-7 h-7" />
          </div>
          <h3 className="text-zinc-900 font-bold mb-1 text-lg">Import Massal via Excel</h3>
          <p className="text-xs text-zinc-600 mb-6 max-w-sm leading-relaxed">
            Format yang didukung: .xlsx atau .xls.
            <br />
            Header wajib (Case-Sensitive): <b className="text-zinc-800">Name</b>, <b className="text-zinc-800">Email</b>, <b className="text-zinc-800">WhatsApp</b>, <b className="text-zinc-800">Program</b>, <b className="text-zinc-800">Start Date</b>, <b className="text-zinc-800">Duration</b>.
            <br />
            <span className="text-[10px] text-zinc-500 italic block mt-0.5 mb-1.5">Isian Duration: "1 Week", "2 Weeks", "3 Weeks", "1 Month", "2 Months", "6 Months".</span>
            Header opsional: <b className="text-zinc-800">Session</b> <span className="text-zinc-400">(Sesi regular)</span>.
          </p>
          <label className="cursor-pointer bg-white hover:bg-zinc-100 border border-dashed border-zinc-300 text-zinc-700 font-semibold py-3 px-8 rounded-xl flex items-center gap-2 transition-colors">
            <UploadCloud className="w-5 h-5 text-indigo-600" />
            <span>Pilih File Excel</span>
            <input
              type="file"
              accept=".xlsx, .xls"
              className="hidden"
              onChange={handleFileUpload}
              disabled={isPending}
            />
          </label>
        </>
      )}

      {(status === "READING" || status === "UPLOADING") && (
        <div className="flex flex-col items-center justify-center animate-in fade-in">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
          <h3 className="text-zinc-900 font-bold mb-1">Harap Tunggu</h3>
          <p className="text-sm text-zinc-500">{message}</p>
        </div>
      )}

      {status === "SUCCESS" && (
        <div className="flex flex-col items-center justify-center animate-in zoom-in fade-in duration-300">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-zinc-900 font-bold mb-2 text-lg">Impor Berhasil Terinjeksi!</h3>
          <p className="text-sm text-zinc-700 mb-6 font-medium bg-white px-4 py-2 rounded-lg border border-zinc-200">{message}</p>
          <button
            onClick={() => setStatus("IDLE")}
            className="bg-white hover:bg-zinc-100 text-zinc-700 font-medium py-2 px-6 rounded-xl transition-colors border border-zinc-300 shadow-sm"
          >
            Impor Lagi
          </button>
        </div>
      )}

      {status === "ERROR" && (
        <div className="flex flex-col items-center justify-center animate-in zoom-in fade-in duration-300">
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="text-zinc-900 font-bold mb-2">Gagal Mengimpor</h3>
          <p className="text-sm text-red-600 mb-6 font-medium">{message}</p>
          <button
            onClick={() => setStatus("IDLE")}
            className="bg-white hover:bg-zinc-100 text-zinc-700 font-medium py-2 px-6 rounded-xl transition-colors border border-zinc-300 shadow-sm"
          >
            Coba Lagi
          </button>
        </div>
      )}
    </div>
  );
}
