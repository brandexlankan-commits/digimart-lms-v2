"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// ==================== TRANSLATIONS FOR LOGIN PAGE ====================
const translations = {
  si: {
    subHeader: "ගුරුවරුන් සඳහා වන ප්‍රධාන පාලන පැනලය",
    usernameLabel: "Username",
    usernamePlaceholder: "username",
    passwordLabel: "Password",
    passwordPlaceholder: "••••••••",
    signIn: "Sign In",
    authenticating: "⚙️ සත්‍යාපනය වෙමින්...",
    welcomePrefix: "👋 සාදරයෙන් පිළිගනිමු",
    welcomeSuffix: "ගුරුතුමනි!",
    invalidFallback: "ඇතුලත් කළ Username හෝ Password වැරදියි බං!",
    serverError: "❌ සර්වර් එක සමඟ සම්බන්ද වීමට නොහැකි විය. නැවත උත්සාහ කරන්න මචං!",
    footer: "Powered by Digimart Automation Solutions"
  },
  en: {
    subHeader: "Main Control Panel for Teachers",
    usernameLabel: "Username",
    usernamePlaceholder: "username",
    passwordLabel: "Password",
    passwordPlaceholder: "••••••••",
    signIn: "Sign In",
    authenticating: "⚙️ Authenticating...",
    welcomePrefix: "👋 Welcome",
    welcomeSuffix: "Teacher!",
    invalidFallback: "Invalid Username or Password!",
    serverError: "❌ Unable to connect to the server. Please try again!",
    footer: "Powered by Digimart Automation Solutions"
  },
  ta: {
    subHeader: "ஆசிரியர்களுக்கான முக்கிய மேலாண்மை போர்டல்",
    usernameLabel: "Username",
    usernamePlaceholder: "username",
    passwordLabel: "Password",
    passwordPlaceholder: "••••••••",
    signIn: "Sign In",
    authenticating: "⚙️ சரிபார்க்கப்படுகிறது...",
    welcomePrefix: "👋 நல்வரவு",
    welcomeSuffix: "ஆசிரியர்!",
    invalidFallback: "உள்ளிடப்பட்ட பயனர்பெயர் அல்லது கடவுச்சொல் தவறானது!",
    serverError: "❌ சேவையகத்துடன் இணைக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்!",
    footer: "Powered by Digimart Automation Solutions"
  }
};

export default function LoginPage() {
  const router = useRouter();
  
  // Language State: 'si' | 'en' | 'ta'
  const [lang, setLang] = useState<"si" | "en" | "ta">("si");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 💡 Read saved language preference or default to Sinhala
    const savedLang = (localStorage.getItem("app_lang") as "si" | "en" | "ta") || "si";
    setLang(savedLang);
  }, []);

  const handleLangChange = (newLang: "si" | "en" | "ta") => {
    setLang(newLang);
    localStorage.setItem("app_lang", newLang);
  };

  const t = translations[lang];

  // 🚀 Next.js API Route එක හරහා ආරක්ෂිතව ලොගින් සත්‍යාපනය කරන ෆන්ක්ෂන් එක
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 🎯 කෙලින්ම n8n එකට නොයා, අපේම Next.js API Route එකට රික්වෙස්ට් එක යවනවා
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      // n8n බැක්එන්ඩ් එකෙන් සත්‍යාපනය සාර්ථකයි (success) කියලා එවුවොත්
      if (data.status === "success") {
        // 💾 ගුරුවරයාගේ සැබෑ දත්ත ටික බ්‍රවුසර් එකේ සේව් කරගන්නවා
        localStorage.setItem("teacher_id", data.teacher_id);
        localStorage.setItem("teacher_name", data.teacher_name);

        // 🔔 TRILINGUAL WELCOME ALERT
        alert(`${t.welcomePrefix} ${data.teacher_name} ${t.welcomeSuffix}`);
        
        // කෙලින්ම ඩෑෂ්බෝඩ් එකට රීඩිරෙක්ට් වෙනවා
        router.push("/dashboard");
      } else {
        // ලොගින් වැරදි නම් හෝ පේමන්ට් බ්ලොක් නම් n8n එකෙන් එවන මැසේජ් එක පෙන්වනවා
        alert(`❌ ${data.message || t.invalidFallback}`);
      }
    } catch (error) {
      console.error("Login Error:", error);
      alert(t.serverError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-sans relative selection:bg-blue-600/30">
      
      {/* 🌐 TOP RIGHT LANGUAGE SWITCHER */}
      <div className="absolute top-5 right-5">
        <select 
          value={lang}
          onChange={(e) => handleLangChange(e.target.value as "si" | "en" | "ta")}
          className="bg-slate-900 border border-slate-800 text-xs text-blue-400 font-bold px-3 py-2 rounded-xl focus:outline-none cursor-pointer shadow-lg"
        >
          <option value="si">🇱🇰 සිංහල</option>
          <option value="en">🇬🇧 English</option>
          <option value="ta">🇱🇰 தமிழ்</option>
        </select>
      </div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl space-y-6">
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-blue-500 tracking-wide">DIGIMART LMS</h1>
          <p className="text-xs text-gray-400">{t.subHeader}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">{t.usernameLabel}</label>
            <input 
              type="text" 
              required 
              disabled={loading}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 bg-slate-800 border border-slate-700/60 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 disabled:opacity-50 font-mono" 
              placeholder={t.usernamePlaceholder}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">{t.passwordLabel}</label>
            <input 
              type="password" 
              required 
              disabled={loading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-slate-800 border border-slate-700/60 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 disabled:opacity-50 font-mono" 
              placeholder={t.passwordPlaceholder}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 mt-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-bold tracking-wide transition-all shadow-lg shadow-blue-600/20 disabled:bg-slate-700 disabled:cursor-not-allowed"
          >
            {loading ? t.authenticating : t.signIn}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-800/80">
          <p className="text-[11px] text-gray-500">{t.footer}</p>
        </div>

      </div>
    </div>
  );
}