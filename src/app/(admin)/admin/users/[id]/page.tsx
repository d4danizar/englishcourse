import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  User as UserIcon, 
  Calendar, 
  Phone, 
  MapPin, 
  CheckCircle, 
  Clock, 
  BookOpen, 
  AlertCircle,
  Activity,
  Award,
  FileText
} from "lucide-react";

export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Fetch the user along with enrollments and attendances
  console.log(`[StudentProfilePage] Fetching user profile for ID: ${id}`);
  
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      enrollments: {
        orderBy: { startDate: 'desc' },
        include: {
          Payment: true,
        }
      },
      attendances: {
        include: {
          session: true
        }
      }
    }
  });

  if (!user) {
    notFound();
  }

  // Calculate overall stats
  const totalPrograms = user.enrollments.length;
  const presentAttendances = user.attendances.filter(a => a.status === "PRESENT").length;
  const totalAttendances = user.attendances.length;

  // Find lead and invoices
  const lead = await prisma.lead.findFirst({
    where: {
      OR: [
        { whatsapp: user.phoneNumber || "UNKNOWN" },
        { name: user.name }
      ]
    },
    include: {
      invoices: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });
  const invoices = lead?.invoices || [];

  let registrationData: any = null;
  if (invoices.length > 0) {
    const regInvoice = invoices.find(i => (i.studentData as any)?.address) || invoices[invoices.length - 1];
    if (regInvoice?.studentData) {
      registrationData = regInvoice.studentData as any;
    }
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Dynamically find truly active enrollment
  const activeEnrollment = user.enrollments.find(e => {
    if (e.status !== "ACTIVE") return false;
    if (!e.endDate) return false; // If no end date from import, assume expired
    const endDate = new Date(e.endDate);
    endDate.setHours(0, 0, 0, 0);
    return endDate >= todayStart;
  });

  const historyEnrollments = user.enrollments.filter(e => e.id !== activeEnrollment?.id);

  // Helper function to get attendance stats for a specific enrollment
  const getAttendanceStatsForEnrollment = (enrollment: any) => {
    const endBound = enrollment.endDate ? new Date(enrollment.endDate) : new Date(8640000000000000);
    const relevantAttendances = user.attendances.filter(a => {
      const sessionDate = new Date(a.session.date);
      return sessionDate >= new Date(enrollment.startDate) && sessionDate <= endBound;
    });

    return {
      present: relevantAttendances.filter(a => a.status === "PRESENT").length,
      absent: relevantAttendances.filter(a => a.status === "ABSENT").length,
      sick: relevantAttendances.filter(a => a.status === "SICK").length,
      excused: relevantAttendances.filter(a => a.status === "EXCUSED").length,
      total: relevantAttendances.length
    };
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(new Date(date));
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header Navigation */}
      <div className="flex items-center gap-4">
        <Link 
          href="/admin/users" 
          className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Student Profile 360°</h1>
          <p className="text-sm text-slate-500">Comprehensive overview of student activities and history.</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Personal Info & Overall Stats */}
        <div className="space-y-6">
          
          {/* Header Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-inner mb-4">
              <span className="text-3xl font-bold text-white tracking-widest uppercase">
                {user.name.substring(0, 2)}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-800">{user.name}</h2>
            <div className="inline-flex items-center px-2.5 py-1 mt-2 rounded-full bg-slate-100 text-xs font-semibold text-slate-600 border border-slate-200">
              {user.role}
            </div>

            <div className="w-full mt-6 space-y-3 text-left">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Phone className="w-4 h-4 text-slate-400" />
                <span>{user.phoneNumber || "Tidak ada nomor WA"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>{user.branch.replace("_", " ")}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Bergabung: {formatDate(user.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Stats Row (Cards) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
              <div className="flex items-center gap-2 text-indigo-600 mb-2">
                <BookOpen className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Total Program</span>
              </div>
              <span className="text-3xl font-extrabold text-slate-800">{totalPrograms}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
              <div className="flex items-center gap-2 text-emerald-600 mb-2">
                <CheckCircle className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Total Hadir</span>
              </div>
              <span className="text-3xl font-extrabold text-slate-800">
                {presentAttendances} <span className="text-sm font-medium text-slate-400">/ {totalAttendances}</span>
              </span>
            </div>
          </div>

          {/* Biodata & Info Pendaftaran */}
          {registrationData && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" /> Biodata & Info Pendaftaran
              </h3>
              <div className="flex flex-col gap-3 text-sm">
                {Object.entries(registrationData)
                  .filter(([k, v]) => v && !['name', 'program', 'whatsapp', 'activeProgram', 'programBatch', 'durationOption', 'batchSchedule', 'startDate'].includes(k))
                  .map(([key, value]) => {
                    const labelMap: Record<string, string> = {
                      email: "Email",
                      school: "Status Kesibukan",
                      gender: "Jenis Kelamin",
                      birthPlace: "Tempat Lahir",
                      birthDate: "Tanggal Lahir",
                      occupation: "Kesibukan Detail",
                      discoverySource: "Sumber Info",
                      address: "Alamat",
                      tshirtSize: "Ukuran Kaos",
                    };
                    return (
                      <div key={key}>
                        <div className="text-xs text-slate-500">{labelMap[key] || key}</div>
                        <div className="font-semibold text-slate-800">
                          {key === "tshirtSize" ? (
                            <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded uppercase font-bold tracking-widest text-xs mt-0.5 inline-block">
                              {String(value)}
                            </span>
                          ) : (
                            String(value)
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Active Program & History */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Program Section */}
          <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden relative ${activeEnrollment ? 'border-emerald-200' : 'border-slate-200'}`}>
            <div className="absolute top-0 right-0 p-4">
              {activeEnrollment ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  ACTIVE
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-bold border border-slate-200">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  INACTIVE
                </span>
              )}
            </div>
            <div className={`p-6 border-b border-slate-100 ${activeEnrollment ? 'bg-gradient-to-r from-emerald-50 to-white' : 'bg-slate-50'}`}>
              <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-widest flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4" /> Program Berjalan
              </h3>
              {activeEnrollment ? (
                <>
                  <div className="mt-4">
                    <h4 className="text-2xl font-bold text-slate-900">{activeEnrollment.programType}</h4>
                    <p className="text-slate-500 text-sm mt-1">
                      {formatDate(activeEnrollment.startDate)} — {formatDate(activeEnrollment.endDate)}
                    </p>
                  </div>

                  {/* Active Program Attendance Progress */}
                  {(() => {
                    const stats = getAttendanceStatsForEnrollment(activeEnrollment);
                    const totalSesi = stats.total || 1; // prevent div by 0
                    const percentage = Math.min(100, Math.round((stats.present / totalSesi) * 100));
                    
                    return (
                      <div className="mt-6">
                        <div className="flex justify-between text-xs font-semibold text-slate-600 mb-2">
                          <span>Kehadiran Program Ini</span>
                          <span>{stats.present} / {stats.total} Sesi ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-2.5 rounded-full transition-all duration-1000" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="flex gap-4 mt-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-500"/> {stats.present} Hadir</span>
                          <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-red-500"/> {stats.absent} Alpa</span>
                        </div>
                        
                        {/* Leave Quota Info */}
                        <div className="mt-4 p-3 bg-white/60 rounded-xl border border-emerald-100 flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-600">Sisa Cuti / Izin</span>
                          <span className="text-sm font-bold text-slate-800">
                            {activeEnrollment.leaveQuota - activeEnrollment.leaveUsed} dari {activeEnrollment.leaveQuota} hari
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </>
              ) : (
                <div className="py-8 text-center text-slate-500">
                  <p>Tidak ada program yang sedang aktif.</p>
                </div>
              )}
            </div>
          </div>

          {/* Invoice History Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-4 h-4" /> Riwayat Tagihan / Invoices
              </h3>
            </div>
            <div className="p-0">
              {invoices.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">No. Invoice</th>
                        <th className="px-4 py-3">Program</th>
                        <th className="px-4 py-3">Total / Dibayar</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invoices.map((inv: any) => (
                        <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-4 font-medium text-slate-900">{inv.invoiceNumber}</td>
                          <td className="px-4 py-4">{inv.programName}</td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-900">Rp {inv.totalAmount.toLocaleString("id-ID")}</span>
                              <span className="text-xs text-slate-500">Dibayar: Rp {inv.paidAmount.toLocaleString("id-ID")}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            {inv.status === "PAID" && (
                              <span className="inline-flex px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs font-bold">LUNAS</span>
                            )}
                            {inv.status === "DP_PAID" && (
                              <span className="inline-flex px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-bold">DP LUNAS</span>
                            )}
                            {inv.status === "PENDING" && (
                              <span className="inline-flex px-2 py-1 bg-amber-100 text-amber-700 rounded-md text-xs font-bold">BELUM BAYAR</span>
                            )}
                            {inv.status === "WAITING_CONFIRMATION" && (
                              <span className="inline-flex px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-bold">MENUNGGU VERIFIKASI</span>
                            )}
                            {inv.status === "CANCELLED" && (
                              <span className="inline-flex px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-bold">DIBATALKAN</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <p>Belum ada riwayat tagihan.</p>
                </div>
              )}
            </div>
          </div>

          {/* History / Repeat Order Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Riwayat Program (Repeat Orders)</h3>
            </div>
            
            <div className="divide-y divide-slate-100">
              {historyEnrollments.length > 0 ? (
                historyEnrollments.map((enrollment) => {
                  const stats = getAttendanceStatsForEnrollment(enrollment);
                  
                  return (
                    <div key={enrollment.id} className="p-5 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-base font-bold text-slate-900">{enrollment.programType}</h4>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{formatDate(enrollment.startDate)} — {formatDate(enrollment.endDate)}</span>
                          </div>
                        </div>
                        <span className="inline-flex px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                          {enrollment.status}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 pt-4 border-t border-slate-100/60">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          <span className="text-sm font-semibold text-slate-700">{stats.present} <span className="font-normal text-slate-500 text-xs">Hadir</span></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-red-500" />
                          <span className="text-sm font-semibold text-slate-700">{stats.absent} <span className="font-normal text-slate-500 text-xs">Alpa</span></span>
                        </div>
                        {enrollment.Payment && enrollment.Payment.length > 0 && (
                          <div className="flex items-center gap-1.5 ml-auto text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                            <span className="text-xs font-semibold">Tercatat {enrollment.Payment.length} Pembayaran</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-500 text-sm">
                  Belum ada riwayat program lain sebelumnya.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
