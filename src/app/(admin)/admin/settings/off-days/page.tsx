import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Calendar, Trash2, Plus, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { createOffDay, deleteOffDay } from "./actions";

export const metadata = {
  title: "Tanggal Merah (Off Days) | Admin",
};

export default async function OffDaysPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  // Hanya Super Admin atau role tertentu yang bisa mengatur tanggal merah
  // Bisa disesuaikan dengan kebutuhan (contoh di sini bebas asal admin)

  const offDays = await prisma.offDay.findMany({
    orderBy: { startDate: "asc" },
  });

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full animate-in fade-in duration-500 py-6 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm w-full">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-red-500" /> Tanggal Merah (Off Days)
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500 max-w-xl">
            Sistem penjadwalan akademik secara otomatis akan melewati tanggal-tanggal di bawah ini saat menghitung tenggat waktu (End Date) siswa dan mengatur kehadiran mingguan.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* FORM TAMBAH TANGGAL MERAH */}
        <div className="md:col-span-1 flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sticky top-24">
            <h2 className="text-sm font-bold tracking-tight text-slate-900 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-500" /> Tambah Baru
            </h2>
            <form action={createOffDay} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mulai Libur</label>
                  <input
                    type="date"
                    name="startDate"
                    required
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Akhir Libur</label>
                  <input
                    type="date"
                    name="endDate"
                    required
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Keterangan / Deskripsi</label>
                <input
                  type="text"
                  name="description"
                  required
                  placeholder="Contoh: Libur Lebaran, Libur Nasional..."
                  autoComplete="off"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 px-3 py-2"
                />
              </div>
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors mt-2"
              >
                Simpan Tanggal
              </button>
            </form>
          </div>
        </div>

        {/* TABEL DAFTAR TANGGAL MERAH */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-900 tracking-tight text-sm">Daftar Libur Akademik</h3>
            </div>
            
            <div className="overflow-x-auto">
              {offDays.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-slate-500">
                  <div className="p-3 bg-slate-50 rounded-full mb-3">
                    <Calendar className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-sm font-medium">Belum ada tanggal merah terdaftar.</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-semibold w-1/3">TANGGAL</th>
                      <th scope="col" className="px-4 py-3 font-semibold">KETERANGAN</th>
                      <th scope="col" className="px-4 py-3 font-semibold text-right w-20">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {offDays.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                          {item.startDate.getTime() === item.endDate.getTime()
                            ? format(item.startDate, "dd MMM yyyy")
                            : `${format(item.startDate, "dd MMM")} - ${format(item.endDate, "dd MMM yyyy")}`}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-600">
                          {item.description}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <form action={deleteOffDay.bind(null, item.id)}>
                            <button
                              type="submit"
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex"
                              title="Hapus Tanggal Merah"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          
          <div className="mt-4 bg-amber-50 text-amber-800 border border-amber-200 px-4 py-3 rounded-xl flex items-start gap-3 text-sm font-medium">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
            <p>
              Tenggat waktu program siswa akan langsung dikalkulasi ulang menyesuaikan array kalender libur ini setiap ada pendaftaran siswa baru atau konversi Bulk Import.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
