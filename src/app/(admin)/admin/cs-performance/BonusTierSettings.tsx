"use client";

import { useState, useTransition } from "react";
import { updateBonusTiers } from "@/lib/actions/cs-performance-actions";
import { Settings, Plus, Trash2, X, CheckCircle, Infinity } from "lucide-react";
import { BonusTier } from "@prisma/client";

export function BonusTierSettings({ initialTiers }: { initialTiers: BonusTier[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tiers, setTiers] = useState([...initialTiers]);
  const [isPending, startTransition] = useTransition();

  const handleAddTier = () => {
    setTiers([...tiers, { id: Date.now().toString(), minOmzet: 0, maxOmzet: null, percentage: 0, createdAt: new Date(), updatedAt: new Date() }]);
  };

  const handleRemoveTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: "minOmzet" | "maxOmzet" | "percentage", value: number | null) => {
    const newTiers = [...tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setTiers(newTiers);
  };

  const handleSave = () => {
    startTransition(async () => {
      // Clean data
      const cleaned = tiers.map(t => ({
        minOmzet: t.minOmzet,
        maxOmzet: t.maxOmzet,
        percentage: t.percentage
      }));
      await updateBonusTiers(cleaned);
      setIsOpen(false);
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
      >
        <Settings className="w-4 h-4" /> Pengaturan Tier Bonus
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Pengaturan Tier Bonus CS</h2>
                <p className="text-xs text-slate-500 mt-1">Sesuaikan batas omzet dan persentase bonus.</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
              {tiers.map((tier, idx) => (
                <div key={tier.id} className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex-1 flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Min Omzet (Rp)</label>
                    <input 
                      type="number"
                      value={tier.minOmzet}
                      onChange={(e) => handleChange(idx, "minOmzet", parseFloat(e.target.value) || 0)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex justify-between">
                      <span>Max Omzet (Rp)</span>
                      <label className="flex items-center gap-1 cursor-pointer text-indigo-600">
                        <input 
                          type="checkbox"
                          checked={tier.maxOmzet === null}
                          onChange={(e) => handleChange(idx, "maxOmzet", e.target.checked ? null : 0)}
                          className="w-3 h-3 accent-indigo-600"
                        />
                        <span className="flex items-center gap-0.5"><Infinity className="w-3 h-3"/> Infinity</span>
                      </label>
                    </label>
                    <input 
                      type="number"
                      value={tier.maxOmzet === null ? "" : tier.maxOmzet}
                      disabled={tier.maxOmzet === null}
                      onChange={(e) => handleChange(idx, "maxOmzet", parseFloat(e.target.value) || 0)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm disabled:opacity-50 disabled:bg-slate-100"
                      placeholder={tier.maxOmzet === null ? "Infinity" : "0"}
                    />
                  </div>
                  <div className="w-24 flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Bonus (%)</label>
                    <input 
                      type="number"
                      step="0.1"
                      value={tier.percentage}
                      onChange={(e) => handleChange(idx, "percentage", parseFloat(e.target.value) || 0)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div className="pt-6">
                    <button 
                      onClick={() => handleRemoveTier(idx)}
                      className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={handleAddTier}
                className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-colors text-sm font-semibold"
              >
                <Plus className="w-4 h-4" /> Tambah Tier Baru
              </button>
            </div>

            <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-white">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={isPending}
                className="px-6 py-2 flex items-center gap-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm disabled:opacity-50"
              >
                {isPending ? "Menyimpan..." : <><CheckCircle className="w-4 h-4" /> Simpan Perubahan</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
