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
  const searchQuery = resolvedParams.q as string | undefined;
  
  const pageParam = typeof resolvedParams.page === "string" ? parseInt(resolvedParams.page, 10) : 1;
  const page = !isNaN(pageParam) && pageParam > 0 ? pageParam : 1;
  const PAGE_SIZE = 50;
  const skip = (page - 1) * PAGE_SIZE;
  
  const branchFilter = await getBranchFilter();
  
  const whereClause: any = {
    ...branchFilter,
    ...(searchQuery ? {
      OR: [
        { name: { contains: searchQuery, mode: 'insensitive' } },
        { whatsapp: { contains: searchQuery } }
      ]
    } : {})
  };

  if (statusStr) {
    if (statusStr === "WAITING_CONFIRMATION") {
      whereClause.invoices = {
        some: { status: "WAITING_CONFIRMATION" }
      };
    } else {
      whereClause.status = statusStr;
    }
  }

  const [totalCount, leads] = await Promise.all([
    prisma.lead.count({ where: whereClause }),
    prisma.lead.findMany({
      where: whereClause,
      take: PAGE_SIZE,
      skip,
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
    })
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  return (
    <div className="h-full animate-in fade-in duration-500 max-w-7xl mx-auto w-full flex flex-col">
      <CRMTable 
        initialLeads={leads} 
        currentFilter={statusStr || "ALL"} 
        currentPage={page} 
        totalPages={totalPages} 
      />
    </div>
  );
}
