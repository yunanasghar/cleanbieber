/**
 * CleanBieber Task Assignment & Rotation Engine
 * Class: Kelas 10 SIJA B (36 Siswa)
 * Timezone: Asia/Jakarta
 */

export type TaskType = 'MBG' | 'Nyapu & Pel' | 'Helper';

export interface TaskInfo {
  type: TaskType;
  title: string;
  fullName: string;
  timeRange: string;
  description: string;
  badgeBg: string;
  badgeText: string;
  dotColor: string;
}

export const TASK_DEFINITIONS: Record<TaskType, TaskInfo> = {
  'MBG': {
    type: 'MBG',
    title: 'MBG',
    fullName: 'Makanan Bergizi Gratis',
    timeRange: 'Pukul 07:00 - 09:00',
    description: 'Menyiapkan, mendistribusikan, dan merapikan konsumsi program MBG siswa.',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    badgeText: 'text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    dotColor: 'bg-emerald-500',
  },
  'Nyapu & Pel': {
    type: 'Nyapu & Pel',
    title: 'Nyapu & Pel',
    fullName: 'Menyapu & Mengepel Ruang Kelas',
    timeRange: 'Pukul 15:00 - 16:30',
    description: 'Menyapu seluruh lantai kelas, mengepel, membersihkan kolong meja, dan merapikan kursi.',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/40',
    badgeText: 'text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    dotColor: 'bg-blue-500',
  },
  'Helper': {
    type: 'Helper',
    title: 'Helper',
    fullName: 'Koordinator & Pendukung Kelas',
    timeRange: 'Pukul 07:00 - 16:30',
    description: 'Membantu perlengkapan, membuang tempat sampah, membersihkan papan tulis, dan koordinasi.',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/40',
    badgeText: 'text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    dotColor: 'bg-purple-500',
  },
};

export const DAY_NAMES: Record<number, string> = {
  1: 'Senin',
  2: 'Selasa',
  3: 'Rabu',
  4: 'Kamis',
  5: 'Jumat',
  6: 'Sabtu',
  7: 'Minggu',
};

/**
 * Returns the base task-slots array for a given dayOfWeek.
 * Monday (1) to Thursday (4): 7 students -> 4 MBG, 2 Nyapu & Pel, 1 Helper
 * Friday (5): 8 students -> 4 MBG, 3 Nyapu & Pel, 1 Helper
 */
export function getBaseTaskSlots(dayOfWeek: number): TaskType[] {
  if (dayOfWeek === 5) {
    // Friday: 4 MBG, 3 Nyapu & Pel, 1 Helper
    return ['MBG', 'MBG', 'MBG', 'MBG', 'Nyapu & Pel', 'Nyapu & Pel', 'Nyapu & Pel', 'Helper'];
  }
  // Monday to Thursday: 4 MBG, 2 Nyapu & Pel, 1 Helper
  return ['MBG', 'MBG', 'MBG', 'MBG', 'Nyapu & Pel', 'Nyapu & Pel', 'Helper'];
}

/**
 * Standard ISO 8601 Week Number and Week-Year calculator
 * Calculates based on Asia/Jakarta local calendar date.
 */
