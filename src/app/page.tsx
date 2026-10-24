'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  CheckCircle2,
  Clock,
  UploadCloud,
  Users,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Shield,
  FileSpreadsheet,
  Cpu,
  HelpCircle,
} from 'lucide-react';
import PublicNavbar from '@/components/PublicNavbar';
import TaskBadge from '@/components/TaskBadge';
import StatusBadge from '@/components/StatusBadge';
import { getISOWeekInfo, formatIndonesianDate, getAssignedTask, DAY_NAMES } from '@/lib/rotation';
import type { StudentRecord, AttendanceRecord } from '@/lib/types';

export default function StudentHomePage() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [todayLogs, setTodayLogs] = useState<AttendanceRecord[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [dateInfo, setDateInfo] = useState({
    isoWeek: 18,
    isoYear: 2025,
    dayOfWeek: 1,
    dateString: '2025-04-28',
  });
  const [formattedDate, setFormattedDate] = useState('Senin, 28 April 2025');

  useEffect(() => {
    const info = getISOWeekInfo(new Date());
    setDateInfo(info);
    setFormattedDate(formatIndonesianDate(new Date()));
  }, []);

  const todayDayOfWeek = dateInfo.dayOfWeek;
  const isWeekend = todayDayOfWeek > 5;
  const activeDutyDay = isWeekend ? 1 : todayDayOfWeek;

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [stuRes, subRes] = await Promise.all([
          fetch('/api/students'),
          fetch(`/api/submissions?date=${dateInfo.dateString}`),
        ]);

        if (stuRes.ok) {
          const data = await stuRes.json();
          setStudents(data.students || []);
        }

        if (subRes.ok) {
          const data = await subRes.json();
          setTodayLogs(data.logs || []);
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [dateInfo.dateString]);

  // Today's students roster
  const todayStudents = students
    .filter((s) => s.dayOfWeek === activeDutyDay)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  // Selected student details
  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  // Calculate task for selected student
  const selectedStudentTask = selectedStudent
    ? getAssignedTask(
        selectedStudent.dayOfWeek,
        selectedStudent.orderIndex,
        dateInfo.isoWeek,
        dateInfo.isoYear
      )
    : null;

  // Selected student's submission status today
  const selectedStudentLog = selectedStudent
    ? todayLogs.find((l) => l.studentId === selectedStudent.id)
    : null;

  // Filter students for search dropdown
  const filteredStudents = searchQuery.trim()
    ? students.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : students;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0b1120] text-slate-900 dark:text-slate-100 transition-colors">
      <PublicNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
        {/* Top Hero Section matching Showcase Branding */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white p-6 sm:p-10 shadow-lg shadow-blue-500/10">
          <div className="absolute right-0 top-0 -mt-10 -mr-10 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-medium border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-blue-200" />
              <span>Sistem Manajemen Piket Terpadu Kelas 10 SIJA B</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Piket Kelas Jadi Lebih Mudah, Teratur, dan Transparan
            </h1>
            <p className="text-blue-100 text-sm sm:text-base leading-relaxed max-w-2xl">
              CleanBieber membantu mengelola rotasi tugas piket harian, memverifikasi foto bukti kebersihan secara
              otomatis dengan dukungan AI Gemini, dan menyajikan rekap kehadiran kelas yang terpercaya.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                href="/unggah"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-blue-600 hover:bg-blue-50 font-semibold text-sm shadow-sm transition-all"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload Foto Bukti</span>
              </Link>
              <Link
                href="/jadwal"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-800/60 hover:bg-blue-800/90 text-white font-medium text-sm border border-white/20 transition-all"
              >
                <Calendar className="w-4 h-4" />
                <span>Lihat Jadwal Mingguan</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Current Date & Status Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Hari Ini
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
                  Minggu ke-{dateInfo.isoWeek}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {formattedDate}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            <div>
              Petugas Hari Ini:{' '}
              <span className="font-bold text-blue-600 dark:text-blue-400">{todayStudents.length} Siswa</span>
            </div>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
            <div>
              Terverifikasi:{' '}
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {todayLogs.filter((l) => l.status === 'verified').length} Siswa
              </span>
            </div>
          </div>
        </div>

        {/* Two-Column Core Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Student Self-Identification & Action Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Pilih Nama Kamu
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Cek tugas piket harian dan status bukti kamu
                  </p>
                </div>
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>

              {/* Searchable Select */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Cari / Pilih Nama Siswa
                </label>
                <div className="relative">
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="">-- Pilih Nama dari Roster --</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({DAY_NAMES[s.dayOfWeek]})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Selected Student Card */}
              {selectedStudent ? (
                <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                        Halo, {selectedStudent.name}!
                      </p>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Jadwal Tetap: {DAY_NAMES[selectedStudent.dayOfWeek]}
                      </h4>
                    </div>
                    {selectedStudentTask && <TaskBadge task={selectedStudentTask} size="sm" />}
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                    <p>
                      <span className="font-medium text-slate-700 dark:text-slate-200">Tugas Kamu:</span>{' '}
                      {selectedStudentTask === 'MBG'
                        ? 'MBG (Makanan Bergizi Gratis, 07:00 - 09:00)'
                        : selectedStudentTask === 'Nyapu & Pel'
                        ? 'Menyapu & Mengepel Kelas (15:00 - 16:30)'
                        : 'Helper / Koordinator Kelas'}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="font-medium text-slate-700 dark:text-slate-200">Status Bukti:</span>
                      {selectedStudentLog ? (
                        <StatusBadge status={selectedStudentLog.status} size="sm" />
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 font-medium">
                          Belum mengunggah foto
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link
                      href={`/unggah?studentId=${selectedStudent.id}`}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-all"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>{selectedStudentLog ? 'Ajukan Ulang / Cek Foto' : 'Upload Foto Bukti Piket'}</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center py-6">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Pilih nama kamu di atas untuk melihat penugasan spesifik hari ini dan mengunggah foto bukti.
                  </p>
                </div>
              )}

              {/* Status explanation note */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  Keterangan Status Verifikasi:
                </span>
                <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                  <li>
                    <span className="font-bold text-amber-600 dark:text-amber-400">• Pending:</span> Foto telah
                    diterima dan menunggu verifikasi admin.
                  </li>
                  <li>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">• Verified:</span> Bukti telah
                    disetujui admin dan kehadiran piket tercatat.
                  </li>
                  <li>
                    <span className="font-bold text-rose-600 dark:text-rose-400">• Rejected:</span> Bukti ditolak
                    (misal: foto tidak sesuai atau tidak jelas).
                  </li>
                </ul>
              </div>
            </div>

            {/* Quick Link Card to weekly board */}
            <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm">Papan Jadwal Lengkap</h4>
                <Calendar className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Lihat jadwal piket Senin s.d. Jumat lengkap dengan rotasi otomatis mingguan untuk seluruh 36 siswa.
              </p>
              <Link
                href="/jadwal"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
              >
                <span>Buka Jadwal Mingguan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Right Column: Today's Cleaning Duty Table (matching mockup) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Jadwal Piket Hari Ini
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {DAY_NAMES[activeDutyDay]}, {formattedDate} — {todayStudents.length} Siswa Bertugas
                  </p>
                </div>
                <Link
                  href="/jadwal"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  <span>Lihat Semua</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">No</th>
                      <th className="py-3 px-4">Nama Siswa</th>
                      <th className="py-3 px-4">Tugas</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                          Memuat data jadwal piket...
                        </td>
                      </tr>
                    ) : todayStudents.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                          Tidak ada jadwal piket hari ini.
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
                            <td className="py-3.5 px-4 text-center text-xs font-medium text-slate-400">
                              {idx + 1}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="font-semibold text-slate-900 dark:text-white block">
                                {student.name}
                              </span>
                              <span className="text-[11px] text-slate-400">Kelas 10 SIJA B</span>
                            </td>
                            <td className="py-3.5 px-4">
                              <TaskBadge task={taskName} size="sm" />
                            </td>
                            <td className="py-3.5 px-4">
                              {log ? (
                                <StatusBadge status={log.status} size="sm" />
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                                  <Clock className="w-3 h-3" />
                                  <span>Belum Upload</span>
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <Link
                                href={`/unggah?studentId=${student.id}`}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-900/60 transition-colors"
                              >
                                <UploadCloud className="w-3.5 h-3.5" />
                                <span>Upload</span>
                              </Link>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Feature Showcase Grid matching UI Mockup Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <h5 className="text-xs font-bold text-slate-900 dark:text-white">Jadwal Piket</h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                  Rotasi tugas otomatis setiap minggu berdasarkan kalender ISO.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
                  <Cpu className="w-4 h-4" />
                </div>
                <h5 className="text-xs font-bold text-slate-900 dark:text-white">AI Verification</h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                  Google Gemini mendeteksi objek kebersihan dan skor validitas.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h5 className="text-xs font-bold text-slate-900 dark:text-white">Status Transparan</h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                  Siswa dapat langsung memantau verifikasi bukti fotonya.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <h5 className="text-xs font-bold text-slate-900 dark:text-white">Rekap Excel & WA</h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                  Ekspor laporan instan dan notifikasi WhatsApp otomatis.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <p>
          CleanBieber © 2025 — Class Cleaning Management System. Kelas 10 SIJA B (36 Siswa).
        </p>
      </footer>
    </div>
  );
}
