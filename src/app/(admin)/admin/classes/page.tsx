import { prisma } from "../../../../lib/prisma";
import { format } from "date-fns";
import { CalendarDays, Clock } from "lucide-react";
import { SchedulePageHeader } from "./SchedulePageHeader";
import { ActiveSessionsView } from "./ActiveSessionsView";
import AutoAbsenceButton from "../../../../components/admin/AutoAbsenceButton";
import { ScheduleTabsWrapper } from "./ScheduleTabsWrapper";
import { WeeklyRosterBuilder } from "./WeeklyRosterBuilder";
import { IndependentClassesView } from "./IndependentClassesView";
import { getBranchFilter } from "@/lib/actions/branch-actions";
import { getTodayTopic, TodayTopic } from "@/lib/syllabus-helpers";

export default async function ScheduleManagementPage() {
  const branchFilter = await getBranchFilter();

  // 1. Fetch tutors for dropdowns (include HEAD_TUTOR as they also teach)
  const tutors = await prisma.user.findMany({
    where: { 
      role: { in: ["TUTOR", "HEAD_TUTOR"] }, 
      OR: [
        { ...branchFilter },
        { secondaryBranch: branchFilter.branch }
      ]
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // 1b. Fetch active students for the Independent Class Modal
  const students = await prisma.user.findMany({
    where: { 
      role: "STUDENT", 
      ...branchFilter 
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // 1c. Fetch Independent Classes (ClassGroups)
  const independentClasses = await prisma.classGroup.findMany({
    where: { 
      classType: "INDEPENDENT",
      branch: branchFilter.branch
    },
    include: {
      sessions: {
        include: { tutor: { select: { name: true } } },
        orderBy: { id: "asc" }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  // 2. Fetch all sessions with tutor info (Active Sessions, excluding null dates)
  const sessions = await prisma.session.findMany({
    where: { 
      ...branchFilter,
      date: { not: null } 
    },
    include: {
      tutor: { select: { name: true } },
      _count: { select: { attendances: true } },
    },
    orderBy: { date: "desc" },
  });

  // Badge colors for program types
  const programStyles: Record<string, string> = {
    Conversation: "bg-blue-100 text-blue-700 border-blue-200",
    Grammar: "bg-indigo-100 text-indigo-700 border-indigo-200",
    Pronunciation: "bg-violet-100 text-violet-700 border-violet-200",
    Listening: "bg-sky-100 text-sky-700 border-sky-200",
    "EFK/EFT": "bg-orange-100 text-orange-700 border-orange-200",
    EFK: "bg-orange-100 text-orange-700 border-orange-200",
    EFT: "bg-pink-100 text-pink-700 border-pink-200",
    "TOEFL Prep": "bg-amber-100 text-amber-700 border-amber-200",
    Private: "bg-emerald-100 text-emerald-700 border-emerald-200",
    TOEFL: "bg-amber-100 text-amber-700 border-amber-200",
    Fullday: "bg-cyan-100 text-cyan-700 border-cyan-200",
    Asrama: "bg-purple-100 text-purple-700 border-purple-200",
  };

  const sessionsWithData = sessions.map(session => {
    return {
      ...session
    };
  });

  const activeSessionsTable = (
    <ActiveSessionsView 
      sessions={sessionsWithData.map(s => ({
        ...s,
        date: s.date ? s.date.toISOString() : null, // Handle optional date
      }))} 
      tutors={tutors} 
    />
  );

  const independentClassesTable = (
    <IndependentClassesView 
      classes={independentClasses.map(c => ({
        id: c.id,
        name: c.name,
        program: c.program,
        classType: c.classType,
        sessions: c.sessions.map(s => ({
          id: s.id,
          title: s.title,
          date: s.date ? s.date.toISOString() : null,
          timeSlot: s.timeSlot,
          tutor: { name: s.tutor.name }
        }))
      }))}
    />
  );

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Page Header (Client Component with single-session modal) */}
      <div className="flex flex-col gap-6">
        <SchedulePageHeader tutors={tutors} students={students} />
        
        {/* Sweep / Auto-Alpa Button Tracker */}
        <div className="flex justify-end pr-1 border-b border-slate-100 pb-6">
          <AutoAbsenceButton />
        </div>
      </div>

      {/* Tab Navigation: Active Sessions | Independent | Weekly Roster Builder */}
      <ScheduleTabsWrapper
        activeSessionsTable={activeSessionsTable}
        independentClassesTable={independentClassesTable}
        rosterBuilder={<WeeklyRosterBuilder tutors={tutors} />}
      />
    </div>
  );
}
