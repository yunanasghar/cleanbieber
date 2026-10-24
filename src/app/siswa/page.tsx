'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Search, Filter, UploadCloud, Calendar, ChevronRight } from 'lucide-react';
import PublicNavbar from '@/components/PublicNavbar';
import TaskBadge from '@/components/TaskBadge';
import { getISOWeekInfo, getAssignedTask, DAY_NAMES } from '@/lib/rotation';
import type { StudentRecord } from '@/lib/types';

export default function StudentDirectoryPage() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [search, setSearch] = useState('');
  const [dayFilter, setDayFilter] = useState<number | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [isoWeek, setIsoWeek] = useState(18);
  const [isoYear, setIsoYear] = useState(2025);

  useEffect(() => {
    const info = getISOWeekInfo(new Date());
    setIsoWeek(info.isoWeek);
    setIsoYear(info.isoYear);
  }, []);

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
        console.error('Error fetching student roster:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStudents();
  }, []);

  const filtered = students.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchesDay = dayFilter === 'all' || s.dayOfWeek === dayFilter;
    return matchesSearch && matchesDay;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0b1120] text-slate-900 dark:text-slate-100 transition-colors w-full max-w-full overflow-x-hidden">
      <PublicNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
                Kelas 10 SIJA B
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Total: 36 Siswa</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
              Daftar Siswa & Hari Piket
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Setiap siswa memiliki hari jadwal tetap dan penugasan yang berotasi otomatis setiap minggunya.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 min-w-0 w-full">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama siswa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 max-w-full shrink-0">
            <button
              onClick={() => setDayFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                dayFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Semua ({students.length})
            </button>
            {[1, 2, 3, 4, 5].map((d) => (
              <button
                key={d}
                onClick={() => setDayFilter(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  dayFilter === d
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {DAY_NAMES[d]} {d === 5 ? '(8)' : '(7)'}
              </button>
            ))}
          </div>
        </div>

        {/* MOBILE CARD VIEW (md:hidden) — No horizontal scrolling */}
        <div className="md:hidden space-y-2.5 min-w-0 w-full">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400 animate-pulse bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              Memuat daftar siswa...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              Tidak ada siswa yang sesuai dengan filter.
            </div>
          ) : (
            filtered.map((student, idx) => {
              const currentTask = getAssignedTask(
                student.dayOfWeek,
                student.orderIndex,
                isoWeek,
                isoYear
              );

              return (
                <div
                  key={student.id}
                  className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3 min-w-0"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {student.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {DAY_NAMES[student.dayOfWeek]}
                        </span>
                        <TaskBadge task={currentTask} size="sm" />
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/unggah?studentId=${student.id}`}
                    className="px-2.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold shrink-0 hover:bg-blue-700 transition-colors shadow-xs"
                  >
                    Upload
                  </Link>
                </div>
              );
            })
          )}
        </div>

        {/* DESKTOP TABLE VIEW (hidden md:block) */}
        <div className="hidden md:block rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden min-w-0">
          <div className="overflow-x-auto min-w-0 w-full">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">Nama Siswa</th>
                  <th className="py-3 px-4">Hari Piket Tetap</th>
                  <th className="py-3 px-4">Tugas Minggu Ini (W{isoWeek})</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                      Memuat daftar siswa...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                      Tidak ada siswa yang sesuai dengan filter.
                    </td>
                  </tr>
                ) : (
                  filtered.map((student, idx) => {
                    const currentTask = getAssignedTask(
                      student.dayOfWeek,
                      student.orderIndex,
                      isoWeek,
                      isoYear
                    );

                    return (
                      <tr
                        key={student.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-4 text-center text-xs text-slate-400 font-medium">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-900 dark:text-white block">
                            {student.name}
                          </span>
                          <span className="text-[11px] text-slate-400">Kelas 10 SIJA B</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            <Calendar className="w-3.5 h-3.5 text-blue-500" />
                            <span>{DAY_NAMES[student.dayOfWeek]}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <TaskBadge task={currentTask} size="sm" />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Link
                            href={`/unggah?studentId=${student.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 transition-colors"
                          >
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Upload Bukti</span>
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
      </main>
    </div>
  );
}
