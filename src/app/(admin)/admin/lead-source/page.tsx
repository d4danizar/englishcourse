import { getLeadsForTracking, getMarketingSources } from "@/lib/actions/lead-source-actions";
import LeadSourceClient from "./LeadSourceClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tracking Asal Iklan | Admin Kampung Inggris",
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LeadSourcePage() {
  const leads = await getLeadsForTracking();
  const sources = await getMarketingSources();

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <LeadSourceClient initialLeads={leads} initialSources={sources} />
    </div>
  );
}
