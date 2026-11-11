import { getLeadsForTracking, getMarketingSources } from "@/lib/actions/lead-source-actions";
import LeadSourceClient from "./LeadSourceClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tracking Asal Iklan | Admin Kampung Inggris",
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LeadSourcePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const pageParam = typeof resolvedParams.page === "string" ? parseInt(resolvedParams.page, 10) : 1;
  const page = !isNaN(pageParam) && pageParam > 0 ? pageParam : 1;

  const now = new Date();
  const monthParam = typeof resolvedParams.month === "string" ? parseInt(resolvedParams.month, 10) : now.getMonth() + 1;
  const yearParam = typeof resolvedParams.year === "string" ? parseInt(resolvedParams.year, 10) : now.getFullYear();

  const currentMonth = !isNaN(monthParam) && monthParam >= 1 && monthParam <= 12 ? monthParam : now.getMonth() + 1;
  const currentYear = !isNaN(yearParam) && yearParam >= 2020 ? yearParam : now.getFullYear();

  let startDate: Date | undefined;
  let endDate: Date | undefined;

  if (typeof resolvedParams.startDate === "string" && resolvedParams.startDate) {
    startDate = new Date(`${resolvedParams.startDate}T00:00:00`);
  } else if (resolvedParams.month || resolvedParams.year) {
    startDate = new Date(currentYear, currentMonth - 1, 1);
  }

  if (typeof resolvedParams.endDate === "string" && resolvedParams.endDate) {
    endDate = new Date(`${resolvedParams.endDate}T23:59:59`);
  } else if (resolvedParams.month || resolvedParams.year) {
    endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);
  }

  const { leads } = await getLeadsForTracking(startDate, endDate);
  const sources = await getMarketingSources();

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col min-h-screen">
      <LeadSourceClient 
        initialLeads={leads} 
        initialSources={sources} 
        currentPage={page}
        totalPages={1}
        currentMonth={currentMonth}
        currentYear={currentYear}
      />
    </div>
  );
}
