"use client";

import { CreditCard, CalendarDays, Receipt, Clock, Users } from "lucide-react";

type PayrollItem = {
  id: string;
  name: string;
  role: string;
  totalSessions: number;
  teachingPay: number;
  referralCount: number;
  referralBonus: number;
  grandTotal: number;
  status: string;
};

export function PayrollClientView({ payrollData }: { payrollData: PayrollItem[] }) {
  // Get current month name for the mockup UI
  const currentMonthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  // Formatting function string Rp
  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(number);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-12">
      {/* 1. Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm w-full">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-500" /> Staff Payroll & Bonus
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Kompensasi mengajar (Rp 30.000 / sesi) & Bonus Referral (Rp 50.000 / siswa).
          </p>
        </div>
        
        {/* Mockup Bulan Dropdown */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl shadow-sm cursor-pointer hover:bg-slate-100 transition-colors">
          <CalendarDays className="w-5 h-5 text-slate-500" />
          <span className="text-sm font-bold text-slate-700">{currentMonthName}</span>
        </div>
      </div>

      {/* 2. Payroll Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col w-full text-left overflow-x-auto">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Staff / Role</th>
                <th className="px-6 py-4">Gaji Mengajar</th>
                <th className="px-6 py-4 text-center">Referral Dipakai</th>
                <th className="px-6 py-4">Bonus Referral</th>
                <th className="px-6 py-4">Total Gaji</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payrollData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium bg-slate-50/30">
                    Belum ada data payroll untuk staf aktif.
                  </td>
                </tr>
              ) : (
                payrollData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
                          {item.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900">{item.name}</span>
                          <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">{item.role}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700">
                          {formatRupiah(item.teachingPay)}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {item.totalSessions > 0 ? `${item.totalSessions} Sesi` : "-"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="inline-flex items-center gap-1.5 border border-indigo-100 bg-indigo-50/50 px-3 py-1 rounded-lg">
                        <Users className="w-4 h-4 text-indigo-400" />
                        <span className="text-sm font-bold text-indigo-700">{item.referralCount}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm font-bold text-emerald-600">
                        {item.referralBonus > 0 ? `+ ${formatRupiah(item.referralBonus)}` : "-"}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-lg font-bold text-slate-900 tracking-tight">
                        {formatRupiah(item.grandTotal)}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      {item.status === "Pending" ? (
                        <span className="inline-flex items-center justify-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest shadow-sm w-[100px]">
                          <Receipt className="w-3.5 h-3.5"/> Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center gap-1.5 bg-slate-50 text-slate-500 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest shadow-sm w-[100px]">
                          No Pay
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer info Summary */}
        <div className="bg-slate-50/80 p-5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <span className="text-sm font-medium text-slate-500">
            Menampilkan data payroll untuk {payrollData.length} staf.
          </span>
          <div className="text-sm font-bold text-slate-900 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div className="flex items-center justify-between sm:justify-start gap-4">
              <span className="text-slate-500">Total Pengeluaran (Bulan Ini):</span>
              <span className="text-xl text-emerald-600 tracking-tight">
                {formatRupiah(payrollData.reduce((acc, curr) => acc + curr.grandTotal, 0))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
