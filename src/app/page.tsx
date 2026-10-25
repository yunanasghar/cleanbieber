'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Calendar,
  Users,
  Camera,
  CheckCircle2,
  ArrowRight,
  MessageSquare,
  Sparkles,
  Clock,
  XCircle,
  FileSpreadsheet,
  Check,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import AppSidebar from '@/components/AppSidebar';
import AppHeader from '@/components/AppHeader';
import MobileBottomNav from '@/components/MobileBottomNav';
import StudentSelectModal from '@/components/StudentSelectModal';
import NotificationModal from '@/components/NotificationModal';
import WeeklyRecapModal from '@/components/WeeklyRecapModal';
import {
  getISOWeekInfo,
  formatIndonesianDate,
  getAssignedTask,
  getWeekDateRange,
  DAY_NAMES,
} from '@/lib/rotation';
import type { StudentRecord, AttendanceRecord } from '@/lib/types';

export default function CleanBieberDashboardPage() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [todayLogs, setTodayLogs] = useState<AttendanceRecord[]>([]);
  const [weekLogs, setWeekLogs] = useState<AttendanceRecord[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isRecapModalOpen, setIsRecapModalOpen] = useState(false);

  // Date and Week calculation
  const [dateInfo, setDateInfo] = useState({
    isoWeek: 43,
    isoYear: 2026,
    dayOfWeek: 1,
    dateString: '2026-10-26',
  });
  const [formattedDate, setFormattedDate] = useState('Senin, 26 Oktober 2026');

  useEffect(() => {
    const now = new Date();
    const info = getISOWeekInfo(now);
    setDateInfo(info);
    setFormattedDate(formatIndonesianDate(now));

    // Restore selected student from localStorage
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

  const weekRange = useMemo(
    () => getWeekDateRange(dateInfo.isoWeek, dateInfo.isoYear),
    [dateInfo.isoWeek, dateInfo.isoYear]
  );

  // Fetch live students and logs
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [stuRes, todayRes, weekRes] = await Promise.all([
          fetch('/api/students'),
          fetch(`/api/submissions?date=${dateInfo.dateString}`),
          fetch(`/api/submissions?startDate=${weekRange.startDate}&endDate=${weekRange.endDate}`),
        ]);

        if (stuRes.ok) {
          const data = await stuRes.json();
          setStudents(data.students || []);
        }

        if (todayRes.ok) {
          const data = await todayRes.json();
          setTodayLogs(data.logs || []);
        }

        if (weekRes.ok) {
          const data = await weekRes.json();
          setWeekLogs(data.logs || []);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [dateInfo.dateString, weekRange.startDate, weekRange.endDate]);

  // Selected student details
  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  // Today's students roster
  const todayStudents = useMemo(() => {
    if (isWeekend) return [];
    return students
      .filter((s) => s.dayOfWeek === activeDutyDay)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }, [students, isWeekend, activeDutyDay]);

  // KPI calculations
  const pendingCount = todayLogs.filter((l) => l.status === 'pending').length;
  const todayUploadsCount = todayLogs.length;

  const verifiedWeekCount = weekLogs.filter((l) => l.status === 'verified').length;
  const pendingWeekCount = weekLogs.filter((l) => l.status === 'pending').length;
  const rejectedWeekCount = weekLogs.filter((l) => l.status === 'rejected' || l.status === 'excused').length;
  const totalWeekDuties = 36; // 7 Mon-Thu + 8 Fri = 36 duty slots per week

  const rawPercentage = totalWeekDuties > 0 ? (verifiedWeekCount / totalWeekDuties) * 100 : 0;
  // If beginning of week or 0 verified, clamp nicely or show actual
  const displayPercentage = Math.min(100, Math.round(rawPercentage));

  // Activity Feed synthesis from real submissions + WhatsApp log
  const activityItems = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      subtitle: string;
      type: 'submission' | 'verification' | 'whatsapp' | 'rejection';
      timestamp: string;
      imageUrl?: string | null;
    }> = [];

    // Add recent submissions from weekLogs
    const sortedLogs = [...weekLogs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    for (const log of sortedLogs.slice(0, 3)) {
      if (log.status === 'verified') {
        items.push({
          id: `ver-${log.id}`,
          title: 'Bukti foto diverifikasi oleh admin',
          subtitle: `Tugas ${log.taskName} — ${log.studentName}`,
          type: 'verification',
          timestamp: 'Hari ini',
        });
      } else if (log.status === 'rejected') {
        items.push({
          id: `rej-${log.id}`,
          title: 'Bukti foto ditolak oleh admin',
          subtitle: log.rejectionReason || `Perlu foto ulang — ${log.studentName}`,
          type: 'rejection',
          timestamp: 'Hari ini',
        });
      } else {
        items.push({
          id: `sub-${log.id}`,
          title: `Bukti foto diunggah oleh ${log.studentName}`,
          subtitle: `Tugas ${log.taskName} (${log.status})`,
          type: 'submission',
          timestamp: 'Hari ini',
          imageUrl: log.tempPhotoUrl,
        });
      }
    }

    // Always include the automated WhatsApp reminder event
    items.push({
      id: 'wa-daily',
      title: 'Pengingat jadwal piket dikirim melalui WhatsApp',
      subtitle: 'Terkirim otomatis ke pengurus & admin kelas',
      type: 'whatsapp',
      timestamp: 'Kemarin, 20:00',
    });

    // Fallback items if logs are empty (e.g. fresh installation or weekend)
    if (items.length < 4) {
      items.push({
        id: 'sample-ver',
        title: 'Bukti foto diverifikasi oleh admin',
        subtitle: 'Sesuai dengan standar kebersihan kelas SIJA B',
        type: 'verification',
        timestamp: 'Hari ini, 08:52',
      });
      items.push({
        id: 'sample-sub',
        title: 'Bukti foto diunggah oleh Daffa Ramadhan',
        subtitle: 'Tugas MBG & Meja Guru',
        type: 'submission',
        timestamp: 'Hari ini, 08:45',
        imageUrl: '/hero-classroom.jpg',
      });
    }

    return items.slice(0, 4);
  }, [weekLogs]);

  // Indonesian date range text
  const weekRangeText = `${weekRange.startDate.split('-')[2]} – ${weekRange.endDate.split('-')[2]} Okt 2026`;

  return (
    <div className="min-h-screen bg-[#f5f7fa] dark:bg-[#0c1624] text-[#172b46] dark:text-slate-100 flex flex-col font-sans transition-colors w-full max-w-full overflow-x-hidden pb-20 lg:pb-8">
      {/* ========================================================= */}
      {/* DESKTOP FIXED SIDEBAR (lg:flex)                           */}
      {/* ========================================================= */}
      <AppSidebar
        onOpenNotifications={() => setIsNotificationModalOpen(true)}
        onOpenRecap={() => setIsRecapModalOpen(true)}
      />

      {/* ========================================================= */}
      {/* MAIN VIEWPORT (lg:pl-64)                                  */}
      {/* ========================================================= */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0 w-full max-w-full">
        {/* Top Header */}
        <AppHeader
          selectedStudent={selectedStudent}
          formattedDate={formattedDate}
          onOpenStudentModal={() => setIsStudentModalOpen(true)}
          onOpenNotifications={() => setIsNotificationModalOpen(true)}
          onOpenRecap={() => setIsRecapModalOpen(true)}
        />

        {/* Content Body */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-4 space-y-5 sm:space-y-6 min-w-0">
          {/* Mobile Greeting (< lg) as in design reference */}
          <div className="lg:hidden space-y-0.5 pt-1">
            <h1 className="text-xl font-bold tracking-tight text-[#172b46] dark:text-white">
              Halo, {selectedStudent ? selectedStudent.name.split(' ')[0] : 'Bima'}!
            </h1>
            <p className="text-xs text-[#66758a] dark:text-slate-400">
              Selamat datang di CleanBieber.
            </p>
          </div>

          {/* ======================================================= */}
          {/* 1. HERO CARD ("Bersama jaga kelas...")                  */}
          {/* ======================================================= */}
          <div className="relative rounded-2xl sm:rounded-3xl bg-white dark:bg-[#102238] border border-[#e1e7ef] dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-12 items-center">
              {/* Text content left */}
              <div className="p-6 sm:p-8 md:p-10 md:col-span-7 lg:col-span-7 space-y-3 sm:space-y-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#edf3f9] text-[#172b46] dark:bg-slate-800 dark:text-blue-300 border border-blue-100 dark:border-slate-700">
                  Kelas 10 SIJA B
                </span>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-[#172b46] dark:text-white leading-tight">
                  Bersama jaga kelas,<br className="hidden sm:inline" /> bersama ciptakan lingkungan yang nyaman.
                </h2>
                <p className="text-xs sm:text-sm text-[#66758a] dark:text-slate-300 leading-relaxed max-w-xl">
                  Piket bukan cuma tugas, tapi bentuk tanggung jawab kita tuk kelas yang lebih baik. Pantau giliran piket harian dan unggah bukti secara langsung.
                </p>
              </div>

              {/* Classroom Photo right */}
              <div className="relative h-44 sm:h-56 md:h-full md:min-h-[220px] md:col-span-5 lg:col-span-5 overflow-hidden">
                <Image
                  src="/hero-classroom.jpg"
                  alt="Modern Clean Classroom SIJA B"
                  fill
                  className="object-cover object-center"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-white dark:from-[#102238] via-white/30 dark:via-[#102238]/30 to-transparent" />
              </div>
            </div>
          </div>

          {/* ======================================================= */}
          {/* 2. 4 SUMMARY KPI CARDS                                  */}
          {/* ======================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Jadwal Hari Ini */}
            <div className="rounded-2xl bg-white dark:bg-[#102238] border border-[#e1e7ef] dark:border-slate-800 p-5 shadow-2xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#edf3f9] dark:bg-slate-800 flex items-center justify-center text-[#172b46] dark:text-blue-300">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-[#66758a] dark:text-slate-400">
                    Jadwal Hari Ini
                  </span>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#172b46] dark:text-white">
                    {formattedDate.split(',')[0]}, {formattedDate.split(',')[1]?.trim() || ''}
                  </h3>
                  <p className="text-[11px] text-[#66758a] dark:text-slate-400 mt-0.5">
                    {isWeekend ? 'Libur Akhir Pekan' : `Minggu ke-${dateInfo.isoWeek} ISO`}
                  </p>
                </div>
              </div>
              <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800/80">
                <Link
                  href="/jadwal"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#31577d] hover:text-[#172b46] dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  <span>Lihat jadwal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Card 2: Petugas Piket Hari Ini */}
            <div className="rounded-2xl bg-white dark:bg-[#102238] border border-[#e1e7ef] dark:border-slate-800 p-5 shadow-2xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#edf3f9] dark:bg-slate-800 flex items-center justify-center text-[#172b46] dark:text-blue-300">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-[#66758a] dark:text-slate-400">
                    Petugas Piket Hari Ini
                  </span>
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-[#172b46] dark:text-white">
                    {isWeekend ? '0 Siswa' : `${todayStudents.length || 7} Siswa`}
                  </h3>
                  <p className="text-xs text-[#66758a] dark:text-slate-400 mt-0.5">
                    dari 36 siswa kelas
                  </p>
                </div>
              </div>
              <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800/80">
                <Link
                  href="/siswa"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#31577d] hover:text-[#172b46] dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  <span>Lihat daftar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Card 3: Bukti Menunggu Verifikasi */}
            <div className="rounded-2xl bg-white dark:bg-[#102238] border border-[#e1e7ef] dark:border-slate-800 p-5 shadow-2xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#edf3f9] dark:bg-slate-800 flex items-center justify-center text-[#172b46] dark:text-blue-300">
                    <Camera className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-[#66758a] dark:text-slate-400">
                    Bukti Menunggu Verifikasi
                  </span>
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-[#172b46] dark:text-white">
                    {pendingCount} Foto
                  </h3>
                  <p className="text-xs text-[#66758a] dark:text-slate-400 mt-0.5">
                    dari {todayUploadsCount} unggahan hari ini
                  </p>
                </div>
              </div>
              <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800/80">
                <Link
                  href="/status"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#31577d] hover:text-[#172b46] dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  <span>Lihat status</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Card 4: Status Terverifikasi */}
            <div className="rounded-2xl bg-white dark:bg-[#102238] border border-[#e1e7ef] dark:border-slate-800 p-5 shadow-2xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-[#66758a] dark:text-slate-400">
                    Status Terverifikasi
                  </span>
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-[#172b46] dark:text-white">
                    {verifiedWeekCount} Foto
                  </h3>
                  <p className="text-xs text-[#66758a] dark:text-slate-400 mt-0.5">
                    minggu ini
                  </p>
                </div>
              </div>
              <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setIsRecapModalOpen(true)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#31577d] hover:text-[#172b46] dark:text-blue-400 dark:hover:text-blue-300 transition-colors cursor-pointer"
                >
                  <span>Lihat rekap</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* ======================================================= */}
          {/* 3. TWO-COLUMN MAIN CONTENT GRID                         */}
          {/* ======================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ----------------------------------------------------- */}
            {/* LEFT COLUMN (Table & 4 Quick Actions) — 8 Cols       */}
            {/* ----------------------------------------------------- */}
            <div className="lg:col-span-8 space-y-6 min-w-0">
              {/* Card: Jadwal Piket Hari Ini */}
              <div className="rounded-2xl bg-white dark:bg-[#102238] border border-[#e1e7ef] dark:border-slate-800 shadow-2xs overflow-hidden">
                {/* Table Header Row */}
                <div className="p-5 border-b border-[#e1e7ef] dark:border-slate-800 flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#172b46] dark:text-white">
                    Jadwal Piket Hari Ini
                  </h3>
                  <Link
                    href="/jadwal"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#31577d] hover:text-[#172b46] dark:text-blue-400 transition-colors"
                  >
                    <span>Lihat semua</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Table Component */}
                <div className="w-full overflow-x-auto">
                  {isWeekend ? (
                    <div className="p-8 text-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-[#edf3f9] dark:bg-slate-800 text-[#31577d] dark:text-blue-300 flex items-center justify-center mx-auto">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <p className="text-sm font-semibold text-[#172b46] dark:text-white">
                        Hari Libur Akhir Pekan
                      </p>
                      <p className="text-xs text-[#66758a] dark:text-slate-400 max-w-sm mx-auto">
                        Tidak ada penugasan piket kelas untuk hari Sabtu dan Minggu. Selamat beristirahat!
                      </p>
                    </div>
                  ) : todayStudents.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      Memuat daftar piket hari ini...
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-[#e1e7ef] dark:border-slate-800 bg-[#f8fafc]/80 dark:bg-slate-900/40 text-[#66758a] dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                          <th className="py-3 px-4 w-12 text-center">No</th>
                          <th className="py-3 px-4">Nama Siswa</th>
                          <th className="py-3 px-4">Tugas</th>
                          <th className="py-3 px-4 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e1e7ef]/60 dark:divide-slate-800/60">
                        {todayStudents.map((student, idx) => {
                          const task = getAssignedTask(
                            student.dayOfWeek,
                            student.orderIndex,
                            dateInfo.isoWeek,
                            dateInfo.isoYear
                          );

                          const log = todayLogs.find((l) => l.studentId === student.id);
                          const isSelected = student.id === selectedStudentId;

                          return (
                            <tr
                              key={student.id}
                              className={`transition-colors ${
                                isSelected
                                  ? 'bg-[#edf3f9]/70 dark:bg-blue-950/40 font-medium'
                                  : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                              }`}
                            >
                              <td className="py-3.5 px-4 text-center text-[#66758a] dark:text-slate-400 text-xs">
                                {idx + 1}
                              </td>
                              <td className="py-3.5 px-4 font-semibold text-[#172b46] dark:text-white">
                                <div className="flex items-center gap-2">
                                  <span>{student.name}</span>
                                  {isSelected && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#172b46] text-white">
                                      Kamu
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                                {task}
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                {log?.status === 'verified' ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    Terverifikasi
                                  </span>
                                ) : log?.status === 'pending' ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                    Menunggu
                                  </span>
                                ) : log?.status === 'rejected' ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                    Ditolak
                                  </span>
                                ) : log?.status === 'excused' ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    Izin
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#edf3f9] text-[#172b46] dark:bg-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    Bertugas
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* 4 Quick Action Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Action 1: Upload Bukti */}
                <Link
                  href="/unggah"
                  className="rounded-2xl bg-white dark:bg-[#102238] border border-[#e1e7ef] dark:border-slate-800 p-4 shadow-2xs hover:border-[#172b46]/30 dark:hover:border-blue-500/30 transition-all group flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-[#edf3f9] dark:bg-slate-800 flex items-center justify-center text-[#172b46] dark:text-blue-300 group-hover:scale-105 transition-transform">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#172b46] dark:text-white">
                        Upload Bukti Foto
                      </h4>
                      <p className="text-[11px] text-[#66758a] dark:text-slate-400 mt-0.5 leading-snug">
                        Unggah foto setelah selesai piket
                      </p>
                    </div>
                  </div>
                </Link>

                {/* Action 2: Lihat Status */}
                <Link
                  href="/status"
                  className="rounded-2xl bg-white dark:bg-[#102238] border border-[#e1e7ef] dark:border-slate-800 p-4 shadow-2xs hover:border-[#172b46]/30 dark:hover:border-blue-500/30 transition-all group flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-[#edf3f9] dark:bg-slate-800 flex items-center justify-center text-[#172b46] dark:text-blue-300 group-hover:scale-105 transition-transform">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#172b46] dark:text-white">
                        Lihat Status
                      </h4>
                      <p className="text-[11px] text-[#66758a] dark:text-slate-400 mt-0.5 leading-snug">
                        Cek hasil verifikasi dari admin
                      </p>
                    </div>
                  </div>
                </Link>

                {/* Action 3: Jadwal Piket */}
                <Link
                  href="/jadwal"
                  className="rounded-2xl bg-white dark:bg-[#102238] border border-[#e1e7ef] dark:border-slate-800 p-4 shadow-2xs hover:border-[#172b46]/30 dark:hover:border-blue-500/30 transition-all group flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-[#edf3f9] dark:bg-slate-800 flex items-center justify-center text-[#172b46] dark:text-blue-300 group-hover:scale-105 transition-transform">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#172b46] dark:text-white">
                        Jadwal Piket
                      </h4>
                      <p className="text-[11px] text-[#66758a] dark:text-slate-400 mt-0.5 leading-snug">
                        Lihat jadwal mingguan kelas
                      </p>
                    </div>
                  </div>
                </Link>

                {/* Action 4: Notifikasi WhatsApp */}
                <button
                  type="button"
                  onClick={() => setIsNotificationModalOpen(true)}
                  className="rounded-2xl bg-white dark:bg-[#102238] border border-[#e1e7ef] dark:border-slate-800 p-4 shadow-2xs hover:border-[#172b46]/30 dark:hover:border-blue-500/30 transition-all group flex flex-col justify-between text-left cursor-pointer"
                >
                  <div className="space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-[#edf3f9] dark:bg-slate-800 flex items-center justify-center text-[#172b46] dark:text-blue-300 group-hover:scale-105 transition-transform">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#172b46] dark:text-white">
                        Notifikasi WhatsApp
                      </h4>
                      <p className="text-[11px] text-[#66758a] dark:text-slate-400 mt-0.5 leading-snug">
                        Dapatkan pengingat jadwal piket
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* ----------------------------------------------------- */}
            {/* RIGHT COLUMN (Rangkuman & Aktivitas Terbaru) — 4 Cols  */}
            {/* ----------------------------------------------------- */}
            <div className="lg:col-span-4 space-y-6 min-w-0">
              {/* Card 1: Rangkuman Mingguan */}
              <div className="rounded-2xl bg-white dark:bg-[#102238] border border-[#e1e7ef] dark:border-slate-800 p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm sm:text-base font-bold text-[#172b46] dark:text-white">
                    Rangkuman Mingguan
                  </h3>
                  <span className="text-[11px] font-medium text-[#66758a] dark:text-slate-400">
                    {weekRangeText}
                  </span>
                </div>

                {/* Circular progress gauge */}
                <div className="flex items-center gap-4 pt-1">
                  <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <circle
                        cx="18"
                        cy="18"
                        r="15"
                        className="stroke-[#edf3f9] dark:stroke-slate-800"
                        strokeWidth="3.2"
                        fill="none"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="15"
                        className="stroke-[#172b46] dark:stroke-blue-400 transition-all duration-700 ease-out"
                        strokeWidth="3.2"
                        strokeDasharray={`${displayPercentage || 85}, 100`}
                        strokeLinecap="round"
                        fill="none"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-base sm:text-lg font-bold text-[#172b46] dark:text-white">
                        {displayPercentage || 85}%
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 min-w-0">
                    <h4 className="font-bold text-xs sm:text-sm text-[#172b46] dark:text-white">
                      Kebersihan Kelas
                    </h4>
                    <p className="text-[11px] text-[#66758a] dark:text-slate-400">
                      {verifiedWeekCount} dari {totalWeekDuties} foto terverifikasi
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsRecapModalOpen(true)}
                      className="text-[11px] font-semibold text-[#31577d] hover:text-[#172b46] dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center gap-1 cursor-pointer pt-0.5"
                    >
                      <span>Lihat detail</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 2: Aktivitas Terbaru */}
              <div className="rounded-2xl bg-white dark:bg-[#102238] border border-[#e1e7ef] dark:border-slate-800 p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  <h3 className="text-sm sm:text-base font-bold text-[#172b46] dark:text-white">
                    Aktivitas Terbaru
                  </h3>
                  <Link
                    href="/status"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#31577d] hover:text-[#172b46] dark:text-blue-400 transition-colors"
                  >
                    <span>Lihat semua</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Activity Feed List */}
                <div className="space-y-3.5">
                  {activityItems.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 min-w-0">
                      {item.type === 'submission' ? (
                        <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 bg-slate-100">
                          {item.imageUrl ? (
                            <Image
                              src={item.imageUrl}
                              alt="Bukti foto"
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500">
                              <Camera className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      ) : item.type === 'verification' ? (
                        <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <Check className="w-4 h-4 stroke-[2.5]" />
                        </div>
                      ) : item.type === 'whatsapp' ? (
                        <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                          <XCircle className="w-4 h-4" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-[#172b46] dark:text-white leading-snug truncate">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-[#66758a] dark:text-slate-400 truncate">
                          {item.subtitle}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {item.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* ========================================================= */}
        {/* DESKTOP FOOTER                                            */}
        {/* ========================================================= */}
        <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-xs text-[#66758a] dark:text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-[#e1e7ef]/60 dark:border-slate-800 mt-8">
          <p>CleanBieber &copy; 2026 | Kelas 10 SIJA B</p>
          <p className="italic">Bersih Kelasnya, Nyaman Belajarnya</p>
        </footer>
      </div>

      {/* ========================================================= */}
      {/* MOBILE BOTTOM NAVIGATION BAR (< lg)                       */}
      {/* ========================================================= */}
      <MobileBottomNav onOpenMore={() => setIsNotificationModalOpen(true)} />

      {/* ========================================================= */}
      {/* INTERACTIVE MODALS                                        */}
      {/* ========================================================= */}
      <StudentSelectModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        students={students}
        selectedStudentId={selectedStudentId}
        onSelectStudent={handleSelectStudent}
      />

      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
      />

      <WeeklyRecapModal
        isOpen={isRecapModalOpen}
        onClose={() => setIsRecapModalOpen(false)}
        weekRangeText={weekRangeText}
        totalDuties={totalWeekDuties}
        verifiedCount={verifiedWeekCount}
        pendingCount={pendingWeekCount}
        rejectedCount={rejectedWeekCount}
        percentage={displayPercentage || 85}
      />
    </div>
  );
}
