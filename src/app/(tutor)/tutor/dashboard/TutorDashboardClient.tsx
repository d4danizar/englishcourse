"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Calendar,
  Clock,
  Users,
  CheckCircle,
  ChevronRight,
  BookOpen,
  AlertCircle,
  Award,
  X,
  Loader2,
  Search,
  UserPlus,
} from "lucide-react";
import { submitAttendance, searchStudentsForAttendance } from "../actions";
import { SessionDetailModal } from "../../../../components/session/SessionDetailModal";
import { getProgramGradingScale } from "@/lib/grading";

// --- Types ---
export type EligibleStudent = {
  id: string;
  name: string;
  activeProgram: string | null;
  existingStatus: string | null;   // null = no attendance yet
  existingPronunciation: number | null;
  existingFluency: number | null;
  existingVocabulary: number | null;
  existingNotes: string | null;
  alergi?: string | null;
  penyakit?: string | null;
};

export type SessionTask = {
  id: string;
  date: string;
  timeSlot: string;
  isCompleted: boolean;
  className: string;
  programType: string;
  students: EligibleStudent[];
  globalPoolStudents: StudentSearchItem[];
  todayTopic: {
    moduleName: string;
    topicNumber: number;
    topicTitle: string;
    totalTopics: number;
  } | null;
};

export type QuickStat = {
  label: string;
  value: string | number;
  iconName: "BookOpen" | "AlertCircle" | "Award";
  color: string;
  bg: string;
};

const ICON_MAP = {
  BookOpen,
  AlertCircle,
  Award,
} as const;

const ATTENDANCE_OPTIONS = ["PRESENT", "ABSENT", "EXCUSED", "SICK"] as const;

const DAYS = [
  { id: 1, name: "MON" },
  { id: 2, name: "TUE" },
  { id: 3, name: "WED" },
  { id: 4, name: "THU" },
  { id: 5, name: "FRI" }
];

export type StudentSearchItem = { id: string; name: string; activeProgram: string | null };

