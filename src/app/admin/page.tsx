'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  ChevronRight,
  Bell,
  Sparkles,
  ArrowRight,
  Eye,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import TaskBadge from '@/components/TaskBadge';
import StatusBadge from '@/components/StatusBadge';
import VerificationModal from '@/components/VerificationModal';
import { getISOWeekInfo, formatIndonesianDate, getAssignedTask, DAY_NAMES } from '@/lib/rotation';
import type { StudentRecord, AttendanceRecord } from '@/lib/types';

export default function AdminDashboardPage() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [todayLogs, setTodayLogs] = useState<AttendanceRecord[]>([]);
  const [allLogs, setAllLogs] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<AttendanceRecord | null>(null);

  const [dateInfo, setDateInfo] = useState({
    isoWeek: 18,
    isoYear: 2025,
    dayOfWeek: 1,
    dateString: '2025-04-28',
  });
  const [formattedToday, setFormattedToday] = useState('Senin, 28 April 2025');

  useEffect(() => {
    const info = getISOWeekInfo(new Date());
    setDateInfo(info);
    setFormattedToday(formatIndonesianDate(new Date()));
  }, []);

  const currentDayOfWeek = dateInfo.dayOfWeek > 5 ? 1 : dateInfo.dayOfWeek;

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [stuRes, subRes, allRes] = await Promise.all([
        fetch('/api/students'),
        fetch(`/api/submissions?date=${dateInfo.dateString}`),
        fetch('/api/submissions'),
      ]);

      if (stuRes.ok) {
        const d = await stuRes.json();
        setStudents(d.students || []);
      }
      if (subRes.ok) {
        const d = await subRes.json();
        setTodayLogs(d.logs || []);
      }
      if (allRes.ok) {
        const d = await allRes.json();
        setAllLogs(d.logs || []);
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [dateInfo.dateString]);

  // Calculations
  const totalStudents = students.length || 36;
  const todayStudents = students
    .filter((s) => s.dayOfWeek === currentDayOfWeek)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  const dutyTodayCount = todayStudents.length;
  const verifiedTodayCount = todayLogs.filter((l) => l.status === 'verified').length;
  const pendingTodayCount = todayLogs.filter((l) => l.status === 'pending').length;

  const handleModerated = (updated: AttendanceRecord) => {
    setTodayLogs((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    setAllLogs((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto min-w-0 overflow-x-hidden">
      {/* Top Header Bar matching Mockup */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Selamat datang, Admin! Berikut adalah ringkasan aktivitas piket kelas 10 SIJA B.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>{formattedToday}</span>
          </div>

          <button
            onClick={loadDashboardData}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Muat ulang data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4 Stat Cards matching Mockup */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Siswa */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Siswa</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {totalStudents}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Kelas 10 SIJA B</span>
          </div>
        </div>

        {/* Piket Hari Ini */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Piket Hari Ini</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {dutyTodayCount}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Hari {DAY_NAMES[currentDayOfWeek]}
            </span>
          </div>
        </div>

        {/* Sudah Verifikasi */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Sudah Verifikasi</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {verifiedTodayCount}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Telah disetujui</span>
          </div>
        </div>

        {/* Menunggu Verifikasi */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Menunggu Verifikasi</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400">
              {pendingTodayCount}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Perlu ditinjau</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Left Table & Right Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Jadwal Piket Hari Ini (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Jadwal Piket Hari Ini
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {DAY_NAMES[currentDayOfWeek]}, {formattedToday}
              </p>
            </div>
            <Link
              href="/admin/verifikasi"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors"
            >
              <span>Lihat Semua</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile Card List (md:hidden) */}
          <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {todayStudents.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Tidak ada petugas piket terjadwal.
              </div>
            ) : (
              todayStudents.map((student, idx) => {
                const taskName = getAssignedTask(
                  student.dayOfWeek,
                  student.orderIndex,
                  dateInfo.isoWeek,
                  dateInfo.isoYear
                );
                const log = todayLogs.find((l) => l.studentId === student.id);

                return (
                  <div
                    key={student.id}
                    className="p-3.5 flex items-center justify-between gap-2.5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 flex items-center justify-center text-[11px] font-bold shrink-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {student.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <TaskBadge task={taskName} size="sm" />
                          {log ? (
                            <StatusBadge status={log.status} size="sm" />
                          ) : (
                            <span className="text-[10px] text-slate-400">Belum Ada Bukti</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {log?.tempPhotoUrl ? (
                        <button
                          onClick={() => setSelectedSubmission(log)}
                          className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 shadow-2xs hover:opacity-85 transition-opacity"
                        >
                          <img src={log.tempPhotoUrl} alt="Bukti" className="w-full h-full object-cover" />
                        </button>
                      ) : log ? (
                        <button
                          onClick={() => setSelectedSubmission(log)}
                          className="p-2 rounded-xl text-blue-600 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-400 text-xs font-semibold"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600 text-xs px-2">-</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop Table (hidden md:block) */}
          <div className="hidden md:block overflow-x-auto min-w-0 w-full">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/70 dark:bg-slate-800/60 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">Nama Siswa</th>
                  <th className="py-3 px-4">Tugas</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Foto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {todayStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                      Tidak ada petugas piket terjadwal.
                    </td>
                  </tr>
                ) : (
                  todayStudents.map((student, idx) => {
                    const taskName = getAssignedTask(
                      student.dayOfWeek,
                      student.orderIndex,
                      dateInfo.isoWeek,
                      dateInfo.isoYear
                    );
                    const log = todayLogs.find((l) => l.studentId === student.id);

                    return (
                      <tr
                        key={student.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-4 text-center text-xs font-medium text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-900 dark:text-white block">
                            {student.name}
                          </span>
                          <span className="text-[11px] text-slate-400">Kelas 10 SIJA B</span>
                        </td>
                        <td className="py-3 px-4">
                          <TaskBadge task={taskName} size="sm" />
                        </td>
                        <td className="py-3 px-4">
                          {log ? (
                            <StatusBadge status={log.status} size="sm" />
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                              <Clock className="w-3 h-3" />
                              <span>Pending</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {log?.tempPhotoUrl ? (
                            <button
                              onClick={() => setSelectedSubmission(log)}
                              className="w-9 h-9 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 hover:opacity-80 transition-opacity inline-block"
                              title="Lihat foto bukti"
                            >
                              <img
                                src={log.tempPhotoUrl}
                                alt="Foto"
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ) : log ? (
                            <button
                              onClick={() => setSelectedSubmission(log)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium"
                              title="Lihat detail"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600 text-xs">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Aktivitas Terbaru (matching Mockup) */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Aktivitas Terbaru
            </h2>
            <Link
              href="/admin/verifikasi"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors"
            >
              Lihat Semua
            </Link>
          </div>

          <div className="p-4 divide-y divide-slate-100 dark:divide-slate-800 flex-1 overflow-y-auto max-h-[460px]">
            {allLogs.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Belum ada aktivitas pengajuan piket.
              </div>
            ) : (
              allLogs.slice(0, 7).map((log) => {
                const isVerified = log.status === 'verified';
                const isRejected = log.status === 'rejected';

                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedSubmission(log)}
                    className="py-3 first:pt-0 last:pb-0 flex items-start gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 p-2 rounded-xl transition-colors"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                        isVerified
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : isRejected
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                      }`}
                    >
                      {isVerified ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1 text-xs">
                      <p className="text-slate-800 dark:text-slate-200 font-medium">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {log.studentName}
                        </span>{' '}
                        {isVerified
                          ? 'bukti disetujui'
                          : isRejected
                          ? 'bukti ditolak'
                          : 'mengunggah bukti piket'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {log.taskName} •{' '}
                        {new Date(log.createdAt).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                          timeZone: 'Asia/Jakarta',
                        })}{' '}
                        WIB
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Verification Modal */}
      <VerificationModal
        submission={selectedSubmission}
        onClose={() => setSelectedSubmission(null)}
        onModerated={handleModerated}
      />
    </div>
  );
}
