"use client";

import { useState } from "react";
import { CalendarDays, LayoutGrid, Sparkles } from "lucide-react";

export function ScheduleTabsWrapper({
  activeSessionsTable,
  rosterBuilder,
  independentClassesTable,
}: {
  activeSessionsTable: React.ReactNode;
  rosterBuilder: React.ReactNode;
  independentClassesTable: React.ReactNode;
}) {
  const [activeTab, setActiveTab] = useState<"sessions" | "roster" | "independent">("sessions");

  const tabs = [
    { id: "sessions" as const, label: "Active Sessions", icon: CalendarDays },
    { id: "independent" as const, label: "Independent Classes", icon: Sparkles },
    { id: "roster" as const, label: "Weekly Roster Builder", icon: LayoutGrid },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Tab Bar */}
      <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                isActive
                  ? "bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/50"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "sessions" && activeSessionsTable}
      {activeTab === "independent" && independentClassesTable}
      {activeTab === "roster" && rosterBuilder}
    </div>
  );
}
