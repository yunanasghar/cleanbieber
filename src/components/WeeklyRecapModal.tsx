'use client';

import React from 'react';
import Link from 'next/link';
import { X, Award, CheckCircle2, AlertTriangle, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import type { AttendanceRecord } from '@/lib/types';

interface WeeklyRecapModalProps {
  isOpen: boolean;
  onClose: () => void;
  weekRangeText: string;
  totalDuties: number;
  verifiedCount: number;
  pendingCount: number;
  rejectedCount: number;
  percentage: number;
}

export default function WeeklyRecapModal({
  isOpen,
  onClose,
  weekRangeText,
  totalDuties,
  verifiedCount,
  pendingCount,
  rejectedCount,
  percentage,
}: WeeklyRecapModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-[#102238] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-[#172b46] dark:text-blue-300">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#172b46] dark:text-white">
                Rangkuman Kebersihan Mingguan
              </h3>
              <p className="text-xs text-[#66758a] dark:text-slate-400">
                Periode: {weekRangeText} · Kelas 10 SIJA B
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto text-xs sm:text-sm">
          {/* Progress Overview Card */}
          <div className="rounded-2xl bg-[#edf3f9] dark:bg-slate-900 border border-blue-100 dark:border-slate-800 p-5 flex items-center gap-5">
            <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  className="stroke-slate-200 dark:stroke-slate-800"
                  strokeWidth="3.2"
                  fill="none"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  className="stroke-[#172b46] dark:stroke-blue-400 transition-all duration-700 ease-out"
                  strokeWidth="3.2"
                  strokeDasharray={`${percentage}, 100`}
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-[#172b46] dark:text-white leading-none">
                  {percentage}%
                </span>
                <span className="text-[9px] text-[#66758a] font-medium mt-0.5">Skor</span>
              </div>
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-[#172b46] dark:text-white text-base">
                Kondisi Kebersihan Kelas
              </h4>
              <p className="text-xs text-[#66758a] dark:text-slate-300">
                {verifiedCount} dari {totalDuties} penugasan piket minggu ini telah diverifikasi oleh admin.
              </p>
            </div>
          </div>

          {/* Breakdown Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="font-semibold">Terverifikasi</span>
              </div>
              <p className="text-lg font-bold text-[#172b46] dark:text-white">{verifiedCount}</p>
              <p className="text-[10px] text-slate-400">Bukti disetujui</p>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-1.5 text-xs text-amber-600 mb-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="font-semibold">Menunggu</span>
              </div>
              <p className="text-lg font-bold text-[#172b46] dark:text-white">{pendingCount}</p>
              <p className="text-[10px] text-slate-400">Perlu moderasi</p>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-1.5 text-xs text-rose-600 mb-1">
                <X className="w-3.5 h-3.5" />
                <span className="font-semibold">Ditolak / Izin</span>
              </div>
              <p className="text-lg font-bold text-[#172b46] dark:text-white">{rejectedCount}</p>
              <p className="text-[10px] text-slate-400">Tidak tuntas</p>
            </div>
          </div>

          {/* Export to Excel banner */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-xs font-semibold text-[#172b46] dark:text-white">
                  Unduh Laporan Format Excel (.xlsx)
                </p>
                <p className="text-[11px] text-[#66758a]">Lengkap dengan rekap nilai & kehadiran</p>
              </div>
            </div>
            <a
              href="/api/reports/excel"
              download
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors"
            >
              Unduh
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
          <Link
            href="/admin/rekap"
            onClick={onClose}
            className="text-xs text-[#31577d] dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
          >
            Buka Halaman Rekap Lengkap &rarr;
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
