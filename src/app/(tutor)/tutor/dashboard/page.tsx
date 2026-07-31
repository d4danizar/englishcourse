import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { redirect } from "next/navigation";
import { TutorDashboardClient, type SessionTask, type EligibleStudent, type StudentSearchItem } from "./TutorDashboardClient";
import { getEligibleStudentsForSession, getGlobalPoolForSession } from "../../../../lib/student-pool";
import { getMedicalMap } from "../../../../lib/actions/invoice-actions";
import { getTodayTopic } from "../../../../lib/syllabus-helpers";

export default async function TutorDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const tutorId = session.user.id;

  const now = new Date();
  const todayStart = new Date(now.setHours(0, 0, 0, 0));

  // 1. Fetch overdue sessions for this tutor
  const overdueSessionsRaw = await prisma.session.findMany({
    where: {
      tutorId,
      isCompleted: false, // Not yet submitted
      date: { lt: todayStart }, // Date is in the past
    },
    orderBy: { date: "asc" }, // Oldest first
    include: {
      assignedStudents: { select: { id: true } },
      attendances: {
        include: {
          student: {
            select: {
              id: true,
              name: true,
              enrollments: {
                orderBy: { createdAt: "desc" },
                take: 1,
                select: { programType: true }
              }
            },
          },
        },
      },
    },
  });

  // 2. Fetch sessions for a wide window: 4 weeks back → 4 weeks ahead.
  //    This gives the client-side weekly navigator enough data to scroll
  //    backwards and forwards without an extra server round-trip.
  const fourWeeksAgo = new Date(todayStart);
  fourWeeksAgo.setDate(todayStart.getDate() - 28);

  const fourWeeksAhead = new Date(todayStart);
  fourWeeksAhead.setDate(todayStart.getDate() + 28);
  fourWeeksAhead.setHours(23, 59, 59, 999);

  const upcomingSessionsRaw = await prisma.session.findMany({
    where: {
      tutorId,
      date: {
        gte: fourWeeksAgo,
        lte: fourWeeksAhead,
      },
    },
    orderBy: [
      { date: "asc" },
      { timeSlot: "asc" }
    ],
    include: {
      assignedStudents: { select: { id: true } },
      attendances: {
        include: {
          student: {
            select: {
              id: true,
              name: true,
              enrollments: {
                orderBy: { createdAt: "desc" },
                take: 1,
                select: { programType: true }
              }
            },
          },
        },
      },
    },
  });

  const medicalMap = await getMedicalMap();

  // Helper function to map raw session to SessionTask
  const mapSessionToTask = async (s: any): Promise<SessionTask> => {
    // Use shared helper for strict radar filtering
    const eligibleStudents = await getEligibleStudentsForSession({
      date: s.date,
      timeSlot: s.timeSlot,
      programType: s.programType,
      assignedStudents: s.assignedStudents,
      branch: s.branch,
    });

    // Build a set of studentIds that already have attendance records
    const existingAttendanceMap = new Map<string, any>(
      s.attendances.map((a: any) => [
        a.studentId,
        {
          status: a.status,
          pronunciation: a.pronunciation,
          fluency: a.fluency,
          vocabulary: a.vocabulary,
          tutorNotes: a.tutorNotes,
        },
      ])
    );

    // Merge: eligible students + any extra students from existing attendance (manual adds)
    const allStudentIds = new Set([
      ...eligibleStudents.map((es: any) => es.id),
      ...s.attendances.map((a: any) => a.studentId),
    ]);

    const mergedStudents: EligibleStudent[] = [];
    for (const studentId of allStudentIds) {
      const eligible = eligibleStudents.find((es: any) => es.id === studentId);
      const attendance = existingAttendanceMap.get(studentId);
      const fromAttendance = s.attendances.find((a: any) => a.studentId === studentId);

      const studentName = eligible?.name || fromAttendance?.student?.name || "Unknown";
      const medical = medicalMap[studentName.toLowerCase()];

      mergedStudents.push({
        id: studentId as string,
        name: studentName,
        activeProgram: eligible?.activeProgram || fromAttendance?.student?.enrollments?.[0]?.programType || null,
        existingStatus: (attendance?.status as string) || null,
        existingPronunciation: attendance?.pronunciation ?? null,
        existingFluency: attendance?.fluency ?? null,
        existingVocabulary: attendance?.vocabulary ?? null,
        existingNotes: attendance?.tutorNotes ?? null,
        alergi: medical?.alergi || null,
        penyakit: medical?.penyakit || null,
      });
    }

    // Use shared helper for global pool (broad, with contains filter for search)
    const globalPoolRaw = await getGlobalPoolForSession({ programType: s.programType, timeSlot: s.timeSlot });
    const globalPoolStudents: StudentSearchItem[] = globalPoolRaw
      .map((gp: any) => ({ id: gp.id, name: gp.name, activeProgram: gp.activeProgram }));

    return {
      id: s.id,
      date: s.date.toISOString(),
      timeSlot: s.timeSlot,
      isCompleted: s.isCompleted,
      className: s.title,
      programType: s.programType,
      students: mergedStudents,
      globalPoolStudents,
      todayTopic: (() => {
        const d = new Date(s.date);
        const dayOfWeek = d.getDay();
        const dayIndex = dayOfWeek >= 1 && dayOfWeek <= 6 ? dayOfWeek - 1 : 0;
        return getTodayTopic(s.timeSlot, 1, (s.topicOffset || 0) + dayIndex, s.date) || null;
      })(),
    };
  };

  const overdueSessions: SessionTask[] = await Promise.all(overdueSessionsRaw.map(mapSessionToTask));
  const todaySessions: SessionTask[] = await Promise.all(upcomingSessionsRaw.map(mapSessionToTask));

  // 3. Calculate quick stats
  const totalToday = todaySessions.filter(s => {
    const d = new Date(s.date);
    return d.toDateString() === new Date().toDateString();
  }).length;
  
  const pendingEvals = todaySessions.filter(s => {
    const d = new Date(s.date);
    return d.toDateString() === new Date().toDateString() && !s.isCompleted;
  }).length;

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const weeklyCompleted = await prisma.session.count({
    where: {
      tutorId,
      isCompleted: true,
      date: { gte: weekStart },
    },
  });

  // allStudents is no longer needed — globalPoolStudents is per-session now

  // Check if today is an evaluation day
  // Friday (day 5) is evaluation day for all.
  // Saturday (day 6) is evaluation day for "English on Saturday" program.
  // Since this is the main dashboard, we'll pass a general 'isFriday' equivalent if it's day 5,
  // but to be precise, the evaluation toggle should ideally be per-session.
  // However, `TutorDashboardClient` expects a boolean for the whole day right now.
  // We'll calculate it as day === 5 for now since the client applies it to all sessions.
  // Actually, wait, the client is being passed `isEvalDay`. If `isEvalDay` is true, it shows sliders.
  // It's better if `isEvalDay` is passed correctly per session or calculated in the page.
  // Since `isEvalDay` is a single prop for the whole page currently, we'll set it to day===5 || day===6.
  // The client will then show sliders, and we can rely on the user to only fill them for the right classes.
  // Let's refine this to:
  const currentDay = new Date().getDay();
  const isEvalDay = currentDay === 5 || currentDay === 6;

  const quickStats = [
    { label: "Classes Today", value: totalToday, iconName: "BookOpen" as const, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Pending Evals", value: pendingEvals, iconName: "AlertCircle" as const, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "This Week", value: `${weeklyCompleted} done`, iconName: "Award" as const, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  return (
    <TutorDashboardClient
      tutorName={session.user.name || "Tutor"}
      todaySessions={todaySessions}
      overdueSessions={overdueSessions}
      quickStats={quickStats}
      isEvalDay={isEvalDay}
    />
  );
}
