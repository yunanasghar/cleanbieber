'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Calendar,
  Camera,
  CheckCircle2,
  Users,
  FileSpreadsheet,
  Bell,
  Sparkles,
} from 'lucide-react';
import CleanBieberLogo from './CleanBieberLogo';

interface AppSidebarProps {
  onOpenNotifications?: () => void;
  onOpenRecap?: () => void;
}

export default function AppSidebar({
  onOpenNotifications,
  onOpenRecap,
}: AppSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Dashboard',
      href: '/',
      icon: Home,
      isActive: pathname === '/',
    },
    {
      label: 'Jadwal Piket',
      href: '/jadwal',
      icon: Calendar,
      isActive: pathname.startsWith('/jadwal'),
    },
    {
      label: 'Upload Bukti',
      href: '/unggah',
      icon: Camera,
      isActive: pathname.startsWith('/unggah'),
    },
    {
      label: 'Status Bukti',
      href: '/status',
      icon: CheckCircle2,
      isActive: pathname.startsWith('/status'),
    },
    {
      label: 'Daftar Siswa',
      href: '/siswa',
      icon: Users,
      isActive: pathname.startsWith('/siswa'),
    },
    {
      label: 'Rekap Kebersihan',
      href: '/admin/rekap',
      icon: FileSpreadsheet,
      isActive: pathname.startsWith('/admin/rekap'),
      onClick: (e: React.MouseEvent) => {
        if (onOpenRecap) {
          e.preventDefault();
          onOpenRecap();
        }
      },
    },
    {
      label: 'Notifikasi',
      href: '#notifikasi',
      icon: Bell,
      isActive: false,
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        if (onOpenNotifications) {
          onOpenNotifications();
        }
      },
    },
  ];

  return (
    <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-64 bg-[#172b46] text-white z-30 select-none border-r border-[#102238]">
      {/* Top Brand Logo */}
      <div className="h-20 flex items-center px-6 border-b border-white/5">
        <Link href="/" className="flex items-center gap-2 group transition-opacity hover:opacity-95">
          <CleanBieberLogo size={32} showText={true} textColor="text-white" />
        </Link>
      </div>

      {/* Main Navigation Items */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={item.onClick}
              className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                item.isActive
                  ? 'bg-[#203656] text-white shadow-xs'
                  : 'text-[#94a3b8] hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  item.isActive ? 'text-white' : 'text-[#8494ab] group-hover:text-white'
                }`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Motivational Badge */}
      <div className="p-4 border-t border-white/5">
        <div className="rounded-2xl bg-[#102238]/90 border border-white/10 p-4 space-y-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-white leading-snug">
              Kelas bersih semangat belajar lebih baik!
            </p>
            <p className="text-[11px] font-medium text-[#7e8ea6]">10 SIJA B</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
