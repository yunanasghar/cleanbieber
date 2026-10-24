'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  UploadCloud,
  Users,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import PublicNavbar from '@/components/PublicNavbar';
import TaskBadge from '@/components/TaskBadge';
import { getISOWeekInfo, getWeekDateRange, getAssignedTask, DAY_NAMES } from '@/lib/rotation';
import type { StudentRecord } from '@/lib/types';

export default function WeeklySchedulePage() {
  const [selectedWeek, setSelectedWeek] = useState(18);
  const [selectedYear, setSelectedYear] = useState(2025);
  const [currentWeek, setCurrentWeek] = useState(18);
  const [currentDay, setCurrentDay] = useState(1);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const info = getISOWeekInfo(new Date());
    setSelectedWeek(info.isoWeek);
    setSelectedYear(info.isoYear);
    setCurrentWeek(info.isoWeek);
    setCurrentDay(info.dayOfWeek);
  }, []);

  const weekRange = getWeekDateRange(selectedWeek, selectedYear);

  useEffect(() => {
    async function fetchStudents() {
      try {
        setLoading(true);
        const res = await fetch('/api/students');
        if (res.ok) {
          const data = await res.json();
          setStudents(data.students || []);
        }
      } catch (e) {
        console.error('Error fetching students:', e);
      } finally {
        setLoading(false);
      }
    }

    fetchStudents();
  }, []);

  const handlePrevWeek = () => {
    if (selectedWeek <= 1) {
      setSelectedWeek(52);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedWeek((w) => w - 1);
    }
  };

  const handleNextWeek = () => {
    if (selectedWeek >= 52) {
      setSelectedWeek(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedWeek((w) => w + 1);
    }
  };

  const handleResetCurrentWeek = () => {
    setSelectedWeek(currentWeek);
  };

  // Group students by dayOfWeek (1 to 5)
  const weekdays = [1, 2, 3, 4, 5];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0b1120] text-slate-900 dark:text-slate-100 transition-colors">
      <PublicNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
                Kelas 10 SIJA B
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Total 36 Siswa</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
              Jadwal Piket Mingguan
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Rotasi tugas otomatis sesuai ISO Calendar Week. Tugas berganti secara adil setiap minggu.
            </p>
          </div>

          {/* Week Selector Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetCurrentWeek}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium flex items-center gap-1 border border-slate-200 dark:border-slate-700"
              title="Kembali ke minggu saat ini"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Minggu Ini</span>
            </button>

            <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-sm">
              <button
                onClick={handlePrevWeek}
                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                aria-label="Previous week"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-3 text-center">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Minggu ke-{selectedWeek}, {selectedYear}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
                  {weekRange.label}
                </span>
              </div>
              <button
                onClick={handleNextWeek}
                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                aria-label="Next week"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 5-Column Grid matching UI Reference */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {weekdays.map((day) => {
            const dayStudents = students
              .filter((s) => s.dayOfWeek === day)
              .sort((a, b) => a.orderIndex - b.orderIndex);

            const isCurrentDay = currentDay === day && selectedWeek === currentWeek;

            return (
              <div
                key={day}
                className={`rounded-2xl border transition-all flex flex-col bg-white dark:bg-slate-900 shadow-sm ${
                  isCurrentDay
                    ? 'border-blue-500 dark:border-blue-500 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Day Header */}
                <div
                  className={`p-3.5 border-b rounded-t-2xl flex items-center justify-between ${
                    isCurrentDay
                      ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800'
                      : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800'
                  }`}
                >
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{DAY_NAMES[day]}</span>
                      {isCurrentDay && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-600 text-white">
                          Hari Ini
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {dayStudents.length} siswa bertugas
                    </p>
                  </div>
                </div>

                {/* Student Cards in Column */}
                <div className="p-3 space-y-2.5 flex-1">
                  {loading ? (
                    <div className="py-8 text-center text-xs text-slate-400 animate-pulse">
                      Memuat jadwal...
                    </div>
                  ) : dayStudents.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">Tidak ada siswa.</div>
                  ) : (
                    dayStudents.map((student, idx) => {
                      const task = getAssignedTask(
                        student.dayOfWeek,
                        student.orderIndex,
                        selectedWeek,
                        selectedYear
                      );

                      return (
                        <div
                          key={student.id}
                          className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400">
                              #{idx + 1}
                            </span>
                            <TaskBadge task={task} size="sm" />
                          </div>
                          <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 block">
                            {student.name}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Bottom Upload action for this day */}
                <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 rounded-b-2xl">
                  <Link
                    href={`/unggah?day=${day}`}
                    className="w-full py-1.5 px-2 rounded-lg text-center text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 block transition-colors"
                  >
                    Unggah Bukti Hari Ini
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend block matching UI Reference */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Keterangan Tugas:</span>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-600 dark:text-slate-400">MBG (Makanan Bergizi Gratis - 4 orang)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-slate-600 dark:text-slate-400">Nyapu & Pel (2-3 orang)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span className="text-slate-600 dark:text-slate-400">Helper (1 orang)</span>
            </div>
          </div>

          <Link
            href="/unggah"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload Foto Piket</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
