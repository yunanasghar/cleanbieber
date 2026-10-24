import React from 'react';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b1120] text-slate-900 dark:text-slate-100 flex flex-col transition-colors w-full max-w-full overflow-x-hidden">
      <AdminSidebar />
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0 w-full max-w-full overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}
