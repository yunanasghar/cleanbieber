'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Camera, CheckCircle2, MoreHorizontal } from 'lucide-react';

interface MobileBottomNavProps {
  onOpenMore: () => void;
}

export default function MobileBottomNav({ onOpenMore }: MobileBottomNavProps) {
  const pathname = usePathname();

  const tabs = [
    {
      label: 'Beranda',
      href: '/',
      icon: Home,
      isActive: pathname === '/',
    },
    {
      label: 'Jadwal',
      href: '/jadwal',
      icon: Calendar,
      isActive: pathname.startsWith('/jadwal'),
    },
    {
      label: 'Upload',
      href: '/unggah',
      icon: Camera,
      isActive: pathname.startsWith('/unggah'),
    },
    {
      label: 'Status',
      href: '/status',
      icon: CheckCircle2,
      isActive: pathname.startsWith('/status'),
    },
    {
      label: 'Lainnya',
      href: '#more',
      icon: MoreHorizontal,
      isActive: false,
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        onOpenMore();
      },
    },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white/98 dark:bg-[#102238]/98 backdrop-blur-md border-t border-[#e1e7ef] dark:border-slate-800 z-40 px-1 py-1 transition-colors shadow-lg">
      <div className="grid grid-cols-5 items-center w-full max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.label}
              href={tab.href}
              onClick={tab.onClick}
              className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-lg transition-all min-w-0 ${
                tab.isActive
                  ? 'text-[#172b46] dark:text-blue-300 font-bold'
                  : 'text-[#66758a] dark:text-slate-400 hover:text-[#172b46]'
              }`}
            >
              <div className="p-0.5 rounded-md">
                <Icon className={`w-5 h-5 stroke-[2] ${tab.isActive ? 'stroke-[2.5]' : ''}`} />
              </div>
              <span className="text-[10px] tracking-tight leading-none mt-1 truncate max-w-full text-center">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
