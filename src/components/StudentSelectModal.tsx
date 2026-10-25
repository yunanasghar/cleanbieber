'use client';

import React, { useState } from 'react';
import { X, Search, UserCheck, Check, Sparkles } from 'lucide-react';
import type { StudentRecord } from '@/lib/types';
import { DAY_NAMES } from '@/lib/rotation';

interface StudentSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: StudentRecord[];
  selectedStudentId: string;
  onSelectStudent: (id: string) => void;
}

export default function StudentSelectModal({
  isOpen,
  onClose,
  students,
  selectedStudentId,
  onSelectStudent,
}: StudentSelectModalProps) {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md bg-white dark:bg-[#102238] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#edf3f9] dark:bg-slate-800 flex items-center justify-center text-[#172b46] dark:text-blue-400">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#172b46] dark:text-white">
                Pilih Nama Siswa
              </h3>
              <p className="text-xs text-[#66758a] dark:text-slate-400">
                Pilih namamu untuk personalisasi jadwal piket
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama siswa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:border-[#172b46] text-slate-900 dark:text-white"
              autoFocus
            />
          </div>
        </div>

        {/* Student list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-slate-100/50 dark:divide-slate-800/50">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Tidak ada siswa dengan nama &quot;{search}&quot;
            </div>
          ) : (
            filtered.map((student) => {
              const isSelected = student.id === selectedStudentId;
              const dayName = DAY_NAMES[student.dayOfWeek] || `Hari ${student.dayOfWeek}`;

              return (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => {
                    onSelectStudent(student.id);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs sm:text-sm transition-all ${
                    isSelected
                      ? 'bg-[#edf3f9] text-[#172b46] font-medium dark:bg-blue-950/60 dark:text-blue-200'
                      : 'hover:bg-slate-50 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-semibold text-xs shrink-0 ${
                        isSelected
                          ? 'bg-[#172b46] text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {student.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{student.name}</p>
                      <p className="text-[11px] text-[#66758a] dark:text-slate-400">
                        Hari Piket: {dayName}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="shrink-0 w-5 h-5 rounded-full bg-[#237a57] text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
          {selectedStudentId ? (
            <button
              type="button"
              onClick={() => {
                onSelectStudent('');
                onClose();
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium"
            >
              Reset identitas siswa
            </button>
          ) : (
            <span className="text-xs text-[#66758a] dark:text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> 36 Siswa Kelas 10 SIJA B
            </span>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
