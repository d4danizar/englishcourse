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
  const PAGE_SIZE = 100;
  const skip = (page - 1) * PAGE_SIZE;

  const { leads, totalCount } = await getLeadsForTracking(skip, PAGE_SIZE);
  const sources = await getMarketingSources();

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col min-h-screen">
      <LeadSourceClient 
        initialLeads={leads} 
        initialSources={sources} 
        currentPage={page}
        totalPages={totalPages}
      />
    </div>
  );
}
