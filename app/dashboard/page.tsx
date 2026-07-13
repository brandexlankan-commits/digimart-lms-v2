"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  
  // ගුරුවරයාගේ දත්ත සඳහා වන States
  const [teacherName, setTeacherName] = useState("ගුරුතුමනි");
  const [teacherId, setTeacherId] = useState("පූරණය වෙමින්...");
  const [loading, setLoading] = useState(true);

  // පෝරමයේ දත්ත සඳහා වන States (Form States)
  const [topic, setTopic] = useState("");
  const [date, setDate] = useState("2026-07-12");
  const [time, setTime] = useState("07:37 AM");
  const [durationHours, setDurationHours] = useState("01 Hr");
  const [durationMinutes, setDurationMinutes] = useState("00 Min");
  const [passcode, setPasscode] = useState("Auto");
  
  // පන්ති සැකසුම් (Checkboxes)
  const [waitingRoom, setWaitingRoom] = useState(true);
  const [hostVideo, setHostVideo] = useState(true);
  const [participantVideo, setParticipantVideo] = useState(false);
  const [muteOnEntry, setMuteOnEntry] = useState(true);
  
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    // බ්‍රවුසර් එකෙහි සුරැකි ගුරු විස්තර ලබා ගැනීම
    const storedName = localStorage.getItem("teacher_name");
    const storedId = localStorage.getItem("teacher_id");

    // ආරක්ෂක පියවර: ලොග් නොවී කෙලින්ම ඩෑෂ්බෝඩ් පැමිණියහොත් ලොගින් පේජ් එකට යොමු කිරීම
    if (!storedId) {
      router.push("/login");
    } else {
      setTeacherName(storedName || "ගුරුතුමනි");
      setTeacherId(storedId);
      setLoading(false);
    }
  }, [router]);

  // Zoom Class එක සෑදීම සඳහා n8n වෙබ්හුක් එකට දත්ත යවන ශ්‍රිතය (Function)
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const response = await fetch("https://n8n.epanthiya.com/webhook/create-zoom-class", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacher_id: teacherId, // දැනට ලොග් වී සිටින ගුරුවරයාගේ සැබෑ ID එක
          topic,
          date,
          time,
          durationHours: durationHours.replace(/[^0-9]/g, ""), 
          durationMinutes: durationMinutes.replace(/[^0-9]/g, ""),
          passcode: passcode === "Auto" ? Math.floor(100000 + Math.random() * 900000).toString() : passcode,
          waiting_room: waitingRoom,
          host_video: hostVideo,
          participant_video: participantVideo,
          mute_upon_entry: muteOnEntry
        })
      });

      if (response.ok) {
        alert("📹 සූම් පන්තිය සාර්ථකව සකස් කර දත්ත ගොනුවට ඇතුලත් කරන ලදී.");
        setTopic("");
      } else {
        alert("❌ පන්තිය සැකසීමට නොහැකි විය. කරුණාකර පද්ධති පරිපාලක අමතන්න.");
      }
    } catch (error) {
      console.error(error);
      alert("❌ සූම් සේවාදායකය සමඟ සම්බන්ධ වීමට නොහැකි විය.");
    } finally {
      setFormLoading(false);
    }
  };

  // පද්ධතියෙන් ඉවත් වීමේ ශ්‍රිතය (Sign Out Function)
  const handleLogout = () => {
    localStorage.removeItem("teacher_id");
    localStorage.removeItem("teacher_name");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b19] flex items-center justify-center text-white font-sans">
        <p className="text-sm animate-pulse">⚙️ පාලන පැනලය සූදානම් වෙමින් පවතියි, කරුණාකර රැඳී සිටින්න...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b19] text-white font-sans p-6 selection:bg-blue-600/30">
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* ==================== TOP NAVIGATION / HEADER ==================== */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-900 pb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-200">
              ආයුබෝවන්, {teacherName}! 👋
            </h1>
            <p className="text-xs text-gray-500 mt-1 tracking-wide">
              Digimart LMS මඟින් ඔබගේ පන්ති සහ පටිගත කිරීම් මෙතැන් සිට පහසුවෙන් පාලනය කරන්න.
            </p>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            <div className="px-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs font-mono text-blue-400 font-bold shadow-inner">
              Teacher ID: {teacherId}
            </div>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/40 text-rose-400 text-xs font-bold rounded-xl transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* ==================== MAIN CONTENT GRID ==================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: CREATE CLASS FORM */}
          <div className="lg:col-span-4 bg-[#0b132b] border border-slate-900 p-6 rounded-2xl shadow-xl space-y-5">
            <h2 className="text-base font-bold text-blue-400 flex items-center gap-2">
              <span>🚀</span> අලුත් Class එකක් හදමු
            </h2>
            
            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-gray-400 mb-1.5">Class Topic</label>
                <input 
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="පන්තියේ මාතෘකාව ඇතුලත් කරන්න"
                  className="w-full p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-gray-400 mb-1.5">Date</label>
                  <input 
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 color-scheme-dark"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-400 mb-1.5">Time</label>
                  <input 
                    type="text"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-gray-400 mb-1.5">Duration (Hours)</label>
                  <select 
                    value={durationHours}
                    onChange={(e) => setDurationHours(e.target.value)}
                    className="w-full p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option>01 Hr</option>
                    <option>02 Hrs</option>
                    <option>03 Hrs</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-400 mb-1.5">Duration (Minutes)</label>
                  <select 
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option>00 Min</option>
                    <option>15 Min</option>
                    <option>30 Min</option>
                    <option>45 Min</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-400 mb-1.5">Passcode</label>
                <input 
                  type="text"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-400 focus:outline-none"
                />
              </div>

              {/* CHECKBOX CONFIGURATIONS */}
              <div className="space-y-2.5 pt-2 border-t border-slate-900">
                <label className="flex items-center gap-3 text-xs text-gray-300 cursor-pointer select-none">
                  <input type="checkbox" checked={waitingRoom} onChange={(e) => setWaitingRoom(e.target.checked)} className="w-4 h-4 rounded border-slate-800 bg-slate-900 text-blue-600 focus:ring-0" />
                  <span>Waiting Room</span>
                </label>
                <label className="flex items-center gap-3 text-xs text-gray-300 cursor-pointer select-none">
                  <input type="checkbox" checked={hostVideo} onChange={(e) => setHostVideo(e.target.checked)} className="w-4 h-4 rounded border-slate-800 bg-slate-900 text-blue-600 focus:ring-0" />
                  <span>Host Video</span>
                </label>
                <label className="flex items-center gap-3 text-xs text-gray-300 cursor-pointer select-none">
                  <input type="checkbox" checked={participantVideo} onChange={(e) => setParticipantVideo(e.target.checked)} className="w-4 h-4 rounded border-slate-800 bg-slate-900 text-blue-600 focus:ring-0" />
                  <span>Participant Video</span>
                </label>
                <label className="flex items-center gap-3 text-xs text-gray-300 cursor-pointer select-none">
                  <input type="checkbox" checked={muteOnEntry} onChange={(e) => setMuteOnEntry(e.target.checked)} className="w-4 h-4 rounded border-slate-800 bg-slate-900 text-blue-600 focus:ring-0" />
                  <span>Mute on Entry</span>
                </label>
              </div>

              <button 
                type="submit"
                disabled={formLoading}
                className="w-full py-3 mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 rounded-xl text-xs font-bold tracking-wide transition-all shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2"
              >
                {formLoading ? "⚙️ පන්තිය සකසමින්..." : "▶️ Create Zoom Class"}
              </button>
            </form>
          </div>

          {/* RIGHT COLUMN: PLANNED CLASSES & CLOUDFLARE R2 RECORDINGS */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* SECTION 1: PLANNED CLASSES LIST */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold tracking-wide text-gray-300 flex items-center gap-2">
                <span>📅</span> සැලසුම් කර ඇති පන්ති <span className="bg-slate-900 text-blue-400 text-xs px-2 py-0.5 rounded-full border border-slate-800">2</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Class Card 1 */}
                <div className="bg-[#0b132b]/50 border border-slate-900 p-5 rounded-2xl space-y-4 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] bg-blue-950 text-blue-400 font-bold px-2 py-1 rounded-md border border-blue-900/30">12/07/2026</span>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">⏳ 2h</span>
                  </div>
                  <h3 className="text-xs font-bold tracking-wide text-slate-200">Combined Maths - Pure Theory Class</h3>
                  <div className="bg-slate-950/60 border border-slate-900/60 p-3 rounded-xl space-y-1.5 font-mono text-[11px] text-slate-400">
                    <p>⏰ Time: 18:30</p>
                    <p>🆔 ID: 845 2931 4920</p>
                    <p>🔑 Pass: 123456</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button className="py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-[10px] font-bold tracking-wide transition-colors">▶️ Start Class</button>
                    <button className="py-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-[10px] font-bold tracking-wide transition-colors">📋 Copy Details</button>
                  </div>
                </div>

                {/* Class Card 2 */}
                <div className="bg-[#0b132b]/50 border border-slate-900 p-5 rounded-2xl space-y-4 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] bg-blue-950 text-blue-400 font-bold px-2 py-1 rounded-md border border-blue-900/30">15/07/2026</span>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">⏳ 1h 30m</span>
                  </div>
                  <h3 className="text-xs font-bold tracking-wide text-slate-200">Combined Maths - Applied Revision</h3>
                  <div className="bg-slate-950/60 border border-slate-900/60 p-3 rounded-xl space-y-1.5 font-mono text-[11px] text-slate-400">
                    <p>⏰ Time: 15:00</p>
                    <p>🆔 ID: 812 4021 3912</p>
                    <p>🔑 Pass: 998877</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button className="py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-[10px] font-bold tracking-wide transition-colors">▶️ Start Class</button>
                    <button className="py-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-[10px] font-bold tracking-wide transition-colors">📋 Copy Details</button>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: CLOUDFLARE R2 RECORDINGS TABLE */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold tracking-wide text-gray-300 flex items-center gap-2">
                <span>🎬</span> පන්ති පටිගත කිරීම් <span className="text-xs font-normal text-gray-500">(Cloudflare R2)</span>
              </h2>
              
              <div className="bg-[#0b132b]/30 border border-slate-900 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-900 bg-slate-950/40 text-gray-400 font-medium">
                      <th className="p-4 w-[25%]">DATE</th>
                      <th className="p-4 w-[55%]">CLASS TITLE</th>
                      <th className="p-4 w-[20%] text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60 text-slate-300">
                    <tr className="hover:bg-slate-900/20 transition-colors">
                      <td className="p-4 font-mono text-gray-400">2026-07-08</td>
                      <td className="p-4 font-bold text-slate-200">Combined Maths - Integration (Class 02)</td>
                      <td className="p-4 text-right">
                        <button className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-bold text-[10px] transition-colors">📋 Copy Link</button>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-900/20 transition-colors">
                      <td className="p-4 font-mono text-gray-400">2026-07-05</td>
                      <td className="p-4 font-bold text-slate-200">Combined Maths - Integration (Class 01)</td>
                      <td className="p-4 text-right">
                        <button className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-bold text-[10px] transition-colors">📋 Copy Link</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}