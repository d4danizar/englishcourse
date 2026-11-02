"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { submitFollowUp } from "./actions";

export default function CrmDashboardClient({ initialLeads, currentMonth, currentYear }: any) {
  const router = useRouter();
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [note, setNote] = useState("");
  const [nextReminder, setNextReminder] = useState("");
  const [isClosedWon, setIsClosedWon] = useState(false);

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.push(`/admin/follow-up?month=${e.target.value}&year=${currentYear}`);
  };

  const openFollowUpModal = (lead: any) => {
    setSelectedLead(lead);
    setNote("");
    setNextReminder("");
    setIsClosedWon(false);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const nextStage = selectedLead.currentStage + 1;
      // You should replace "CS_Staff" with the actual logged-in user's name from session later
      await submitFollowUp(
        selectedLead.id, 
        nextStage, 
        note, 
        "CS_Staff", 
        nextReminder ? new Date(nextReminder) : undefined, 
        isClosedWon
      );
      setIsModalOpen(false);
      router.refresh(); // Refresh server component to get new data
    } catch (error) {
      console.error(error);
      alert("Gagal menyimpan follow-up.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isOverdue = (dateString: string) => {
    if (!dateString) return false;
    return new Date(dateString) <= new Date();
  };

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <select value={currentMonth} onChange={handleMonthChange} className="border p-2 rounded font-medium text-gray-700">
          {[
            "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
            "Juli", "Agustus", "September", "Oktober", "November", "Desember"
          ].map((monthName, index) => (
            <option key={index + 1} value={index + 1}>{monthName}</option>
          ))}
        </select>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama & Kontak</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status & Stage</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reminder</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Riwayat Terakhir</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {initialLeads.map((lead: any) => (
              <tr key={lead.id} className={lead.status === "CLOSED_WON" ? "bg-green-50 opacity-70" : ""}>
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{lead.name}</div>
                  <div className="text-sm text-gray-500">{lead.phone || lead.whatsapp}</div>
                  <div className="text-xs text-blue-500">{lead.source}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${lead.status === 'CLOSED_WON' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {lead.status}
                  </span>
                  <div className="text-sm text-gray-500 mt-1">Stage: {lead.currentStage} / 8</div>
                </td>
                <td className="px-6 py-4 text-sm">
                  {lead.nextReminderDate ? (
                    <span className={isOverdue(lead.nextReminderDate) ? "text-red-600 font-bold" : "text-gray-900"}>
                      {new Date(lead.nextReminderDate).toLocaleDateString('id-ID')}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                  {lead.followUps?.length > 0 
                    ? lead.followUps[lead.followUps.length - 1].note 
                    : "Belum ada riwayat"}
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium">
                  {lead.status !== "CLOSED_WON" && lead.currentStage < 8 && (
                    <button 
                      onClick={() => openFollowUpModal(lead)}
                      className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded"
                    >
                      + Follow Up
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Follow Up Modal */}
      {isModalOpen && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Input Follow Up {selectedLead.currentStage + 1}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Catatan Hasil Percakapan</label>
                <textarea 
                  required 
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  rows={3} 
                  value={note} 
                  onChange={e => setNote(e.target.value)}
                />
              </div>

              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="closedWon" 
                  checked={isClosedWon} 
                  onChange={e => setIsClosedWon(e.target.checked)} 
                  className="mr-2"
                />
                <label htmlFor="closedWon" className="text-sm font-medium text-green-700">Mark as CLOSED WON (Siswa Mendaftar)</label>
              </div>

              {!isClosedWon && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tanggal Reminder Berikutnya</label>
                  <input 
                    type="date" 
                    required 
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    value={nextReminder} 
                    onChange={e => setNextReminder(e.target.value)}
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded">Batal</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-indigo-600 text-white rounded">
                  {isSubmitting ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
