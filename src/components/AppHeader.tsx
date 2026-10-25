'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Calendar,
  User,
  Menu,
  X,
  ShieldCheck,
  Bell,
  FileSpreadsheet,
  Users,
  Camera,
  CheckCircle2,
  Home,
} from 'lucide-react';
import CleanBieberLogo from './CleanBieberLogo';
import type { StudentRecord } from '@/lib/types';

interface AppHeaderProps {
  selectedStudent?: StudentRecord | null;
  formattedDate: string;
  onOpenStudentModal?: () => void;
  onOpenNotifications?: () => void;
  onOpenRecap?: () => void;
  pageTitle?: string;
  pageSubtitle?: string;
}

export default function AppHeader({
  selectedStudent,
  formattedDate,
  onOpenStudentModal,
  onOpenNotifications,
  onOpenRecap,
  pageTitle,
  pageSubtitle,
}: AppHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const greetingName = selectedStudent
    ? selectedStudent.name.split(' ')[0]
    : 'Siswa 10 SIJA B';

  return (
    <>
      {/* ========================================================= */}
      {/* DESKTOP TOP BAR (lg:flex)                                 */}
      {/* ========================================================= */}
      <header className="hidden lg:flex items-center justify-between px-8 py-6 w-full max-w-7xl mx-auto min-w-0">
        {/* Left Greeting & Context */}
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#172b46] dark:text-white">
              {pageTitle || `Halo, ${greetingName}!`}
            </h1>
            {onOpenStudentModal && (
              <button
                type="button"
                onClick={onOpenStudentModal}
                className="text-xs px-2 py-0.5 rounded-md bg-[#edf3f9] hover:bg-[#dfeaf5] text-[#31577d] dark:bg-slate-800 dark:text-slate-300 font-medium transition-colors"
                title="Ganti nama siswa"
              >
                Ganti siswa
              </button>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[#66758a] dark:text-slate-400">
            {pageSubtitle || (
              <>
                Selamat datang di <strong className="text-[#172b46] dark:text-slate-200">CleanBieber</strong>. Tetap semangat dan jaga kebersihan kelas kita!
              </>
            )}
          </p>
        </div>

        {/* Right Date Pill & Profile Avatar */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Indonesian Date Pill */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-[#e1e7ef] dark:border-slate-800 text-xs sm:text-sm font-medium text-[#172b46] dark:text-slate-200 shadow-2xs">
            <Calendar className="w-4 h-4 text-[#31577d] dark:text-blue-400" />
            <span>{formattedDate}</span>
          </div>

          {/* Admin portal shortcut */}
          <Link
            href="/admin"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-[#e1e7ef] dark:border-slate-800 text-xs font-medium text-[#172b46] dark:text-slate-200 hover:bg-[#edf3f9] dark:hover:bg-slate-800 transition-colors shadow-2xs"
            title="Portal Administrator"
          >
            <ShieldCheck className="w-4 h-4 text-[#31577d] dark:text-blue-400" />
            <span>Admin</span>
          </Link>

          {/* User Avatar Circle */}
          <button
            type="button"
            onClick={() => onOpenStudentModal?.()}
            className="w-10 h-10 rounded-full bg-[#172b46] dark:bg-slate-800 text-white flex items-center justify-center hover:bg-[#203656] transition-colors shadow-2xs cursor-pointer"
            title={selectedStudent ? selectedStudent.name : 'Pilih Nama Siswa'}
          >
            {selectedStudent ? (
              <span className="font-semibold text-sm">
                {selectedStudent.name.charAt(0)}
              </span>
            ) : (
              <User className="w-5 h-5 text-white/90" />
            )}
          </button>
        </div>
      </header>

      {/* ========================================================= */}
      {/* MOBILE TOP BAR (< lg)                                    */}
      {/* ========================================================= */}
      <header className="lg:hidden sticky top-0 z-40 w-full bg-white/95 dark:bg-[#102238]/95 backdrop-blur-md border-b border-[#e1e7ef] dark:border-slate-800 px-4 h-14 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2">
          <CleanBieberLogo size={26} showText={true} textColor="text-[#172b46] dark:text-white" />
        </Link>

        {/* Right Hamburger Menu Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Buka menu navigasi"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* ========================================================= */}
      {/* MOBILE DRAWER MODAL                                       */}
      {/* ========================================================= */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex flex-col justify-end"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="bg-white dark:bg-[#102238] rounded-t-2xl p-5 border-t border-slate-200 dark:border-slate-800 max-h-[80vh] overflow-y-auto space-y-4 animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <CleanBieberLogo size={28} showText={true} textColor="text-[#172b46] dark:text-white" />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student info */}
            <div className="p-3 rounded-xl bg-[#edf3f9] dark:bg-slate-900 border border-blue-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Profil Siswa Aktif:</p>
                <p className="text-sm font-bold text-[#172b46] dark:text-white">
                  {selectedStudent ? selectedStudent.name : 'Belum Dipilih'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenStudentModal?.();
                }}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 text-[#31577d] dark:text-blue-300"
              >
                Ganti
              </button>
            </div>

            {/* Navigation links */}
            <div className="space-y-1">
              {[
                { href: '/', label: 'Beranda / Dashboard', icon: Home },
                { href: '/jadwal', label: 'Jadwal Piket', icon: Calendar },
                { href: '/unggah', label: 'Upload Bukti', icon: Camera },
                { href: '/status', label: 'Status Bukti', icon: CheckCircle2 },
                { href: '/siswa', label: 'Daftar 36 Siswa', icon: Users },
                { href: '/admin/rekap', label: 'Rekap Kebersihan', icon: FileSpreadsheet },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                      isActive
                        ? 'bg-[#edf3f9] text-[#172b46] font-semibold dark:bg-blue-950/60 dark:text-blue-200'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-[#31577d] dark:text-blue-400" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenNotifications?.();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 text-left"
              >
                <Bell className="w-4 h-4 text-[#31577d] dark:text-blue-400" />
                <span>Notifikasi WhatsApp</span>
              </button>
            </div>

            {/* Admin Portal link */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#172b46] text-white text-sm font-medium hover:bg-[#203656] transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Portal Administrator</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
