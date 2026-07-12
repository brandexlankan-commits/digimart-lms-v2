"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // 🚀 n8n එක හරහා Google Sheet එකෙන් ලොගින් සත්‍යාපනය කරන ෆන්ක්ෂන් එක
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 🎯 n8n Login Webhook එකට රික්වෙස්ට් එක යවනවා
      const response = await fetch("https://n8n.epanthiya.com/webhook/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      // n8n එකෙන් සාර්ථකයි (success) කියලා එවුවොත්
      if (data.status === "success") {
        // 💾 ගුරුවරයාගේ සැබෑ දත්ත ටික බ්‍රවුසර් එකේ සේව් කරගන්නවා
        localStorage.setItem("teacher_id", data.teacher_id);
        localStorage.setItem("teacher_name", data.teacher_name);

        alert(`👋 සාදරයෙන් පිළිගනිමු ${data.teacher_name} ගුරුතුමනි!`);
        // කෙලින්ම ඩෑෂ්බෝඩ් එකට රීඩිරෙක්ට් වෙනවා
        router.push("/dashboard");
      } else {
        // n8n එකෙන් ලොගින් වැරදියි කිව්වොත් (status === "failed")
        alert(`❌ ${data.message || "ඇතුලත් කළ Username හෝ Password වැරදියි බං!"}`);
      }
    } catch (error) {
      console.error("Login Error:", error);
      alert("❌ n8n ලොගින් වෙබ්හුක් එකට කනෙක්ට් වෙන්න බැරි වුණා මචං!");
    } finally {
      setLoading(false);
    }
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
              disabled={loading}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 bg-slate-800 border border-slate-700/60 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 disabled:opacity-50" 
              placeholder="username"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Password</label>
            <input 
              type="password" 
              required 
              disabled={loading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-slate-800 border border-slate-700/60 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 disabled:opacity-50" 
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 mt-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-bold tracking-wide transition-all shadow-lg shadow-blue-600/20 disabled:bg-slate-700 disabled:cursor-not-allowed"
          >
            {loading ? "⚙️ සත්‍යාපනය වෙමින්..." : "Sign In"}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-[11px] text-gray-500">Powered by Digimart Automation Solutions</p>
        </div>

      </div>
    </div>
  );
}