export function getISOWeekInfo(inputDate: Date | string = new Date()): {
  isoWeek: number;
  isoYear: number;
  dayOfWeek: number;
  dateString: string;
} {
  // Convert to Asia/Jakarta date representation
  const d = typeof inputDate === 'string' ? new Date(inputDate) : new Date(inputDate.getTime());
  
  // Format to Asia/Jakarta parts to avoid UTC boundary shifts
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  });

  const parts = formatter.formatToParts(d);
  let year = 0;
  let month = 0;
  let day = 0;
  for (const part of parts) {
    if (part.type === 'year') year = parseInt(part.value, 10);
    if (part.type === 'month') month = parseInt(part.value, 10);
    if (part.type === 'day') day = parseInt(part.value, 10);
  }

  // Create date at midnight in UTC corresponding to Jakarta day
  const target = new Date(Date.UTC(year, month - 1, day));
  
  // ISO day of week: 1 (Mon) .. 7 (Sun)
  const dayNr = (target.getUTCDay() + 6) % 7 + 1;

  // Set target to nearest Thursday: current date + 4 - current day number
  target.setUTCDate(target.getUTCDate() + 4 - dayNr);

  // Year of this Thursday is the ISO week year
  const isoYear = target.getUTCFullYear();

  // The first week of the ISO year has Thursday in it
  const firstThursday = new Date(Date.UTC(isoYear, 0, 4));
  const firstThursdayDayNr = (firstThursday.getUTCDay() + 6) % 7 + 1;
  firstThursday.setUTCDate(firstThursday.getUTCDate() + 4 - firstThursdayDayNr);

  // Calculate week number
  const weekDiff = Math.round((target.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000));
  const isoWeek = 1 + weekDiff;

  // Format dateString "YYYY-MM-DD"
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  const dateString = `${year}-${mm}-${dd}`;

  return {
    isoWeek,
    isoYear,
    dayOfWeek: dayNr,
    dateString,
  };
}

/**
 * Deterministic Task Assignment Engine:
 * For any given day, week, year, and student's orderIndex:
 * - Sorts base task slots
 * - Applies deterministic offset: (isoYear * 53 + isoWeek) % slotCount
 * - Maps orderIndex -> rotatedTaskSlot
 */
export function getAssignedTask(
  dayOfWeek: number,
  orderIndex: number,
  isoWeek: number,
  isoYear: number
): TaskType {
  const baseSlots = getBaseTaskSlots(dayOfWeek);
  const slotCount = baseSlots.length;
  
  // Deterministic offset based on ISO year and ISO week
  const offset = Math.abs(isoYear * 53 + isoWeek) % slotCount;
  
  const assignedIndex = (orderIndex + offset) % slotCount;
  return baseSlots[assignedIndex];
}

/**
 * Helper to calculate all duty assignments for a given day's roster
 */
export function calculateDayAssignments<T extends { orderIndex: number }>(
  students: T[],
  dayOfWeek: number,
  isoWeek: number,
  isoYear: number
): Array<T & { taskName: TaskType; taskInfo: TaskInfo }> {
  const sorted = [...students].sort((a, b) => a.orderIndex - b.orderIndex);
  
  return sorted.map((student) => {
    const taskName = getAssignedTask(dayOfWeek, student.orderIndex, isoWeek, isoYear);
    return {
      ...student,
      taskName,
      taskInfo: TASK_DEFINITIONS[taskName],
    };
  });
}

/**
 * Returns formatted Indonesian date, e.g. "Senin, 28 April 2025"
 */
export function formatIndonesianDate(input: Date | string): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

/**
 * Returns start (Monday) and end (Friday) dates for a given ISO week
 */
export function getWeekDateRange(isoWeek: number, isoYear: number): {
  startDate: string;
  endDate: string;
  label: string;
} {
  // Find Monday of ISO week
  const simple = new Date(Date.UTC(isoYear, 0, 1 + (isoWeek - 1) * 7));
  const dow = (simple.getUTCDay() + 6) % 7 + 1;
  const monday = new Date(simple);
  if (dow <= 4) {
    monday.setUTCDate(simple.getUTCDate() - dow + 1);
  } else {
    monday.setUTCDate(simple.getUTCDate() + 8 - dow);
  }

  const friday = new Date(monday);
  friday.setUTCDate(monday.getUTCDate() + 4);

  const startStr = monday.toISOString().split('T')[0];
  const endStr = friday.toISOString().split('T')[0];

  const mFormat = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' });
  const fFormat = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  return {
    startDate: startStr,
    endDate: endStr,
    label: `${mFormat.format(monday)} - ${fFormat.format(friday)}`,
  };
}
