import { getRecentHomeworks } from "@/lib/actions/homework-actions";
import { HomeworkEditor } from "./HomeworkEditor";
import { HomeworkHistoryClient } from "./HomeworkHistoryClient";
import { format } from "date-fns";

export default async function HomeworkPage() {
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
          Tulis tugas harian untuk murid per cabang aktif. Setiap cabang hanya punya 1 homework per hari.
        </p>
      </div>

      <HomeworkEditor initialHomeworkMap={homeworkMap} />

      {/* Recent Homework History */}
      <HomeworkHistoryClient homeworks={homeworks} />
    </div>
  );
}
