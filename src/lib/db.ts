import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma.ts';
import { INITIAL_STUDENTS, INITIAL_SETTINGS } from './initial-data.ts';
import type {
  StudentRecord,
  AttendanceRecord,
  AdminUser,
  SystemSettingsRecord,
  AuditRecord,
  SubmissionStatus,
  AIStatus,
} from './types.ts';
import type { TaskType } from './rotation.ts';

interface JsonDbData {
  students: StudentRecord[];
  attendanceLogs: AttendanceRecord[];
  admins: Array<AdminUser & { passwordHash: string }>;
  sessions: Array<{ token: string; adminId: string; expiresAt: string }>;
  settings: Record<string, string>;
  auditLogs: AuditRecord[];
  notifications: Array<{ type: string; targetDate: string; recipient: string; status: string; createdAt: string }>;
  cleanupQueue: Array<{ photoPublicId: string; status: string; retryCount: number; lastError: string | null; createdAt: string }>;
}

const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

function ensureDataFile(): JsonDbData {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DATA_FILE)) {
    try {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(content);
    } catch {
      // fallback if corrupt
    }
  }

  // Generate initial database
  const students: StudentRecord[] = INITIAL_STUDENTS.map((s, idx) => ({
    id: `stu-${idx + 1}`,
    name: s.name,
    dayOfWeek: s.dayOfWeek,
    orderIndex: s.orderIndex,
    phoneNumber: s.phoneNumber || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  // Initial admin credentials: admin / admin123
  const defaultAdminHash = bcrypt.hashSync(process.env.ADMIN_INITIAL_PASSWORD || 'admin123', 10);
  const admins: Array<AdminUser & { passwordHash: string }> = [
    {
      id: 'admin-1',
      username: process.env.ADMIN_INITIAL_USERNAME || 'admin',
      name: 'Administrator',
      passwordHash: defaultAdminHash,
      phoneNumber: process.env.ADMIN_WHATSAPP_NUMBER || '081234567890',
      createdAt: new Date().toISOString(),
    },
  ];

  // Seed sample recent attendance logs for today & this week so the dashboard is immediately demonstrable
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  const sampleLogs: AttendanceRecord[] = [
    {
      id: 'att-1',
      date: today.toISOString(),
      dateString: todayStr,
      studentId: 'stu-1',
      studentName: 'Ahmad Rizki',
      dayOfWeek: 1,
      taskName: 'MBG',
      tempPhotoUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=400&q=80',
      photoPublicId: 'sample-mbg-1',
      aiStatus: 'VALID',
      aiConfidence: 0.94,
      aiDetectedItems: ['makanan', 'meja bersih', 'tempat makan', 'sendok'],
      aiReason: 'Foto menunjukkan kotak makanan MBG tertata rapi di atas meja kelas.',
      status: 'verified',
      rejectionReason: null,
      verifiedAt: new Date(Date.now() - 3600000).toISOString(),
      verifiedByAdminId: 'admin-1',
      verifiedByAdminName: 'Administrator',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'att-2',
      date: today.toISOString(),
      dateString: todayStr,
      studentId: 'stu-2',
      studentName: 'Siti Nurhaliza',
      dayOfWeek: 1,
      taskName: 'MBG',
      tempPhotoUrl: 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=400&q=80',
      photoPublicId: 'sample-mbg-2',
      aiStatus: 'VALID',
      aiConfidence: 0.92,
      aiDetectedItems: ['meja', 'kursi', 'tempat sampah', 'lantai bersih'],
      aiReason: 'Foto menunjukkan suasana kelas yang bersih dan sesuai dengan tugas MBG. Tidak terdeteksi indikasi foto palsu.',
      status: 'pending',
      rejectionReason: null,
      verifiedAt: null,
      verifiedByAdminId: null,
      verifiedByAdminName: null,
      createdAt: new Date(Date.now() - 600000).toISOString(),
      updatedAt: new Date(Date.now() - 600000).toISOString(),
    },
    {
      id: 'att-3',
      date: today.toISOString(),
      dateString: todayStr,
      studentId: 'stu-3',
      studentName: 'Budi Santoso',
      dayOfWeek: 1,
      taskName: 'Nyapu & Pel',
      tempPhotoUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80',
      photoPublicId: 'sample-nyapu-1',
      aiStatus: 'VALID',
      aiConfidence: 0.88,
      aiDetectedItems: ['sapu', 'alat pel', 'ember', 'lantai mengkilap'],
      aiReason: 'Foto memperlihatkan sapu dan lantai kelas yang telah disapu dan dipel.',
      status: 'pending',
      rejectionReason: null,
      verifiedAt: null,
      verifiedByAdminId: null,
      verifiedByAdminName: null,
      createdAt: new Date(Date.now() - 1500000).toISOString(),
      updatedAt: new Date(Date.now() - 1500000).toISOString(),
    },
    {
      id: 'att-4',
      date: today.toISOString(),
      dateString: todayStr,
      studentId: 'stu-4',
      studentName: 'Citra Dewi',
      dayOfWeek: 1,
      taskName: 'Nyapu & Pel',
      tempPhotoUrl: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=400&q=80',
      photoPublicId: 'sample-citra-1',
      aiStatus: 'INVALID',
      aiConfidence: 0.34,
      aiDetectedItems: ['selfie', 'wajah', 'ruang luar'],
      aiReason: 'Foto merupakan selfie di luar ruang kelas, tidak memperlihatkan bukti tugas piket.',
      status: 'rejected',
      rejectionReason: 'Foto tidak menampilkan bukti kebersihan kelas.',
      verifiedAt: new Date(Date.now() - 3600000).toISOString(),
      verifiedByAdminId: 'admin-1',
      verifiedByAdminName: 'Administrator',
      createdAt: new Date(Date.now() - 5400000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'att-5',
      date: today.toISOString(),
      dateString: todayStr,
      studentId: 'stu-5',
      studentName: 'Daffa Pratama',
      dayOfWeek: 1,
      taskName: 'Helper',
      tempPhotoUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=400&q=80',
      photoPublicId: 'sample-helper-1',
      aiStatus: 'VALID',
      aiConfidence: 0.95,
      aiDetectedItems: ['papan tulis bersih', 'penghapus', 'spidol rapi'],
      aiReason: 'Papan tulis kelas telah dibersihkan rapi, tempat sampah telah dikosongkan.',
      status: 'verified',
      rejectionReason: null,
      verifiedAt: new Date(Date.now() - 7200000).toISOString(),
      verifiedByAdminId: 'admin-1',
      verifiedByAdminName: 'Administrator',
      createdAt: new Date(Date.now() - 9000000).toISOString(),
      updatedAt: new Date(Date.now() - 7200000).toISOString(),
    },
  ];

  const initialData: JsonDbData = {
    students,
    attendanceLogs: sampleLogs,
    admins,
    sessions: [],
    settings: {
      adminWhatsAppNumber: process.env.ADMIN_WHATSAPP_NUMBER || '081234567890',
      classLabel: 'Kelas 10 SIJA B',
      totalStudents: '36',
    },
    auditLogs: [
      {
        id: 'audit-1',
        adminId: 'admin-1',
        adminName: 'Administrator',
        action: 'SYSTEM_INITIALIZED',
        details: 'Sistem CleanBieber diinisialisasi dengan 36 siswa Kelas 10 SIJA B.',
        createdAt: new Date().toISOString(),
      },
    ],
    notifications: [],
    cleanupQueue: [],
  };

  fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  return initialData;
}

function saveDb(data: JsonDbData): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Determine whether a usable remote database is connected
 */
function isPostgresConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.includes('postgresql'));
}

// ======================== STUDENT REPOSITORY ========================

export async function getStudents(dayOfWeek?: number): Promise<StudentRecord[]> {
  if (isPostgresConfigured()) {
    try {
      const records = await prisma.student.findMany({
        where: dayOfWeek ? { dayOfWeek } : undefined,
        orderBy: [{ dayOfWeek: 'asc' }, { orderIndex: 'asc' }],
      });
      return records.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }));
    } catch (e) {
      console.warn('Prisma getStudents failed, falling back to local DB:', e);
    }
  }

  const db = ensureDataFile();
  let list = db.students;
  if (dayOfWeek) {
    list = list.filter((s) => s.dayOfWeek === dayOfWeek);
  }
  return [...list].sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.orderIndex - b.orderIndex);
}

