import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { redirect } from "next/navigation";
import { GlobalSchedulesClient, type GlobalSession } from "./GlobalSchedulesClient";

export default async function GlobalSchedulesPage() {
  const sessionUser = await getServerSession(authOptions);
  if (!sessionUser?.user?.id) {
    redirect("/login");
  }

  const currentTutorId = sessionUser.user.id;

  // Fetch upcoming sessions from today onwards (limit to next 14 days)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const endSearch = new Date();
  endSearch.setDate(todayStart.getDate() + 14); // Next two weeks
  endSearch.setHours(23, 59, 59, 999);

  const sessionsRaw = await prisma.session.findMany({
    where: {
      date: {
        gte: todayStart,
        lte: endSearch,
      },
    },
    orderBy: [
      { date: "asc" },
      { timeSlot: "asc" },
    ],
    include: {
      tutor: {
        select: { id: true, name: true },
      },
      _count: {
        select: { attendances: true },
      },
    },
  });

  const upcomingSessions: GlobalSession[] = sessionsRaw.map((s) => ({
    id: s.id,
    title: s.title,
    date: s.date.toISOString(),
    timeSlot: s.timeSlot,
    programType: s.programType,
    isCompleted: s.isCompleted,
    tutorId: s.tutor.id,
    tutorName: s.tutor.name,
    hasAttendance: s._count.attendances > 0,
  }));

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Global Upcoming Schedules
        </h1>
        <p className="mt-1 text-sm text-slate-500 max-w-2xl text-balance">
          View all upcoming classes across all tutors for the next 2 weeks. You can take over classes that haven't started yet.
        </p>
      </div>

      {/* Main Content */}
      <GlobalSchedulesClient
        currentTutorId={currentTutorId}
        sessions={upcomingSessions}
      />
    </div>
  );
}
