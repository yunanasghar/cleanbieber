'use client';

import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  Sparkles,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Calendar,
  Layers,
} from 'lucide-react';
import TaskBadge from './TaskBadge';
import StatusBadge from './StatusBadge';
import { formatIndonesianDate } from '@/lib/rotation';
import type { AttendanceRecord } from '@/lib/types';

interface VerificationModalProps {
  submission: AttendanceRecord | null;
  onClose: () => void;
  onModerated: (updated: AttendanceRecord) => void;
}

export default function VerificationModal({
  submission,
  onClose,
  onModerated,
}: VerificationModalProps) {
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!submission) return null;

  const handleModerate = async (status: 'verified' | 'rejected') => {
    setActionError(null);
    if (status === 'rejected' && !rejectionReason.trim()) {
      setActionError('Alasan penolakan wajib diisi agar siswa memahami evaluasi bukti.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`/api/submissions/${submission.id}/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          rejectionReason: status === 'rejected' ? rejectionReason : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memproses moderasi');
      }

      onModerated(data.submission);
      onClose();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  const confidenceScore = submission.aiConfidence !== null ? submission.aiConfidence : 0;
  const confidencePercent = Math.round(confidenceScore * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto sm:my-8 min-w-0">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Detail Verifikasi Bukti Piket
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {actionError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
              {actionError}
            </div>
          )}

          {/* Student Info Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-slate-900 dark:text-white">
                  {submission.studentName}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
                  Kelas 10 SIJA B
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatIndonesianDate(new Date(`${submission.dateString}T00:00:00+07:00`))}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <TaskBadge task={submission.taskName} size="md" />
              <StatusBadge status={submission.status} size="md" />
            </div>
          </div>

          {/* Photo Display */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Foto Bukti Kebersihan:
            </span>
            {submission.tempPhotoUrl ? (
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black aspect-video max-h-80 flex items-center justify-center">
                <img
                  src={submission.tempPhotoUrl}
                  alt="Bukti Piket"
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="p-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-700">
                Foto bukti telah dihapus secara permanen dari server penyimpanan temporary setelah proses verifikasi selesai dilakukan.
              </div>
            )}
          </div>

          {/* Gemini AI Analysis Card matching visual mockup */}
          <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                  Hasil Analisis Gemini AI
                </h4>
              </div>

              {submission.aiStatus && (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    submission.aiStatus === 'VALID'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300'
                  }`}
                >
                  {submission.aiStatus === 'VALID' ? 'Valid' : 'Invalid'} ({submission.aiConfidence?.toFixed(2) || '0.00'})
                </span>
              )}
            </div>

            {/* Confidence Score Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Confidence Score:</span>
                <span>{submission.aiConfidence ? `${confidencePercent}% (${submission.aiConfidence.toFixed(2)})` : 'Tidak tersedia'}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    confidenceScore >= 0.7
                      ? 'bg-emerald-500'
                      : confidenceScore >= 0.4
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${confidencePercent}%` }}
                />
              </div>
            </div>

            {/* Detected Objects Pills */}
            {submission.aiDetectedItems && submission.aiDetectedItems.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                  Objek Terdeteksi:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {submission.aiDetectedItems.map((item, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* AI Reasoning */}
            {submission.aiReason && (
              <div className="space-y-1 pt-1">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                  Alasan Analisis:
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-white/70 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700/60">
                  {submission.aiReason}
                </p>
              </div>
            )}

            <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">
              *Analisis AI merupakan rekomendasi bantu, bukan keputusan final. Keputusan kehadiran ditentukan oleh admin.
            </p>
          </div>

          {/* Rejection reason input form */}
          {rejecting && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 space-y-2">
              <label className="block text-xs font-bold text-rose-800 dark:text-rose-200">
                Alasan Penolakan:
              </label>
              <textarea
                rows={2}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Contoh: Foto tidak memperlihatkan lantai kelas yang telah disapu."
                className="w-full p-2.5 rounded-lg border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRejecting(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleModerate('rejected')}
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors"
                >
                  {submitting ? 'Menyimpan...' : 'Konfirmasi Tolak'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Foto bukti otomatis dihapus secara permanen dari penyimpanan cloud setelah keputusan verifikasi disimpan.
          </p>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {!rejecting && (
              <>
                <button
                  type="button"
                  onClick={() => setRejecting(true)}
                  disabled={submitting}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Tolak</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleModerate('verified')}
                  disabled={submitting}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-500/20 transition-colors"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Setujui</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
