import { Metadata } from "next";
import { getCSMonthlyPerformance, getBonusTiers } from "@/lib/actions/cs-performance-actions";
import { BonusTierSettings } from "./BonusTierSettings";
import { ChevronLeft, ChevronRight, Crown, Trophy, TrendingUp } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  title: "CS Omzet Performance | Admin Kampung Inggris",
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CSPerformancePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "SUPER_ADMIN") {
    redirect("/admin/dashboard");
  }

  const params = await searchParams;
  
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const month = params.month ? parseInt(params.month) : currentMonth;
  const year = params.year ? parseInt(params.year) : currentYear;

  if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
    redirect(`/admin/cs-performance?month=${currentMonth}&year=${currentYear}`);
  }

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  
  const leaderboard = await getCSMonthlyPerformance(month, year);
  const tiers = await getBonusTiers();

  const totalCompanyOmzet = leaderboard.reduce((acc, curr) => acc + curr.omzet, 0);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" /> CS Performance Tracker
          </h1>
          <p className="text-sm text-slate-500">Peringkat omzet Customer Service dan perhitungan bonus.</p>
        </div>

        <div className="flex items-center gap-4">
          <BonusTierSettings initialTiers={tiers} />
          
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <Link
              href={`/admin/cs-performance?month=${prevMonth}&year=${prevYear}`}
              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <div className="px-4 py-1 text-sm font-bold text-slate-700 min-w-[120px] text-center">
              {monthNames[month - 1]} {year}
            </div>
            <Link
              href={`/admin/cs-performance?month=${nextMonth}&year=${nextYear}`}
              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Global Summary */}
      <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row gap-6 justify-between items-center">
        <div>
          <div className="text-indigo-200 text-sm font-semibold uppercase tracking-widest mb-1">Total Omzet Keseluruhan (CS)</div>
          <div className="text-4xl font-black flex items-center gap-3">
            Rp {totalCompanyOmzet.toLocaleString("id-ID")}
            <TrendingUp className="w-8 h-8 text-indigo-200" />
          </div>
        </div>
        <div className="bg-white/10 px-6 py-4 rounded-xl border border-white/20 text-center">
          <div className="text-indigo-100 text-xs font-medium uppercase mb-1">Jumlah CS Aktif</div>
          <div className="text-2xl font-bold">{leaderboard.length} Orang</div>
        </div>
      </div>

      {/* Leaderboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {leaderboard.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-slate-50 border border-slate-200 rounded-2xl border-dashed">
            <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Belum ada omzet yang tercatat di bulan ini.</p>
          </div>
        ) : (
          leaderboard.map((cs, idx) => {
            const isTop = idx === 0 && cs.omzet > 0;
            return (
              <div 
                key={cs.id} 
                className={`relative bg-white p-6 rounded-2xl border ${
                  isTop ? "border-amber-300 shadow-amber-100 shadow-lg" : "border-slate-200 shadow-sm"
                } flex flex-col gap-4 overflow-hidden group hover:-translate-y-1 transition-transform duration-300`}
              >
                {isTop && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-400 to-amber-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-bl-xl flex items-center gap-1 shadow-sm">
                    <Crown className="w-3 h-3" /> PERINGKAT 1
                  </div>
                )}
                
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl shadow-inner ${
                    isTop ? "bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700" : "bg-slate-100 text-slate-600"
                  }`}>
                    {cs.name.substring(0,2).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-bold text-slate-900 text-lg leading-tight">{cs.name}</h3>
                    <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full w-max mt-1 border border-indigo-100">
                      📍 Cabang: {cs.branch || "KARTASURA"}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Omzet Bulan Ini</div>
                    <div className={`text-2xl font-black ${isTop ? "text-amber-600" : "text-indigo-600"}`}>
                      Rp {cs.omzet.toLocaleString("id-ID")}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pencapaian Tier</div>
                      <div className="font-bold text-slate-700 text-sm">
                        {cs.percent > 0 ? (
                          <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{cs.percent}% Bonus</span>
                        ) : (
                          <span className="text-slate-500">{cs.tierLabel}</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Estimasi Bonus</div>
                      <div className="font-bold text-emerald-600 text-lg leading-none">
                        Rp {cs.bonus.toLocaleString("id-ID")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
