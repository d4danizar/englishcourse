"use client";

import { useState, useTransition } from "react";
import * as XLSX from "xlsx";
import { addMarketingSource, updateLeadSource } from "@/lib/actions/lead-source-actions";
import { Plus, Download, Loader2, Search, BarChart2 } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

type Lead = {
  id: string;
  name: string;
  whatsapp: string;
  createdAt: Date;
  discoverySource: string | null;
  notes?: string | null;
};

type MarketingSource = {
  id: string;
  name: string;
  createdAt: Date;
};

export default function LeadSourceClient({
  initialLeads,
  initialSources,
}: {
  initialLeads: Lead[];
  initialSources: MarketingSource[];
}) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [sources, setSources] = useState<MarketingSource[]>(initialSources);
  const [isPending, startTransition] = useTransition();

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showChart, setShowChart] = useState(false);

  // Apply filters
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.whatsapp?.includes(searchQuery) || 
      lead.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Date check (ignoring time by resetting to midnight for safe comparison)
    const leadDate = new Date(lead.createdAt);
    leadDate.setHours(0,0,0,0);
    
    const start = startDate ? new Date(startDate) : null;
    if (start) start.setHours(0,0,0,0);
    
    const end = endDate ? new Date(endDate) : null;
    if (end) end.setHours(0,0,0,0);

    const matchesStart = start ? leadDate >= start : true;
    const matchesEnd = end ? leadDate <= end : true;

    return matchesSearch && matchesStart && matchesEnd;
  });

  // Chart Data Preparation
  const chartDataMap: Record<string, number> = {};
  filteredLeads.forEach(lead => {
    const source = lead.discoverySource || "Belum Ditentukan";
    chartDataMap[source] = (chartDataMap[source] || 0) + 1;
  });
  
  const chartData = Object.keys(chartDataMap).map(key => ({
    name: key,
    value: chartDataMap[key]
  })).sort((a, b) => b.value - a.value); // Sort highest to lowest

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658', '#e83e8c', '#20c997'];

  const handleExportExcel = () => {
    try {
      // Use filteredLeads instead of all leads
      const exportData = filteredLeads.map(lead => ({
        "Tanggal Masuk": format(new Date(lead.createdAt), "dd MMMM yyyy", { locale: id }),
        "Nama": lead.name,
        "Nomor WhatsApp": lead.whatsapp,
        "Asal Iklan": lead.discoverySource || "Belum Ditentukan"
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Auto-size columns
      worksheet["!cols"] = [
        { wch: 20 }, // Tanggal
        { wch: 40 }, // Nama
        { wch: 20 }, // WhatsApp
        { wch: 20 }, // Asal Iklan
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data Leads");
      XLSX.writeFile(workbook, "Tracking_Iklan_Leads.xlsx");
    } catch (error) {
      console.error("Failed to export Excel:", error);
      alert("Gagal mengekspor data ke Excel.");
    }
  };

  const handleAddSource = async () => {
    const newSourceName = window.prompt("Masukkan nama asal iklan baru (Contoh: Brosur):");
    if (!newSourceName || newSourceName.trim() === "") return;

    startTransition(async () => {
      const res = await addMarketingSource(newSourceName);
      if (res.error) {
        alert(res.error);
      } else if (res.source) {
        setSources(prev => [...prev, res.source!]);
        alert(`Opsi "${newSourceName}" berhasil ditambahkan.`);
      }
    });
  };

  const handleSourceChange = (leadId: string, newSource: string) => {
    // Optimistic UI update
    setLeads(prev => prev.map(lead => 
      lead.id === leadId ? { ...lead, discoverySource: newSource } : lead
    ));

    // Save to DB in background
    startTransition(async () => {
      const res = await updateLeadSource(leadId, newSource);
      if (res.error) {
        alert(res.error);
        // Revert on error (fetch fresh data or just reload)
        window.location.reload();
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header & Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        {/* Left Side: Title & Subtitle */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tracking Asal Iklan Leads</h1>
          <p className="text-sm text-slate-500 mt-1">
            Lacak dan atur asal sumber iklan dari setiap lead yang masuk.
          </p>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={() => setShowChart(!showChart)}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors border w-full sm:w-auto ${showChart ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
          >
            <BarChart2 className="w-4 h-4" />
            {showChart ? "Sembunyikan Grafik" : "Tampilkan Grafik"}
          </button>

          <button
            onClick={handleAddSource}
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200 disabled:opacity-50 w-full sm:w-auto"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Opsi Iklan
          </button>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors w-full sm:w-auto"
          >
            <Download className="w-4 h-4" />
            Download Excel
          </button>
        </div>
      </div>

      {/* Control Panel: Filters Only */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
        {/* Search */}
        <div className="relative w-full md:w-1/3">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Cari nama atau nomor WA..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 font-medium text-slate-900"
          />
        </div>
        
        {/* Date Range Inputs */}
        <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full sm:w-auto p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-900"
          />
          <span className="text-slate-400 font-medium hidden sm:block">-</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full sm:w-auto p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-900"
          />
        </div>
      </div>

      {/* Conditional Chart Section */}
      {showChart && (
        <div className="w-full h-80 bg-white p-4 shadow-sm border border-slate-200 rounded-2xl mb-2 transition-all">
          <h3 className="font-bold text-center text-slate-800 mb-2">Distribusi Asal Iklan</h3>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} Leads`, "Jumlah"]} />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse whitespace-nowrap table-auto">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Tanggal Masuk</th>
                <th className="px-6 py-4">Nama Lead</th>
                <th className="px-6 py-4">No. WhatsApp</th>
                <th className="px-6 py-4">Asal Iklan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-medium">
                    {leads.length === 0 ? "Belum ada data leads." : "Tidak ada lead yang cocok dengan filter."}
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {format(new Date(lead.createdAt), "dd MMM yyyy", { locale: id })}
                    </td>
                    <td 
                      className="px-6 py-4 text-sm font-bold text-slate-900 max-w-[200px] sm:max-w-[300px] truncate"
                      title={lead.name}
                    >
                      {lead.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {lead.whatsapp || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={lead.discoverySource || ""}
                        onChange={(e) => handleSourceChange(lead.id, e.target.value)}
                        disabled={isPending}
                        className="w-full max-w-[200px] p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium text-slate-700 disabled:opacity-50"
                      >
                        <option value="" disabled>Pilih Sumber...</option>
                        {sources.map(source => (
                          <option key={source.id} value={source.name}>
                            {source.name}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-slate-50/80 p-4 border-t border-slate-200 text-xs font-medium text-slate-500 text-center sm:text-left">
          Menampilkan {filteredLeads.length} lead
        </div>
      </div>
    </div>
  );
}
