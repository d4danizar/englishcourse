"use client";

import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { MoreVertical, Trash2, Eye, Pencil, Loader2, X, Clock, Calendar, BookOpen, Users } from "lucide-react";
import { deleteSession, updateSession } from "./actions";
import { SessionDetailModal } from "../../../../components/session/SessionDetailModal";

type SessionData = {
  id: string;
  title: string;
  date: string; // ISO date string
  timeSlot: string;
  programType: string;
  tutorId: string;
  isCompleted: boolean;
  topicOffset: number;
};

type TutorOption = { id: string; name: string };

const TIME_SLOTS = [
  "08:00 - 09:30",
  "10:00 - 11:30",
  "12:30 - 14:00",
  "14:30 - 16:00",
  "16:30 - 18:00",
  "18:30 - 20:00",
];

const PROGRAM_TYPES = [
  "Conversation", "EFK", "EFT", "Private", "TOEFL Prep", "English on Saturday",
];

export function SessionRowActions({
  session,
  tutors,
}: {
  session: SessionData;
  tutors: TutorOption[];
}) {
  const [isPending, startTransition] = useTransition();
  const [showDetail, setShowDetail] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Edit form state
  const [editTitle, setEditTitle] = useState(session.title);
  const [editDate, setEditDate] = useState(session.date.slice(0, 10));
  const [editTimeSlot, setEditTimeSlot] = useState(session.timeSlot);
  const [editProgramType, setEditProgramType] = useState(session.programType);
  const [editTutorId, setEditTutorId] = useState(session.tutorId);
  const [editTopicOffset, setEditTopicOffset] = useState((session.topicOffset || 0) + 1);

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this session? All attendance records will also be deleted.")) {
      startTransition(async () => {
        const res = await deleteSession(session.id);
        if (res.error) alert(res.error);
      });
    }
  };

  const handleEditSave = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("sessionId", session.id);
      formData.set("title", editTitle);
      formData.set("date", editDate);
      formData.set("timeSlot", editTimeSlot);
      formData.set("programType", editProgramType);
      formData.set("tutorId", editTutorId);
      formData.set("topicOffset", editTopicOffset.toString());
      const res = await updateSession(formData);
      if (res.error) {
        alert(res.error);
      } else {
        setShowEdit(false);
      }
    });
  };

  return (
    <>
      <div className="relative inline-block text-left">
        <button
          type="button"
          disabled={isPending}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          className="flex h-6 w-6 p-0 items-center justify-center rounded-md hover:bg-slate-100 outline-none transition-colors"
        >
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" /> : <MoreVertical className="w-4 h-4 text-slate-500" />}
          <span className="sr-only">Open menu</span>
        </button>

        {menuOpen && (
          <>
            <div 
              className="fixed inset-0 z-[40] bg-transparent"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenuOpen(false);
              }}
            />
            <div 
              className="absolute right-0 top-8 z-[50] w-48 rounded-md border border-slate-200 bg-white p-1 shadow-md animate-in fade-in zoom-in-95 duration-100"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMenuOpen(false);
                  setShowDetail(true);
                }}
                className="w-full flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-slate-100 text-slate-700"
              >
                <Eye className="w-4 h-4 text-slate-400" />
                View Details
              </button>
              
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMenuOpen(false);
                  setShowEdit(true);
                }}
                className="w-full flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-slate-100 text-slate-700"
              >
                <Pencil className="w-4 h-4 text-slate-400" />
                Edit Session
              </button>
              
              <div className="my-1 h-px bg-slate-100" />
              
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMenuOpen(false);
                  handleDelete();
                }}
                className="w-full flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-red-50 text-red-600 focus:text-red-700"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
                Delete Session
              </button>
            </div>
          </>
        )}
      </div>

      {/* View Details Modal */}
      {showDetail && (
        <SessionDetailModal
          sessionId={session.id}
          onClose={() => setShowDetail(false)}
        />
      )}

      {/* Edit Session Modal */}
      {showEdit && mounted && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Edit Session</h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5">Update class details or reassign tutor</p>
              </div>
              <button onClick={() => setShowEdit(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Title */}
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                  <BookOpen className="w-3 h-3" /> Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Date */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" /> Date
                </label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Time Slot */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> Time Slot
                </label>
                <select
                  value={editTimeSlot}
                  onChange={(e) => setEditTimeSlot(e.target.value)}
                  className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                  {!TIME_SLOTS.includes(editTimeSlot) && (
                    <option value={editTimeSlot}>{editTimeSlot}</option>
                  )}
                </select>
              </div>

              {/* Program Type */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Program Type</label>
                <select
                  value={editProgramType}
                  onChange={(e) => setEditProgramType(e.target.value)}
                  className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  {PROGRAM_TYPES.map((p) => <option key={p} value={p}>{p}</option>)}
                  {!PROGRAM_TYPES.includes(editProgramType) && (
                    <option value={editProgramType}>{editProgramType}</option>
                  )}
                </select>
              </div>

              {/* Tutor — highlighted, most important field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
                  <Users className="w-3 h-3" /> Assigned Tutor
                </label>
                <select
                  value={editTutorId}
                  onChange={(e) => setEditTutorId(e.target.value)}
                  className="px-3 py-2.5 bg-indigo-50 border-2 border-indigo-200 rounded-xl text-sm font-bold text-indigo-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  {tutors.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              
              {/* Topic Offset */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                  Mulai dari Topik Ke-
                  <span className="text-[9px] font-semibold text-slate-400 normal-case tracking-normal">(Opsional)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={editTopicOffset}
                  onChange={(e) => setEditTopicOffset(parseInt(e.target.value) || 1)}
                  className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0 flex justify-end gap-3">
              <button
                onClick={() => setShowEdit(false)}
                disabled={isPending}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={isPending}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
              >
                {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : "Save Changes"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
