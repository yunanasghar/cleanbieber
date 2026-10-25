import React from 'react';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f7fa] dark:bg-[#0c1624] text-[#172b46] dark:text-slate-100 flex flex-col font-sans transition-colors w-full max-w-full overflow-x-hidden">
      <AdminSidebar />
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0 w-full max-w-full overflow-x-hidden pb-12">
        {children}
      </div>
    </div>
  );
}
