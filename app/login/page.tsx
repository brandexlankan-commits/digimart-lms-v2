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
    invalidFallback: "ඇතුලත් කළ Username හෝ Password වැරදියි. කරුණාකර නැවත උත්සාහ කරන්න!",
    serverError: "❌ සර්වර් එක සමඟ සම්බන්ධ වීමට නොහැකි විය. කරුණාකර නැවත උත්සාහ කරන්න!",
    payUploadBtn: "💳 Slip එක Upload කර Account එක Active කරන්න",
    unpaidNotice: "ඔබගේ ගෙවීම් කටයුතු සක්‍රිය නැත. පහත බොත්තමෙන් Bank Slip එක Upload කර ගිණුම ක්ෂණිකව සක්‍රිය කරගන්න!",
    whatsappBtn: "💬 WhatsApp සහයෝගිතාව",
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
    invalidFallback: "Invalid Username or Password. Please try again!",
    serverError: "❌ Unable to connect to the server. Please try again!",
    payUploadBtn: "💳 Upload Slip & Activate Account",
    unpaidNotice: "Your account is not active. Upload your Bank Slip below to activate it instantly!",
    whatsappBtn: "💬 Contact Support via WhatsApp",
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
    payUploadBtn: "💳 ரசீதை பதிவேற்றி கணக்கை இயக்கவும்",
    unpaidNotice: "உங்கள் கணக்கு செயலில் இல்லை. உடனடியாக இயக்க வங்கி ரசீதை பதிவேற்றவும்!",
    whatsappBtn: "💬 வாட்ஸ்அப் மூலம் தொடர்பு கொள்ளவும்",
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
  const [errorMsg, setErrorMsg] = useState("");
  const [isUnpaid, setIsUnpaid] = useState(false);
  const [targetIdForPay, setTargetIdForPay] = useState("");

  useEffect(() => {
    const savedLang = (localStorage.getItem("app_lang") as "si" | "en" | "ta") || "si";
    setLang(savedLang);
  }, []);

  const handleLangChange = (newLang: "si" | "en" | "ta") => {
    setLang(newLang);
    localStorage.setItem("app_lang", newLang);
  };

  const t = translations[lang];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setIsUnpaid(false);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });

      const data = await response.json();

      if (data.status === "success" || data.success) {
        localStorage.setItem("teacher_id", data.teacher_id);
        localStorage.setItem("teacher_name", data.teacher_name);
        if (data.username) localStorage.setItem("teacher_username", data.username);
        router.push("/dashboard");
      } else {
        const rawMsg = String(data.message || "");
        
        // 🎯 UNPAID හඳුනාගැනීම (Backend එකෙන් status UNPAID ආවත් හෝ Message එකේ "ගෙවීම්/unpaid" තිබුණත්)
        const checkUnpaid = data.status === "UNPAID" || data.isUnpaid || 
                            rawMsg.toLowerCase().includes("unpaid") || 
                            rawMsg.includes("ගෙවීම්") || 
                            rawMsg.includes("සක්‍රිය නැත");

        if (checkUnpaid) {
          setIsUnpaid(true);
          const resolvedId = data.teacher_id || username.trim();
          setTargetIdForPay(resolvedId);
          setErrorMsg(t.unpaidNotice);
        } else {
          let errorMessage = data.message || t.invalidFallback;
          if (errorMessage.includes("බං") || errorMessage.includes("මචං") || errorMessage.includes("වැරදියි")) {
            errorMessage = t.invalidFallback;
          }
          setErrorMsg(errorMessage);
        }
      }
    } catch (error) {
      console.error("Login Error:", error);
      setErrorMsg(t.serverError);
    } finally {
      setLoading(false);
    }
  };

  // 🎯 කෙලින්ම ගුරුවරයාගේ Username / ID එක සහිතව /pay පිටුවට යැවීම
  const handleGoToPay = () => {
    const idToPass = targetIdForPay || username.trim();
    router.push(`/pay?id=${encodeURIComponent(idToPass)}`);
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

        {/* 🚨 ERROR MESSAGE BANNER (DIRECT PAYMENT BUTTON FOR UNPAID TEACHERS) */}
        {errorMsg && (
          <div className={`p-4 rounded-xl text-xs text-center font-medium animate-fadeIn flex flex-col items-center gap-3 border ${
            isUnpaid 
              ? "bg-rose-950/40 border-rose-500/40 text-rose-300" 
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}>
            <span>{errorMsg}</span>
            
            {isUnpaid ? (
              <div className="w-full space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleGoToPay}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black px-4 rounded-xl transition-all text-xs shadow-lg shadow-blue-600/30 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>{t.payUploadBtn}</span>
                  <span className="text-sm font-bold">➔</span>
                </button>

                <div className="text-center pt-1">
                  <a 
                    href={`https://wa.me/94750204252?text=${encodeURIComponent(`Hi Digimart! මගේ Username එක ${username.trim()} වන අතර ගිණුම Activate කරගැනීමට සහය අවශ්‍යයි.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-emerald-400 hover:underline inline-flex items-center gap-1 font-bold"
                  >
                    <span>{t.whatsappBtn}</span>
                  </a>
                </div>
              </div>
            ) : (
              <a 
                href="https://wa.me/94750204252?text=Hello%20Digimart!%20I%20need%20help%20with%20my%20LMS%20account."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg transition-all text-xs shadow-md shadow-emerald-600/20 active:scale-95"
              >
                {t.whatsappBtn}
              </a>
            )}
          </div>
        )}

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
            className="w-full py-3 mt-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-bold tracking-wide transition-all shadow-lg shadow-blue-600/20 disabled:bg-slate-700 disabled:cursor-not-allowed cursor-pointer"
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