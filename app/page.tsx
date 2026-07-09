"use client";
import { useEffect } from "react";

export default function RootPage() {
  useEffect(() => {
    window.location.href = "/login";
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-sans">
      <div className="text-center space-y-2">
        <span className="text-xl animate-spin inline-block">⚙️</span>
        <p className="text-xs text-gray-400">DIGIMART LMS වෙත පිවිසෙමින්...</p>
      </div>
    </div>
  );
}