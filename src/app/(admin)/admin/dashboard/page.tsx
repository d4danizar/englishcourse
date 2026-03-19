import { prisma } from "../../../../lib/prisma";
import Link from "next/link";
import { format, startOfDay, endOfDay } from "date-fns";
import {
  Users,
  GraduationCap,
  CalendarDays,
  Sun,
  PauseCircle,
  TrendingUp,
  Clock,
} from "lucide-react";

export default async function AdminDashboardPage() {
  // Fetch stats in parallel
  const [tutorCount, studentCount, totalSessions, recentSessions] =
    await Promise.all([
      prisma.user.count({ where: { role: "TUTOR" } }),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.session.count(),
      prisma.session.findMany({
        where: {
          date: {
            gte: startOfDay(new Date()),
            lte: endOfDay(new Date()),
          },
        },
        take: 5,
        orderBy: { timeSlot: "asc" }, // better to order by time for today's sessions
        include: { tutor: { select: { name: true } } },
      }),
    ]);

  const stats = [
    {
      label: "Total Tutors",
      value: tutorCount,
      icon: Users,
      trend: "Active in roster",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      label: "Total Students",
      value: studentCount,
      icon: GraduationCap,
      trend: "Enrolled members",
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      label: "Total Sessions",
      value: totalSessions,
      icon: CalendarDays,
      trend: "All time",
      color: "text-violet-600",
      bgColor: "bg-violet-100",
    },
  ];

  // Badge colors for program types
  const programStyles: Record<string, string> = {
    Conversation: "bg-blue-100 text-blue-700",
    Grammar: "bg-indigo-100 text-indigo-700",
    EFK: "bg-orange-100 text-orange-700",
    Private: "bg-emerald-100 text-emerald-700",
    TOEFL: "bg-amber-100 text-amber-700",
    Fullday: "bg-cyan-100 text-cyan-700",
    Asrama: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Dashboard
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Overview of your English course operations.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col gap-4 text-left transition-all hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  {stat.label}
                </p>
                <div className={`p-2 rounded-xl ${stat.bgColor} ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold tracking-tight text-slate-900">
                  {stat.value}
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-medium text-slate-500">
                    {stat.trend}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Holiday Mode Control */}
      <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-amber-100 rounded-full blur-2xl opacity-50 pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-amber-100 rounded-xl text-amber-600 mt-1 sm:mt-0 shadow-sm border border-amber-200/50">
              <Sun className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight text-amber-900">
                Holiday Mode
              </h3>
              <p className="mt-1 text-sm font-medium text-amber-800/80 max-w-xl leading-relaxed">
                Pause all <strong className="font-semibold text-amber-900">Regular</strong> sessions
                during seasonal holiday programs.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 transition-colors whitespace-nowrap"
          >
            <PauseCircle className="w-4 h-4" />
            Pause Regular Sessions
          </button>
        </div>
      </div>

      {/* Recent Sessions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">
              Recent Sessions
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              The 5 most recently scheduled sessions.
            </p>
          </div>
          <Link
            href="/admin/classes"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center"
          >
            View all schedules
            <span aria-hidden="true" className="ml-1">→</span>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Time
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Title
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Program
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Tutor
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {recentSessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-sm text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="p-4 bg-slate-50 rounded-full">
                        <CalendarDays className="w-10 h-10 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-base font-medium text-slate-900">No sessions found</p>
                        <p className="mt-1">Create your first schedule to get started.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                recentSessions.map((s) => {
                  const pStyle = programStyles[s.programType] || "bg-slate-100 text-slate-700";
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                        {format(new Date(s.date), "MMM dd, yyyy")}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {s.timeSlot}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="font-semibold text-slate-900">{s.title}</span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${pStyle}`}>
                          {s.programType}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-600">
                        {s.tutor.name}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {s.isCompleted ? (
                          <span className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold bg-green-100 text-green-700">
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold bg-amber-100 text-amber-700">
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
