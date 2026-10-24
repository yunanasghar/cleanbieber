'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';
import TaskBadge from '@/components/TaskBadge';
import { getISOWeekInfo, getWeekDateRange, getAssignedTask, DAY_NAMES } from '@/lib/rotation';
import type { StudentRecord } from '@/lib/types';

export default function AdminScheduleRotationPage() {
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
      } catch (err) {
        console.error('Error fetching students:', err);
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

  const weekdays = [1, 2, 3, 4, 5];

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto min-w-0 overflow-x-hidden">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Jadwal & Rotasi Tugas
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Inspeksi pembagian tugas piket kelas 10 SIJA B berdasarkan ISO Calendar Week.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedWeek(currentWeek);
            }}
            className="p-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Minggu Ini</span>
          </button>

          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-xs">
            <button
              onClick={handlePrevWeek}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 text-center">
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Minggu ke-{selectedWeek}, {selectedYear}
              </span>
              <span className="text-[10px] text-slate-400 block font-medium">
                {weekRange.label}
              </span>
            </div>
            <button
              onClick={handleNextWeek}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Rotation Notice Banner */}
      <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-900 dark:text-white">
            Algoritma Rotasi Otomatis Bersih:
          </span>{' '}
          Roster hari tetap (Senin–Kamis 7 siswa, Jumat 8 siswa). Komposisi tugas selalu terjaga secara presisi:
          4 siswa MBG, 2-3 siswa Nyapu, dan 1 siswa Helper. Pergeseran offset rotasi dihitung secara deterministik dari nomor minggu ISO.
        </div>
      </div>

      {/* 5-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {weekdays.map((day) => {
          const dayStudents = students
            .filter((s) => s.dayOfWeek === day)
            .sort((a, b) => a.orderIndex - b.orderIndex);

          const isCurrentDay = currentDay === day && selectedWeek === currentWeek;

          return (
            <div
              key={day}
              className={`rounded-2xl border transition-all flex flex-col bg-white dark:bg-slate-900 shadow-xs ${
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

              {/* Student List */}
              <div className="p-3 space-y-2.5 flex-1">
                {loading ? (
                  <div className="py-8 text-center text-xs text-slate-400 animate-pulse">
                    Memuat...
                  </div>
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
                        className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400">
                            Slot #{idx + 1}
                          </span>
                          <TaskBadge task={task} size="sm" />
                        </div>
                        <span className="font-semibold text-xs text-slate-900 dark:text-white block">
                          {student.name}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
