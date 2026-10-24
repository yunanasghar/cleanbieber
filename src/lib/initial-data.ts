import type { StudentRecord } from './types';

export const INITIAL_STUDENTS: Array<Omit<StudentRecord, 'id' | 'createdAt' | 'updatedAt'>> = [
  // SENIN (7 Siswa)
  { name: 'Ahmad Rizki', dayOfWeek: 1, orderIndex: 0, phoneNumber: '081234567801' },
  { name: 'Siti Nurhaliza', dayOfWeek: 1, orderIndex: 1, phoneNumber: '081234567802' },
  { name: 'Budi Santoso', dayOfWeek: 1, orderIndex: 2, phoneNumber: '081234567803' },
  { name: 'Citra Dewi', dayOfWeek: 1, orderIndex: 3, phoneNumber: '081234567804' },
  { name: 'Daffa Pratama', dayOfWeek: 1, orderIndex: 4, phoneNumber: '081234567805' },
  { name: 'Nayla Putri', dayOfWeek: 1, orderIndex: 5, phoneNumber: '081234567806' },
  { name: 'Rizky Maulana', dayOfWeek: 1, orderIndex: 6, phoneNumber: '081234567807' },

  // SELASA (7 Siswa)
  { name: 'Fajar Ardiansyah', dayOfWeek: 2, orderIndex: 0, phoneNumber: '081234567808' },
  { name: 'Intan Permata', dayOfWeek: 2, orderIndex: 1, phoneNumber: '081234567809' },
  { name: 'Joko Susilo', dayOfWeek: 2, orderIndex: 2, phoneNumber: '081234567810' },
  { name: 'Lia Anggraeni', dayOfWeek: 2, orderIndex: 3, phoneNumber: '081234567811' },
  { name: 'Muhammad Iqbal', dayOfWeek: 2, orderIndex: 4, phoneNumber: '081234567812' },
  { name: 'Nabila Hasanah', dayOfWeek: 2, orderIndex: 5, phoneNumber: '081234567813' },
  { name: 'Rafi Pratama', dayOfWeek: 2, orderIndex: 6, phoneNumber: '081234567814' },

  // RABU (7 Siswa)
  { name: 'Salsa Putri', dayOfWeek: 3, orderIndex: 0, phoneNumber: '081234567815' },
  { name: 'Reza Fanani', dayOfWeek: 3, orderIndex: 1, phoneNumber: '081234567816' },
  { name: 'Dinda Lestari', dayOfWeek: 3, orderIndex: 2, phoneNumber: '081234567817' },
  { name: 'Fikri Ramadhan', dayOfWeek: 3, orderIndex: 3, phoneNumber: '081234567818' },
  { name: 'Ayu Lestari', dayOfWeek: 3, orderIndex: 4, phoneNumber: '081234567819' },
  { name: 'Dimas Saputra', dayOfWeek: 3, orderIndex: 5, phoneNumber: '081234567820' },
  { name: 'Tiara Wijaya', dayOfWeek: 3, orderIndex: 6, phoneNumber: '081234567821' },

  // KAMIS (7 Siswa)
  { name: 'Andi Saputra', dayOfWeek: 4, orderIndex: 0, phoneNumber: '081234567822' },
  { name: 'Bella Safitri', dayOfWeek: 4, orderIndex: 1, phoneNumber: '081234567823' },
  { name: 'Agus Setiawan', dayOfWeek: 4, orderIndex: 2, phoneNumber: '081234567824' },
  { name: 'Siti Aisyah', dayOfWeek: 4, orderIndex: 3, phoneNumber: '081234567825' },
  { name: 'Rizal Hakim', dayOfWeek: 4, orderIndex: 4, phoneNumber: '081234567826' },
  { name: 'Melati Putri', dayOfWeek: 4, orderIndex: 5, phoneNumber: '081234567827' },
  { name: 'Kevin Santoso', dayOfWeek: 4, orderIndex: 6, phoneNumber: '081234567828' },

  // JUMAT (8 Siswa)
  { name: 'Yoga Pratama', dayOfWeek: 5, orderIndex: 0, phoneNumber: '081234567829' },
  { name: 'Nadya Cahyani', dayOfWeek: 5, orderIndex: 1, phoneNumber: '081234567830' },
  { name: 'Bagas Wijaya', dayOfWeek: 5, orderIndex: 2, phoneNumber: '081234567831' },
  { name: 'Alif Ramadhan', dayOfWeek: 5, orderIndex: 3, phoneNumber: '081234567832' },
  { name: 'Zahra Putri', dayOfWeek: 5, orderIndex: 4, phoneNumber: '081234567833' },
  { name: 'Farhan Maulana', dayOfWeek: 5, orderIndex: 5, phoneNumber: '081234567834' },
  { name: 'Ratu Salsabila', dayOfWeek: 5, orderIndex: 6, phoneNumber: '081234567835' },
  { name: 'Raka Pratama', dayOfWeek: 5, orderIndex: 7, phoneNumber: '081234567836' },
];

export const INITIAL_SETTINGS = {
  adminWhatsAppNumber: process.env.ADMIN_WHATSAPP_NUMBER || '081234567890',
  fonnteTokenConfigured: Boolean(process.env.FONNTE_TOKEN),
  cloudinaryConfigured: Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY),
  geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
  allowPublicSubmissions: true,
  reminderHour: 20,
  classLabel: 'Kelas 10 SIJA B',
  totalStudents: 36,
};
