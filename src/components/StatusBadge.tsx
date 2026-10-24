import React from 'react';
import type { SubmissionStatus } from '@/lib/types';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';

export default function StatusBadge({
  status,
  size = 'sm',
}: {
  status: SubmissionStatus;
  size?: 'sm' | 'md';
}) {
  const sizeClass = size === 'sm' ? 'text-xs px-2.5 py-0.5' : 'text-xs px-3 py-1 font-medium';

  switch (status) {
    case 'verified':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 ${sizeClass}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Verified</span>
        </span>
      );
    case 'rejected':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800 ${sizeClass}`}
        >
          <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          <span>Rejected</span>
        </span>
      );
    case 'pending':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800 ${sizeClass}`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>Pending</span>
        </span>
      );
  }
}
