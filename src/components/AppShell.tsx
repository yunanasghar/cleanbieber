'use client';

import React, { useState, useEffect } from 'react';
import AppSidebar from '@/components/AppSidebar';
import AppHeader from '@/components/AppHeader';
import MobileBottomNav from '@/components/MobileBottomNav';
import StudentSelectModal from '@/components/StudentSelectModal';
import NotificationModal from '@/components/NotificationModal';
import WeeklyRecapModal from '@/components/WeeklyRecapModal';
import { getISOWeekInfo, formatIndonesianDate, getWeekDateRange } from '@/lib/rotation';
import type { StudentRecord } from '@/lib/types';

interface AppShellProps {
  children: React.ReactNode;
  pageTitle?: string;
  pageSubtitle?: string;
}

export default function AppShell({ children, pageTitle, pageSubtitle }: AppShellProps) {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isRecapModalOpen, setIsRecapModalOpen] = useState(false);

  const [dateInfo, setDateInfo] = useState({
    isoWeek: 43,
    isoYear: 2026,
    dayOfWeek: 1,
    dateString: '2026-10-26',
  });
  const [formattedDate, setFormattedDate] = useState('Senin, 26 Oktober 2026');

  useEffect(() => {
    const now = new Date();
    setDateInfo(getISOWeekInfo(now));
    setFormattedDate(formatIndonesianDate(now));

    try {
      const savedId = localStorage.getItem('cleanbieber_student_id');
      if (savedId) {
        setSelectedStudentId(savedId);
      }
    } catch {
      // ignore
    }

    // Fetch students list for student selector modal
    async function fetchStudents() {
      try {
        const res = await fetch('/api/students');
        if (res.ok) {
          const data = await res.json();
          setStudents(data.students || []);
        }
      } catch (err) {
        console.error('Failed to load students in AppShell:', err);
      }
    }
    fetchStudents();
  }, []);

  const handleSelectStudent = (id: string) => {
    setSelectedStudentId(id);
    try {
      if (id) {
        localStorage.setItem('cleanbieber_student_id', id);
      } else {
        localStorage.removeItem('cleanbieber_student_id');
      }
    } catch {
      // ignore
    }
  };

  const selectedStudent = students.find((s) => s.id === selectedStudentId);
  const weekRange = getWeekDateRange(dateInfo.isoWeek, dateInfo.isoYear);
  const weekRangeText = `${weekRange.startDate.split('-')[2]} – ${weekRange.endDate.split('-')[2]} Okt 2026`;

  return (
    <div className="min-h-screen bg-[#f5f7fa] dark:bg-[#0c1624] text-[#172b46] dark:text-slate-100 flex flex-col font-sans transition-colors w-full max-w-full overflow-x-hidden pb-20 lg:pb-8">
      {/* Desktop Fixed Dark Navy Sidebar */}
      <AppSidebar
        onOpenNotifications={() => setIsNotificationModalOpen(true)}
        onOpenRecap={() => setIsRecapModalOpen(true)}
      />

      {/* Main Viewport Container */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0 w-full max-w-full">
        {/* Top Header */}
        <AppHeader
          selectedStudent={selectedStudent}
          formattedDate={formattedDate}
          onOpenStudentModal={() => setIsStudentModalOpen(true)}
          onOpenNotifications={() => setIsNotificationModalOpen(true)}
          onOpenRecap={() => setIsRecapModalOpen(true)}
          pageTitle={pageTitle}
          pageSubtitle={pageSubtitle}
        />

        {/* Content Body */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-4 space-y-6 min-w-0">
          {children}
        </main>

        {/* Desktop Footer */}
        <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-xs text-[#66758a] dark:text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-[#e1e7ef]/60 dark:border-slate-800 mt-8">
          <p>CleanBieber &copy; 2026 | Kelas 10 SIJA B</p>
          <p className="italic">Bersih Kelasnya, Nyaman Belajarnya</p>
        </footer>
      </div>

      {/* Mobile Bottom Navigation Bar (< lg) */}
      <MobileBottomNav onOpenMore={() => setIsNotificationModalOpen(true)} />

      {/* Modals */}
      <StudentSelectModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        students={students}
        selectedStudentId={selectedStudentId}
        onSelectStudent={handleSelectStudent}
      />

      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
      />

      <WeeklyRecapModal
        isOpen={isRecapModalOpen}
        onClose={() => setIsRecapModalOpen(false)}
        weekRangeText={weekRangeText}
        totalDuties={36}
        verifiedCount={0}
        pendingCount={0}
        rejectedCount={0}
        percentage={85}
      />
    </div>
  );
}
