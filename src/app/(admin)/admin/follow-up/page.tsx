import { getLeadsByMonth } from "./actions";
import CrmDashboardClient from "./CrmDashboardClient";

export default async function FollowUpPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }> | { month?: string; year?: string };
}) {
  const resolvedParams = await Promise.resolve(searchParams);
  const currentDate = new Date();
  const month = resolvedParams?.month ? parseInt(resolvedParams.month) : currentDate.getMonth() + 1;
  const year = resolvedParams?.year ? parseInt(resolvedParams.year) : currentDate.getFullYear();

  const leads = await getLeadsByMonth(year, month);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">CRM Pipeline & Follow-Up Tracker</h1>
      <CrmDashboardClient currentMonth={month} currentYear={year} initialLeads={leads} />
    </div>
  );
}
