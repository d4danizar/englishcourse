"use client";
import { useState } from "react";
import { BulkImportForm } from "@/components/ui/BulkImportForm";
import { ChevronDown, ChevronUp, FileSpreadsheet } from "lucide-react";

export function CollapsibleBulkImport() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-1 transition-all">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 rounded-xl transition-colors outline-none"
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
             <FileSpreadsheet className="w-4 h-4" />
          </div>
          <span className="font-semibold text-zinc-800 tracking-tight">Migrasi Data Massal (Excel)</span>
        </div>
        <div className="text-zinc-400 bg-zinc-50 p-1.5 rounded-md">
           {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="rounded-xl overflow-hidden px-1 pb-1 mt-1">
            <BulkImportForm />
          </div>
        </div>
      </div>
    </div>
  );
}
