'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, CheckCircle2, Clock, XCircle, Sparkles, Calendar, UploadCloud, ArrowRight } from 'lucide-react';
import PublicNavbar from '@/components/PublicNavbar';
import TaskBadge from '@/components/TaskBadge';
import StatusBadge from '@/components/StatusBadge';
import { formatIndonesianDate } from '@/lib/rotation';
import type { AttendanceRecord, StudentRecord } from '@/lib/types';

export default function SubmissionStatusPage() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [logs, setLogs] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check saved student
    try {
      const savedId = localStorage.getItem('cleanbieber_student_id');
      if (savedId) {
        setSelectedStudentId(savedId);
      }
    } catch {
      // ignore
    }

    async function fetchStudents() {
      try {
        const res = await fetch('/api/students');
        if (res.ok) {
          const data = await res.json();
          setStudents(data.students || []);
        }
      } catch (err) {
        console.error('Failed to load students:', err);
      }
    }
    fetchStudents();
  }, []);

  const handleSelectStudent = (id: string) => {
    setSelectedStudentId(id);
    try {
      if (id) {
        localStorage.setItem('cleanbieber_student_id', id);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    async function fetchStudentLogs() {
      if (!selectedStudentId) {
        setLogs([]);
        return;
      }
      try {
        setLoading(true);
        const res = await fetch(`/api/submissions?studentId=${selectedStudentId}`);
        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs || []);
        }
      } catch (err) {
        console.error('Error fetching logs:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStudentLogs();
  }, [selectedStudentId]);

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0b1120] text-slate-900 dark:text-slate-100 transition-colors w-full max-w-full overflow-x-hidden">
      <PublicNavbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-5 min-w-0">
        <div className="text-center max-w-lg mx-auto space-y-1.5 px-2">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Pengecekan Status
          </span>
          <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Cek Status Bukti Piket
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pilih nama kamu untuk memantau apakah bukti piket telah disetujui atau memerlukan perbaikan.
          </p>
        </div>

        {/* Student Selector */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-xs max-w-md mx-auto space-y-2 min-w-0">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Pilih Nama Kamu:
          </label>
          <select
            value={selectedStudentId}
            onChange={(e) => handleSelectStudent(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 truncate"
          >
            <option value="">-- Pilih Nama Kamu --</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Results */}
        {selectedStudent && (
          <div className="space-y-4 min-w-0 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Riwayat Bukti: {selectedStudent.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Total pengajuan ditemukan: {logs.length}
                </p>
              </div>

              <Link
                href={`/unggah?studentId=${selectedStudent.id}`}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors shrink-0"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload Bukti Baru</span>
              </Link>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400 animate-pulse bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                Memuat riwayat pengajuan...
              </div>
            ) : logs.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Belum ada catatan bukti piket yang dikirimkan untuk siswa ini.
                </p>
                <Link
                  href={`/unggah?studentId=${selectedStudent.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Kirim Bukti Sekarang</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-3 min-w-0">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0"
                  >
                    <div className="space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <TaskBadge task={log.taskName} size="sm" />
                        <StatusBadge status={log.status} size="sm" />
                        {log.aiStatus && (
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              log.aiStatus === 'VALID'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                            }`}
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>
                              AI {log.aiStatus} ({Math.round((log.aiConfidence || 0) * 100)}%)
                            </span>
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-600 dark:text-slate-300">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          Tanggal Piket:{' '}
                          {formatIndonesianDate(new Date(`${log.dateString}T00:00:00+07:00`))}
                        </p>
                        <p className="text-slate-400 text-[11px] mt-0.5">
                          Diajukan pada: {new Date(log.createdAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}
                        </p>
                      </div>

                      {log.rejectionReason && (
                        <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
                          <span className="font-bold">Alasan Ditolak:</span> {log.rejectionReason}
                        </div>
                      )}
                    </div>

                    {/* Image thumbnail if still available */}
                    {log.tempPhotoUrl && (
                      <div className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 shrink-0">
                        <img
                          src={log.tempPhotoUrl}
                          alt="Thumbnail bukti"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
