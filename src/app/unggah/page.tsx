'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  UploadCloud,
  Camera,
  CheckCircle2,
  AlertCircle,
  X,
  Calendar,
  Sparkles,
  ArrowLeft,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import PublicNavbar from '@/components/PublicNavbar';
import TaskBadge from '@/components/TaskBadge';
import { getISOWeekInfo, getAssignedTask, DAY_NAMES } from '@/lib/rotation';
import type { StudentRecord } from '@/lib/types';
import type { TaskType } from '@/lib/rotation';

function UploadFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [targetDate, setTargetDate] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    id: string;
    studentName: string;
    taskName: TaskType;
    aiStatus?: string;
    aiReason?: string;
  } | null>(null);

  // Initialize today's date
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setTargetDate(today);

    const initialStudentId = searchParams.get('studentId');
    if (initialStudentId) {
      setSelectedStudentId(initialStudentId);
    }
  }, [searchParams]);

  // Load students
  useEffect(() => {
    async function fetchStudents() {
      try {
        const res = await fetch('/api/students');
        if (res.ok) {
          const data = await res.json();
          setStudents(data.students || []);
        }
      } catch (err) {
        console.error('Failed to load students:', err);
      }
    }
    fetchStudents();
  }, []);

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  // Calculate assigned task dynamically based on selected student and date
  let assignedTask: TaskType | null = null;
  let isAssignedDay = false;

  if (selectedStudent && targetDate) {
    const dateObj = new Date(`${targetDate}T00:00:00+07:00`);
    if (!isNaN(dateObj.getTime())) {
      const { isoWeek, isoYear, dayOfWeek } = getISOWeekInfo(dateObj);
      isAssignedDay = selectedStudent.dayOfWeek === dayOfWeek;
      assignedTask = getAssignedTask(selectedStudent.dayOfWeek, selectedStudent.orderIndex, isoWeek, isoYear);
    }
  }

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Berkas harus berupa gambar (JPG, PNG, atau WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Ukuran gambar maksimal 5 MB.');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedStudentId) {
      setErrorMsg('Pilih nama siswa terlebih dahulu.');
      return;
    }

    if (!targetDate) {
      setErrorMsg('Pilih tanggal piket.');
      return;
    }

    if (!selectedFile) {
      setErrorMsg('Silakan pilih atau ambil foto bukti piket.');
      return;
    }

    if (!isAssignedDay) {
      setErrorMsg(`Hari piket ${selectedStudent?.name} adalah ${DAY_NAMES[selectedStudent?.dayOfWeek || 1]}, bukan tanggal yang dipilih.`);
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(20);

      const formData = new FormData();
      formData.append('studentId', selectedStudentId);
      formData.append('date', targetDate);
      formData.append('photo', selectedFile);

      setUploadProgress(50);

      const res = await fetch('/api/submissions', {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(85);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengunggah bukti piket.');
      }

      setUploadProgress(100);
      setSuccessData({
        id: data.submission.id,
        studentName: selectedStudent?.name || 'Siswa',
        taskName: assignedTask || 'MBG',
        aiStatus: data.submission.aiStatus,
        aiReason: data.submission.aiReason,
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan saat mengunggah foto.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-5 w-full min-w-0">
      {/* Back button */}
      <div>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>
      </div>

      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-8 shadow-xs space-y-5 min-w-0">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Formulir Bukti Piket
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            Unggah Foto Bukti Piket
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Ambil foto area kelas yang telah dibersihkan sesuai dengan tugas piket kamu hari ini.
          </p>
        </div>

        {/* Success screen */}
        {successData ? (
          <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-200">
                Bukti Piket Berhasil Terkirim!
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                Terima kasih, <span className="font-semibold">{successData.studentName}</span>. Foto tugas{' '}
                <span className="font-semibold">{successData.taskName}</span> telah diterima sistem.
              </p>
            </div>

            {successData.aiStatus && (
              <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/70 text-left border border-emerald-100 dark:border-emerald-900 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Analisis Awal Gemini AI:</span>
                  <span
                    className={`ml-auto px-2 py-0.5 rounded text-[10px] font-bold ${
                      successData.aiStatus === 'VALID'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
                    }`}
                  >
                    {successData.aiStatus}
                  </span>
                </div>
                {successData.aiReason && (
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                    {successData.aiReason}
                  </p>
                )}
                <p className="text-[10px] text-slate-400 dark:text-slate-500 italic pt-1">
                  *Keputusan akhir verifikasi ditentukan oleh administrator kelas.
                </p>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
              <button
                type="button"
                onClick={() => {
                  setSuccessData(null);
                  setSelectedFile(null);
                  setPreviewUrl(null);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors"
              >
                Kirim Pengajuan Lain
              </button>
              <button
                type="button"
                onClick={() => router.push('/status')}
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Lihat Status Verifikasi
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Student Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Pilih Nama Siswa <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Pilih Nama dari Roster --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({DAY_NAMES[s.dayOfWeek]})
                  </option>
                ))}
              </select>
            </div>

            {/* Date Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tanggal Piket <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Assigned Task Preview */}
            {selectedStudent && (
              <div
                className={`p-4 rounded-xl border transition-all text-xs space-y-2 ${
                  isAssignedDay
                    ? 'bg-blue-50/70 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900'
                    : 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Jadwal Siswa Terpilih:
                  </span>
                  {assignedTask && <TaskBadge task={assignedTask} size="sm" />}
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  Hari jadwal tetap: <span className="font-semibold">{DAY_NAMES[selectedStudent.dayOfWeek]}</span>
                </p>
                {!isAssignedDay && (
                  <p className="text-amber-700 dark:text-amber-400 font-medium">
                    Peringatan: Tanggal yang dipilih bukan jadwal piket tetap untuk {selectedStudent.name}.
                  </p>
                )}
              </div>
            )}

            {/* Photo Upload / Capture Input */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Foto Bukti Kebersihan <span className="text-rose-500">*</span>
              </label>

              {previewUrl ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black aspect-video max-h-72">
                  <img
                    src={previewUrl}
                    alt="Preview bukti piket"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-rose-600 transition-colors shadow-md"
                    title="Hapus foto"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-slate-900/80 text-white text-[10px] font-medium backdrop-blur-sm">
                    {selectedFile?.name} ({(selectedFile?.size || 0) / 1024 > 1000 ? `${((selectedFile?.size || 0) / (1024 * 1024)).toFixed(1)} MB` : `${Math.round((selectedFile?.size || 0) / 1024)} KB`})
                  </div>
                </div>
              ) : (
                <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-500 rounded-2xl p-6 text-center transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Klik untuk mengambil foto kamera atau pilih berkas
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Mendukung format JPG, PNG, WEBP (Maksimal 5 MB)
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Upload progress */}
            {uploading && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Mengunggah dan menganalisis foto dengan AI...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={uploading || !selectedFile || !selectedStudentId}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 font-bold text-sm shadow-sm transition-all"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{uploading ? 'Sedang Memproses...' : 'Kirim Bukti Piket'}</span>
            </button>

            {/* Abuse notice */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-[11px] text-slate-500 dark:text-slate-400">
              <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>
                Sistem tidak mewajibkan login akun siswa, namun seluruh unggahan diverifikasi oleh administrator
                kelas. Dilarang mengunggah foto palsu, selfie tidak relevan, atau mengatasnamakan siswa lain.
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function StudentUploadPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0b1120] text-slate-900 dark:text-slate-100 transition-colors w-full max-w-full overflow-x-hidden">
      <PublicNavbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-10 min-w-0">
        <Suspense fallback={<div className="text-center text-xs text-slate-400">Memuat formulir...</div>}>
          <UploadFormContent />
        </Suspense>
      </main>
    </div>
  );
}
