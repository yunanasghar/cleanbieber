import type { TaskType } from './rotation';

export interface StudentRecord {
  id: string;
  name: string;
  dayOfWeek: number; // 1 = Senin, 2 = Selasa, 3 = Rabu, 4 = Kamis, 5 = Jumat
  orderIndex: number;
  phoneNumber?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type SubmissionStatus = 'pending' | 'verified' | 'rejected' | 'excused';
export type AIStatus = 'VALID' | 'INVALID' | 'UNAVAILABLE' | 'FAILED';

export interface AttendanceRecord {
  id: string;
  date: string; // ISO date string
  dateString: string; // "YYYY-MM-DD"
  studentId: string;
  studentName?: string;
  dayOfWeek?: number;
  taskName: TaskType;
  tempPhotoUrl: string | null;
  photoPublicId: string | null;
  aiStatus: AIStatus | null;
  aiConfidence: number | null;
  aiDetectedItems: string[] | null;
  aiReason: string | null;
  status: SubmissionStatus;
  rejectionReason: string | null;
  verifiedAt: string | null;
  verifiedByAdminId: string | null;
  verifiedByAdminName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  username: string;
  name: string;
  phoneNumber?: string | null;
  createdAt: string;
}

export interface SystemSettingsRecord {
  adminWhatsAppNumber: string;
  adminWhatsAppNumbers: string[];
  fonnteTokenConfigured: boolean;
  cloudinaryConfigured: boolean;
  geminiConfigured: boolean;
  allowPublicSubmissions: boolean;
  reminderHour: number; // 20
  classLabel: string; // 'Kelas 10 SIJA B'
  totalStudents: number; // 36
}

export interface AuditRecord {
  id: string;
  adminId: string | null;
  adminName?: string | null;
  action: string;
  details: string | null;
  ipAddress?: string | null;
  createdAt: string;
}
