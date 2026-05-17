import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DebugClonesPage() {
  // Fetch all enrollments with user info
  const allEnrollments = await prisma.enrollment.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' }
  });

  // Group and find duplicates
  const cloneMap = new Map();
  const affectedUsers = new Map();

  allEnrollments.forEach((e) => {
    if (!e.startDate) return;
    const start = new Date(e.startDate);
    const uniqueKey = `${e.userId}-${e.programType}-${start.getFullYear()}-${start.getMonth()}`;

    if (cloneMap.has(uniqueKey)) {
      // It's a duplicate!
      const currentCount = cloneMap.get(uniqueKey).count;
      cloneMap.set(uniqueKey, { ...e, count: currentCount + 1 });
      
      affectedUsers.set(e.userId, {
        name: e.user?.name || "Unknown",
        email: e.user?.email || "Unknown",
        program: e.programType,
        clonesFound: currentCount + 1
      });
    } else {
      cloneMap.set(uniqueKey, { ...e, count: 1 });
    }
  });

  const targets = Array.from(affectedUsers.values());

  // RENDER THE UI
  return (
    <div className="p-8">
      <h1 className="text-3xl font-black text-red-600 mb-4">🚨 RADAR KLONING MURID</h1>
      <p className="mb-6 text-gray-700">Daftar murid yang memiliki lebih dari 1 program yang sama di bulan yang sama.</p>
      
      {targets.length === 0 ? (
        <div className="p-4 bg-emerald-100 text-emerald-800 font-bold rounded">✅ Database Bersih! Tidak ada kloningan ditemukan.</div>
      ) : (
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Nama Murid</th>
              <th className="border p-2">Email</th>
              <th className="border p-2">Program Terdampak</th>
              <th className="border p-2">Jumlah Kloningan</th>
            </tr>
          </thead>
          <tbody>
            {targets.map((t, idx) => (
              <tr key={idx} className="bg-red-50">
                <td className="border p-2 font-semibold">{t.name}</td>
                <td className="border p-2">{t.email}</td>
                <td className="border p-2">{t.program}</td>
                <td className="border p-2 text-center text-red-600 font-bold">{t.clonesFound}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
