"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Meeting {
  topic: string;
  date: string;
  time: string;
  duration: string;
  zoom_id?: string;
  passcode: string;
  start_url?: string;
  join_url?: string;
  zoom_account_id?: string;
  meeting_id_row?: string;
  startTime?: string;
  start_time?: string;
}

interface Recording {
  date: string;
  title: string;
  link: string;
}

export default function DashboardPage() {
  const router = useRouter();
  
  // Tab State: 'home' | 'schedule' | 'planned' | 'recordings'
  const [activeTab, setActiveTab] = useState<"home" | "schedule" | "planned" | "recordings">("home");

  const [teacherName, setTeacherName] = useState("ගුරුතුමනි");
  const [teacherId, setTeacherId] = useState("");
  const [teacherPic, setTeacherPic] = useState("");
  const [loading, setLoading] = useState(true);

  const [plannedClasses, setPlannedClasses] = useState<Meeting[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  
  // Form State
  const [topic, setTopic] = useState("");
  const [date, setDate] = useState("2026-08-01");
  const [selectedHour, setSelectedHour] = useState("07");
  const [selectedMinute, setSelectedMinute] = useState("30");
  const [selectedAmPm, setSelectedAmPm] = useState("PM");
  const [durationHours, setDurationHours] = useState("03 Hr");
  const [durationMinutes, setDurationMinutes] = useState("30 Min");
  const [passcode, setPasscode] = useState("Auto");
  
  const [waitingRoom, setWaitingRoom] = useState(true);
  const [hostVideo, setHostVideo] = useState(true);
  const [participantVideo, setParticipantVideo] = useState(false);
  const [muteOnEntry, setMuteOnEntry] = useState(true);
  
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    const storedName = localStorage.getItem("teacher_name");
    const storedId = localStorage.getItem("teacher_id");
    const storedPic = localStorage.getItem("teacher_pic") || localStorage.getItem("profile_pic");

    if (!storedId) {
      router.push("/login");
    } else {
      setTeacherName(storedName || "ගුරුතුමනි");
      setTeacherId(storedId);
      if (storedPic) setTeacherPic(storedPic);
      fetchTeacherData(storedId);
    }
  }, [router]);

  const fetchTeacherData = async (id: string) => {
    try {
      const response = await fetch(`/api/teacher/data?teacher_id=${id}`);
      if (response.ok) {
        const data = await response.json();
        setPlannedClasses(data.plannedClasses || []);
        setRecordings(data.recordings || []);
        
        if (data.profilePic || data.teacherPic || data.profile_picture) {
          const pic = data.profilePic || data.teacherPic || data.profile_picture;
          setTeacherPic(pic);
          localStorage.setItem("teacher_pic", pic);
        }

        if (data.teacherName) {
          setTeacherName(data.teacherName);
          localStorage.setItem("teacher_name", data.teacherName);
        }
      }
    } catch (error) {
      console.error("දත්ත ලබා ගැනීමේදී දෝෂයක් සිදු විය:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    const formattedTime = `${selectedHour}:${selectedMinute} ${selectedAmPm}`;

    try {
      const response = await fetch("https://n8n.epanthiya.com/webhook/create-zoom-class-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacher_id: teacherId,
          topic,
          date,
          time: formattedTime,
          durationHours: durationHours.replace(/[^0-9]/g, ""), 
          durationMinutes: durationMinutes.replace(/[^0-9]/g, ""),
          passcode: passcode === "Auto" ? Math.floor(100000 + Math.random() * 900000).toString() : passcode,
          waiting_room: waitingRoom,
          host_video: hostVideo,
          participant_video: participantVideo,
          mute_upon_entry: muteOnEntry
        })
      });

      let data: any = {};
      try { data = await response.json(); } catch (e) { data = {}; }

      if (response.ok && data.status === "success") {
        alert("📹 සූම් පන්තිය සාර්ථකව සකස් කර දත්ත ගොනුවට ඇතුලත් කරන ලදී.");
        setTopic("");
        fetchTeacherData(teacherId);
        setActiveTab("planned");
      } else {
        const errorMsg = data.message || data.errorMessage || data.error || "🚫 පන්තිය සකස් කිරීමට නොහැකි විය. වේලාව නැවත පරීක්ෂා කරන්න.";
        alert(errorMsg);
      }
    } catch (error: any) {
      console.error(error);
      alert("⚠️ සේවාදායකය සමඟ සම්බන්ධ වීමේ දෝෂයකි. කරුණාකර නැවත උත්සාහ කරන්න.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancelClass = async (meetingIdRow?: string, zoomMeetingId?: string) => {
    const idToCancel = meetingIdRow || zoomMeetingId;
    if (!idToCancel) return alert("⚠️ Meeting ID හමු නොවීය.");

    const isConfirmed = confirm("⚠️ ඔබට මෙම පන්තිය අවලංගු (Cancel) කිරීමට අවශ්‍යද?\n\nමෙය සිදු කළ පසු අදාළ Zoom Time Slot එක ස්වයංක්‍රීයව නිදහස් වේ.");
    if (!isConfirmed) return;

    try {
      const response = await fetch("https://n8n.epanthiya.com/webhook/cancel-zoom-class", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meeting_id_row: idToCancel,
          zoom_meeting_id: zoomMeetingId,
          teacher_id: teacherId
        })
      });

      let data: any = {};
      try { data = await response.json(); } catch (e) { data = {}; }

      if (response.ok && data.status === "success") {
        alert("🗑️ පන්තිය සාර්ථකව අවලංගු (Cancel) කරන ලදී.");
        fetchTeacherData(teacherId);
      } else {
        alert(data.message || "❌ පන්තිය අවලංගු කිරීමට නොහැකි විය.");
      }
    } catch (error) {
      console.error(error);
      alert("⚠️ සේවාදායකය සමඟ සම්බන්ධ වීමේ දෝෂයකි.");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b19] flex items-center justify-center text-white font-sans">
        <p className="text-sm animate-pulse">⚙️ ඔබගේ පාලන පැනලය සූදානම් වෙමින් පවතියයි, කරුණාකර රැඳී සිටින්න...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b19] text-white font-sans p-4 md:p-6 selection:bg-blue-600/30">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* ==================== HEADER SECTION ==================== */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-900 pb-5 gap-4">
          <div className="flex items-center gap-4">
            {teacherPic ? (
              <img 
                src={teacherPic} 
                alt={teacherName} 
                className="w-12 h-12 rounded-2xl object-cover border-2 border-blue-500/50 shadow-lg shadow-blue-500/10"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 border-2 border-blue-400/30 flex items-center justify-center text-lg font-black text-white shadow-lg">
                {teacherName.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-200">
                ආයුබෝවන්, {teacherName}! 👋
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">Digimart LMS Management Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <span className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-blue-400 font-bold">
              ID: {teacherId}
            </span>
            <button 
              onClick={handleLogout}
              className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/40 text-rose-400 text-xs font-bold rounded-xl transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* ==================== TABS NAVIGATION HEADER ==================== */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-900 no-scrollbar">
          
          <button
            onClick={() => setActiveTab("home")}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "home" 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                : "bg-slate-900/60 text-gray-400 hover:bg-slate-900 hover:text-white border border-slate-800"
            }`}
          >
            <span>🏠</span> Home
          </button>

          <button
            onClick={() => setActiveTab("schedule")}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "schedule" 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                : "bg-slate-900/60 text-gray-400 hover:bg-slate-900 hover:text-white border border-slate-800"
            }`}
          >
            <span>➕</span> Schedule Class
          </button>

          <button
            onClick={() => setActiveTab("planned")}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap relative ${
              activeTab === "planned" 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                : "bg-slate-900/60 text-gray-400 hover:bg-slate-900 hover:text-white border border-slate-800"
            }`}
          >
            <span>📅</span> Scheduled Classes
            <span className="ml-1 bg-slate-950 text-blue-400 px-2 py-0.5 rounded-full text-[10px] font-bold border border-slate-800">
              {plannedClasses.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("recordings")}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap relative ${
              activeTab === "recordings" 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                : "bg-slate-900/60 text-gray-400 hover:bg-slate-900 hover:text-white border border-slate-800"
            }`}
          >
            <span>🎬</span> Recordings
            <span className="ml-1 bg-slate-950 text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-bold border border-slate-800">
              {recordings.length}
            </span>
          </button>

        </div>

        {/* ==================== TAB CONTENT AREAS ==================== */}

        {/* ----------------- 🏠 TAB 1: HOME (SUMMARY + PROMO AD BANNERS) ----------------- */}
        {activeTab === "home" && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#0b132b] border border-slate-900 p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-medium">සැලසුම් කළ පන්ති</p>
                  <h3 className="text-2xl font-black text-blue-400 mt-1">{plannedClasses.length}</h3>
                </div>
                <div className="w-12 h-12 bg-blue-950/60 border border-blue-900/40 rounded-xl flex items-center justify-center text-xl">📅</div>
              </div>

              <div className="bg-[#0b132b] border border-slate-900 p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-medium">පටිගත කිරීම් (Recordings)</p>
                  <h3 className="text-2xl font-black text-emerald-400 mt-1">{recordings.length}</h3>
                </div>
                <div className="w-12 h-12 bg-emerald-950/60 border border-emerald-900/40 rounded-xl flex items-center justify-center text-xl">🎬</div>
              </div>

              <div className="bg-[#0b132b] border border-slate-900 p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-medium">ගිණුමේ තත්ත්වය</p>
                  <h3 className="text-base font-bold text-emerald-400 mt-1">● Active Account</h3>
                </div>
                <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-xl">⚡</div>
              </div>
            </div>

            {/* 🎯 DIGIMART ANNOUNCEMENTS & ADVERTISEMENTS SECTION */}
            <div className="space-y-4 pt-2">
              <h2 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                <span>📢</span> Digimart විශේෂ නිවේදන සහ පිරිනැමීම්
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* AD CARD 1: ZOOM 300P / 500P PACKAGE UPGRADE */}
                <div className="bg-gradient-to-br from-blue-950/50 via-[#0b132b] to-indigo-950/40 border border-blue-800/40 p-6 rounded-2xl relative overflow-hidden group shadow-xl">
                  <div className="absolute top-3 right-3 bg-blue-600 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider text-white">
                    Special Offer
                  </div>
                  <h3 className="text-base font-black text-blue-300">🚀 Zoom 300 / 500 Participants Package Upgrade!</h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    ඔබගේ ශිෂ්‍ය සංඛ්‍යාව වැඩි වී තිබේද? කිසිදු බාධාවකින් තොරව 300 හෝ 500 ලිමිට් ඇති Zoom Pro Packages අදම Digimart LMS හරහා පහසුවෙන් ලබාගන්න.
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs font-mono text-emerald-400 font-bold">24/7 Live Support Available</span>
                    <a 
                      href="https://wa.me/94778538626?text=Hi%20Digimart!%20මම%20Zoom%20Package%20එකක්%20Upgrade%20කරගන්න%20විස්තර%20දැනගන්න%20කැමතියි." 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5"
                    >
                      💬 Contact Support
                    </a>
                  </div>
                </div>

                {/* AD CARD 2: AUTOMATED LMS / WEBSITE INTEGRATION */}
                <div className="bg-gradient-to-br from-purple-950/40 via-[#0b132b] to-slate-900 border border-purple-800/30 p-6 rounded-2xl relative overflow-hidden group shadow-xl">
                  <div className="absolute top-3 right-3 bg-purple-600 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider text-white">
                    New Feature
                  </div>
                  <h3 className="text-base font-black text-purple-300">🌐 ඔබගේම LMS වෙබ් අඩවියක් සාදා ගනිමුද?</h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    Automated Card Payments, Student Attendance Tracking සහ Class Video Cloud Storage සමඟින් ඔබගේ නමින්ම LMS Web Platform එකක් මිනිත්තු කිහිපයකින් ස්ථාපනය කරගන්න.
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs font-mono text-purple-400 font-bold">Digimart Smart LMS</span>
                    <a 
                      href="https://wa.me/94778538626?text=Hi%20Digimart!%20මම%20LMS%20Website%20එකක්%20හදාගන්න%20විස්තර%20දැනගන්න%20කැමතියි." 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5"
                    >
                      ✨ වැඩිවිස්තර සඳහා
                    </a>
                  </div>
                </div>

              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="p-6 bg-[#0b132b] border border-slate-900 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-slate-200">අලුත් පන්තියක් සැලසුම් කිරීමට අවශ්‍යද?</h4>
                <p className="text-xs text-gray-500 mt-1">තත්පර කිහිපයකින් Zoom Meeting එකක් සාදා ගන්න.</p>
              </div>
              <button 
                onClick={() => setActiveTab("schedule")}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-blue-600/20"
              >
                ➕ Schedule New Class Now
              </button>
            </div>

          </div>
        )}

        {/* ----------------- ➕ TAB 2: SCHEDULE CLASS FORM ----------------- */}
        {activeTab === "schedule" && (
          <div className="max-w-2xl mx-auto bg-[#0b132b] border border-slate-900 p-6 rounded-2xl shadow-xl space-y-5 animate-fadeIn">
            <h2 className="text-base font-bold text-blue-400 flex items-center gap-2 border-b border-slate-900 pb-3">
              <span>🚀</span> අලුත් Class එකක් Schedule කරමු
            </h2>
            
            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Class Topic</label>
                <input 
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="පන්තියේ මාතෘකාව ඇතුලත් කරන්න"
                  className="w-full p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Date</label>
                  <input 
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 color-scheme-dark"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Time</label>
                  <div className="grid grid-cols-3 gap-1">
                    <select 
                      value={selectedHour} 
                      onChange={(e) => setSelectedHour(e.target.value)}
                      className="p-3 bg-slate-900/90 border border-slate-800 rounded-l-xl text-xs text-center focus:outline-none"
                    >
                      {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                    <select 
                      value={selectedMinute} 
                      onChange={(e) => setSelectedMinute(e.target.value)}
                      className="p-3 bg-slate-900/90 border-y border-slate-800 text-xs text-center focus:outline-none"
                    >
                      {["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <select 
                      value={selectedAmPm} 
                      onChange={(e) => setSelectedAmPm(e.target.value)}
                      className="p-3 bg-slate-900/90 border border-slate-800 rounded-r-xl text-xs text-center font-bold text-blue-400 focus:outline-none"
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Duration (Hours)</label>
                  <select 
                    value={durationHours}
                    onChange={(e) => setDurationHours(e.target.value)}
                    className="w-full p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs focus:outline-none"
                  >
                    {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map(h => (
                      <option key={h} value={`${h} ${parseInt(h) === 1 ? 'Hr' : 'Hrs'}`}>{h} {parseInt(h) === 1 ? 'Hr' : 'Hrs'}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Duration (Minutes)</label>
                  <select 
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs focus:outline-none"
                  >
                    <option>00 Min</option>
                    <option>15 Min</option>
                    <option>30 Min</option>
                    <option>45 Min</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Passcode</label>
                <input 
                  type="text"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-400 focus:outline-none"
                />
              </div>

              <div className="space-y-2.5 pt-2 border-t border-slate-900">
                <label className="flex items-center gap-3 text-xs text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={waitingRoom} onChange={(e) => setWaitingRoom(e.target.checked)} className="w-4 h-4 rounded bg-slate-900" />
                  <span>Waiting Room</span>
                </label>
                <label className="flex items-center gap-3 text-xs text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={hostVideo} onChange={(e) => setHostVideo(e.target.checked)} className="w-4 h-4 rounded bg-slate-900" />
                  <span>Host Video</span>
                </label>
                <label className="flex items-center gap-3 text-xs text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={participantVideo} onChange={(e) => setParticipantVideo(e.target.checked)} className="w-4 h-4 rounded bg-slate-900" />
                  <span>Participant Video</span>
                </label>
                <label className="flex items-center gap-3 text-xs text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={muteOnEntry} onChange={(e) => setMuteOnEntry(e.target.checked)} className="w-4 h-4 rounded bg-slate-900" />
                  <span>Mute on Entry</span>
                </label>
              </div>

              <button 
                type="submit"
                disabled={formLoading}
                className="w-full py-3.5 mt-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 rounded-xl text-xs font-bold tracking-wide transition-all shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2"
              >
                {formLoading ? "⚙️ පන්තිය සකසමින්..." : "▶️ Create Zoom Class"}
              </button>
            </form>
          </div>
        )}

        {/* ----------------- 📅 TAB 3: SCHEDULED CLASSES ----------------- */}
        {activeTab === "planned" && (
          <div className="space-y-4 animate-fadeIn">
            <h2 className="text-sm font-bold tracking-wide text-gray-300 flex items-center justify-between">
              <span className="flex items-center gap-2">📅 සැලසුම් කර ඇති පන්ති</span>
              <span className="bg-slate-900 text-blue-400 text-xs px-2.5 py-1 rounded-full border border-slate-800 font-bold">{plannedClasses.length} Classes</span>
            </h2>
            
            {plannedClasses.length === 0 ? (
              <div className="p-12 border border-dashed border-slate-800 rounded-2xl text-center text-gray-500 text-xs space-y-3">
                <p>👋 ඔබ වෙනුවෙන් මෙතෙක් කිසිදු පන්තියක් සැලසුම් කර නොමැත.</p>
                <button 
                  onClick={() => setActiveTab("schedule")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
                >
                  ➕ Schedule First Class
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {plannedClasses.map((item, idx) => (
                  <div key={idx} className="bg-[#0b132b]/60 border border-slate-900 p-5 rounded-2xl space-y-4 shadow-sm relative hover:border-slate-800 transition-colors">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] bg-blue-950 text-blue-400 font-bold px-2 py-1 rounded-md border border-blue-900/30">{item.date}</span>
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">⏳ {item.duration} Min</span>
                    </div>

                    <h3 className="text-xs font-bold tracking-wide text-slate-200 line-clamp-2">{item.topic}</h3>
                    
                    <div className="bg-slate-950/70 border border-slate-900/60 p-3 rounded-xl space-y-1.5 font-mono text-[11px] text-slate-400">
                      <p>⏰ Time: {item.time || item.startTime || "12:00 PM"}</p>
                      <p>🆔 ID: {item.zoom_id || "පූරණය වෙමින්..."}</p>
                      <p>🔑 Pass: {item.passcode}</p>
                      <p className="text-[10px] text-blue-400 font-bold">⚙️ Acc: {item.zoom_account_id || "Pool Acc"}</p>
                    </div>
                    
                    <div className="space-y-2 pt-1">
                      <div className="grid grid-cols-2 gap-2">
                        <a 
                          href={`https://n8n.epanthiya.com/webhook/start-zoom-class?meeting_id=${item.meeting_id_row || item.zoom_id}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-[10px] font-bold transition-colors text-center block text-white"
                        >
                          ▶️ Start Class
                        </a>

                        <button 
                          onClick={() => {
                            const details = `✨ *DIGIMART LMS - CLASS DETAILS* ✨\n\n📌 *Topic:* ${item.topic}\n📅 *Date:* ${item.date}\n⏰ *Time:* ${item.time}\n\n🔐 *Meeting ID:* ${item.zoom_id}\n🔑 *Passcode:* ${item.passcode}\n\n🌐 *Join Link:* ${item.join_url}`;
                            navigator.clipboard.writeText(details);
                            alert("📝 පන්තියේ විස්තර Clipboard එකට Copy කරගන්නා ලදී.");
                          }}
                          className="py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-bold transition-colors"
                        >
                          📋 Copy Details
                        </button>
                      </div>

                      <button 
                        onClick={() => handleCancelClass(item.meeting_id_row, item.zoom_id)}
                        className="w-full py-1.5 bg-rose-950/30 hover:bg-rose-900/50 border border-rose-900/40 text-rose-400 text-[10px] font-bold rounded-xl transition-all text-center"
                      >
                        ❌ Cancel Class
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ----------------- 🎬 TAB 4: RECORDINGS ----------------- */}
        {activeTab === "recordings" && (
          <div className="space-y-4 animate-fadeIn">
            <h2 className="text-sm font-bold tracking-wide text-gray-300 flex items-center justify-between">
              <span className="flex items-center gap-2">🎬 ඔබගේ පන්ති පටිගත කිරීම් <span className="text-xs font-normal text-gray-500">(Cloudflare R2 Storage)</span></span>
              <span className="bg-slate-900 text-emerald-400 text-xs px-2.5 py-1 rounded-full border border-slate-800 font-bold">{recordings.length} Videos</span>
            </h2>
            
            {recordings.length === 0 ? (
              <div className="p-12 border border-dashed border-slate-800 rounded-2xl text-center text-gray-500 text-xs">
                පටිගත කරන ලද පන්ති දර්ශන කිසිවක් හමුනොවීය.
              </div>
            ) : (
              <div className="bg-[#0b132b]/40 border border-slate-900 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-900 bg-slate-950/50 text-gray-400 font-medium">
                      <th className="p-4 w-[25%]">DATE</th>
                      <th className="p-4 w-[55%]">CLASS TITLE</th>
                      <th className="p-4 w-[20%] text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60 text-slate-300">
                    {recordings.map((rec, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/30 transition-colors">
                        <td className="p-4 font-mono text-gray-400">{rec.date}</td>
                        <td className="p-4 font-bold text-slate-200">{rec.title}</td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(rec.link);
                              alert("🎬 පටිගත කිරීමේ සබැඳිය (Video Link) සාර්ථකව Copy කරගන්නා ලදී.");
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[10px] transition-colors"
                          >
                            📋 Copy Link
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}