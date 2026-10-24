'use client';

import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import TaskBadge from '@/components/TaskBadge';
import { getISOWeekInfo, getWeekDateRange, DAY_NAMES } from '@/lib/rotation';
import type { AttendanceRecord, StudentRecord } from '@/lib/types';

export default function AdminWeeklyRecapPage() {
  const [selectedWeek, setSelectedWeek] = useState(18);
  const [selectedYear, setSelectedYear] = useState(2025);

  const [logs, setLogs] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingWa, setSendingWa] = useState(false);
  const [waNotice, setWaNotice] = useState<string | null>(null);

  useEffect(() => {
    const info = getISOWeekInfo(new Date());
    setSelectedWeek(info.isoWeek);
    setSelectedYear(info.isoYear);
  }, []);

  const weekRange = getWeekDateRange(selectedWeek, selectedYear);

  const fetchWeekLogs = async () => {
    try {
      setLoading(true);
      const url = `/api/submissions?startDate=${weekRange.startDate}&endDate=${weekRange.endDate}`;
      const res = await fetch(url);
      if (res.ok) {
        const d = await res.json();
        setLogs(d.logs || []);
      }
    } catch (err) {
      console.error('Error loading weekly logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeekLogs();
  }, [selectedWeek, selectedYear]);

  const total = logs.length;
  const verified = logs.filter((l) => l.status === 'verified').length;
  const rejected = logs.filter((l) => l.status === 'rejected').length;
  const pending = logs.filter((l) => l.status === 'pending').length;

  const verifiedPercent = total > 0 ? ((verified / total) * 100).toFixed(1) : '0.0';
  const rejectedPercent = total > 0 ? ((rejected / total) * 100).toFixed(1) : '0.0';

  // Task breakdown
  const taskRows = (['MBG', 'Nyapu & Pel', 'Helper'] as const).map((t) => {
    const subset = logs.filter((l) => l.taskName === t);
    const ver = subset.filter((l) => l.status === 'verified').length;
    const rej = subset.filter((l) => l.status === 'rejected').length;
    return {
      task: t,
      total: subset.length,
      verified: ver,
      rejected: rej,
    };
  });

  // Daily Hadir vs Tidak Hadir
  const dayChartData = [1, 2, 3, 4, 5].map((d) => {
    const list = logs.filter((l) => l.dayOfWeek === d);
    const hadir = list.filter((l) => l.status === 'verified').length;
    const tidakHadir = list.filter((l) => l.status === 'rejected').length;
    return {
      day: DAY_NAMES[d],
      hadir,
      tidakHadir,
      total: list.length,
    };
  });

  const handleDownloadExcel = () => {
    window.location.href = `/api/reports/excel?week=${selectedWeek}&year=${selectedYear}`;
  };

  const handleSendWhatsAppRecap = async () => {
    setWaNotice(null);
    try {
      setSendingWa(true);
      const res = await fetch('/api/cron/weekly-recap', {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || 'dev-secret'}`,
        },
      });
      const data = await res.json();
      setWaNotice(data.message || 'Rekap mingguan telah diproses ke WhatsApp admin.');
    } catch {
      setWaNotice('Gagal mengirimkan rekap WhatsApp.');
    } finally {
      setSendingWa(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
      {/* Title & Top Controls matching mockup */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Rekap Mingguan
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Laporan kehadiran piket mingguan dan ekspor lembar kerja Microsoft Excel.
          </p>
        </div>

        {/* Date Selector & Download Excel */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Week picker */}
          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-xs">
            <button
              onClick={() => setSelectedWeek((w) => Math.max(1, w - 1))}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 text-center">
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                {weekRange.label}
              </span>
              <span className="text-[10px] text-slate-400 block">Minggu ke-{selectedWeek}</span>
            </div>
            <button
              onClick={() => setSelectedWeek((w) => Math.min(52, w + 1))}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Download Excel Button (matching mockup blue button) */}
          <button
            onClick={handleDownloadExcel}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download Excel</span>
          </button>

          {/* WhatsApp Button */}
          <button
            onClick={handleSendWhatsAppRecap}
            disabled={sendingWa}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors"
          >
            {sendingWa ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Kirim WA Admin</span>
          </button>
        </div>
      </div>

      {waNotice && (
        <div className="p-3.5 rounded-xl bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs flex items-center justify-between">
          <span>{waNotice}</span>
          <button onClick={() => setWaNotice(null)} className="text-xs font-bold">
            Tutup
          </button>
        </div>
      )}

      {/* 3 Metric Cards matching Mockup */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Piket */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Piket</span>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{total}</p>
          <span className="text-[11px] text-slate-400 block">pengajuan tercatat</span>
        </div>

        {/* Terverifikasi */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Terverifikasi</span>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{verified}</p>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              ({verifiedPercent}%)
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block">kehadiran sah</span>
        </div>

        {/* Ditolak */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Ditolak</span>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">{rejected}</p>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
              ({rejectedPercent}%)
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block">tidak memenuhi syarat</span>
        </div>
      </div>

      {/* Rekap per Tugas Table matching Mockup */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Rekap per Tugas</h2>
          <p className="text-xs text-slate-400 mt-0.5">Rincian status pelaksanaan tiap penugasan piket.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/70 dark:bg-slate-800/60 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Tugas</th>
                <th className="py-3 px-4 text-center">Jumlah</th>
                <th className="py-3 px-4 text-center">Terverifikasi</th>
                <th className="py-3 px-4 text-center">Ditolak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {taskRows.map((r) => (
                <tr key={r.task} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="py-3.5 px-4">
                    <TaskBadge task={r.task} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 text-center text-xs font-bold text-slate-900 dark:text-white">
                    {r.total}
                  </td>
                  <td className="py-3.5 px-4 text-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {r.verified}
                  </td>
                  <td className="py-3.5 px-4 text-center text-xs font-bold text-rose-600 dark:text-rose-400">
                    {r.rejected}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grafik Kehadiran Bar Chart matching Mockup */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Grafik Kehadiran</h2>
            <p className="text-xs text-slate-400 mt-0.5">Perbandingan Hadir vs Tidak Hadir per hari</p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-blue-600" />
              <span className="text-slate-600 dark:text-slate-300">Hadir</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-slate-300 dark:bg-slate-700" />
              <span className="text-slate-600 dark:text-slate-300">Tidak Hadir / Ditolak</span>
            </div>
          </div>
        </div>

        {/* Visual Bar chart */}
        <div className="flex items-end justify-between gap-4 h-52 pt-8 border-b border-slate-200 dark:border-slate-800 pb-4">
          {dayChartData.map((d) => {
            const maxVal = Math.max(...dayChartData.map((x) => x.total), 8);
            const hadirHeight = Math.round((d.hadir / maxVal) * 100);
            const tidakHadirHeight = Math.round((d.tidakHadir / maxVal) * 100);

            return (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div className="flex items-end gap-1.5 h-36">
                  {/* Hadir Bar */}
                  <div
                    className="w-5 sm:w-7 bg-blue-600 rounded-t-md transition-all duration-300"
                    style={{ height: `${Math.max(hadirHeight, 6)}%` }}
                    title={`Hadir: ${d.hadir}`}
                  />
                  {/* Tidak Hadir Bar */}
                  <div
                    className="w-5 sm:w-7 bg-slate-200 dark:bg-slate-700 rounded-t-md transition-all duration-300"
                    style={{ height: `${Math.max(tidakHadirHeight, 6)}%` }}
                    title={`Tidak Hadir/Ditolak: ${d.tidakHadir}`}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-2">
                  {d.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
