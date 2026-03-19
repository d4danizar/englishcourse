import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { redirect } from "next/navigation";
import { TutorDashboardClient, type SessionTask, type EligibleStudent, type StudentSearchItem } from "./TutorDashboardClient";
import { getEligibleStudentsForSession, getGlobalPoolForSession } from "../../../../lib/student-pool";

export default async function TutorDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const tutorId = session.user.id;

  // 1. Fetch today's sessions for this tutor
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const sessions = await prisma.session.findMany({
    where: {
      tutorId,
      date: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
    orderBy: { date: "asc" },
    include: {
      assignedStudents: { select: { id: true } },
      attendances: {
        include: {
          student: {
            select: { id: true, name: true, activeProgram: true },
          },
        },
      },
    },
  });

  // 2. For each session, fetch eligible students using shared helper (DRY)
  const todaySessions: SessionTask[] = await Promise.all(
    sessions.map(async (s) => {
      // Use shared helper for strict radar filtering
      const eligibleStudents = await getEligibleStudentsForSession({
        date: s.date,
        timeSlot: s.timeSlot,
        programType: s.programType,
        assignedStudents: s.assignedStudents,
      });

      // Build a set of studentIds that already have attendance records
      const existingAttendanceMap = new Map(
        s.attendances.map((a) => [
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
        ...eligibleStudents.map((es) => es.id),
        ...s.attendances.map((a) => a.studentId),
      ]);

      const mergedStudents: EligibleStudent[] = [];
      for (const studentId of allStudentIds) {
        const eligible = eligibleStudents.find((es) => es.id === studentId);
        const attendance = existingAttendanceMap.get(studentId);
        const fromAttendance = s.attendances.find((a) => a.studentId === studentId);

        mergedStudents.push({
          id: studentId,
          name: eligible?.name || fromAttendance?.student?.name || "Unknown",
          activeProgram: eligible?.activeProgram || fromAttendance?.student?.activeProgram || null,
          existingStatus: (attendance?.status as string) || null,
          existingPronunciation: attendance?.pronunciation ?? null,
          existingFluency: attendance?.fluency ?? null,
          existingVocabulary: attendance?.vocabulary ?? null,
          existingNotes: attendance?.tutorNotes ?? null,
        });
      }

      // Use shared helper for global pool (broad, no time/batch filter)
      const globalPoolRaw = await getGlobalPoolForSession({ programType: s.programType });
      const globalPoolStudents: StudentSearchItem[] = globalPoolRaw
        .map((gp) => ({ id: gp.id, name: gp.name, activeProgram: gp.activeProgram }));

      return {
        id: s.id,
        timeSlot: s.timeSlot,
        isCompleted: s.isCompleted,
        className: s.title,
        programType: s.programType,
        students: mergedStudents,
        globalPoolStudents,
      };
    })
  );

  // 3. Calculate quick stats
  const totalToday = todaySessions.length;
  const pendingEvals = todaySessions.filter((s) => !s.isCompleted).length;

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
      quickStats={quickStats}
      isEvalDay={isEvalDay}
    />
  );
}
