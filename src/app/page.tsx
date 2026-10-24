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
  FileSpreadsheet,
  Cpu,
  HelpCircle,
  Camera,
  Utensils,
  HeartHandshake,
  UserCheck,
  Check,
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

    // Load persisted student selection if any
    try {
      const savedId = localStorage.getItem('cleanbieber_student_id');
      if (savedId) {
        setSelectedStudentId(savedId);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSelectStudent = (id: string) => {
    setSelectedStudentId(id);
    try {
      if (id) {
        localStorage.setItem('cleanbieber_student_id', id);
      } else {
        localStorage.removeItem('cleanbieber_student_id');
      }
    } catch {
      // ignore
    }
  };

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

  const isSelectedStudentDutyToday = selectedStudent && selectedStudent.dayOfWeek === activeDutyDay;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0b1120] text-slate-900 dark:text-slate-100 transition-colors w-full max-w-full overflow-x-hidden">
      <PublicNavbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-5 sm:space-y-8 min-w-0">

        {/* ============================================================== */}
        {/* MOBILE VIEW (< lg) — Pixel-perfect to Mockup Phone Screen       */}
        {/* ============================================================== */}
        <div className="lg:hidden space-y-4 min-w-0 w-full">
          {/* Greeting Banner */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                  Halo, {selectedStudent ? selectedStudent.name : 'Siswa 10 SIJA B'}!
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Berikut jadwal piket kelas kamu hari ini.
                </p>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800 shrink-0">
                10 SIJA B
              </span>
            </div>

            {/* Date Pill & Week */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>{formattedDate}</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Hari Ini
              </span>
            </div>
          </div>

          {/* Student Selector Card */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Pilih Nama Kamu:</span>
              </label>
              {selectedStudent && (
                <button
                  onClick={() => handleSelectStudent('')}
                  className="text-[11px] font-medium text-slate-400 hover:text-rose-500"
                >
                  Ganti
                </button>
              )}
            </div>

            <div className="relative">
              <select
                value={selectedStudentId}
                onChange={(e) => handleSelectStudent(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all truncate"
              >
                <option value="">-- Sentuh untuk Pilih Nama Kamu --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({DAY_NAMES[s.dayOfWeek]})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tugas Kamu Card (Dedicated Mobile Card matching Mockup) */}
          <div className="rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white p-4.5 shadow-md shadow-blue-500/15 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center">
                  {selectedStudentTask === 'MBG' ? (
                    <Utensils className="w-4 h-4 text-white" />
                  ) : selectedStudentTask === 'Nyapu & Pel' ? (
                    <Sparkles className="w-4 h-4 text-white" />
                  ) : (
                    <HeartHandshake className="w-4 h-4 text-white" />
                  )}
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-100">
                  Tugas Kamu
                </span>
              </div>

              {selectedStudent && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-xs">
                  {DAY_NAMES[selectedStudent.dayOfWeek]}
                </span>
              )}
            </div>

            {selectedStudent ? (
              <div className="space-y-1.5">
                <h2 className="text-lg font-extrabold tracking-tight">
                  {selectedStudentTask === 'MBG'
                    ? 'MBG (Makanan Bergizi Gratis)'
                    : selectedStudentTask === 'Nyapu & Pel'
                    ? 'Nyapu & Pel Kelas'
                    : 'Helper / Koordinator'}
                </h2>
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-white/20 text-blue-50 backdrop-blur-xs">
                    {selectedStudentTask === 'MBG'
                      ? 'Pukul 07:00 - 09:00 WIB'
                      : selectedStudentTask === 'Nyapu & Pel'
                      ? 'Pukul 15:00 - 16:30 WIB'
                      : 'Pukul 07:00 - 16:30 WIB'}
                  </span>

                  {selectedStudentLog ? (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                        selectedStudentLog.status === 'excused'
                          ? 'bg-blue-100 text-blue-900'
                          : selectedStudentLog.status === 'verified'
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-white text-blue-900'
                      }`}
                    >
                      {selectedStudentLog.status === 'excused' ? (
                        <HeartHandshake className="w-3 h-3 text-blue-600" />
                      ) : (
                        <Check className="w-3 h-3 text-emerald-600" />
                      )}
                      <span>
                        {selectedStudentLog.status === 'verified'
                          ? 'Terverifikasi'
                          : selectedStudentLog.status === 'excused'
                          ? 'Sakit / Izin'
                          : 'Pending'}
                      </span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-400/30 text-amber-100 border border-amber-300/30">
                      Belum Upload Bukti
                    </span>
                  )}
                </div>

                {!isSelectedStudentDutyToday && (
                  <p className="text-[11px] text-blue-200 pt-1 leading-snug">
                    * Hari piket tetap kamu adalah {DAY_NAMES[selectedStudent.dayOfWeek]}.
                  </p>
                )}
              </div>
            ) : (
              <div className="py-2 text-center text-blue-100 text-xs">
                Pilih nama kamu di atas untuk melihat penugasan tugas piket spesifik minggu ini.
              </div>
            )}
          </div>

          {/* Section: Jadwal Piket Hari Ini (Mobile Card List - NO horizontal scroll) */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Jadwal Piket Hari Ini
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {DAY_NAMES[activeDutyDay]} — {todayStudents.length} Siswa Bertugas
                </p>
              </div>
              <Link
                href="/jadwal"
                className="inline-flex items-center gap-0.5 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                <span>Lihat Semua</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Mobile Vertical Row Items */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {loading ? (
                <div className="py-8 text-center text-xs text-slate-400 animate-pulse">
                  Memuat data jadwal piket...
                </div>
              ) : todayStudents.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Tidak ada jadwal piket hari ini.
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
                  const isVerified = log?.status === 'verified';
                  const isPending = log?.status === 'pending';
                  const isExcused = log?.status === 'excused';
                  const isSelected = selectedStudentId === student.id;

                  return (
                    <div
                      key={student.id}
                      onClick={() => handleSelectStudent(student.id)}
                      className={`p-3.5 flex items-center justify-between gap-2.5 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/70 dark:bg-blue-950/40'
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Number Circle */}
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {idx + 1}
                        </div>

                        {/* Name and Task */}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {student.name}
                          </p>
                          <div className="mt-0.5">
                            <TaskBadge task={taskName} size="sm" />
                          </div>
                        </div>
                      </div>

                      {/* Right status icon / button */}
                      <div className="shrink-0 flex items-center gap-1.5">
                        {isVerified ? (
                          <div
                            className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"
                            title="Terverifikasi"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        ) : isExcused ? (
                          <div
                            className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-bold flex items-center gap-1"
                            title={log?.rejectionReason || 'Sakit / Izin Resmi'}
                          >
                            <HeartHandshake className="w-3.5 h-3.5" />
                            <span>Izin</span>
                          </div>
                        ) : isPending ? (
                          <div
                            className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center"
                            title="Pending Verifikasi"
                          >
                            <Clock className="w-4 h-4" />
                          </div>
                        ) : (
                          <Link
                            href={`/unggah?studentId=${student.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-[11px] font-semibold hover:bg-blue-100 transition-colors"
                          >
                            Upload
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Mobile Quick Feature Cards (Compact 2x2) */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <h4 className="text-[11px] font-bold text-slate-900 dark:text-white">Rotasi Otomatis</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                Berganti adil tiap minggu kalender ISO.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="w-6 h-6 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
                <Cpu className="w-3.5 h-3.5" />
              </div>
              <h4 className="text-[11px] font-bold text-slate-900 dark:text-white">AI Gemini Check</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                Deteksi otomatis objek kebersihan foto.
              </p>
            </div>
          </div>

          {/* Sticky Bottom Action Button for Mobile — Direct One-Tap Upload */}
          <div className="sticky bottom-0 z-30 pt-2 pb-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 -mx-3 px-3 shadow-lg">
            <Link
              href={selectedStudent ? `/unggah?studentId=${selectedStudent.id}` : '/unggah'}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 active:scale-[0.99] transition-all"
            >
              <Camera className="w-4 h-4" />
              <span>
                {selectedStudent
                  ? `Upload Foto Bukti (${selectedStudent.name.split(' ')[0]})`
                  : 'Upload Foto Bukti Piket'}
              </span>
            </Link>
          </div>
        </div>


        {/* ============================================================== */}
        {/* DESKTOP VIEW (hidden lg:block) — Comprehensive SaaS Dashboard   */}
        {/* ============================================================== */}
        <div className="hidden lg:block space-y-8 min-w-0">
          {/* Top Hero Section matching Showcase Branding */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white p-8 shadow-lg shadow-blue-500/10">
            <div className="absolute right-0 top-0 -mt-10 -mr-10 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10 max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-medium border border-white/20">
                <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                <span>Sistem Manajemen Piket Terpadu Kelas 10 SIJA B</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight leading-tight">
                Piket Kelas Jadi Lebih Mudah, Teratur, dan Transparan
              </h1>
              <p className="text-blue-100 text-sm leading-relaxed max-w-2xl">
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
          <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
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
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {formattedDate}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-300">
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
          <div className="grid grid-cols-3 gap-8 min-w-0">
            {/* Left Column: Student Self-Identification & Action Card */}
            <div className="col-span-1 space-y-6">
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
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
                      onChange={(e) => handleSelectStudent(e.target.value)}
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
                      {selectedStudentLog?.status === 'excused' ? (
                        <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-300 space-y-1">
                          <p className="font-bold flex items-center gap-1.5">
                            <HeartHandshake className="w-4 h-4 text-blue-600" />
                            <span>Dispensasi Kehadiran Diterima</span>
                          </p>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400">
                            Kamu resmi tercatat <b>{selectedStudentLog.rejectionReason || 'Sakit / Izin'}</b> oleh admin. Tidak perlu mengunggah foto bukti piket hari ini.
                          </p>
                        </div>
                      ) : (
                        <Link
                          href={`/unggah?studentId=${selectedStudent.id}`}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-all"
                        >
                          <UploadCloud className="w-4 h-4" />
                          <span>{selectedStudentLog ? 'Ajukan Ulang / Cek Foto' : 'Upload Foto Bukti Piket'}</span>
                        </Link>
                      )}
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

            {/* Right Column: Today's Cleaning Duty Table */}
            <div className="col-span-2 space-y-6 min-w-0">
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
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
                <div className="overflow-x-auto min-w-0 w-full">
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
              <div className="grid grid-cols-4 gap-4">
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
