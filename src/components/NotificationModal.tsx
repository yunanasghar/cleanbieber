'use client';

import React from 'react';
import { X, MessageSquare, CheckCircle2, Clock, Phone, Send, ShieldCheck } from 'lucide-react';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationModal({ isOpen, onClose }: NotificationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-[#102238] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#172b46] dark:text-white">
                Notifikasi WhatsApp Otomatis
              </h3>
              <p className="text-xs text-[#66758a] dark:text-slate-400">
                Pengingat harian piket & briefing pengurus kelas
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
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Status Box */}
          <div className="rounded-xl bg-[#edf3f9] dark:bg-slate-900 border border-blue-100 dark:border-slate-800 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#172b46] dark:text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> WhatsApp Gateway (Fonnte)
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Terhubung (Aktif)
              </span>
            </div>
            <p className="text-xs text-[#66758a] dark:text-slate-300">
              Sistem CleanBieber mengirimkan pengingat jadwal otomatis setiap malam pukul{' '}
              <strong className="text-[#172b46] dark:text-white">20:00 WIB</strong> via server Vercel Cron.
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-900/40">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Waktu Pengiriman</span>
              </div>
              <p className="font-semibold text-sm text-[#172b46] dark:text-white">20:00 WIB</p>
              <p className="text-[11px] text-slate-400">Setiap Minggu - Kamis</p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-900/40">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Nomor Pengirim</span>
              </div>
              <p className="font-semibold text-sm text-[#172b46] dark:text-white">088215904416</p>
              <p className="text-[11px] text-slate-400">Akun Resmi CleanBieber</p>
            </div>
          </div>

          {/* Target Penerima */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-[#172b46] dark:text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Target Penerima Pengurus & Admin:
            </p>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-2.5 bg-slate-50 dark:bg-slate-900/50 space-y-1 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Ketua & Wakil Kelas</span>
                <span className="font-mono text-[11px]">0812-2732-4594 / 0857-0058-6648</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Koordinator Kebersihan</span>
                <span className="font-mono text-[11px]">0856-0067-9515 / 0895-0769-7055</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Admin Sistem SIJA B</span>
                <span className="font-mono text-[11px]">0882-2178-0900</span>
              </div>
            </div>
          </div>

          {/* Preview template */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-[#172b46] dark:text-slate-300 flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-blue-600" /> Format Pesan Briefing:
            </p>
            <pre className="text-[11px] leading-relaxed bg-[#102238] text-slate-200 p-3 rounded-xl overflow-x-auto font-mono">
{`🧹 LAPORAN HARIAN PIKET — KELAS 10 SIJA B
📅 Evaluasi Kehadiran Hari Ini
📋 JADWAL PIKET BESOK (7 Petugas):
🍱 MBG (07:00 - 09:00 WIB)
🧹 Nyapu (15:00 - 16:30 WIB)
🤝 Helper (Koordinator)

📲 Verifikasi: https://cleanbieber.vercel.app/admin/verifikasi`}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#172b46] text-xs font-medium text-white hover:bg-[#203656] transition-colors"
          >
            Mengerti
          </button>
        </div>
      </div>
    </div>
  );
}