// --- MAIN CLIENT COMPONENT ---
export function TutorDashboardClient({
  tutorName,
  todaySessions,
  overdueSessions = [],
  quickStats,
  isEvalDay,
}: {
  tutorName: string;
  todaySessions: SessionTask[];
  overdueSessions?: SessionTask[];
  quickStats: QuickStat[];
  isEvalDay: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"upcoming" | "overdue">("upcoming");
  const [viewMode, setViewMode] = useState<"LIST" | "TIMETABLE">("LIST");
  const [selectedTask, setSelectedTask] = useState<SessionTask | null>(null);
  const [isPending, startTransition] = useTransition();
  const [detailSessionId, setDetailSessionId] = useState<string | null>(null);

  // Weekly Navigator State
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const date = new Date(now.setDate(diff));
    date.setHours(0, 0, 0, 0);
    return date;
  });

  const handlePrevWeek = () => {
    const prev = new Date(currentWeekStart);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekStart(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + 7);
    setCurrentWeekStart(next);
  };

  const currentWeekEnd = new Date(currentWeekStart);
  currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
  currentWeekEnd.setHours(23, 59, 59, 999);

  // Filter sessions by selected week
  const filteredSessions = todaySessions.filter((task) => {
    const taskDate = new Date(task.date);
    const taskDay = new Date(taskDate.setHours(0, 0, 0, 0)).getTime();
    const weekStart = currentWeekStart.getTime();
    const weekEnd = currentWeekEnd.getTime();
    return taskDay >= weekStart && taskDay <= weekEnd;
  });

  // Dynamically generate time slots from the currently filtered sessions
  const dynamicTimeSlots = Array.from(new Set(
    filteredSessions.map(session => session.timeSlot)
  )).filter(Boolean).sort();

  const getSessionsForCell = (dayId: number, slot: string) => {
    return filteredSessions.filter((session) => {
      const sessionDay = new Date(session.date).getDay();
      const isSameSlot = session.timeSlot === slot;
      return sessionDay === dayId && isSameSlot;
    });
  };

  // Per-student attendance state
  const [studentEvals, setStudentEvals] = useState<
    Record<string, { status: string; pronunciation: number; fluency: number; vocabulary: number }>
  >({});
  const [tutorNotes, setTutorNotes] = useState("");
  const [rescheduleNotes, setRescheduleNotes] = useState("");

  // Grab-and-Go Search & Claim State
  const [searchQuery, setSearchQuery] = useState("");
  const [modalStudents, setModalStudents] = useState<EligibleStudent[]>([]);
  const [searchResults, setSearchResults] = useState<StudentSearchItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Skenario Mayoritas: Live dynamic fetching populating officially tracked students initially, plus explicit external searches.
  useEffect(() => {
    if (!selectedTask) return;
    let isCancelled = false;

    const q = searchQuery.trim().toLowerCase();
    setIsSearching(true);

    if (!selectedTask || q.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    searchStudentsForAttendance(selectedTask.programType, selectedTask.timeSlot || "", q)
      .then((students) => {
        if (isCancelled) return;
        // SEARCH INPUT DYNAMIC
        const excludeIds = new Set(modalStudents.map((m) => m.id));
        setSearchResults(students.filter((s) => !excludeIds.has(s.id)));
      })
      .catch((err) => console.error("Dynamic Student Search Error:", err))
      .finally(() => {
        if (!isCancelled) setIsSearching(false);
      });

    return () => { isCancelled = true; };
  }, [selectedTask?.id, searchQuery]);

  const handleOpenModal = (task: SessionTask) => {
    setSelectedTask(task);
    setTutorNotes("");
    setRescheduleNotes("");
    setSearchQuery("");
    
    // Load all eligible native students directly from the SSR task payload
    const initialStudentsToGrade = task.students;
    setModalStudents(initialStudentsToGrade);

    // Initialize evals from existing attendance data or defaults
    const initialEvals: typeof studentEvals = {};
    initialStudentsToGrade.forEach((s) => {
      initialEvals[s.id] = {
        status: s.existingStatus || "PRESENT",
        pronunciation: s.existingPronunciation ?? 3,
        fluency: s.existingFluency ?? 3,
        vocabulary: s.existingVocabulary ?? 3,
      };
    });
    setStudentEvals(initialEvals);
  };

  const handleCloseModal = () => {
    setSelectedTask(null);
    setModalStudents([]);
  };

  const handleClaimStudent = (studentToClaim: StudentSearchItem) => {
    setModalStudents((prev) => [
      ...prev,
      {
        id: studentToClaim.id,
        name: studentToClaim.name,
        activeProgram: studentToClaim.activeProgram,
        existingStatus: "PRESENT",
        existingPronunciation: null,
        existingFluency: null,
        existingVocabulary: null,
        existingNotes: null,
      } as EligibleStudent,
    ]);

    setStudentEvals((prev) => ({
      ...prev,
      [studentToClaim.id]: { status: "PRESENT", pronunciation: 3, fluency: 3, vocabulary: 3 },
    }));
    setSearchQuery("");
  };

  const handleRemoveStudent = (studentId: string) => {
    setModalStudents((prev) => prev.filter((s) => s.id !== studentId));
    setStudentEvals((prev) => {
      const updated = { ...prev };
      delete updated[studentId];
      return updated;
    });
  };

  const handleSubmit = () => {
    if (!selectedTask) return;

    const formData = new FormData();
    formData.append("sessionId", selectedTask.id);
    formData.append("tutorNotes", tutorNotes);
    formData.append("rescheduleNotes", rescheduleNotes);
    formData.append("isEvalDay", isEvalDay ? "true" : "false");

    // Append per-student data as parallel arrays (using all modal students)
    modalStudents.forEach((s) => {
      const eval_ = studentEvals[s.id];
      if (!eval_) return; // skip if somehow no eval state
      formData.append("studentId", s.id);
      formData.append("status", eval_.status);
      formData.append("pronunciation", String(eval_.pronunciation));
      formData.append("fluency", String(eval_.fluency));
      formData.append("vocabulary", String(eval_.vocabulary));
    });

    startTransition(async () => {
      const res = await submitAttendance(formData);
      if (res.error) {
        alert(res.error);
      } else {
        alert("Attendance submitted successfully!");
        handleCloseModal();
      }
    });
  };

  const updateStudentEval = (studentId: string, field: string, value: string | number) => {
    setStudentEvals((prev) => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || { status: "PRESENT", pronunciation: 3, fluency: 3, vocabulary: 3 }), [field]: value },
    }));
  };

  // Greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  const renderSessionCard = (task: SessionTask, isOverdue: boolean = false) => {
    const isCompleted = task.isCompleted;
    const eligibleCount = task.students.length;
    return (
      <div
        key={task.id}
        className={`group flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white rounded-2xl border ${isCompleted ? "border-slate-200 opacity-75" : isOverdue ? "border-l-4 border-l-red-500 border-red-200" : "border-l-4 border-l-indigo-500 border-slate-200"
          } p-5 sm:p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-slate-300`}
      >
        {/* Info Column */}
        <div className="flex items-start gap-4 sm:gap-5 w-full md:w-auto">
          <div
            className={`p-3 sm:p-4 rounded-xl flex-shrink-0 ${isCompleted
                ? "bg-slate-100 text-slate-500"
                : isOverdue ? "bg-red-50 text-red-600" : "bg-indigo-50 text-indigo-600"
              }`}
          >
            {isCompleted ? (
              <CheckCircle className="w-6 h-6" />
            ) : isOverdue ? (
              <AlertCircle className="w-6 h-6" />
            ) : (
              <Clock className="w-6 h-6" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className={`text-sm font-bold px-2 py-0.5 rounded-md border ${isOverdue ? "text-red-700 bg-red-50 border-red-100" : "text-indigo-600 bg-indigo-50 border-indigo-100"}`}>
                {new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(task.date))}
              </span>
              <span className="text-sm font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                {task.timeSlot}
              </span>
              <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                {task.programType}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2 sm:mb-3">
              {task.className}
            </h3>
            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm font-medium text-slate-500">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-400" />
                {eligibleCount} Eligible Students
              </div>
              {task.todayTopic && (
                <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-md">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span className="font-bold">#{task.todayTopic.topicNumber}</span>
                  <span className="hidden sm:inline">{task.todayTopic.topicTitle}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Column */}
        <div className="flex-shrink-0 w-full md:w-auto mt-2 md:mt-0">
          {isCompleted ? (
            <button
              type="button"
              onClick={() => setDetailSessionId(task.id)}
              className="inline-flex w-full md:w-auto items-center justify-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-5 py-3 rounded-xl border border-emerald-100 transition-colors cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              View Details
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleOpenModal(task)}
              className={`w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 ${isOverdue ? "bg-red-600 hover:bg-red-700" : "bg-indigo-600 hover:bg-indigo-700"}`}
            >
              Take Attendance
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full pb-24 relative">

      {/* 1. Welcome Header */}
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {greeting}, {tutorName?.split(" ")[0] || "Tutor"} 👋
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            You&apos;re doing great! Here is your schedule for today.
            {isEvalDay && (
              <span className="ml-2 inline-flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md text-xs font-bold">
                📝 Evaluation Day (Friday)
              </span>
            )}
          </p>
        </div>
      </div>

      {/* 2. Quick Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
        {quickStats.map((stat, idx) => {
          const Icon = ICON_MAP[stat.iconName];
          return (
            <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4 hover:shadow-md hover:border-slate-300 transition-all duration-200">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Schedule Tabs Navigation */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Tabs Bar */}
          <div className="flex space-x-2 bg-slate-100/50 p-1.5 rounded-xl border border-slate-200 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`flex-1 sm:flex-none py-2.5 px-4 text-sm font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === "upcoming"
                  ? "bg-white text-indigo-700 shadow-sm border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              }`}
            >
              <Calendar className="w-4 h-4" />
              Jadwal Aktif
            </button>
            <button
              onClick={() => setActiveTab("overdue")}
              className={`flex-1 sm:flex-none py-2.5 px-4 text-sm font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === "overdue"
                  ? "bg-white text-red-700 shadow-sm border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              Menunggu Presensi
              {overdueSessions && overdueSessions.length > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                  {overdueSessions.length}
                </span>
              )}
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex bg-slate-100/50 p-1.5 rounded-xl border border-slate-200 w-full sm:w-auto">
            <button 
              onClick={() => setViewMode("LIST")}
              className={`flex-1 sm:flex-none px-4 py-2 text-sm rounded-lg font-bold transition-all duration-200 ${viewMode === "LIST" ? "bg-white shadow-sm text-indigo-700 border border-slate-200/50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
            >
              List View
            </button>
            <button 
              onClick={() => setViewMode("TIMETABLE")}
              className={`flex-1 sm:flex-none px-4 py-2 text-sm rounded-lg font-bold transition-all duration-200 ${viewMode === "TIMETABLE" ? "bg-white shadow-sm text-indigo-700 border border-slate-200/50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
            >
              Timetable
            </button>
          </div>
        </div>

        {/* Weekly Navigator (only for upcoming tab or timetable view) */}
        {(activeTab === "upcoming" || viewMode === "TIMETABLE") && (
          <div className="flex justify-center sm:justify-start">
            <div className="flex items-center bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <button onClick={handlePrevWeek} className="px-4 py-2 hover:bg-slate-50 border-r border-slate-200 text-slate-600 font-semibold text-sm transition-colors">
                &larr; Prev
              </button>
              <div className="px-6 py-2 text-sm font-bold text-slate-800 text-center min-w-[180px]">
                {currentWeekStart.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} 
                {" - "}
                {currentWeekEnd.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
              <button onClick={handleNextWeek} className="px-4 py-2 hover:bg-slate-50 border-l border-slate-200 text-slate-600 font-semibold text-sm transition-colors">
                Next &rarr;
              </button>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {viewMode === "TIMETABLE" ? (
            <div className="relative w-full">
              {/* PORTRAIT WARNING (Visible only on small screens in portrait) */}
              <div className="flex flex-col items-center justify-center h-64 bg-slate-900 text-white rounded-2xl sm:hidden portrait:flex landscape:hidden shadow-sm">
                <svg className="w-12 h-12 mb-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                <p className="text-center font-bold px-4 text-lg">Harap putar HP Anda (Landscape)</p>
                <p className="text-center text-sm text-slate-300 mt-2 px-6">Tampilan Timetable membutuhkan layar yang lebih lebar.</p>
              </div>

              {/* ACTUAL TIMETABLE GRID (Hidden on mobile portrait, visible on desktop or mobile landscape) */}
              <div className="hidden sm:block portrait:hidden landscape:block w-full overflow-x-auto bg-white border border-slate-200 rounded-2xl shadow-sm">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="p-3 text-xs font-semibold text-slate-500 uppercase w-28 border-r border-slate-200 text-center">Time / Slot</th>
                      {DAYS.map(day => (
                        <th key={day.id} className="p-3 text-xs font-bold text-slate-700 uppercase text-center border-r border-slate-200 w-48">
                          {day.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dynamicTimeSlots.length > 0 ? (
                      dynamicTimeSlots.map(slot => (
                        <tr key={slot} className="border-b border-slate-200 hover:bg-slate-50/50 transition-colors">
                          <td className="p-3 text-sm font-medium text-slate-600 border-r border-slate-200 text-center align-top whitespace-nowrap">
                            {slot}
                          </td>
                          {DAYS.map(day => {
                            const cellSessions = getSessionsForCell(day.id, slot);
                            return (
                              <td key={`${day.id}-${slot}`} className="p-2 border-r border-slate-200 align-top bg-slate-50/20">
                                {cellSessions.length > 0 ? (
                                  <div className="space-y-2">
                                    {cellSessions.map(session => (
                                      <div key={session.id} className="bg-white border border-indigo-100 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="inline-block px-2 py-1 mb-2 text-[10px] font-bold text-indigo-700 bg-indigo-50 rounded uppercase">
                                          {session.programType}
                                        </div>
                                        <p className="text-sm font-bold text-slate-800 leading-tight mb-2">
                                          {session.className}
                                        </p>
                                        {session.todayTopic && (
                                          <div className="text-xs text-slate-500 mb-3 flex items-start gap-1">
                                            <BookOpen className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                            <span className="line-clamp-2">#{session.todayTopic.topicNumber}: {session.todayTopic.topicTitle}</span>
                                          </div>
                                        )}
                                        <button 
                                          onClick={() => handleOpenModal(session)}
                                          className="w-full py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center justify-center gap-1"
                                        >
                                          Take Attendance
                                          <ChevronRight className="w-3 h-3" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="h-full min-h-[80px] flex items-center justify-center text-slate-300 text-xs italic">
                                    Kosong
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500 font-medium italic">
                          Tidak ada kelas yang dijadwalkan pada minggu ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <>
              {activeTab === "upcoming" ? (
                <div className="flex flex-col gap-4">
                  {filteredSessions.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 shadow-sm flex flex-col items-center justify-center text-center gap-3">
                      <div className="p-4 bg-emerald-50 rounded-full">
                        <CheckCircle className="w-8 h-8 text-emerald-500" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">Tidak ada jadwal mengajar</h3>
                      <p className="text-sm font-medium text-slate-500">Belum ada kelas yang dijadwalkan pada minggu ini. 🎉</p>
                    </div>
                  ) : (
                    filteredSessions.map((task) => renderSessionCard(task, false))
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {!overdueSessions || overdueSessions.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 shadow-sm flex flex-col items-center justify-center text-center gap-3">
                      <div className="p-4 bg-emerald-50 rounded-full">
                        <Award className="w-8 h-8 text-emerald-500" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">🎉 Hebat! Semua beres.</h3>
                      <p className="text-sm font-medium text-slate-500">Semua presensi kelas telah diselesaikan.</p>
                    </div>
                  ) : (
                    overdueSessions.map(task => renderSessionCard(task, true))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 4. The Attendance & Evaluation Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Attendance {isEvalDay ? "& Evaluation" : ""}
                </h3>
                <p className="text-sm font-medium text-slate-500 mt-1">
                  {selectedTask.className} • {selectedTask.timeSlot}
                </p>
                {selectedTask.todayTopic && (
                  <div className="mt-2 inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1.5 rounded-lg text-xs font-bold">
                    <BookOpen className="w-3.5 h-3.5" />
                    {selectedTask.todayTopic.moduleName} — #{selectedTask.todayTopic.topicNumber}: {selectedTask.todayTopic.topicTitle}
                  </div>
                )}
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">

              {/* --- STUDENT SEARCH & CLAIM BAR --- */}
              <div className="mb-6 relative z-[60]">
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  🔍 Cari & Klaim Siswa
                </label>
                <input
                  type="text"
                  placeholder="Ketik nama siswa (contoh: Budi)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />

                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                  <div className="absolute w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto overflow-x-hidden">
                    {searchResults.map((student) => (
                      <button
                        key={student.id}
                        type="button"
                        onClick={() => handleClaimStudent(student)}
                        className="w-full text-left px-4 py-3 hover:bg-indigo-50 border-b border-slate-100 last:border-0 flex justify-between items-center transition-colors"
                      >
                        <span className="font-semibold text-slate-800">{student.name}</span>
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded uppercase tracking-wider">
                          {student.activeProgram || "Unknown"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Student Count Info */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  {modalStudents.length} Students Claimed
                  {!isEvalDay && <span className="ml-2 text-slate-400 normal-case font-medium">(status only — evaluations on designated days)</span>}
                </p>
              </div>

              {/* Per-Student Attendance & Evaluation */}
              {modalStudents.length === 0 ? (
                <div className="text-center text-sm text-slate-500 py-8 font-medium">
                  Belum ada siswa yang diklaim. Silakan cari nama siswa di atas.
                </div>
              ) : (
                modalStudents.map((student) => {
                  const eval_ = studentEvals[student.id] || { status: "PRESENT", pronunciation: 3, fluency: 3, vocabulary: 3 };
                  return (
                    <div key={student.id} className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-col gap-3">
                      {/* Student Name & Program Badge */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-bold text-slate-900">{student.name}</p>
                              {(student.alergi || student.penyakit) && (
                                <div className="group relative flex items-center">
                                  <AlertCircle className="w-4 h-4 text-amber-500 cursor-help" />
                                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-max max-w-xs bg-slate-800 text-white text-[10px] rounded py-1 px-2 z-10 shadow-lg">
                                    {student.alergi && <p><strong>Alergi:</strong> {student.alergi}</p>}
                                    {student.penyakit && <p><strong>Penyakit:</strong> {student.penyakit}</p>}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                  </div>
                                </div>
                              )}
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                              {student.activeProgram || "No Program"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleRemoveStudent(student.id)}
                            className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Batalkan Klaim"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Attendance Status Buttons */}
                      <div className="flex flex-wrap gap-1.5">
                        {ATTENDANCE_OPTIONS.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => updateStudentEval(student.id, "status", opt)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all duration-150 ${eval_.status === opt
                                ? opt === "ABSENT" || opt === "SICK"
                                  ? "bg-red-50 border-red-200 text-red-700"
                                  : opt === "EXCUSED"
                                    ? "bg-amber-50 border-amber-200 text-amber-700"
                                    : "bg-indigo-50 border-indigo-200 text-indigo-700"
                                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                              }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>

                      {/* Evaluation Sliders — ONLY on Evaluation Days AND only if PRESENT */}
                      {isEvalDay && eval_.status === "PRESENT" && (
                        <div className="flex flex-col gap-3 pt-2 border-t border-slate-200">
                          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
                            📝 Evaluation
                          </span>
                          {(["pronunciation", "fluency", "vocabulary"] as const).map((metric) => {
                            const { isExamScale, maxScore } = getProgramGradingScale(student.activeProgram);
                            const currentValue = eval_[metric] ?? (isExamScale ? 80 : 4);

                            return (
                              <div key={metric} className="flex flex-col gap-1">
                                <div className="flex justify-between text-xs font-medium mb-1">
                                  <span className="text-slate-600 capitalize">{metric}</span>
                                  {isExamScale ? null : <span className="text-indigo-600 font-bold">{currentValue}</span>}
                                </div>
                                {isExamScale ? (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      min="0"
                                      max={maxScore}
                                      value={currentValue}
                                      onChange={(e) => updateStudentEval(student.id, metric, parseInt(e.target.value) || 0)}
                                      className="w-full text-sm p-2 rounded-lg border border-slate-200 outline-none focus:border-indigo-500 bg-white"
                                    />
                                    <span className="text-xs font-bold text-indigo-600 whitespace-nowrap">(Max: {maxScore})</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="range"
                                      min="1"
                                      max={maxScore}
                                      value={currentValue}
                                      onChange={(e) => updateStudentEval(student.id, metric, parseInt(e.target.value))}
                                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                    <span className="text-xs font-bold text-indigo-600 whitespace-nowrap">(Max: {maxScore})</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* Tutor Notes */}
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  Tutor Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={tutorNotes}
                  onChange={(e) => setTutorNotes(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:bg-slate-50"
                  placeholder="Notes on student performance, areas of improvement..."
                />
              </div>

              {/* Reschedule Notes (Conditional: PRIVATE only) */}
              {selectedTask.programType === "Private" && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <label className="block text-sm font-bold text-amber-900 mb-1 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    Reschedule Notes
                  </label>
                  <p className="text-xs text-amber-700/80 mb-3 font-medium">
                    This is a PRIVATE class. If rescheduled, please note the details.
                  </p>
                  <textarea
                    rows={2}
                    value={rescheduleNotes}
                    onChange={(e) => setRescheduleNotes(e.target.value)}
                    className="w-full border border-amber-200 rounded-lg p-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white transition-all shadow-sm"
                    placeholder="e.g., Rescheduled from Monday due to student request."
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-slate-400">
                {modalStudents.length} students • {isEvalDay ? "with evaluation" : "status only"}
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCloseModal}
                  disabled={isPending}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isPending || modalStudents.length === 0}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition-all disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Attendance"
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Session Detail Modal */}
      {detailSessionId && (
        <SessionDetailModal
          sessionId={detailSessionId}
          onClose={() => setDetailSessionId(null)}
        />
      )}

    </div>
  );
}
