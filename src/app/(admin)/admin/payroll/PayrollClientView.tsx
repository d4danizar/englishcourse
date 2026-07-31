"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  CreditCard,
  CalendarDays,
  Receipt,
  Users,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Clock,
  Tag,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type SessionDetail = {
  id: string;
  date: string | null;   // ISO string — serialized from server
  timeSlot: string;
  title: string;
  programType: string;
};

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
  sessionDetails: SessionDetail[];
};

type Props = {
  payrollData: PayrollItem[];
  selectedMonth: number; // 1-indexed
  selectedYear: number;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April",
  "Mei", "Juni", "Juli", "Agustus",
  "September", "Oktober", "November", "Desember",
];

const CURRENT_YEAR  = new Date().getFullYear();
const YEAR_OPTIONS  = Array.from({ length: 3 }, (_, i) => CURRENT_YEAR - 2 + i);

// Badge colour map by programType — mirrors ActiveSessionsView
const PROGRAM_STYLES: Record<string, string> = {
  Conversation:    "bg-blue-100   text-blue-700   border-blue-200",
  Grammar:         "bg-indigo-100 text-indigo-700  border-indigo-200",
  Pronunciation:   "bg-violet-100 text-violet-700  border-violet-200",
  Listening:       "bg-sky-100    text-sky-700     border-sky-200",
  "EFK/EFT":       "bg-orange-100 text-orange-700  border-orange-200",
  EFK:             "bg-orange-100 text-orange-700  border-orange-200",
  EFT:             "bg-pink-100   text-pink-700    border-pink-200",
  "TOEFL Prep":    "bg-amber-100  text-amber-700   border-amber-200",
  Private:         "bg-emerald-100 text-emerald-700 border-emerald-200",
  TOEFL:           "bg-amber-100  text-amber-700   border-amber-200",
  Fullday:         "bg-cyan-100   text-cyan-700    border-cyan-200",
  Asrama:          "bg-purple-100 text-purple-700  border-purple-200",
};

// ── Component ─────────────────────────────────────────────────────────────────

