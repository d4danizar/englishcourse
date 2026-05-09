"use client";

import { useState, useTransition } from "react";
import { Search, Loader2, X, RefreshCcw, User, Calendar, MapPin, Clock } from "lucide-react";
import Link from "next/link";
import { renewStudent } from "../users/actions";

type InvoiceDP = {
  id: string;
  invoiceNumber: string;
  programName: string;
  totalAmount: number;
  paidAmount: number;
  studentData: any;
};

type StudentData = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  branch: string;
  activeProgram: string;
  createdAt: string;
  endDate?: string | null;
};

type Props = {
  dpInvoices: InvoiceDP[];
  activeStudents: StudentData[];
  expiredStudents: StudentData[];
};

export default function EnrollmentTabs({ dpInvoices, activeStudents, expiredStudents }: Props) {
  const [activeTab, setActiveTab] = useState<"DP" | "ACTIVE" | "EXPIRED">("DP");
  const [searchQuery, setSearchQuery] = useState("");

  // === RENEW / REPEAT ORDER STATE ===
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [renewingUser, setRenewingUser] = useState<StudentData | null>(null);
  const [renewProgram, setRenewProgram] = useState("");
  const [renewStartDate, setRenewStartDate] = useState("");
  const [renewDuration, setRenewDuration] = useState("");
  const [renewAmount, setRenewAmount] = useState<number | "">("");
  const [renewPaymentMethod, setRenewPaymentMethod] = useState("CASH");
  const [membershipPackage, setMembershipPackage] = useState("");
  const [renewReferralCode, setRenewReferralCode] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleOpenRenewModal = (student: StudentData) => {
    setRenewingUser(student);
    setIsRenewModalOpen(true);
    setRenewProgram("");
    setRenewStartDate("");
    setRenewDuration("");
    setRenewAmount("");
    setRenewPaymentMethod("CASH");
    setMembershipPackage("");
    setRenewReferralCode("");
  };

  const handleRenewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewingUser) return;

    if (!renewProgram || !renewStartDate) {
      alert("Harap lengkapi program dan tanggal mulai.");
      return;
    }
    if (renewProgram === "Membership" && !membershipPackage) {
      alert("Harap pilih paket membership.");
      return;
    }
    if (renewProgram !== "Membership" && (!renewDuration || !renewAmount)) {
      alert("Harap lengkapi durasi dan nominal pembayaran.");
      return;
    }

    startTransition(async () => {
      const result = await renewStudent(renewingUser.id, {
        programType: renewProgram,
        startDate: new Date(renewStartDate),
        duration: renewProgram === "Membership" ? "" : renewDuration,
        amount: renewProgram === "Membership" ? 0 : Math.max(0, Number(renewAmount) - 100000),
        paymentMethod: renewPaymentMethod,
        membershipPackage: renewProgram === "Membership" ? membershipPackage : undefined,
        referralCode: renewProgram === "Membership" && renewReferralCode ? renewReferralCode : undefined,
      });

      if (result.error) {
        alert("Error: " + result.error);
      } else {
        alert(`✅ Repeat Order berhasil! ${renewingUser.name} terdaftar di program ${renewProgram}.`);
        setIsRenewModalOpen(false);
        setRenewingUser(null);
        setMembershipPackage("");
        window.location.reload();
      }
    });
  };

  const filteredDP = dpInvoices.filter((inv) => {
    const sd = inv.studentData || {};
    const name = (sd.fullName || sd.name || "").toLowerCase();
    const email = (sd.email || "").toLowerCase();
    const q = searchQuery.toLowerCase();
    return name.includes(q) || email.includes(q) || inv.invoiceNumber.toLowerCase().includes(q);
  });

  const filterStudents = (students: StudentData[]) => {
    return students.filter(s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.phoneNumber || "").includes(searchQuery)
    );
  };

  const filteredActive = filterStudents(activeStudents);
  const filteredExpired = filterStudents(expiredStudents);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in">

      {/* Search & Tabs Header */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="flex overflow-x-auto space-x-2 bg-slate-100 p-1.5 rounded-xl w-full sm:w-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("DP")}
            className={`shrink-0 py-2 px-3 sm:px-4 text-xs sm:text-sm font-semibold rounded-lg whitespace-nowrap transition-all ${activeTab === "DP" ? "bg-white text-orange-600 shadow-sm" : "text-slate-500 hover:bg-slate-200"}`}
          >
            ⏳ Menunggu Pelunasan ({dpInvoices.length})
          </button>
          <button
            onClick={() => setActiveTab("ACTIVE")}
            className={`shrink-0 py-2 px-3 sm:px-4 text-xs sm:text-sm font-semibold rounded-lg whitespace-nowrap transition-all ${activeTab === "ACTIVE" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:bg-slate-200"}`}
          >
            ✅ Lunas ({activeStudents.length})
          </button>
          <button
            onClick={() => setActiveTab("EXPIRED")}
            className={`shrink-0 py-2 px-3 sm:px-4 text-xs sm:text-sm font-semibold rounded-lg whitespace-nowrap transition-all ${activeTab === "EXPIRED" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:bg-slate-200"}`}
          >
            🎓 Alumni ({expiredStudents.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, email, no WA..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

        {/* DP TAB */}
        {activeTab === "DP" && (
          <div className="flex flex-col p-2 sm:p-4 gap-3 bg-slate-50/50">
            {filteredDP.length === 0 ? (
              <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200">Tidak ada data siswa DP.</div>
            ) : filteredDP.map((inv) => {
              const sd = inv.studentData || {};
              return (
                <div key={inv.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 border border-slate-200 rounded-xl gap-4 hover:shadow-sm transition-shadow bg-white">
                  {/* Left Side: Name & Contact */}
                  <div className="flex flex-col">
                    <p className="font-bold text-slate-900 text-sm md:text-base">{sd.fullName || sd.name || "-"}</p>
                    <p className="text-xs md:text-sm text-slate-500">{sd.email} • {sd.whatsapp || sd.phone}</p>
                  </div>

                  {/* Middle: Program & Tagihan */}
                  <div className="flex flex-col sm:items-center">
                    <p className="font-semibold text-slate-800 text-sm">{inv.programName}</p>
                    <p className="text-xs font-medium text-orange-600 mt-0.5">
                      Kurang: Rp {(inv.totalAmount - inv.paidAmount).toLocaleString('id-ID')}
                    </p>
                  </div>

                  {/* Right Side: Action */}
                  <div className="flex flex-col sm:items-end w-full sm:w-auto">
                    <Link
                      href={`/pay/pelunasan/${inv.invoiceNumber}`}
                      target="_blank"
                      className="w-full sm:w-auto inline-flex justify-center px-4 py-2.5 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-lg shadow-sm"
                    >
                      Selesaikan Pembayaran
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ACTIVE TAB */}
        {activeTab === "ACTIVE" && (
          <div className="flex flex-col p-2 sm:p-4 gap-3 bg-slate-50/50">
            {filteredActive.length === 0 ? (
              <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200">Tidak ada siswa aktif.</div>
            ) : filteredActive.map((user) => (
              <div key={user.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 border border-slate-200 rounded-xl gap-4 hover:shadow-sm transition-shadow bg-white">
                {/* Left Side: Name & Contact */}
                <div className="flex flex-col">
                  <p className="font-bold text-slate-900 text-sm md:text-base">{user.name}</p>
                  <p className="text-xs md:text-sm text-slate-500">{user.email}</p>
                </div>

                {/* Middle: Program & Tagihan */}
                <div className="flex flex-col sm:items-center">
                  <span className="inline-block px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-md">
                    {user.activeProgram}
                  </span>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Berakhir: {formatDate(user.endDate)}
                  </div>
                </div>

                {/* Right Side: Action */}
                <div className="flex flex-col sm:items-end w-full sm:w-auto">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="w-full sm:w-auto inline-flex justify-center px-4 py-2.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg"
                  >
                    Lihat Profil
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* EXPIRED TAB */}
        {activeTab === "EXPIRED" && (
          <div className="flex flex-col p-2 sm:p-4 gap-3 bg-slate-50/50">
            {filteredExpired.length === 0 ? (
              <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200">Tidak ada alumni.</div>
            ) : filteredExpired.map((user) => (
              <div key={user.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 border border-slate-200 rounded-xl gap-4 hover:shadow-sm transition-shadow bg-white">
                {/* Left Side: Name & Contact */}
                <div className="flex flex-col">
                  <p className="font-bold text-slate-900 text-sm md:text-base">{user.name}</p>
                  <p className="text-xs md:text-sm text-slate-500">{user.email}</p>
                </div>

                {/* Middle: Program & Tagihan */}
                <div className="flex flex-col sm:items-center">
                  <p className="font-medium text-slate-700 text-sm">{user.activeProgram !== "-" ? user.activeProgram : "Belum ada program"}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Sejak: {formatDate(user.createdAt)}</p>
                </div>

                {/* Right Side: Action */}
                <div className="flex flex-col sm:flex-row sm:items-center w-full sm:w-auto gap-2">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="w-full sm:w-auto inline-flex justify-center px-4 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                  >
                    Profil
                  </Link>
                  <button
                    onClick={() => handleOpenRenewModal(user)}
                    className="w-full sm:w-auto inline-flex justify-center items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                  >
                    <RefreshCcw className="w-3.5 h-3.5" /> Repeat Order
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ======================= REPEAT ORDER MODAL ======================= */}
      {isRenewModalOpen && renewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <RefreshCcw className="w-5 h-5" /> Repeat Order
                </h2>
                <p className="text-indigo-100 text-xs mt-0.5">Daftarkan siklus belajar baru untuk <strong>{renewingUser.name}</strong></p>
              </div>
              <button onClick={() => setIsRenewModalOpen(false)} className="text-white/70 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRenewSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="p-6 flex flex-col gap-4 overflow-y-auto">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Program Baru</label>
                  <select
                    value={renewProgram}
                    onChange={(e) => setRenewProgram(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium text-slate-700"
                    required
                  >
                    <option value="">Pilih program...</option>
                    <option value="Regular">Regular (1 Bulan)</option>
                    <option value="Fullday">Fullday</option>
                    <option value="Asrama">Asrama</option>
                    <option value="EFK">EFK (6 Bulan)</option>
                    <option value="EFT">EFT (6 Bulan)</option>
                    <option value="Private">Private</option>
                    <option value="Membership">Membership (Khusus Alumni - Max 14 Hari Pasca Lulus)</option>
                    <option value="TOEFL">TOEFL</option>
                  </select>

                  {renewProgram === "Membership" && (
                    <div className="mt-3 p-4 border border-blue-200 bg-blue-50 rounded-lg">
                      <label className="block text-sm font-semibold text-blue-900 mb-2">Pilih Paket Membership:</label>
                      <select
                        value={membershipPackage}
                        onChange={(e) => setMembershipPackage(e.target.value)}
                        className="w-full border-gray-300 rounded-md shadow-sm mb-3 p-2 text-sm"
                        required
                      >
                        <option value="" disabled>Pilih Paket Membership</option>
                        <option value="1_Bulan">1 Bulan (Rp 750.000)</option>
                        <option value="3_Plus_1_Bulan">3+1 Bulan (Rp 1.250.000)</option>
                        <option value="6_Plus_1_Bulan">6+1 Bulan (Rp 1.950.000)</option>
                        <option value="12_Plus_1_Bulan">12+1 Bulan (Rp 3.100.000)</option>
                      </select>

                      <div className="mt-4">
                        <label className="block text-sm font-semibold text-blue-900 mb-2">Kode Referral / Tutor (Opsional)</label>
                        <input
                          type="text"
                          placeholder="Contoh: TUTORBUDI"
                          className="w-full border-gray-300 rounded-md shadow-sm p-2 text-sm uppercase focus:ring-blue-500 focus:border-blue-500"
                          value={renewReferralCode}
                          onChange={(e) => setRenewReferralCode(e.target.value.toUpperCase())}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Tanggal Mulai</label>
                  <input
                    type="date"
                    value={renewStartDate}
                    onChange={(e) => setRenewStartDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    required
                  />
                </div>

                {renewProgram !== "Membership" && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Durasi</label>
                    <select
                      value={renewDuration}
                      onChange={(e) => setRenewDuration(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      required
                    >
                      <option value="">Pilih durasi...</option>
                      <option value="1_WEEK">1 Minggu</option>
                      <option value="2_WEEKS">2 Minggu</option>
                      <option value="3_WEEKS">3 Minggu</option>
                      <option value="1_MONTH">1 Bulan</option>
                      <option value="2_MONTHS">2 Bulan</option>
                      <option value="6_MONTHS">6 Bulan</option>
                    </select>
                  </div>
                )}

                {renewProgram !== "Membership" && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Harga Normal Program (Rp)</label>
                    <input
                      type="number"
                      value={renewAmount}
                      onChange={(e) => setRenewAmount(e.target.value ? Number(e.target.value) : "")}
                      placeholder="Contoh: 500000"
                      min={100000}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      required
                    />
                    {renewAmount !== "" && Number(renewAmount) >= 100000 && (
                      <div className="mt-1 text-xs font-medium text-indigo-700 bg-indigo-50 p-2 rounded-lg border border-indigo-200">
                        Total Tagihan Repeat Order: <strong>Rp {(Number(renewAmount) - 100000).toLocaleString("id-ID")}</strong> <br />
                        <span className="text-indigo-600 opacity-80">(Otomatis dipotong biaya pendaftaran Rp 100.000)</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Metode Pembayaran</label>
                  <select
                    value={renewPaymentMethod}
                    onChange={(e) => setRenewPaymentMethod(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  >
                    <option value="CASH">💵 Cash</option>
                    <option value="TRANSFER">🏦 Transfer Bank</option>
                  </select>
                </div>
              </div>

              <div className="p-5 border-t border-slate-100 gap-3 flex justify-end bg-slate-50/50 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsRenewModalOpen(false)}
                  disabled={isPending}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
                >
                  {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : "✅ Daftarkan & Bayar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
