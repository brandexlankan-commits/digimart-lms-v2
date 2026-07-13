"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [teacherName, setTeacherName] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 💾 ලොගින් පේජ් එකෙන් සේව් කරපු ගුරුවරයාගේ විස්තර බ්‍රවුසර් එකෙන් ගන්නවා
    const storedName = localStorage.getItem("teacher_name");
    const storedId = localStorage.getItem("teacher_id");

    // 🔒 ආරක්ෂාවට: කවුරු හරි ලොග් නොවී කෙලින්ම /dashboard ආවොත් ලොගින් පේජ් එකට හරවලා යවනවා
    if (!storedId) {
      router.push("/login");
    } else {
      setTeacherName(storedName || "ගුරුතුමනි");
      setTeacherId(storedId);
      setLoading(false);
    }
  }, [router]);

  // ලොග් අවුට් වෙන කොට localStorage එක ක්ලීන් කරන ෆන්ක්ෂන් එක
  const handleLogout = () => {
    localStorage.removeItem("teacher_id");
    localStorage.removeItem("teacher_name");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-sans">
        <p className="text-sm animate-pulse">⚙️ දත්ත පූරණය වෙමින් පවතියි...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* 📋 Header කොටස - මෙතන ලොග් වෙන කෙනාගේ නම ඩයිනමික් වැටෙනවා */}
        <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <div>
            <p className="text-xs text-blue-500 font-semibold tracking-wide">DIGIMART LMS MAIN PANEL</p>
            <h1 className="text-2xl font-black mt-1">ආයුබෝවන්, {teacherName}! 👋</h1>
            <p className="text-xs text-gray-400 mt-1">ගුරු අයිඩී එක: <span className="text-slate-300 font-mono font-bold">{teacherId}</span></p>
          </div>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-xs font-bold rounded-xl transition-all shadow-lg shadow-rose-600/10"
          >
            Sign Out
          </button>
        </div>

        {/* 📊 ගුරුවරයාට වෙන්වුණු විස්තර කාඩ්ස් (උදාහරණයක් විදිහට) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h3 className="text-sm font-medium text-gray-400">ක්‍රියාකාරී පන්ති</h3>
            <p className="text-3xl font-black mt-2 text-blue-500">04</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h3 className="text-sm font-medium text-gray-400">මුළු සිසුන් ගණන</h3>
            <p className="text-3xl font-black mt-2 text-emerald-500">1,250</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h3 className="text-sm font-medium text-gray-400">ගෙවීම් තත්ත්වය</h3>
            <p className="text-sm font-bold mt-3 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg w-max">
              Active (Paid)
            </p>
          </div>
        </div>

        {/* 📹 Zoom Class සාදන Component එක (මීට පල්ලෙහායින් තමයි ඒක දාන්න ඕනේ මචං) */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <h2 className="text-lg font-bold mb-4">අලුත් සූම් පන්තියක් සකසන්න</h2>
          <p className="text-xs text-gray-400 mb-4">මෙහිදී ඔබ සාදන පන්ති ස්වයංක්‍රීයව ඔබගේ සිසුන්ගේ පැනලයට දර්ශනය වේ.</p>
          
          {/* උඹ කලින් හදපු <CreateClassForm teacherId={teacherId} /> වගේ කෑල්ලක් මෙතනට දාන්න පුළුවන් */}
          <div className="p-8 border border-dashed border-slate-800 rounded-xl text-center text-gray-500 text-sm">
            පන්ති සෑදීමේ පෝරමය (Form එක) මෙතනට සෙට් කරමු මචං.
          </div>
        </div>

      </div>
    </div>
  );
}