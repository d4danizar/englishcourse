import { getRecentHomeworks } from "@/lib/actions/homework-actions";
import { HomeworkEditor } from "@/app/(admin)/admin/homework/HomeworkEditor";
import { HomeworkHistoryClient } from "@/app/(admin)/admin/homework/HomeworkHistoryClient";
import { format } from "date-fns";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HeadTutorHomeworkPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any).role !== "HEAD_TUTOR") {
    redirect("/tutor/dashboard");
  }

  const homeworks = await getRecentHomeworks();

  // Build a map of date -> content for the client
  const homeworkMap: Record<string, string> = {};
  homeworks.forEach((hw) => {
    const key = format(new Date(hw.date), "yyyy-MM-dd");
    homeworkMap[key] = hw.content;
  });

  return (
    <div className="p-6 sm:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          📝 Daily Homework
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Atur tugas harian (PR) untuk murid di cabang Anda. Homework yang Anda tentukan di sini akan otomatis tampil di dasbor seluruh murid {session.user.branch || "cabang ini"}.
        </p>
      </div>

      {/* Editor Component reused from Admin */}
      <HomeworkEditor initialHomeworkMap={homeworkMap} />

      {/* Recent Homework History */}
      <HomeworkHistoryClient homeworks={homeworks} />
    </div>
  );
}
