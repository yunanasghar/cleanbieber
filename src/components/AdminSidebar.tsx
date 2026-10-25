'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  CheckCircle,
  Users,
  BarChart3,
  FileSpreadsheet,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  ExternalLink,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import CleanBieberLogo from './CleanBieberLogo';
import type { AdminUser } from '@/lib/types';

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [admin, setAdmin] = useState<AdminUser | null>(null);

  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setAdmin(data.admin);
        } else {
          // If not authenticated, redirect to login
          if (pathname !== '/admin/login') {
            router.push('/admin/login');
          }
        }
      } catch (err) {
        console.error('Auth check error:', err);
      }
    }
    fetchMe();
  }, [pathname, router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin/login');
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const navItems = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Verifikasi Bukti', href: '/admin/verifikasi', icon: CheckCircle },
    { label: 'Kelola Jadwal', href: '/admin/jadwal', icon: Calendar },
    { label: 'Daftar Siswa', href: '/admin/siswa', icon: Users },
    { label: 'Statistik & Analisis', href: '/admin/statistik', icon: BarChart3 },
    { label: 'Rekap & Laporan', href: '/admin/rekap', icon: FileSpreadsheet },
    { label: 'Pengaturan Sistem', href: '/admin/pengaturan', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Top Header */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-15 bg-white dark:bg-[#102238] border-b border-[#e1e7ef] dark:border-slate-800">
        <Link href="/admin" className="flex items-center gap-2">
          <CleanBieberLogo size={26} showText={true} textColor="text-[#172b46] dark:text-white" />
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#edf3f9] text-[#172b46] dark:bg-slate-800 dark:text-blue-300 border border-blue-100 dark:border-slate-700">
            Admin
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle admin navigation"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Desktop Persistent Dark Navy Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#172b46] text-white border-r border-[#102238] flex flex-col justify-between transition-transform duration-200 select-none lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          {/* Brand header */}
          <div className="h-20 flex items-center justify-between px-6 border-b border-white/5">
            <Link href="/admin" className="flex items-center gap-2">
              <CleanBieberLogo size={32} showText={true} textColor="text-white" />
            </Link>

            <div className="hidden lg:block">
              <ThemeToggle />
            </div>
          </div>

          {/* Admin Tag */}
          <div className="px-6">
            <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">Panel Administrator</span>
              <span className="text-[10px] font-medium text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Aktif
              </span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="px-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-280px)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-[#203656] text-white shadow-xs font-semibold'
                      : 'text-[#94a3b8] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-[#8494ab]'
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Profile & Actions */}
        <div className="p-4 border-t border-white/5 space-y-3">
          <div className="rounded-2xl bg-[#102238]/90 border border-white/10 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-slate-200 font-bold shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {admin?.name || 'Administrator'}
                </p>
                <p className="text-[11px] text-[#7e8ea6] truncate">@{admin?.username || 'admin'}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/5 transition-colors"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="pt-0.5">
            <Link
              href="/"
              target="_blank"
              className="flex items-center justify-center gap-1.5 w-full text-center py-2 rounded-xl text-xs font-medium text-[#94a3b8] hover:text-white hover:bg-white/5 transition-colors border border-white/5"
            >
              <span>Buka Beranda Siswa</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-xs lg:hidden animate-in fade-in duration-150"
        />
      )}
    </>
  );
}
