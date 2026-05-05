"use client";

import { useState, useTransition } from "react";
import { X, Loader2, PlusCircle } from "lucide-react";
import { createManualIncome } from "./actions";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  branch: string;
};

export function AddIncomeModal({ isOpen, onClose, branch }: Props) {
  const [isPending, startTransition] = useTransition();

  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState("PELUNASAN");
  const [description, setDescription] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !date || !category || !description) {
      alert("Harap lengkapi semua field wajib.");
      return;
    }

    const numAmount = parseInt(amount, 10);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert("Nominal harus berupa angka lebih dari 0.");
      return;
    }

    startTransition(async () => {
      const res = await createManualIncome({
        amount: numAmount,
        category,
        description,
        branch,
        date: new Date(date),
      });

      if (res.error) {
        alert("Error: " + res.error);
      } else {
        onClose();
        setAmount("");
        setDescription("");
        setCategory("PELUNASAN");
        setDate(new Date().toISOString().split("T")[0]);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-50">
          <h2 className="text-lg font-bold text-emerald-800 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-emerald-600" />
            Catat Pemasukan Manual
          </h2>
          <button onClick={onClose} className="p-2 text-emerald-600 hover:text-emerald-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          <form id="income-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Nominal Pemasukan (Rp) *</label>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Contoh: 500000"
                required
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Tanggal *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Kategori *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm"
              >
                <option value="PELUNASAN">PELUNASAN (SPP / Cicilan)</option>
                <option value="DP">DP (Down Payment)</option>
                <option value="REGISTRATION_FEE">REGISTRATION FEE (Biaya Pendaftaran)</option>
                <option value="OTHER">LAIN-LAIN (Other)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Keterangan *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Contoh: Cicilan SPP Bulan 1 - Budi (EFK)"
                required
                rows={3}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm resize-none"
              />
              <p className="text-xs text-slate-500 mt-1">Harap isi dengan detail nama murid dan program untuk pencatatan.</p>
            </div>
          </form>
        </div>

        <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button onClick={onClose} disabled={isPending} type="button" className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
            Batal
          </button>
          <button form="income-form" type="submit" disabled={isPending} className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan Pemasukan"}
          </button>
        </div>
      </div>
    </div>
  );
}
