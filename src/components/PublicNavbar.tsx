'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Calendar,
  Users,
  Camera,
  CheckCircle2,
  ShieldCheck,
  Menu,
  X,
  Bell,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import CleanBieberLogo from './CleanBieberLogo';
import NotificationModal from './NotificationModal';

export default function PublicNavbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Beranda', icon: Home },
    { href: '/jadwal', label: 'Jadwal Piket', icon: Calendar },
    { href: '/unggah', label: 'Upload Bukti', icon: Camera },
    { href: '/status', label: 'Status Bukti', icon: CheckCircle2 },
    { href: '/siswa', label: 'Daftar Siswa', icon: Users },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#102238]/95 backdrop-blur-md border-b border-[#e1e7ef] dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand identity */}
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="flex items-center gap-2 group min-w-0">
              <CleanBieberLogo size={28} showText={true} textColor="text-[#172b46] dark:text-white" />
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#edf3f9] text-[#172b46] border border-blue-100 dark:bg-slate-800 dark:text-blue-300 dark:border-slate-700 shrink-0">
                10 SIJA B
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-[#172b46] dark:text-white bg-[#edf3f9] dark:bg-slate-800 font-semibold shadow-2xs'
                      : 'text-[#66758a] hover:text-[#172b46] hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 text-[#31577d] dark:text-blue-400" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right actions: WhatsApp Notif, ThemeToggle & Admin Login */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setNotificationOpen(true)}
              className="p-2 rounded-xl text-[#66758a] hover:text-[#172b46] hover:bg-[#edf3f9] dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="Notifikasi WhatsApp"
            >
              <Bell className="w-4 h-4" />
            </button>

            <ThemeToggle />

            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium bg-white dark:bg-slate-800 hover:bg-[#edf3f9] dark:hover:bg-slate-700 text-[#172b46] dark:text-slate-200 border border-[#e1e7ef] dark:border-slate-700 transition-colors shadow-2xs"
              title="Admin Portal"
            >
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#31577d] dark:text-blue-400" />
              <span>Admin</span>
            </Link>

            {/* Mobile hamburger toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-[#e1e7ef] dark:border-slate-800 bg-white/98 dark:bg-[#102238]/98 px-4 pt-3 pb-4 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-3 py-1.5 mb-2 rounded-xl bg-[#edf3f9] dark:bg-slate-900 border border-blue-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-[#172b46] dark:text-blue-300">Kelas 10 SIJA B</span>
              <span className="text-[10px] text-[#66758a] dark:text-slate-400">36 Siswa</span>
            </div>

            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-[#172b46] dark:text-blue-300 bg-[#edf3f9] dark:bg-blue-950/40 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 text-[#31577d] dark:text-blue-400" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-xl text-xs font-semibold bg-[#172b46] dark:bg-slate-800 text-white hover:bg-[#203656] transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-white" />
                <span>Masuk Admin Portal</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      <NotificationModal
        isOpen={notificationOpen}
        onClose={() => setNotificationOpen(false)}
      />
    </>
  );
}

