"use client";

import { useState } from "react";
import { differenceInBusinessDays, format } from "date-fns";
import { 
  CalendarDays, 
  Clock, 
  User, 
  CheckCircle2, 
  Sparkles, 
  Clock4, 
  ShieldAlert,
  GraduationCap,
  CalendarCheck2,
  FileText,
  Star,
  Award,
  Settings,
  BookOpen,
  ClipboardList
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { COMPANY_INFO } from "@/lib/constants/branding";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { getTodayTopic } from "@/lib/syllabus-helpers";

type ProfileContent = {
  id: string;
  name: string;
  activeProgram: string | null;
  programBatch: string | null;
  batchSchedule: string | null;
  startDate: Date | null;
  endDate: Date | null;
  extendedEndDate: Date | null;
  leaveQuota?: number;
  leaveUsed?: number;
};

type AttendanceWithSession = {
  id: string;
  status: string;
  pronunciation: number | null;
  fluency: number | null;
  vocabulary: number | null;
  tutorNotes: string | null;
  session: {
    title: string;
    date: Date;
    timeSlot: string;
    programType: string;
    tutor: { name: string };
  };
};

type DescriptiveEvaluation = {
  id: string;
  fluency: string;
  pronunciation: string;
  vocabulary: string;
  notes: string | null;
  createdAt: Date;
  tutor: { name: string };
};

export function StudentDashboardClient({
  profile,
  attendances,
  evaluations,
  todayHomework,
  tomorrowHomework,
  topicOffset,
}: {
  profile: ProfileContent;
  attendances: AttendanceWithSession[];
  evaluations: DescriptiveEvaluation[];
  todayHomework: string | null;
  tomorrowHomework: string | null;
  topicOffset: number;
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "attendance" | "evaluations" | "settings">("overview");

  // Calculate Days Left against EXTENDED END DATE
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let daysLeft: number | null = null;
  let isExtendedStatus = false;

  if (profile.extendedEndDate && profile.endDate) {
    const originalEnd = new Date(profile.endDate);
    originalEnd.setHours(0, 0, 0, 0);

    const extEnd = new Date(profile.extendedEndDate);
    extEnd.setHours(0, 0, 0, 0);

    // Days left calculated against the extended date
    daysLeft = differenceInBusinessDays(extEnd, today);

    // If today is past original but not past extended
    if (today > originalEnd && today <= extEnd) {
      isExtendedStatus = true;
    }
  } else if (profile.endDate) {
    const end = new Date(profile.endDate);
    end.setHours(0, 0, 0, 0);
    daysLeft = differenceInBusinessDays(end, today);
  }

  // Attendance Stats
  const totalPresent = attendances.filter(a => a.status === "PRESENT").length;
  const totalSessions = attendances.length;
  
  // Render Stars Helper
  const renderStars = (score: number) => {
    return (
      <div className="flex gap-1" title={`${score}/5`}>
        {[...Array(5)].map((_, idx) => (
          <Star
            key={idx}
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all ${
              idx < score ? "text-amber-400 fill-amber-400" : "text-slate-100 fill-slate-100"
            }`}
          />
        ))}
        <span className="text-xs font-bold text-amber-600 ml-1">{score}/5</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* 1. Membership Card (Always Visible) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 text-slate-900 relative overflow-hidden shadow-xl border border-slate-100">
        
        {/* Watermark Gaib */}
        <div className="absolute -bottom-10 -right-10 w-64 h-64 opacity-5 pointer-events-none rotate-12">
          <Image src={COMPANY_INFO.logoSmallUrl} alt="Watermark" fill unoptimized style={{ objectFit: "contain" }} />
        </div>

        {/* Tipografi Vertikal */}
        <div 
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black tracking-[0.3em] text-slate-200 pointer-events-none hidden sm:block" 
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          {COMPANY_INFO.name}
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center pr-0 sm:pr-8">
          
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-sm shrink-0 overflow-hidden relative">
              <Image 
                src={COMPANY_INFO.logoSmallUrl} 
                alt="Avatar" 
                fill
                unoptimized
                style={{ objectFit: "contain", padding: "10px" }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
                {profile.name}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-1 relative z-20">
                <span className="px-2.5 py-1 bg-slate-900 rounded-lg text-xs font-bold text-white tracking-wide uppercase flex items-center gap-1.5 shadow-sm">
                  <GraduationCap className="w-3.5 h-3.5" />
                  {profile.activeProgram || "No Active Program"}
                </span>
                {profile.programBatch && (
                  <span className="text-sm font-bold text-slate-500">
                    • {profile.programBatch}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Membership Days Left Indicator */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 w-full md:w-auto flex flex-col items-center justify-center min-w-[140px] shadow-sm relative z-20 shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Masa Aktif</p>
            {daysLeft === null ? (
              <span className="text-sm font-bold text-slate-900 uppercase">—</span>
            ) : daysLeft < 0 ? (
              <div className="flex items-center gap-1.5 text-slate-500 bg-slate-200 px-3 py-1 rounded-full border border-slate-300">
                <ShieldAlert className="w-4 h-4" />
                <span className="font-bold text-sm tracking-wide">EXPIRED</span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="flex items-end gap-1.5">
                  <span className={`text-3xl font-black leading-none tracking-tighter ${daysLeft <= 3 ? "text-red-500" : "text-slate-900"}`}>
                    {daysLeft}
                  </span>
                  <span className={`text-sm font-bold pb-0.5 ${daysLeft <= 3 ? "text-red-400" : "text-slate-500"}`}>
                    hari aktif
                  </span>
                </div>
                {isExtendedStatus && (
                  <span className="mt-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-[10px] font-bold rounded uppercase tracking-wider border border-yellow-200 shadow-sm leading-none">
                    Ext: Kompensasi Izin
                  </span>
                )}
              </div>
            )}
            {profile.extendedEndDate && (
              <p className="text-[10px] font-bold text-slate-400 mt-2 tracking-wide">
                s.d. {format(new Date(profile.extendedEndDate), "dd MMM yyyy")}
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* 1.5. Dynamic Banner for E-Certificate if Eligible */}
      {daysLeft !== null && daysLeft < 0 && (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 sm:px-8 text-white shadow-lg border border-emerald-400 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner hide-print">
              <Award className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white drop-shadow-sm">
                🎉 Program Selesai!
              </h3>
              <p className="text-emerald-50 text-sm font-medium">
                Selamat! Anda telah menyelesaikan program. E-Certificate Anda sudah rilis.
              </p>
            </div>
          </div>
          <Link
            href="/student/certificate"
            className="w-full sm:w-auto text-center px-6 py-3 bg-white text-emerald-700 hover:bg-emerald-50 font-bold rounded-xl shadow-md transition-all whitespace-nowrap"
          >
            Unduh E-Certificate
          </Link>
        </div>
      )}

      {/* 1.6. Daily Homework Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Tugas Hari Ini */}
        {todayHomework ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 sm:p-6 shadow-sm relative overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-100/60 rounded-full -mr-6 -mt-6 pointer-events-none" />
            <div className="relative z-10 flex gap-4">
              <div className="p-3 bg-amber-100 rounded-xl flex-shrink-0 h-fit">
                <ClipboardList className="w-6 h-6 text-amber-700" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-black text-amber-900 uppercase tracking-wider">
                  📝 Tugas Hari Ini
                </h3>
                <p className="text-sm text-amber-900 font-medium leading-relaxed whitespace-pre-wrap">
                  {todayHomework}
                </p>
                <p className="text-[11px] font-bold text-amber-600/80 mt-1 border-t border-amber-200 pt-2">
                  💡 Report to your tutor in the first 30 minutes of your first session.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-5 sm:p-6 text-center animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col justify-center">
            <ClipboardList className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700 mb-1">Hore! Belum ada tugas hari ini 🎉</h3>
            <p className="text-xs text-slate-500 font-medium">PR untuk hari ini akan muncul di sini.</p>
          </div>
        )}

        {/* Persiapan Besok */}
        {tomorrowHomework ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm relative overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300 opacity-90 transition-opacity hover:opacity-100">
            <div className="relative z-10 flex gap-4">
              <div className="p-3 bg-slate-100 rounded-xl flex-shrink-0 h-fit">
                <BookOpen className="w-6 h-6 text-slate-500" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider">
                  📅 Persiapan Besok
                </h3>
                <p className="text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                  {tomorrowHomework}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-5 sm:p-6 text-center animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col justify-center">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-500">Tidak ada persiapan untuk besok.</p>
          </div>
        )}
      </div>

      {/* 2. Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-200/50 rounded-2xl border border-slate-200 max-w-fit relative z-20 mt-4">
        {[
          { id: "overview", label: "Overview", icon: Clock4 },
          { id: "attendance", label: "Riwayat Kelas", icon: CalendarCheck2 },
          { id: "evaluations", label: "Rapor (Evaluasi)", icon: FileText },
          { id: "settings", label: "Pengaturan", icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all relative z-20 ${
                isActive 
                  ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5" 
                  : "text-slate-500 hover:bg-slate-200/50 hover:text-slate-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 3. Tab Contents */}
      <div className="mt-2" style={{ isolation: 'isolate', position: 'relative', zIndex: 10 }}>
        
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Quick Stats */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-center items-center text-center gap-2 shadow-sm relative z-10 transition-shadow hover:shadow-md">
              <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-3xl font-black text-slate-800 tracking-tight">{totalPresent} <span className="text-lg text-slate-400 font-bold">/ {totalSessions}</span></p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Kehadiran</p>
            </div>
            
            {/* Leave Quota Card */}
            {(() => {
              const quota = profile.leaveQuota || 0;
              const used = profile.leaveUsed || 0;
              const remaining = Math.max(0, quota - used);
              const usedPercent = quota > 0 ? Math.min(100, (used / quota) * 100) : 0;
              const isExhausted = remaining === 0 && quota > 0;
              const isLow = remaining > 0 && remaining <= Math.ceil(quota * 0.2);

              return (
                <div className={`bg-white rounded-2xl border p-6 flex flex-col justify-center items-center text-center gap-3 shadow-sm relative z-10 transition-shadow hover:shadow-md ${
                  isExhausted ? "border-red-200" : isLow ? "border-amber-200" : "border-slate-200"
                }`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-1 ${
                    isExhausted ? "bg-red-50 text-red-500" : isLow ? "bg-amber-50 text-amber-500" : "bg-indigo-50 text-indigo-600"
                  }`}>
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <p className={`text-3xl font-black tracking-tight ${
                    isExhausted ? "text-red-500" : isLow ? "text-amber-600" : "text-slate-800"
                  }`}>
                    {remaining} <span className="text-lg text-slate-400 font-bold">/ {quota}</span>
                  </p>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sisa Jatah Izin</p>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2 mt-1">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        isExhausted ? "bg-red-400" : isLow ? "bg-amber-400" : "bg-indigo-500"
                      }`}
                      style={{ width: `${usedPercent}%` }}
                    />
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {used} izin terpakai
                  </p>
                  {isExhausted && (
                    <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2.5 py-1 rounded-full border border-red-100 mt-1">
                      ⚠️ Kuota Habis — Izin selanjutnya dihitung Alpa
                    </span>
                  )}
                </div>
              );
            })()}

            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-center gap-4 shadow-sm relative z-10 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-3 text-slate-800 font-semibold mb-2">
                <CalendarDays className="w-5 h-5 text-indigo-500" />
                Jadwal Default
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Batch</p>
                <p className="text-sm font-medium text-slate-900">{profile.programBatch || "-"}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Jam Belajar</p>
                <p className="text-sm font-medium text-slate-900">{profile.batchSchedule || "-"}</p>
              </div>
            </div>
          </div>

          {/* Today's Topic Card */}
          {(() => {
            const slot = profile.programBatch || "";
            // meetingCount = already attended sessions + 1 (this is the NEXT one)
            const nextMeetingNumber = totalSessions + 1;
            const topic = getTodayTopic(slot, nextMeetingNumber, topicOffset, new Date());
            if (!topic) return null;
            return (
              <div className="bg-white rounded-2xl border border-indigo-100 p-6 shadow-sm relative z-10 transition-shadow hover:shadow-md overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-8 -mt-8 opacity-60 pointer-events-none" />
                <div className="relative z-10">
                  <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    Topik Hari Ini — {topic.moduleName}
                  </p>
                  <h4 className="text-lg font-black text-slate-900 tracking-tight">
                    #{topic.topicNumber}: {topic.topicTitle}
                  </h4>
                  <p className="text-xs font-medium text-slate-400 mt-2">
                    Pertemuan ke-{nextMeetingNumber} • {topic.totalTopics} topik dalam modul
                  </p>
                </div>
              </div>
            );
          })()}
          </>
        )}

        {/* ATTENDANCE HISTORY TAB */}
        {activeTab === "attendance" && (
          <div className="flex flex-col gap-4 relative z-10">
            {attendances.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
                <CalendarCheck2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">Belum ada riwayat kelas</h3>
                <p className="text-sm text-slate-500 mt-1">Sesi yang telah selesai akan muncul di sini.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 relative z-20">
                {attendances.map((att) => {
                  const isPresent = att.status === "PRESENT";
                  const sessionDate = new Date(att.session.date);
                  const isEvalDay = sessionDate.getDay() === 5 || (sessionDate.getDay() === 6 && att.session.programType === "English on Saturday");
                  const hasScores = isPresent && isEvalDay && (att.pronunciation || att.fluency || att.vocabulary);
                  
                  return (
                    <div key={att.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:border-indigo-100 transition-all z-20">
                      
                      {/* Session Header Info */}
                      <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-50">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-xl flex-shrink-0 ${
                            isPresent ? "bg-teal-50 text-teal-600" : 
                            att.status === "EXCUSED" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"
                          }`}>
                            <CalendarDays className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                {format(new Date(att.session.date), "dd MMM yyyy")}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                {att.session.timeSlot}
                              </span>
                            </div>
                            <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                              {att.session.title}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-2 text-sm font-medium text-slate-500">
                              <User className="w-3.5 h-3.5" />
                              <span className="truncate max-w-[150px] sm:max-w-xs">{att.session.tutor.name}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex-shrink-0">
                          <span className={`inline-flex px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg border ${
                            isPresent ? "bg-teal-50 border-teal-200 text-teal-700" :
                            att.status === "EXCUSED" ? "bg-amber-50 border-amber-200 text-amber-700" :
                            "bg-red-50 border-red-200 text-red-700"
                          }`}>
                            {att.status}
                          </span>
                        </div>
                      </div>

                      {/* Daily Scores / Notes (If any) */}
                      {(hasScores || att.tutorNotes) && (
                        <div className="bg-slate-50/50 p-5 border-t border-slate-100">
                          {hasScores && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                              {[
                                { label: "Pronunciation", val: att.pronunciation },
                                { label: "Fluency", val: att.fluency },
                                { label: "Vocabulary", val: att.vocabulary },
                              ].map((score, idx) => score.val !== null ? (
                                <div key={idx} className="flex flex-col gap-1">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{score.label}</span>
                                  {renderStars(score.val)}
                                </div>
                              ) : null)}
                            </div>
                          )}
                          
                          {att.tutorNotes && (
                            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                              <div className="flex items-center gap-1.5 mb-1 text-blue-800">
                                <FileText className="w-3.5 h-3.5" />
                                <span className="text-xs font-bold uppercase tracking-widest">Tutor Notes</span>
                              </div>
                              <p className="text-sm font-medium text-blue-900/80 leading-relaxed italic">
                                &quot;{att.tutorNotes}&quot;
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* EVALUATIONS (RAPOR) TAB */}
        {activeTab === "evaluations" && (
          <div className="flex flex-col gap-4 relative z-10">
            {evaluations.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
                <Star className="w-10 h-10 text-amber-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">Belum ada Rapor Evaluasi</h3>
                <p className="text-sm text-slate-500 mt-1">Evaluasi spesifik dari tutormu akan muncul di sini.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {evaluations.map((ev) => (
                  <div key={ev.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow relative group">
                    
                    {/* Glowing effect inside card for premium feel */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="p-6 relative z-10">
                      <div className="flex items-start justify-between mb-5">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest bg-amber-50 w-fit px-2 py-0.5 rounded-full border border-amber-100">
                            Evaluasi Tutor
                          </span>
                          <h4 className="text-lg font-bold text-slate-900 leading-tight">
                            {format(new Date(ev.createdAt), "MMMM yyyy")}
                          </h4>
                          <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                            <User className="w-3.5 h-3.5" /> {ev.tutor.name}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-5 mt-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400"/> Fluency</span>
                          <p className="text-sm text-slate-700 font-medium leading-relaxed pl-3 border-l-2 border-indigo-100">{ev.fluency}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"/> Pronunciation</span>
                          <p className="text-sm text-slate-700 font-medium leading-relaxed pl-3 border-l-2 border-emerald-100">{ev.pronunciation}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400"/> Vocabulary</span>
                          <p className="text-sm text-slate-700 font-medium leading-relaxed pl-3 border-l-2 border-cyan-100">{ev.vocabulary}</p>
                        </div>
                        
                        {ev.notes && (
                          <div className="mt-2 text-sm text-slate-600 italic font-medium bg-slate-50 p-4 rounded-xl border border-slate-100">
                            &quot;{ev.notes}&quot;
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === "settings" && (
          <div className="max-w-lg">
            <ChangePasswordForm userId={profile.id} />
          </div>
        )}

      </div>

    </div>
  );
}
