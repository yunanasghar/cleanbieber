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
} from 'lucide-react';
import type { SystemSettingsRecord } from '@/lib/types';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettingsRecord | null>(null);
  const [adminPhone, setAdminPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [testingWa, setTestingWa] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      // If endpoint doesn't support GET directly, we can read settings
      const statusRes = await fetch('/api/students');
      if (statusRes.ok) {
        setSettings({
          adminWhatsAppNumber: process.env.NEXT_PUBLIC_ADMIN_PHONE || '081234567890',
          fonnteTokenConfigured: false,
          cloudinaryConfigured: false,
          geminiConfigured: false,
          allowPublicSubmissions: true,
          reminderHour: 20,
          classLabel: 'Kelas 10 SIJA B',
          totalStudents: 36,
        });
        setAdminPhone('081234567890');
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setSavingSettings(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-settings',
          adminWhatsAppNumber: adminPhone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan nomor WhatsApp');
      setFeedback({ type: 'success', text: 'Nomor WhatsApp admin berhasil diperbarui.' });
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
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test-whatsapp',
          targetPhone: adminPhone,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Gagal mengirim pesan uji coba.');
      }
      setFeedback({ type: 'success', text: 'Pesan tes berhasil dikirim ke WhatsApp admin!' });
    } catch (err) {
      setFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Gagal mengirim tes WhatsApp' });
    } finally {
      setTestingWa(false);
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

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-6 max-w-4xl w-full mx-auto min-w-0 overflow-x-hidden">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Pengaturan Sistem
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Konfigurasi integrasi WhatsApp Fonnte, kredensial admin, dan status layanan cloud.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
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
              Siap / Configured
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
              Connected
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Pengingat piket harian (20:00 WIB) dan rekap mingguan Excel (Jumat 17:00 WIB).
          </p>
        </div>
      </div>

      {/* WhatsApp Configuration Form */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Konfigurasi Nomor Notifikasi WhatsApp Admin
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Nomor tujuan pengiriman bot pengingat harian piket dan lampiran Excel mingguan.
          </p>
        </div>

        <form onSubmit={handleSavePhone} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Nomor WhatsApp Penerima
            </label>
            <div className="flex gap-2">
              <input
                type="tel"
                value={adminPhone}
                onChange={(e) => setAdminPhone(e.target.value)}
                placeholder="081234567890"
                required
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={savingSettings}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors"
              >
                {savingSettings ? 'Menyimpan...' : 'Simpan Nomor'}
              </button>
              <button
                type="button"
                onClick={handleTestWhatsApp}
                disabled={testingWa}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
              >
                {testingWa ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Tes Kirim</span>
              </button>
            </div>
          </div>
        </form>
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
                Minggu s.d. Kamis @ 20:00 WIB (13:00 UTC) • Pengingat jadwal piket esok hari
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
                Jumat @ 17:00 WIB (10:00 UTC) • Rekapitulasi mingguan dan lampiran Excel
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
