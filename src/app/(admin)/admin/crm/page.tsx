import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "../../../../lib/prisma";
import { CRMTable } from "./CRMTable";
import { getBranchFilter } from "@/lib/actions/branch-actions";

export const metadata = {
  title: "CRM Leads | Admin",
  description: "Daftar Leads masuk",
};

export default async function CRMPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getServerSession(authOptions);

  const CRM_ALLOWED = ["SUPER_ADMIN", "CS", "MARKETING"];
  if (!session?.user || !CRM_ALLOWED.includes(session.user.role as string)) {
    redirect("/admin");
  }

  const resolvedParams = await searchParams;
  const statusStr = resolvedParams.status as string | undefined;
  const branchFilter = await getBranchFilter();

  const leads = await prisma.lead.findMany({
    where: statusStr ? { status: statusStr as any, ...branchFilter } : { ...branchFilter },
    take: 200,
    include: {
      invoices: {
        select: {
          id: true,
          invoiceNumber: true,
          programName: true,
          amountDue: true,
          totalAmount: true,
          paidAmount: true,
          status: true,
          paymentProof: true,
          studentData: true,
          cashflows: { select: { id: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="h-full animate-in fade-in duration-500 max-w-7xl mx-auto w-full">
      <CRMTable initialLeads={leads} currentFilter={statusStr || "ALL"} />
    </div>
  );
}
