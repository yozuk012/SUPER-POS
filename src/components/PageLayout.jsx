// src/components/PageLayout.js
"use client";

import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { FiMenu } from "react-icons/fi";
import { useAuth } from "@/hooks/auth/useAuth";
import { useRouter } from "next/navigation";

export default function PageLayout({ children, title = "Dashboard", contentClassName = "flex-1 p-4 md:p-6" }) {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.replace('/auth/login');
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 relative">
      {/* 1. Sidebar (Responsive) */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* 2. Area Konten Utama */}
      <div className="min-w-0 flex-1 flex flex-col min-h-screen transition-all duration-300">
        
        {/* Header Mobile (Hanya muncul di layar kecil) */}
        <header className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <button 
            onClick={() => setIsSidebarOpen(true)} 
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Buka menu"
          >
            <FiMenu size={24} />
          </button>
          
          <h1 className="text-lg font-bold text-gray-800">{title}</h1>
          
          {/* Spacer agar judul tetap di tengah */}
          <div className="w-10" /> 
        </header>

        {/* Konten Halaman */}
        <main className={contentClassName}>
          {children}
        </main>
      </div>
    </div>
  );
}