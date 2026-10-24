'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Calendar,
  Layers,
} from 'lucide-react';
import TaskBadge from '@/components/TaskBadge';
import { DAY_NAMES } from '@/lib/rotation';
import type { AttendanceRecord, StudentRecord } from '@/lib/types';

export default function AdminStatisticsPage() {
  const [logs, setLogs] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [subRes, stuRes] = await Promise.all([
          fetch('/api/submissions'),
          fetch('/api/students'),
        ]);

        if (subRes.ok) {
          const d = await subRes.json();
          setLogs(d.logs || []);
        }
        if (stuRes.ok) {
          const d = await stuRes.json();
          setStudents(d.students || []);
        }
      } catch (err) {
        console.error('Error fetching statistics:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const total = logs.length;
  const verified = logs.filter((l) => l.status === 'verified').length;
  const rejected = logs.filter((l) => l.status === 'rejected').length;
  const pending = logs.filter((l) => l.status === 'pending').length;

  const rate = total > 0 ? Math.round((verified / total) * 100) : 0;

  // Breakdown by task
  const taskStats = (['MBG', 'Nyapu', 'Helper'] as const).map((task) => {
    const list = logs.filter((l) =>
      task === 'Nyapu' ? l.taskName === 'Nyapu' || (l.taskName as string) === 'Nyapu & Pel' : l.taskName === task
    );
    const ver = list.filter((l) => l.status === 'verified').length;
    const rej = list.filter((l) => l.status === 'rejected').length;
    return {
      task,
      total: list.length,
      verified: ver,
      rejected: rej,
      percent: list.length ? Math.round((ver / list.length) * 100) : 0,
    };
  });

  // Daily stats for Mon-Fri
  const dayStats = [1, 2, 3, 4, 5].map((d) => {
    const list = logs.filter((l) => l.dayOfWeek === d);
    const ver = list.filter((l) => l.status === 'verified').length;
    return {
      day: DAY_NAMES[d],
      dayOfWeek: d,
      total: list.length,
      verified: ver,
    };
  });

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto min-w-0 overflow-x-hidden">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Statistik Kehadiran Piket
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Analisis metrik kepatuhan piket, tingkat verifikasi tugas, dan rekap per kategori.
        </p>
      </div>

      {/* Top 4 stat summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Tingkat Kelulusan Piket
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{rate}%</span>
            <span className="text-xs text-slate-400">terverifikasi</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Total Pengajuan
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{total}</span>
            <span className="text-xs text-slate-400">foto bukti</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Bukti Terverifikasi
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{verified}</span>
            <span className="text-xs text-slate-400">disetujui admin</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Bukti Ditolak
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">{rejected}</span>
            <span className="text-xs text-slate-400">perlu upload ulang</span>
          </div>
        </div>
      </div>

      {/* Task Performance Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Penyelesaian per Kategori Tugas
          </h3>

          <div className="space-y-4">
            {taskStats.map((item) => (
              <div key={item.task} className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <TaskBadge task={item.task} size="sm" />
                    <span className="text-slate-500">({item.verified} / {item.total} terverifikasi)</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">{item.percent}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Distribution Chart */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Aktivitas Piket per Hari
          </h3>

          <div className="flex items-end justify-between gap-3 h-48 pt-6">
            {dayStats.map((d) => {
              const maxVal = Math.max(...dayStats.map((x) => x.total), 1);
              const heightPct = Math.round((d.total / maxVal) * 100);

              return (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    {d.verified}
                  </span>
                  <div className="w-full max-w-[40px] bg-slate-100 dark:bg-slate-800 rounded-t-lg overflow-hidden flex flex-col justify-end h-32">
                    <div
                      className="w-full bg-blue-600 dark:bg-blue-500 rounded-t-lg transition-all"
                      style={{ height: `${Math.max(heightPct, 8)}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {d.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
