'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  Calendar,
  Filter,
  Eye,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import TaskBadge from '@/components/TaskBadge';
import StatusBadge from '@/components/StatusBadge';
import VerificationModal from '@/components/VerificationModal';
import { formatIndonesianDate } from '@/lib/rotation';
import type { AttendanceRecord } from '@/lib/types';

export default function VerificationCenterPage() {
  const [logs, setLogs] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<AttendanceRecord | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const url = new URL('/api/submissions', window.location.origin);
      if (dateFilter) url.searchParams.set('date', dateFilter);

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (e) {
      console.error('Error fetching verification logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [dateFilter]);

  // Tab counts
  const totalCount = logs.length;
  const pendingCount = logs.filter((l) => l.status === 'pending').length;
  const verifiedCount = logs.filter((l) => l.status === 'verified').length;
  const rejectedCount = logs.filter((l) => l.status === 'rejected').length;

  const filteredLogs = logs.filter((l) => {
    const matchesTab = activeTab === 'all' || l.status === activeTab;
    const matchesSearch = (l.studentName || '').toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleModerated = (updated: AttendanceRecord) => {
    setLogs((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto min-w-0 overflow-x-hidden">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Verifikasi Bukti Piket
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Tinjau hasil foto tugas kebersihan siswa beserta rekomendasi validitas dari Gemini AI.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="self-start sm:self-auto p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Muat ulang data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tabs matching UI mockup */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Semua ({totalCount})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'pending'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setActiveTab('verified')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'verified'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Verified ({verifiedCount})
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'rejected'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Rejected ({rejectedCount})
          </button>
        </div>

        {/* Search & Date Filter */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama siswa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-44 sm:w-52"
            />
          </div>

          <div className="relative">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Mobile Card List (md:hidden) */}
      <div className="md:hidden space-y-3 min-w-0">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            Memuat data pengajuan...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            Tidak ada bukti piket dalam antrean ini.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isValidAi = log.aiStatus === 'VALID';
            return (
              <div
                key={log.id}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 min-w-0"
              >
                <div className="flex items-start gap-3 min-w-0">
                  {log.tempPhotoUrl ? (
                    <div
                      onClick={() => setSelectedSubmission(log)}
                      className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 shrink-0 cursor-pointer"
                    >
                      <img src={log.tempPhotoUrl} alt="Bukti" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] text-slate-400 shrink-0">
                      Foto Dihapus
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {log.studentName}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {formatIndonesianDate(new Date(`${log.dateString}T00:00:00+07:00`))}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <TaskBadge task={log.taskName} size="sm" />
                      <StatusBadge status={log.status} size="sm" />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div>
                    {log.aiStatus && (
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isValidAi
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                        }`}
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>AI {isValidAi ? 'Valid' : 'Invalid'}</span>
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedSubmission(log)}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors"
                  >
                    Tinjau Bukti
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Verification Table (hidden md:block) */}
      <div className="hidden md:block rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden min-w-0">
        <div className="overflow-x-auto min-w-0 w-full">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/70 dark:bg-slate-800/60 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 w-16 text-center">Foto</th>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-4">Tugas</th>
                <th className="py-3 px-4">AI Status</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                    Memuat data pengajuan...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                    Tidak ada bukti piket dalam antrean ini.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isValidAi = log.aiStatus === 'VALID';
                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 text-center">
                        {log.tempPhotoUrl ? (
                          <div
                            onClick={() => setSelectedSubmission(log)}
                            className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 cursor-pointer hover:opacity-80 transition-opacity mx-auto"
                          >
                            <img
                              src={log.tempPhotoUrl}
                              alt="Foto bukti"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] text-slate-400 mx-auto">
                            Dihapus
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 dark:text-white block">
                          {log.studentName}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          10 SIJA B • {formatIndonesianDate(new Date(`${log.dateString}T00:00:00+07:00`))}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <TaskBadge task={log.taskName} size="sm" />
                      </td>

                      <td className="py-3 px-4">
                        {log.aiStatus ? (
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                              isValidAi
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                                : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800'
                            }`}
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>
                              {isValidAi ? 'Valid' : 'Invalid'} ({log.aiConfidence?.toFixed(2) || '0.00'})
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <StatusBadge status={log.status} size="sm" />
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setSelectedSubmission(log)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-900/60 transition-colors"
                        >
                          Lihat
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Verification Modal */}
      <VerificationModal
        submission={selectedSubmission}
        onClose={() => setSelectedSubmission(null)}
        onModerated={handleModerated}
      />
    </div>
  );
}
