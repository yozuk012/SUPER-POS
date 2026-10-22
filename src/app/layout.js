// src/app/layout.js
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PWAProvider from "@/components/PWAProvider";
import StructuredData from "@/components/StructuredData";

// 1. Import & Re-export metadata dan viewport dari file terpisah
export { metadata, viewport } from "./metadata";

// 2. Konfigurasi Font
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 3. Root Layout Component
export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        <StructuredData />
        {children}
        {/* PWA Provider diletakkan di paling bawah body agar tidak memblokir render awal */}
        <PWAProvider />
      </body>
    </html>
  );
}