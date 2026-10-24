'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Phone,
  Key,
  ShieldCheck,
  Send,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Cloud,
  MessageSquare,
  Lock,
  Loader2,
  Users,
  BellRing,
  Eye,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { SystemSettingsRecord } from '@/lib/types';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettingsRecord | null>(null);
  const [adminPhonesInput, setAdminPhonesInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [testingWa, setTestingWa] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMessage, setPreviewMessage] = useState<string | null>(null);

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings(data.settings);
          const numbers = data.settings.adminWhatsAppNumbers || [data.settings.adminWhatsAppNumber || '089673038689'];
          setAdminPhonesInput(numbers.join(', '));
        }
      } else {
        // Fallback
        setAdminPhonesInput('089673038689');
      }
    } catch (e) {
      console.error(e);
      setAdminPhonesInput('089673038689');
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSavePhones = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setSavingSettings(true);
    try {
      const cleanedList = adminPhonesInput
        .split(/[\n,;]+/)
        .map((s) => s.trim().replace(/[^\d+]/g, ''))
        .filter(Boolean);

      if (cleanedList.length === 0) {
        throw new Error('Masukkan minimal 1 nomor WhatsApp admin.');
      }

      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-settings',
          adminWhatsAppNumbers: cleanedList,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan nomor WhatsApp');
      setFeedback({
        type: 'success',
        text: `Berhasil menyimpan ${cleanedList.length} nomor WhatsApp admin/pengurus.`,
      });
      loadSettings();
    } catch (err) {
      setFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Terjadi kesalahan' });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTestWhatsApp = async () => {
    setFeedback(null);
    setTestingWa(true);
    try {
      const firstPhone = adminPhonesInput.split(/[\n,;]+/)[0]?.trim();
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test-whatsapp',
          targetPhone: firstPhone,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Gagal mengirim pesan uji coba.');
      }
      setFeedback({ type: 'success', text: `Pesan tes berhasil dikirim ke WhatsApp (${firstPhone})!` });
    } catch (err) {
      setFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Gagal mengirim tes WhatsApp' });
    } finally {
      setTestingWa(false);
    }
  };

  const handleSendAdminBriefing = async () => {
    setFeedback(null);
    setBroadcasting(true);
    setPreviewMessage(null);
    try {
      const res = await fetch('/api/admin/broadcast-briefing', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.sendResult?.results?.[0]?.message || 'Gagal mengirim broadcast briefing.');
      }
      setPreviewMessage(data.messagePreview);
      setPreviewOpen(true);
      setFeedback({
        type: 'success',
        text: `Laporan briefing harian (evaluasi hari ini + jadwal besok) berhasil dikirim ke ${data.totalRecipients} nomor admin WhatsApp!`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Gagal mengirim laporan briefing ke admin.',
      });
    } finally {
      setBroadcasting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (newPassword.length < 6) {
      setFeedback({ type: 'error', text: 'Password minimal 6 karakter.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setFeedback({ type: 'error', text: 'Konfirmasi password tidak cocok.' });
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change-password',
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengubah password');
      setNewPassword('');
      setConfirmPassword('');
      setFeedback({ type: 'success', text: 'Password administrator berhasil diperbarui!' });
    } catch (err) {
      setFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Gagal mengubah password' });
    } finally {
      setSavingPassword(false);
    }
  };

  const currentNumbers = adminPhonesInput
    .split(/[\n,;]+/)
    .map((s) => s.trim().replace(/[^\d+]/g, ''))
    .filter(Boolean);

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-6 max-w-4xl w-full mx-auto min-w-0 overflow-x-hidden">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Pengaturan Sistem
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Kelola nomor penerima WhatsApp pengurus kelas, laporan briefing harian, dan kredensial admin.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Integration Status Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Gemini Vision */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-blue-600" />
              <span>Google Gemini AI</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
              gemini-3.5-flash
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Menganalisis objek kebersihan dan skor validitas bukti foto siswa.
          </p>
        </div>

        {/* Cloudinary Storage */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Cloud className="w-4 h-4 text-indigo-600" />
              <span>Cloudinary Temp</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
              Active / Fallback
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Penyimpanan bukti sementara dengan penghapusan otomatis pasca-moderasi.
          </p>
        </div>

        {/* Fonnte WhatsApp */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>Fonnte WhatsApp</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
              Connected (1000)
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Laporan briefing harian (evaluasi hari ini + besok) dan rekap mingguan Excel.
          </p>
        </div>
      </div>

      {/* WhatsApp Multi-Admin Configuration Form */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Daftar Nomor WhatsApp Admin / Pengurus Kelas
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Nomor-nomor ini akan otomatis menerima <b>laporan briefing harian</b> (siapa yang sudah piket, siapa yang belum konfirmasi/upload, dan jadwal petugas besok).
            </p>
          </div>
        </div>

        {/* Current Active Number Badges */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Nomor Terdaftar ({currentNumbers.length} Nomor):
          </span>
          <div className="flex flex-wrap gap-2">
            {currentNumbers.map((num, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-mono font-semibold"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{num}</span>
                {idx === 0 && (
                  <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-sans">
                    Utama
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>

        <form onSubmit={handleSavePhones} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Edit / Tambah Nomor WhatsApp Admin (Pisahkan dengan tanda koma atau baris baru)
            </label>
            <textarea
              rows={3}
              value={adminPhonesInput}
              onChange={(e) => setAdminPhonesInput(e.target.value)}
              placeholder="089673038689, 081234567890, 085712345678"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[11px] text-slate-400">
              Contoh: Masukkan nomor Ketua Kelas, Seksi Kebersihan, dan Wali Kelas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              type="submit"
              disabled={savingSettings}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-2xs"
            >
              {savingSettings ? 'Menyimpan...' : 'Simpan Daftar Nomor'}
            </button>

            <button
              type="button"
              onClick={handleTestWhatsApp}
              disabled={testingWa}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors flex items-center gap-1.5"
            >
              {testingWa ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Tes Ping Nomor Pertama</span>
            </button>

            <button
              type="button"
              onClick={handleSendAdminBriefing}
              disabled={broadcasting}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm shadow-emerald-500/20"
            >
              {broadcasting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <BellRing className="w-4 h-4" />
              )}
              <span>Kirim Laporan Briefing ke Semua Admin Sekarang</span>
            </button>
          </div>
        </form>

        {/* Message Preview Accordion */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
          <button
            type="button"
            onClick={() => setPreviewOpen(!previewOpen)}
            className="flex items-center justify-between w-full text-left text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-blue-500" />
              <span>Format Pesan WhatsApp Briefing Harian yang Diterima Admin:</span>
            </span>
            {previewOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {previewOpen && (
            <div className="mt-2.5 p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] leading-relaxed whitespace-pre-wrap border border-slate-800 shadow-inner max-h-80 overflow-y-auto">
              {previewMessage ||
                `🧹 *LAPORAN HARIAN PIKET — KELAS 10 SIJA B*
📅 *Hari Ini:* Senin, 28 April 2025
━━━━━━━━━━━━━━━━━━━━━

📊 *EVALUASI KEHADIRAN PIKET HARI INI:*

✅ *Hadir & Terverifikasi (2/7):*
  1. Siti Nurhaliza [MBG]
  2. Budi Santoso [Nyapu & Pel]

⏳ *Menunggu Verifikasi Admin (1):*
  1. Citra Dewi [MBG] ➔ Foto sudah diunggah, menunggu persetujuan

⚠️ *BELUM KONFIRMASI / BELUM UPLOAD (4):*
  1. Ahmad Rizki [MBG] ➔ ❗Segera konfirmasi & upload bukti!
  2. Daffa Pratama [Nyapu & Pel] ➔ ❗Segera konfirmasi & upload bukti!
  3. Nayla Putri [Helper] ➔ ❗Segera konfirmasi & upload bukti!
  4. Rizky Maulana [Helper] ➔ ❗Segera konfirmasi & upload bukti!

━━━━━━━━━━━━━━━━━━━━━
📋 *JADWAL PIKET BESOK:* 
📅 *Selasa, 29 April 2025* (7 Petugas)

🍱 *MBG (07:00 - 09:00 WIB):*
  1. Fajar Ardiansyah
  2. Intan Permata
  3. Joko Susilo
  4. Lia Anggraeni

🧹 *Nyapu & Pel (15:00 - 16:30 WIB):*
  1. Muhammad Iqbal
  2. Nabila Hasanah

🤝 *Helper (Koordinator):*
  1. Rafi Pratama

━━━━━━━━━━━━━━━━━━━━━
📲 *Tindakan Cepat:*
• Verifikasi Bukti: https://cleanbieber.vercel.app/admin/verifikasi
• Formulir Bukti Siswa: https://cleanbieber.vercel.app/unggah

_Notifikasi otomatis CleanBieber untuk Pengurus & Admin Kelas 10 SIJA B._`}
            </div>
          )}
        </div>
      </div>

      {/* Change Password Form */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Ganti Password Administrator
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Perbarui kata sandi akun administrator untuk menjaga keamanan portal.
          </p>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-3.5 text-xs max-w-md">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Password Baru (Minimal 6 karakter)
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Konfirmasi Password Baru
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={savingPassword}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors"
          >
            {savingPassword ? 'Menyimpan...' : 'Perbarui Password'}
          </button>
        </form>
      </div>

      {/* Vercel Cron Schedules Reference */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-3 text-xs">
        <h2 className="font-bold text-sm text-slate-900 dark:text-white">
          Jadwal Vercel Cron Jobs Terdaftar
        </h2>
        <div className="space-y-2">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">
                /api/cron/daily-reminder
              </span>
              <span className="text-[11px] text-slate-400">
                Minggu s.d. Kamis @ 20:00 WIB (13:00 UTC) • Briefing evaluasi hari ini & jadwal besok ke seluruh nomor admin
              </span>
            </div>
            <span className="font-mono text-[11px] text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
              0 13 * * 0-4
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">
                /api/cron/weekly-recap
              </span>
              <span className="text-[11px] text-slate-400">
                Jumat @ 17:00 WIB (10:00 UTC) • Rekapitulasi mingguan dan lampiran Excel ke nomor admin
              </span>
            </div>
            <span className="font-mono text-[11px] text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
              0 10 * * 5
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
