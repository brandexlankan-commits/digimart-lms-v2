"use client";
import { useState } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Vercel Hosting එක සාර්ථකයි මචං! ඊළඟ පියවරෙන් n8n වෙබ්හුක් එක සෙට් කරමු.");
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-sans">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl space-y-6">
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-blue-500 tracking-wide">DIGIMART LMS</h1>
          <p className="text-xs text-gray-400">ගුරුවරුන් සඳහා වන ප්‍රධාන පාලන පැනලය</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Username</label>
            <input 
              type="text" 
              required 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 bg-slate-800 border border-slate-700/60 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500" 
              placeholder="username"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Password</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-slate-800 border border-slate-700/60 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500" 
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            className="w-full py-3 mt-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-bold tracking-wide transition-all shadow-lg shadow-blue-600/20"
          >
            Sign In
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-[11px] text-gray-500">Powered by Digimart Automation Solutions</p>
        </div>

      </div>
    </div>
  );
}