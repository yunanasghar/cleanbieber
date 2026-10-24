import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CleanBieber — Sistem Manajemen Piket Kelas 10 SIJA B",
  description: "Aplikasi manajemen jadwal piket kelas, rotasi tugas otomatis, verifikasi foto AI Gemini, dan rekap kehadiran terpadu.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#2563eb",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col w-full max-w-full overflow-x-hidden antialiased bg-slate-50 dark:bg-[#0b1120] text-slate-900 dark:text-slate-100">
        {children}
      </body>
    </html>
  );
}
