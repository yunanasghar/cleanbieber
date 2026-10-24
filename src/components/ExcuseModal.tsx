'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  HeartHandshake,
  Loader2,
  AlertCircle,
  FileText,
  UserCheck,
  RotateCcw,
} from 'lucide-react';
import type { TaskType } from '@/lib/rotation';
import type { AttendanceRecord } from '@/lib/types';
import TaskBadge from './TaskBadge';

interface ExcuseModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: {
    id: string;
    name: string;
    taskName: TaskType;
  } | null;
  dateString: string;
  existingRecord?: AttendanceRecord | null;
  onSuccess: (record?: AttendanceRecord) => void;
}

export default function ExcuseModal({
  isOpen,
  onClose,
  student,
  dateString,
  existingRecord,
  onSuccess,
}: ExcuseModalProps) {
  const [excuseType, setExcuseType] = useState<'sakit' | 'izin'>('sakit');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (existingRecord?.status === 'excused') {
      const rawReason = existingRecord.rejectionReason || '';
      if (rawReason.toLowerCase().startsWith('izin')) {
        setExcuseType('izin');
        setReason(rawReason.replace(/^izin:\s*/i, ''));
      } else {
        setExcuseType('sakit');
        setReason(rawReason.replace(/^sakit:\s*/i, ''));
      }
    } else {
      setExcuseType('sakit');
      setReason('');
    }
    setErrorMsg(null);
  }, [existingRecord, isOpen]);

  if (!isOpen || !student) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/excuse-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'excuse',
          studentId: student.id,
          dateString,
          taskName: student.taskName,
          excuseType,
          reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan status');
      }

      onSuccess(data.record);
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveExcuse = async () => {
    if (!existingRecord) return;
    if (!confirm('Apakah kamu yakin ingin membatalkan status izin/sakit siswa ini dan mengembalikannya ke status pending?')) {
      return;
    }

    setErrorMsg(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/excuse-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove',
          attendanceId: existingRecord.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal membatalkan status');
      }

      onSuccess(undefined);
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Dispensasi Sakit / Izin Piket
              </h3>
              <p className="text-[11px] text-slate-400">
                Pencatatan resmi siswa berhalangan hadir piket
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Student & Duty Target Info */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block">Petugas Piket:</span>
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                {student.name}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block mb-0.5">Tugas Hari Ini:</span>
              <TaskBadge task={student.taskName} size="sm" />
            </div>
          </div>

          {/* Type Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Jenis Keterangan
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setExcuseType('sakit')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all ${
                  excuseType === 'sakit'
                    ? 'bg-rose-50 border-rose-400 text-rose-700 dark:bg-rose-950/40 dark:border-rose-700 dark:text-rose-300 shadow-xs ring-1 ring-rose-400'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                <span>🏥</span>
                <span>Sakit (Surat Dokter / Demam)</span>
              </button>

              <button
                type="button"
                onClick={() => setExcuseType('izin')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all ${
                  excuseType === 'izin'
                    ? 'bg-blue-50 border-blue-400 text-blue-700 dark:bg-blue-950/40 dark:border-blue-700 dark:text-blue-300 shadow-xs ring-1 ring-blue-400'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                <span>✉️</span>
                <span>Izin Resmi / Keluarga</span>
              </button>
            </div>
          </div>

          {/* Note Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Catatan / Keterangan Tambahan
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                excuseType === 'sakit'
                  ? 'Contoh: Demam, istirahat di rumah (surat dokter ada)'
                  : 'Contoh: Izin acara keluarga di luar kota'
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* SOP Guide Note */}
          <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/40 text-[11px] text-blue-800 dark:text-blue-300 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" />
              <span>SOP Kelas & Dampak Sistem:</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              • Siswa <b>tidak akan dihitung Alpa / Bolos</b> pada persentase kelas.
              <br />• Di laporan WA dan Excel tercatat resmi sebagai <b>{excuseType.toUpperCase()}</b>.
              <br />• Tugas {student.taskName} hari ini otomatis dialihkan ke <b>Helper</b> atau diganti piket hari lain.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between gap-3">
            {existingRecord?.status === 'excused' ? (
              <button
                type="button"
                onClick={handleRemoveExcuse}
                disabled={submitting}
                className="px-3 py-2 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Batalkan Izin</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Tutup
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-3.5 h-3.5" />
                    <span>Simpan Keterangan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
