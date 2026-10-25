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
import AppShell from '@/components/AppShell';
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
  const [mobileDayFilter, setMobileDayFilter] = useState<number | 'all'>('all');

  useEffect(() => {
    const info = getISOWeekInfo(new Date());
    setSelectedWeek(info.isoWeek);
    setSelectedYear(info.isoYear);
    setCurrentWeek(info.isoWeek);
    const day = info.dayOfWeek > 5 ? 1 : info.dayOfWeek;
    setCurrentDay(day);
    setMobileDayFilter(day);
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

  const weekdays = [1, 2, 3, 4, 5];
  const displayedDays = mobileDayFilter === 'all' ? weekdays : [mobileDayFilter];

  return (
    <AppShell
      pageTitle="Jadwal Piket Mingguan"
      pageSubtitle="Rotasi tugas otomatis berganti secara adil setiap minggu kalender ISO."
    >
      <div className="space-y-6 min-w-0">
        {/* Controls Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#102238] border border-[#e1e7ef] dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#edf3f9] text-[#172b46] dark:bg-slate-800 dark:text-blue-300 border border-blue-100 dark:border-slate-700">
                Kelas 10 SIJA B
              </span>
              <span className="text-xs text-[#66758a] dark:text-slate-400">Total 36 Siswa</span>
            </div>
            <p className="text-xs text-[#66758a] dark:text-slate-400 mt-1">
              Pilih minggu kalender untuk melihat rotasi pembagian tugas MBG, Nyapu, dan Helper.
            </p>
          </div>

          {/* Week Selector Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleResetCurrentWeek}
              className="px-3 py-2 rounded-xl text-slate-600 hover:text-[#172b46] hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 border border-[#e1e7ef] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs transition-colors"
              title="Kembali ke minggu saat ini"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Minggu Ini</span>
            </button>

            <div className="flex items-center bg-white dark:bg-slate-900 border border-[#e1e7ef] dark:border-slate-800 rounded-xl p-1 shadow-2xs">
              <button
                onClick={handlePrevWeek}
                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                aria-label="Previous week"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-3 text-center min-w-[130px]">
                <span className="text-xs font-bold text-[#172b46] dark:text-white block">
                  Minggu ke-{selectedWeek}, {selectedYear}
                </span>
                <span className="text-[10px] text-[#66758a] dark:text-slate-400 block font-medium">
                  {weekRange.label}
                </span>
              </div>
              <button
                onClick={handleNextWeek}
                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                aria-label="Next week"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Day Selector Tabs (md:hidden) */}
        <div className="md:hidden flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => setMobileDayFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
              mobileDayFilter === 'all'
                ? 'bg-[#172b46] text-white'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
          >
            Semua Hari
          </button>
          {weekdays.map((d) => (
            <button
              key={d}
              onClick={() => setMobileDayFilter(d)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors shrink-0 flex items-center gap-1 ${
                mobileDayFilter === d
                  ? 'bg-[#172b46] text-white'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <span>{DAY_NAMES[d]}</span>
              {currentDay === d && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              )}
            </button>
          ))}
        </div>

        {/* 5-Column Grid on Desktop, Filterable on Mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 min-w-0">
          {(mobileDayFilter === 'all' ? weekdays : displayedDays).map((day) => {
            const dayStudents = students
              .filter((s) => s.dayOfWeek === day)
              .sort((a, b) => a.orderIndex - b.orderIndex);

            const isCurrentDay = currentDay === day && selectedWeek === currentWeek;

            return (
              <div
                key={day}
                className={`rounded-2xl border transition-all flex flex-col bg-white dark:bg-[#102238] shadow-2xs min-w-0 overflow-hidden ${
                  isCurrentDay
                    ? 'border-[#172b46] dark:border-blue-400 ring-2 ring-[#172b46]/10 dark:ring-blue-500/20'
                    : 'border-[#e1e7ef] dark:border-slate-800'
                }`}
              >
                {/* Day Header */}
                <div
                  className={`p-4 border-b flex items-center justify-between ${
                    isCurrentDay
                      ? 'bg-[#edf3f9] dark:bg-blue-950/40 border-blue-100 dark:border-blue-900/60'
                      : 'bg-[#f8fafc] dark:bg-slate-900/40 border-[#e1e7ef] dark:border-slate-800'
                  }`}
                >
                  <div>
                    <h3 className="font-bold text-sm text-[#172b46] dark:text-white flex items-center gap-1.5">
                      <span>{DAY_NAMES[day]}</span>
                      {isCurrentDay && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#172b46] text-white">
                          Hari Ini
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-[#66758a] dark:text-slate-400 mt-0.5">
                      {dayStudents.length} siswa bertugas
                    </p>
                  </div>
                </div>

                {/* Student Cards in Column */}
                <div className="p-3 space-y-2 flex-1 min-w-0">
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
                          className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-[#edf3f9]/50 transition-colors space-y-1 min-w-0"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-bold text-slate-400 shrink-0">
                              #{idx + 1}
                            </span>
                            <TaskBadge task={task} size="sm" />
                          </div>
                          <span className="font-semibold text-xs text-[#172b46] dark:text-slate-100 block truncate">
                            {student.name}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Bottom Upload action for this day */}
                <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-[#f8fafc]/50 dark:bg-slate-900/30">
                  <Link
                    href={`/unggah?studentId=${dayStudents[0]?.id || ''}`}
                    className="w-full py-1.5 px-2 rounded-xl text-center text-[11px] font-semibold text-[#31577d] hover:text-[#172b46] dark:text-blue-400 block hover:bg-[#edf3f9] dark:hover:bg-slate-800 transition-colors"
                  >
                    Unggah Bukti Hari {DAY_NAMES[day]} &rarr;
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend block */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#102238] border border-[#e1e7ef] dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs min-w-0">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-bold text-[#172b46] dark:text-slate-300">Penugasan:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-[#66758a] dark:text-slate-400 font-medium">MBG (Pagi)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
              <span className="text-[#66758a] dark:text-slate-400 font-medium">Nyapu (Sore)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
              <span className="text-[#66758a] dark:text-slate-400 font-medium">Helper (Koordinator)</span>
            </div>
          </div>

          <Link
            href="/unggah"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#172b46] hover:bg-[#203656] text-white font-medium text-xs transition-colors shrink-0 shadow-2xs"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload Foto Piket</span>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