export async function getStudentById(id: string): Promise<StudentRecord | null> {
  if (isPostgresConfigured()) {
    try {
      const r = await prisma.student.findUnique({ where: { id } });
      if (r) {
        return {
          ...r,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        };
      }
    } catch (e) {
      console.warn('Prisma getStudentById fallback:', e);
    }
  }

  const db = ensureDataFile();
  return db.students.find((s) => s.id === id) || null;
}

export async function createStudent(data: {
  name: string;
  dayOfWeek: number;
  orderIndex: number;
  phoneNumber?: string;
}): Promise<StudentRecord> {
  const now = new Date().toISOString();
  if (isPostgresConfigured()) {
    try {
      const created = await prisma.student.create({
        data: {
          name: data.name,
          dayOfWeek: data.dayOfWeek,
          orderIndex: data.orderIndex,
          phoneNumber: data.phoneNumber || null,
        },
      });
      return {
        ...created,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      };
    } catch (e) {
      console.warn('Prisma createStudent fallback:', e);
    }
  }

  const db = ensureDataFile();
  const newStudent: StudentRecord = {
    id: `stu-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: data.name,
    dayOfWeek: data.dayOfWeek,
    orderIndex: data.orderIndex,
    phoneNumber: data.phoneNumber || null,
    createdAt: now,
    updatedAt: now,
  };
  db.students.push(newStudent);
  saveDb(db);
  return newStudent;
}

export async function updateStudent(
  id: string,
  data: Partial<Pick<StudentRecord, 'name' | 'dayOfWeek' | 'orderIndex' | 'phoneNumber'>>
): Promise<StudentRecord | null> {
  const now = new Date().toISOString();
  if (isPostgresConfigured()) {
    try {
      const updated = await prisma.student.update({
        where: { id },
        data: {
          ...data,
          phoneNumber: data.phoneNumber === undefined ? undefined : data.phoneNumber,
        },
      });
      return {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };
    } catch (e) {
      console.warn('Prisma updateStudent fallback:', e);
    }
  }

  const db = ensureDataFile();
  const idx = db.students.findIndex((s) => s.id === id);
  if (idx === -1) return null;

  db.students[idx] = {
    ...db.students[idx],
    ...data,
    updatedAt: now,
  };
  saveDb(db);
  return db.students[idx];
}

export async function deleteStudent(id: string): Promise<boolean> {
  if (isPostgresConfigured()) {
    try {
      await prisma.student.delete({ where: { id } });
      return true;
    } catch (e) {
      console.warn('Prisma deleteStudent fallback:', e);
    }
  }

  const db = ensureDataFile();
  const initialLength = db.students.length;
  db.students = db.students.filter((s) => s.id !== id);
  if (db.students.length !== initialLength) {
    saveDb(db);
    return true;
  }
  return false;
}

// ======================== ATTENDANCE LOGS REPOSITORY ========================

export async function getAttendanceLogs(filters?: {
  dateString?: string;
  status?: string;
  studentId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<AttendanceRecord[]> {
  if (isPostgresConfigured()) {
    try {
      const where: Record<string, unknown> = {};
      if (filters?.dateString) where.dateString = filters.dateString;
      if (filters?.status && filters.status !== 'all') where.status = filters.status;
      if (filters?.studentId) where.studentId = filters.studentId;
      if (filters?.startDate || filters?.endDate) {
        where.dateString = {
          gte: filters.startDate,
          lte: filters.endDate,
        };
      }

      const logs = await prisma.attendanceLog.findMany({
        where,
        include: {
          student: true,
          verifiedByAdmin: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return logs.map((l) => ({
        id: l.id,
        date: l.date.toISOString(),
        dateString: l.dateString,
        studentId: l.studentId,
        studentName: l.student.name,
        dayOfWeek: l.student.dayOfWeek,
        taskName: l.taskName as TaskType,
        tempPhotoUrl: l.tempPhotoUrl,
        photoPublicId: l.photoPublicId,
        aiStatus: l.aiStatus as AIStatus | null,
        aiConfidence: l.aiConfidence,
        aiDetectedItems: l.aiDetectedItems ? JSON.parse(l.aiDetectedItems) : null,
        aiReason: l.aiReason,
        status: l.status as SubmissionStatus,
        rejectionReason: l.rejectionReason,
        verifiedAt: l.verifiedAt ? l.verifiedAt.toISOString() : null,
        verifiedByAdminId: l.verifiedByAdminId,
        verifiedByAdminName: l.verifiedByAdmin?.name || null,
        createdAt: l.createdAt.toISOString(),
        updatedAt: l.updatedAt.toISOString(),
      }));
    } catch (e) {
      console.warn('Prisma getAttendanceLogs fallback:', e);
    }
  }

  const db = ensureDataFile();
  let list = db.attendanceLogs;

  if (filters?.dateString) {
    list = list.filter((l) => l.dateString === filters.dateString);
  }
  if (filters?.status && filters.status !== 'all') {
    list = list.filter((l) => l.status === filters.status);
  }
  if (filters?.studentId) {
    list = list.filter((l) => l.studentId === filters.studentId);
  }
  if (filters?.startDate) {
    list = list.filter((l) => l.dateString >= filters.startDate!);
  }
  if (filters?.endDate) {
    list = list.filter((l) => l.dateString <= filters.endDate!);
  }

  return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getAttendanceLogById(id: string): Promise<AttendanceRecord | null> {
  const logs = await getAttendanceLogs();
  return logs.find((l) => l.id === id) || null;
}

export async function createAttendanceLog(data: {
  dateString: string;
  studentId: string;
  studentName: string;
  dayOfWeek: number;
  taskName: TaskType;
  tempPhotoUrl: string;
  photoPublicId: string;
  aiStatus: AIStatus;
  aiConfidence: number | null;
  aiDetectedItems: string[];
  aiReason: string | null;
}): Promise<AttendanceRecord> {
  const now = new Date().toISOString();
  const dateObj = new Date(data.dateString);

  if (isPostgresConfigured()) {
    try {
      const created = await prisma.attendanceLog.create({
        data: {
          date: dateObj,
          dateString: data.dateString,
          studentId: data.studentId,
          taskName: data.taskName,
          tempPhotoUrl: data.tempPhotoUrl,
          photoPublicId: data.photoPublicId,
          aiStatus: data.aiStatus,
          aiConfidence: data.aiConfidence,
          aiDetectedItems: JSON.stringify(data.aiDetectedItems),
          aiReason: data.aiReason,
          status: 'pending',
        },
        include: { student: true },
      });

      return {
        id: created.id,
        date: created.date.toISOString(),
        dateString: created.dateString,
        studentId: created.studentId,
        studentName: created.student.name,
        dayOfWeek: created.student.dayOfWeek,
        taskName: created.taskName as TaskType,
        tempPhotoUrl: created.tempPhotoUrl,
        photoPublicId: created.photoPublicId,
        aiStatus: created.aiStatus as AIStatus,
        aiConfidence: created.aiConfidence,
        aiDetectedItems: data.aiDetectedItems,
        aiReason: created.aiReason,
        status: 'pending',
        rejectionReason: null,
        verifiedAt: null,
        verifiedByAdminId: null,
        verifiedByAdminName: null,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      };
    } catch (e) {
      console.warn('Prisma createAttendanceLog fallback:', e);
    }
  }

  const db = ensureDataFile();
  const newRecord: AttendanceRecord = {
    id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    date: dateObj.toISOString(),
    dateString: data.dateString,
    studentId: data.studentId,
    studentName: data.studentName,
    dayOfWeek: data.dayOfWeek,
    taskName: data.taskName,
    tempPhotoUrl: data.tempPhotoUrl,
    photoPublicId: data.photoPublicId,
    aiStatus: data.aiStatus,
    aiConfidence: data.aiConfidence,
    aiDetectedItems: data.aiDetectedItems,
    aiReason: data.aiReason,
    status: 'pending',
    rejectionReason: null,
    verifiedAt: null,
    verifiedByAdminId: null,
    verifiedByAdminName: null,
    createdAt: now,
    updatedAt: now,
  };

  db.attendanceLogs.unshift(newRecord);
  saveDb(db);
  return newRecord;
}

export async function moderateAttendanceLog(
  id: string,
  data: {
    status: 'verified' | 'rejected';
    rejectionReason?: string;
    adminId: string;
    adminName: string;
    clearPhoto?: boolean;
  }
): Promise<AttendanceRecord | null> {
  const now = new Date().toISOString();

  if (isPostgresConfigured()) {
    try {
      const updated = await prisma.attendanceLog.update({
        where: { id },
        data: {
          status: data.status,
          rejectionReason: data.rejectionReason || null,
          verifiedAt: new Date(),
          verifiedByAdminId: data.adminId,
          ...(data.clearPhoto ? { tempPhotoUrl: null, photoPublicId: null } : {}),
        },
        include: { student: true, verifiedByAdmin: true },
      });

      return {
        id: updated.id,
        date: updated.date.toISOString(),
        dateString: updated.dateString,
        studentId: updated.studentId,
        studentName: updated.student.name,
        dayOfWeek: updated.student.dayOfWeek,
        taskName: updated.taskName as TaskType,
        tempPhotoUrl: updated.tempPhotoUrl,
        photoPublicId: updated.photoPublicId,
        aiStatus: updated.aiStatus as AIStatus | null,
        aiConfidence: updated.aiConfidence,
        aiDetectedItems: updated.aiDetectedItems ? JSON.parse(updated.aiDetectedItems) : null,
        aiReason: updated.aiReason,
        status: updated.status as SubmissionStatus,
        rejectionReason: updated.rejectionReason,
        verifiedAt: updated.verifiedAt ? updated.verifiedAt.toISOString() : null,
        verifiedByAdminId: updated.verifiedByAdminId,
        verifiedByAdminName: updated.verifiedByAdmin?.name || null,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };
    } catch (e) {
      console.warn('Prisma moderateAttendanceLog fallback:', e);
    }
  }

  const db = ensureDataFile();
  const idx = db.attendanceLogs.findIndex((l) => l.id === id);
  if (idx === -1) return null;

  db.attendanceLogs[idx] = {
    ...db.attendanceLogs[idx],
    status: data.status,
    rejectionReason: data.rejectionReason || null,
    verifiedAt: now,
    verifiedByAdminId: data.adminId,
    verifiedByAdminName: data.adminName,
    updatedAt: now,
    ...(data.clearPhoto ? { tempPhotoUrl: null, photoPublicId: null } : {}),
  };

  saveDb(db);
  return db.attendanceLogs[idx];
}

// ======================== ADMIN & AUTH REPOSITORY ========================

export async function getAdminByUsername(username: string): Promise<(AdminUser & { passwordHash: string }) | null> {
  if (isPostgresConfigured()) {
    try {
      const a = await prisma.admin.findUnique({ where: { username } });
      if (a) {
        return {
          id: a.id,
          username: a.username,
          name: a.name || 'Administrator',
          phoneNumber: a.phoneNumber,
          passwordHash: a.passwordHash,
          createdAt: a.createdAt.toISOString(),
        };
      }
    } catch (e) {
      console.warn('Prisma getAdminByUsername fallback:', e);
    }
  }

  const db = ensureDataFile();
  return db.admins.find((a) => a.username.toLowerCase() === username.toLowerCase()) || null;
}

export async function getAdminById(id: string): Promise<AdminUser | null> {
  if (isPostgresConfigured()) {
    try {
      const a = await prisma.admin.findUnique({ where: { id } });
      if (a) {
        return {
          id: a.id,
          username: a.username,
          name: a.name || 'Administrator',
          phoneNumber: a.phoneNumber,
          createdAt: a.createdAt.toISOString(),
        };
      }
    } catch (e) {
      console.warn('Prisma getAdminById fallback:', e);
    }
  }

  const db = ensureDataFile();
  const found = db.admins.find((a) => a.id === id);
  if (!found) return null;
  const { passwordHash: _, ...user } = found;
  return user;
}

export async function updateAdminPassword(adminId: string, newPasswordHash: string): Promise<boolean> {
  if (isPostgresConfigured()) {
    try {
      await prisma.admin.update({
        where: { id: adminId },
        data: { passwordHash: newPasswordHash },
      });
      return true;
    } catch (e) {
      console.warn('Prisma updateAdminPassword fallback:', e);
    }
  }

  const db = ensureDataFile();
  const idx = db.admins.findIndex((a) => a.id === adminId);
  if (idx !== -1) {
    db.admins[idx].passwordHash = newPasswordHash;
    saveDb(db);
    return true;
  }
  return false;
}

export async function createSession(adminId: string, token: string, expiresAt: Date): Promise<void> {
  if (isPostgresConfigured()) {
    try {
      await prisma.adminSession.create({
        data: {
          adminId,
          token,
          expiresAt,
        },
      });
      return;
    } catch (e) {
      console.warn('Prisma createSession fallback:', e);
    }
  }

  const db = ensureDataFile();
  db.sessions.push({
    adminId,
    token,
    expiresAt: expiresAt.toISOString(),
  });
  saveDb(db);
}

export async function getSession(token: string): Promise<AdminUser | null> {
  const now = new Date();
  if (isPostgresConfigured()) {
    try {
      const s = await prisma.adminSession.findUnique({
        where: { token },
        include: { admin: true },
      });
      if (s && s.expiresAt > now) {
        return {
          id: s.admin.id,
          username: s.admin.username,
          name: s.admin.name || 'Administrator',
          phoneNumber: s.admin.phoneNumber,
          createdAt: s.admin.createdAt.toISOString(),
        };
      }
    } catch (e) {
      console.warn('Prisma getSession fallback:', e);
    }
  }

  const db = ensureDataFile();
  const s = db.sessions.find((item) => item.token === token);
  if (s && new Date(s.expiresAt) > now) {
    return getAdminById(s.adminId);
  }
  return null;
}

export async function deleteSession(token: string): Promise<void> {
  if (isPostgresConfigured()) {
    try {
      await prisma.adminSession.delete({ where: { token } });
      return;
    } catch (e) {
      console.warn('Prisma deleteSession fallback:', e);
    }
  }

  const db = ensureDataFile();
  db.sessions = db.sessions.filter((s) => s.token !== token);
  saveDb(db);
}

// ======================== SYSTEM SETTINGS & AUDIT ========================

export async function getSystemSettings(): Promise<SystemSettingsRecord> {
  const db = ensureDataFile();
  return {
    adminWhatsAppNumber: db.settings.adminWhatsAppNumber || process.env.ADMIN_WHATSAPP_NUMBER || '081234567890',
    fonnteTokenConfigured: Boolean(process.env.FONNTE_TOKEN),
    cloudinaryConfigured: Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    allowPublicSubmissions: db.settings.allowPublicSubmissions !== 'false',
    reminderHour: parseInt(db.settings.reminderHour || '20', 10),
    classLabel: db.settings.classLabel || 'Kelas 10 SIJA B',
    totalStudents: db.students.length,
  };
}

export async function updateSystemSetting(key: string, value: string): Promise<void> {
  const db = ensureDataFile();
  db.settings[key] = value;
  saveDb(db);
}

export async function addAuditLog(action: string, adminId?: string, details?: string, ipAddress?: string): Promise<void> {
  const admin = adminId ? await getAdminById(adminId) : null;
  const db = ensureDataFile();
  const log: AuditRecord = {
    id: `audit-${Date.now()}`,
    adminId: adminId || null,
    adminName: admin?.name || 'Sistem',
    action,
    details: details || null,
    ipAddress: ipAddress || null,
    createdAt: new Date().toISOString(),
  };
  db.auditLogs.unshift(log);
  if (db.auditLogs.length > 200) {
    db.auditLogs = db.auditLogs.slice(0, 200);
  }
  saveDb(db);
}

export async function getAuditLogs(limit: number = 20): Promise<AuditRecord[]> {
  const db = ensureDataFile();
  return db.auditLogs.slice(0, limit);
}

// ======================== NOTIFICATION & CLEANUP LOGS ========================

export async function hasNotificationBeenSent(type: string, targetDate: string, recipient: string): Promise<boolean> {
  const db = ensureDataFile();
  return db.notifications.some((n) => n.type === type && n.targetDate === targetDate && n.recipient === recipient && n.status === 'SUCCESS');
}

export async function recordNotificationLog(type: string, targetDate: string, recipient: string, status: string): Promise<void> {
  const db = ensureDataFile();
  db.notifications.push({
    type,
    targetDate,
    recipient,
    status,
    createdAt: new Date().toISOString(),
  });
  saveDb(db);
}

export async function addToCleanupQueue(photoPublicId: string): Promise<void> {
  const db = ensureDataFile();
  if (!db.cleanupQueue.some((c) => c.photoPublicId === photoPublicId && c.status === 'PENDING')) {
    db.cleanupQueue.push({
      photoPublicId,
      status: 'PENDING',
      retryCount: 0,
      lastError: null,
      createdAt: new Date().toISOString(),
    });
    saveDb(db);
  }
}

export async function getPendingCleanups(): Promise<Array<{ photoPublicId: string; retryCount: number }>> {
  const db = ensureDataFile();
  return db.cleanupQueue.filter((c) => c.status === 'PENDING');
}

export async function markCleanupCompleted(photoPublicId: string): Promise<void> {
  const db = ensureDataFile();
  const item = db.cleanupQueue.find((c) => c.photoPublicId === photoPublicId);
  if (item) {
    item.status = 'CLEANED';
    saveDb(db);
  }
}
