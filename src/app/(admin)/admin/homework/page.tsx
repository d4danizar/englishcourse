import { getRecentHomeworks } from "@/lib/actions/homework-actions";
import { HomeworkEditor } from "./HomeworkEditor";
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
      {homeworks.length > 0 && (
        <div className="mt-10">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
            Riwayat 14 Hari Terakhir
          </h2>
          <div className="flex flex-col gap-3">
            {homeworks.map((hw) => (
              <div
                key={hw.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {format(new Date(hw.date), "EEEE, dd MMM yyyy")}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    {hw.branch}
                  </span>
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {hw.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
