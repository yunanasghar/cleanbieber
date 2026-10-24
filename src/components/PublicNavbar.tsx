'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CheckSquare, Calendar, Users, UploadCloud, Search, ShieldCheck, Menu, X } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function PublicNavbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Beranda', icon: CheckSquare },
    { href: '/jadwal', label: 'Jadwal Piket', icon: Calendar },
    { href: '/siswa', label: 'Daftar Siswa', icon: Users },
    { href: '/unggah', label: 'Unggah Bukti', icon: UploadCloud },
    { href: '/status', label: 'Cek Status', icon: Search },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-15 sm:h-16 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link href="/" className="flex items-center gap-2 group min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shadow-blue-500/20 group-hover:bg-blue-700 transition-colors">
              <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white truncate">
                  Clean<span className="text-blue-600">Bieber</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800 shrink-0">
                  Kelas 10 SIJA B
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-none hidden sm:block">
                Class Cleaning Management System
              </p>
              <p className="text-[10px] font-medium text-blue-600 dark:text-blue-400 leading-none sm:hidden">
                10 SIJA B
              </p>
            </div>
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/40'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right actions: ThemeToggle & Admin Login & Mobile Hamburger */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <ThemeToggle />

          <Link
            href="/admin"
            className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
            title="Admin Portal"
          >
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
            <span className="hidden sm:inline">Admin</span>
          </Link>

          {/* Mobile hamburger toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            type="button"
            className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white/98 dark:bg-slate-900/98 px-4 pt-3 pb-4 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-1.5 mb-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-800 dark:text-blue-300">Kelas 10 SIJA B</span>
            <span className="text-[10px] text-blue-600 dark:text-blue-400">36 Siswa</span>
          </div>

          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/40 font-semibold'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>{link.label}</span>
              </Link>
            );
          })}

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>Masuk Admin Portal</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
