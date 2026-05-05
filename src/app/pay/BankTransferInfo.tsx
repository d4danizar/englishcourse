"use client";

import { useState } from "react";
import { Copy, CheckCircle2 } from "lucide-react";

export function BankTransferInfo({ showRegistrationFeeNote = false }: { showRegistrationFeeNote?: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText("3930719144");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-left">
      <p className="text-sm font-semibold text-indigo-900 mb-3">Silakan transfer ke rekening berikut:</p>
      
      <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-indigo-100 shadow-sm">
        <div>
          <p className="font-bold text-slate-800 text-sm">Bank BCA</p>
          <p className="text-lg font-mono font-bold text-indigo-700">3930719144</p> 
          <p className="text-xs font-medium text-slate-500">a.n. Nofi Mujayati</p>
        </div>
        <button 
          type="button" 
          onClick={handleCopy}
          className={`flex items-center gap-1.5 text-sm font-bold px-3 py-2 rounded-lg transition-all active:scale-95 ${
            copied 
              ? "bg-emerald-100 text-emerald-700" 
              : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
          }`}
        >
          {copied ? (
            <>
              <CheckCircle2 className="w-4 h-4" /> Disalin
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" /> Salin
            </>
          )}
        </button>
      </div>
      
      <div className="mt-3 text-xs text-indigo-600/80 font-medium leading-relaxed space-y-1">
        <p>* Pastikan nominal transfer sesuai hingga 3 digit terakhir jika ada.</p>
        {showRegistrationFeeNote && (
          <p>* Biaya Pendaftaran Rp100.000 sudah termasuk dalam total tagihan.</p>
        )}
      </div>
    </div>
  );
}
