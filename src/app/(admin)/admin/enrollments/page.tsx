import { prisma } from "@/lib/prisma";
import EnrollmentTabs from "./EnrollmentTabs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getBranchFilter } from "@/lib/actions/branch-actions";
import { getHolidayMedicalData } from "@/lib/actions/invoice-actions";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Pusat Pendaftaran",
};

export default async function EnrollmentsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return notFound();

  const branchFilter = await getBranchFilter();

  // 1. Fetch DP Invoices
  const dpInvoicesRaw = await prisma.invoice.findMany({
    where: { status: "DP_PAID", ...branchFilter },
    orderBy: { createdAt: "desc" }
  });

  const dpInvoices = dpInvoicesRaw.map(inv => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    programName: inv.programName,
    totalAmount: inv.totalAmount,
    paidAmount: inv.paidAmount,
    studentData: inv.studentData
  }));

  const dpEmails = new Set(
    dpInvoices.map(inv => (inv.studentData as any)?.email).filter(Boolean)
  );

  // 2. Fetch all students
  const rawUsers = await prisma.user.findMany({
    where: { role: "STUDENT", ...branchFilter },
    include: {
      enrollments: {
        orderBy: { startDate: "desc" },
      }
    },
    orderBy: { createdAt: "desc" }
  });

  const activeStudents: any[] = [];
  const expiredStudents: any[] = [];

  rawUsers.forEach(user => {
    // If they have a DP Invoice, they are in the DP tab, we skip them here
    // so they don't show up in ACTIVE.
    if (dpEmails.has(user.email)) return;

    const hasActive = user.enrollments.some(e => e.status === "ACTIVE");
    
    const studentData = {
      id: user.id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      branch: user.branch,
      activeProgram: user.enrollments[0]?.programType || "-",
      createdAt: user.createdAt.toISOString(),
      endDate: user.enrollments[0]?.endDate?.toISOString() || null
    };

    if (hasActive) {
      activeStudents.push(studentData);
    } else {
      expiredStudents.push(studentData);
    }
  });

  // 3. Fetch Medical Data
  const medicalRecords = await getHolidayMedicalData();

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Pusat Pendaftaran & Pembayaran</h1>
        <p className="text-sm text-slate-500 mt-1">
          Kelola siswa yang belum lunas (DP), siswa aktif, dan perpanjangan alumni (Repeat Order).
        </p>
      </div>
      
      <EnrollmentTabs 
        dpInvoices={dpInvoices} 
        activeStudents={activeStudents} 
        expiredStudents={expiredStudents}
        medicalRecords={medicalRecords}
      />
    </div>
  );
}