export function PayrollClientView({ payrollData, selectedMonth, selectedYear }: Props) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  // Track which staff rows are expanded — keyed by staff.id
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (staffId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(staffId) ? next.delete(staffId) : next.add(staffId);
      return next;
    });
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const formatRupiah = (n: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);

  const formatSessionDate = (iso: string | null): string => {
    if (!iso) return "—";
    try {
      return format(parseISO(iso), "EEE, dd MMM", { locale: idLocale });
    } catch {
      return "—";
    }
  };

  const navigate = useCallback(
    (month: number, year: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("month", String(month));
      params.set("year", String(year));
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    navigate(parseInt(e.target.value, 10), selectedYear);

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    navigate(selectedMonth, parseInt(e.target.value, 10));

  const totalGrandPay = payrollData.reduce((acc, cur) => acc + cur.grandTotal, 0);
  const periodLabel   = `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-12">

      {/* ── 1. Header & Period Filter ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm w-full">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-500" />
            Staff Payroll &amp; Bonus
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Kompensasi mengajar (Rp 30.000 / sesi) &amp; Bonus Referral (Rp 50.000 / siswa).
          </p>
        </div>

        {/* Month & Year selectors */}
        <div className="flex items-center gap-2 shrink-0">
          <CalendarDays className="w-5 h-5 text-slate-400 shrink-0" />

          <div className="relative">
            <select
              id="payroll-month-select"
              value={selectedMonth}
              onChange={handleMonthChange}
              className="appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={idx + 1} value={idx + 1}>{name}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          </div>

          <div className="relative">
            <select
              id="payroll-year-select"
              value={selectedYear}
              onChange={handleYearChange}
              className="appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {YEAR_OPTIONS.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          </div>
        </div>
      </div>

      {/* ── 2. Payroll Table ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col w-full text-left">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                {/* Extra column for expand toggle — only meaningful for TUTORs */}
                <th className="w-10 px-3 py-4" aria-label="Expand" />
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
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium bg-slate-50/30">
                    Belum ada data payroll untuk staf aktif pada{" "}
                    <span className="font-bold text-slate-700">{periodLabel}</span>.
                  </td>
                </tr>
              ) : (
                payrollData.map((item) => {
                  const isExpanded    = expandedRows.has(item.id);
                  const canExpand     = item.role === "TUTOR" && item.sessionDetails.length > 0;

                  return (
                    <>
                      {/* ── Main staff row ──────────────────────────────────── */}
                      <tr
                        key={item.id}
                        className={`transition-colors group ${
                          isExpanded ? "bg-emerald-50/30" : "hover:bg-slate-50/50"
                        }`}
                      >
                        {/* Expand toggle cell */}
                        <td className="px-3 py-5 text-center">
                          {canExpand ? (
                            <button
                              onClick={() => toggleRow(item.id)}
                              aria-expanded={isExpanded}
                              aria-label={isExpanded ? "Tutup rincian sesi" : "Buka rincian sesi"}
                              className={`p-1.5 rounded-lg border transition-all ${
                                isExpanded
                                  ? "bg-emerald-100 border-emerald-300 text-emerald-700"
                                  : "bg-slate-100 border-slate-200 text-slate-500 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700"
                              }`}
                            >
                              {isExpanded
                                ? <ChevronDown  className="w-3.5 h-3.5" />
                                : <ChevronRight className="w-3.5 h-3.5" />}
                            </button>
                          ) : (
                            /* Placeholder so layout stays consistent */
                            <span className="block w-7 h-7" />
                          )}
                        </td>

                        {/* Name & role */}
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
                              {item.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-900">{item.name}</span>
                              <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                                {item.role}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Teaching pay */}
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700">
                              {formatRupiah(item.teachingPay)}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">
                              {item.totalSessions > 0 ? `${item.totalSessions} Sesi` : "–"}
                            </span>
                          </div>
                        </td>

                        {/* Referral badge */}
                        <td className="px-6 py-5 text-center">
                          <div className="inline-flex items-center gap-1.5 border border-indigo-100 bg-indigo-50/50 px-3 py-1 rounded-lg">
                            <Users className="w-4 h-4 text-indigo-400" />
                            <span className="text-sm font-bold text-indigo-700">{item.referralCount}</span>
                          </div>
                        </td>

                        {/* Referral bonus */}
                        <td className="px-6 py-5">
                          <span className="text-sm font-bold text-emerald-600">
                            {item.referralBonus > 0 ? `+ ${formatRupiah(item.referralBonus)}` : "–"}
                          </span>
                        </td>

                        {/* Grand total */}
                        <td className="px-6 py-5">
                          <span className="text-lg font-bold text-slate-900 tracking-tight">
                            {formatRupiah(item.grandTotal)}
                          </span>
                        </td>

                        {/* Status badge */}
                        <td className="px-6 py-5 text-center">
                          {item.status === "Pending" ? (
                            <span className="inline-flex items-center justify-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest shadow-sm w-[100px]">
                              <Receipt className="w-3.5 h-3.5" /> Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center gap-1.5 bg-slate-50 text-slate-500 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest shadow-sm w-[100px]">
                              No Pay
                            </span>
                          )}
                        </td>
                      </tr>

                      {/* ── Expandable session-detail row ────────────────────── */}
                      {isExpanded && canExpand && (
                        <tr key={`${item.id}-detail`} className="bg-emerald-50/20">
                          {/* Skip first two cells (toggle + name) */}
                          <td colSpan={7} className="px-0 py-0">
                            <div className="mx-6 my-4 rounded-xl border border-emerald-200 overflow-hidden shadow-sm">

                              {/* Mini-table header */}
                              <div className="bg-emerald-600 px-4 py-2.5 flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-emerald-100" />
                                <span className="text-xs font-bold text-white uppercase tracking-widest">
                                  Rincian {item.sessionDetails.length} Sesi Selesai — {periodLabel}
                                </span>
                              </div>

                              {/* Mini-table body */}
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="bg-emerald-50 border-b border-emerald-200 text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                                    <th className="px-4 py-2.5">No</th>
                                    <th className="px-4 py-2.5">Tanggal</th>
                                    <th className="px-4 py-2.5">Waktu</th>
                                    <th className="px-4 py-2.5">Program</th>
                                    <th className="px-4 py-2.5">Judul / Topik</th>
                                    <th className="px-4 py-2.5 text-right">Honor</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-emerald-100 bg-white">
                                  {item.sessionDetails.map((sesi, idx) => {
                                    const pStyle =
                                      PROGRAM_STYLES[sesi.programType] ??
                                      "bg-slate-100 text-slate-700 border-slate-200";
                                    return (
                                      <tr
                                        key={sesi.id}
                                        className="hover:bg-emerald-50/40 transition-colors"
                                      >
                                        {/* Row number */}
                                        <td className="px-4 py-3 text-xs font-bold text-slate-400 w-10">
                                          {idx + 1}
                                        </td>

                                        {/* Date */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                          <span className="text-xs font-semibold text-slate-700">
                                            {formatSessionDate(sesi.date)}
                                          </span>
                                        </td>

                                        {/* Time slot */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600">
                                            <Clock className="w-3 h-3 text-slate-400" />
                                            {sesi.timeSlot || "—"}
                                          </span>
                                        </td>

                                        {/* Program badge */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wide ${pStyle}`}>
                                            <Tag className="w-2.5 h-2.5" />
                                            {sesi.programType}
                                          </span>
                                        </td>

                                        {/* Title */}
                                        <td className="px-4 py-3 max-w-[240px]">
                                          <span className="text-xs font-medium text-slate-700 truncate block" title={sesi.title}>
                                            {sesi.title}
                                          </span>
                                        </td>

                                        {/* Per-session pay */}
                                        <td className="px-4 py-3 text-right whitespace-nowrap">
                                          <span className="text-xs font-bold text-emerald-700">
                                            Rp 30.000
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>

                                {/* Mini-table footer — subtotal */}
                                <tfoot>
                                  <tr className="bg-emerald-50 border-t border-emerald-200">
                                    <td colSpan={5} className="px-4 py-3 text-xs font-bold text-emerald-800">
                                      Subtotal Gaji Mengajar
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                      <span className="text-sm font-extrabold text-emerald-700">
                                        {formatRupiah(item.teachingPay)}
                                      </span>
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Footer Summary ─────────────────────────────────────────────────── */}
        <div className="bg-slate-50/80 p-5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <span className="text-sm font-medium text-slate-500">
            Menampilkan data payroll{" "}
            <span className="font-bold text-slate-700">{periodLabel}</span>
            {" "}— {payrollData.length} staf.
            {" "}
            <span className="text-slate-400 text-xs">
              (Klik <ChevronRight className="inline w-3 h-3" /> pada baris TUTOR untuk rincian sesi.)
            </span>
          </span>
          <div className="text-sm font-bold text-slate-900 flex items-center gap-4">
            <span className="text-slate-500">Total Pengeluaran:</span>
            <span className="text-xl text-emerald-600 tracking-tight">
              {formatRupiah(totalGrandPay)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
