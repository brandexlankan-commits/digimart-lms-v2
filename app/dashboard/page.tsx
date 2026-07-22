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
  
  const [teacherName, setTeacherName] = useState("ගුරුතුමනි");
  const [teacherId, setTeacherId] = useState("");
  const [teacherPic, setTeacherPic] = useState("");
  const [loading, setLoading] = useState(true);

  const [plannedClasses, setPlannedClasses] = useState<Meeting[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  
  const [topic, setTopic] = useState("");
  const [date, setDate] = useState("2026-07-14");
  
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
      try {
        data = await response.json();
      } catch (jsonErr) {
        data = {};
      }

      if (response.ok && data.status === "success") {
        alert("📹 සූම් පන්තිය සාර්ථකව සකස් කර දත්ත ගොනුවට ඇතුලත් කරන ලදී.");
        setTopic("");
        fetchTeacherData(teacherId);
      } else {
        const errorMsg = data.message || data.errorMessage || data.error || "🚫 ඔබගේ Package එක අනුව එකම වේලාවේ මෙපමණ පන්ති සංඛ්‍යාවක් පැවැත්විය නොහැක.";
        alert(errorMsg);
      }
    } catch (error: any) {
      console.error(error);
      alert("⚠️ සේවාදායකය සමඟ සම්බන්ධ වීමේ දෝෂයකි. කරුණාකර නැවත උත්සාහ කරන්න.");
    } finally {
      setFormLoading(false);
    }
  };

  // 🎯 🗑️ CLASS CANCEL FUNCTION
  const handleCancelClass = async (meetingIdRow?: string, zoomMeetingId?: string) => {
    const idToCancel = meetingIdRow || zoomMeetingId;
    
    if (!idToCancel) {
      alert("⚠️ පන්තියේ අංකය (Meeting ID) හමු නොවීය.");
      return;
    }

    const isConfirmed = confirm("⚠️ ඔබට මෙම පන්තිය අවලංගු (Cancel) කිරීමට අවශ්‍යද?\n\nමෙය සිදු කළ පසු අදාළ Zoom Time Slot එක සහ Host Limit එක ස්වයංක්‍රීයව නිදහස් වේ.");
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
      try {
        data = await response.json();
      } catch (e) {
        data = {};
      }

      if (response.ok && data.status === "success") {
        alert("🗑️ පන්තිය සාර්ථකව අවලංගු (Cancel) කරන ලදී.");
        fetchTeacherData(teacherId);
      } else {
        alert(data.message || "❌ පන්තිය අවලංගු කිරීමට නොහැකි විය. නැවත උත්සාහ කරන්න.");
      }
    } catch (error) {
      console.error(error);
      alert("⚠️ සේවාදායකය සමඟ සම්බන්ධ වීමේ දෝෂයකි.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("teacher_id");
    localStorage.removeItem("teacher_name");
    localStorage.removeItem("teacher_pic");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b19] flex items-center justify-center text-white font-sans">
        <p className="text-sm animate-pulse">⚙️ ඔබගේ පාලන පැනලය සහ දත්ත සූදානම් වෙමින් පවතියයි, කරුණාකර රැඳී සිටින්න...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b19] text-white font-sans p-6 selection:bg-blue-600/30">
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* ==================== TOP NAVIGATION / HEADER ==================== */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-900 pb-6 gap-4">
          
          <div className="flex items-center gap-4">
            {teacherPic ? (
              <img 
                src={teacherPic} 
                alt={teacherName} 
                className="w-14 h-14 rounded-2xl object-cover border-2 border-blue-500/50 shadow-lg shadow-blue-500/10"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 border-2 border-blue-400/30 flex items-center justify-center text-xl font-black text-white shadow-lg shadow-blue-500/10">
                {teacherName.charAt(0)}
              </div>
            )}
            
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-200">
                ආයුබෝවන්, {teacherName}! 👋
              </h1>
              <p className="text-xs text-gray-500 mt-1 tracking-wide">
                Digimart LMS මඟින් ඔබගේ පන්ති සහ පටිගත කිරීම් මෙතැන් සිට පහසුවෙන් පාලනය කරන්න.
              </p>
            </div>
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
                  <div className="grid grid-cols-3 gap-1">
                    <select 
                      value={selectedHour} 
                      onChange={(e) => setSelectedHour(e.target.value)}
                      className="p-3 bg-slate-900/90 border border-slate-800 rounded-l-xl text-xs focus:outline-none focus:border-blue-500 appearance-none text-center"
                    >
                      {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                    <select 
                      value={selectedMinute} 
                      onChange={(e) => setSelectedMinute(e.target.value)}
                      className="p-3 bg-slate-900/90 border-y border-slate-800 text-xs focus:outline-none focus:border-blue-500 appearance-none text-center"
                    >
                      {["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <select 
                      value={selectedAmPm} 
                      onChange={(e) => setSelectedAmPm(e.target.value)}
                      className="p-3 bg-slate-900/90 border border-slate-800 rounded-r-xl text-xs focus:outline-none focus:border-blue-500 appearance-none text-center font-bold text-blue-400"
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
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
                    {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map(h => (
                      <option key={h} value={`${h} ${parseInt(h) === 1 ? 'Hr' : 'Hrs'}`}>{h} {parseInt(h) === 1 ? 'Hr' : 'Hrs'}</option>
                    ))}
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

          {/* RIGHT COLUMN: DYNAMIC PLANNED CLASSES & RECORDINGS */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* SECTION 1: PLANNED CLASSES LIST */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold tracking-wide text-gray-300 flex items-center gap-2">
                <span>📅</span> සැලසුම් කර ඇති පන්ති <span className="bg-slate-900 text-blue-400 text-xs px-2 py-0.5 rounded-full border border-slate-800">{plannedClasses.length}</span>
              </h2>
              
              {plannedClasses.length === 0 ? (
                <div className="p-8 border border-dashed border-slate-800 rounded-2xl text-center text-gray-500 text-xs">
                  👋 ඔබ වෙනුවෙන් මෙතෙක් කිසිදු පන්තියක් සැලසුම් කර නොමැත.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {plannedClasses.map((item, idx) => (
                    <div key={idx} className="bg-[#0b132b]/50 border border-slate-900 p-5 rounded-2xl space-y-4 shadow-sm relative">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] bg-blue-950 text-blue-400 font-bold px-2 py-1 rounded-md border border-blue-900/30">{item.date}</span>
                        <span className="text-[10px] text-gray-400 flex items-center gap-1">⏳ {item.duration} Min</span>
                      </div>
                      <h3 className="text-xs font-bold tracking-wide text-slate-200">{item.topic}</h3>
                      
                      <div className="bg-slate-950/60 border border-slate-900/60 p-3 rounded-xl space-y-1.5 font-mono text-[11px] text-slate-400">
                        <p>
                          ⏰ Time: {
                            (() => {
                              try {
                                const rawTime = item.time || item.startTime || item.start_time;
                                if (!rawTime) return "12:00 PM";
                                if (rawTime.includes('AM') || rawTime.includes('PM')) return rawTime;
                                if (rawTime.includes('T') || rawTime.includes(':')) {
                                  const timeString = rawTime.includes('T') ? rawTime : `${item.date}T${rawTime}`;
                                  const dateObj = new Date(timeString);
                                  if (!isNaN(dateObj.getTime())) {
                                    return dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                                  }
                                }
                                return rawTime;
                              } catch (e) {
                                return item.time || "12:00 PM";
                              }
                            })()
                          }
                        </p>
                        <p>🆔 ID: {item.zoom_id || "පූරණය වෙමින්..."}</p>
                        <p>🔑 Pass: {item.passcode}</p>
                        <p className="text-[10px] text-blue-400 font-bold">⚙️ Acc: {item.zoom_account_id || "Pool Account"}</p>
                      </div>
                      
                      {/* BUTTONS LAYOUT */}
                      <div className="space-y-2 pt-1">
                        <div className="grid grid-cols-2 gap-3">
                          <a 
                            href={`https://n8n.epanthiya.com/webhook/start-zoom-class?meeting_id=${item.meeting_id_row || item.zoom_id}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-[10px] font-bold tracking-wide transition-colors text-center block"
                          >
                            ▶️ Start Class
                          </a>

                          <button 
                            onClick={() => {
                              const displayTime = (() => {
                                try {
                                  const rawTime = item.time || item.startTime || item.start_time;
                                  if (!rawTime) return "12:00 PM";
                                  if (rawTime.includes('AM') || rawTime.includes('PM')) return rawTime;
                                  if (rawTime.includes('T') || rawTime.includes(':')) {
                                    const timeString = rawTime.includes('T') ? rawTime : `${item.date}T${rawTime}`;
                                    const dateObj = new Date(timeString);
                                    if (!isNaN(dateObj.getTime())) {
                                      return dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                                    }
                                  }
                                  return rawTime;
                                } catch (e) {
                                  return item.time || "12:00 PM";
                                }
                              })();
                              const details = `✨ *DIGIMART LMS - CLASS DETAILS* ✨\n\n📌 *Topic:* ${item.topic}\n📅 *Date:* ${item.date}\n⏰ *Time:* ${displayTime}\n\n🔐 *Meeting ID:* ${item.zoom_id}\n🔑 *Passcode:* ${item.passcode}\n\n🌐 *Join Link:* ${item.join_url}`;
                              navigator.clipboard.writeText(details);
                              alert("📝 පන්තියේ සියලුම විස්තර ඉතා පැහැදිලිව පිටපත් කර ගන්නා ලදී.");
                            }}
                            className="py-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-[10px] font-bold tracking-wide transition-colors"
                          >
                            📋 Copy Details
                          </button>
                        </div>

                        {/* 🗑️ CANCEL CLASS BUTTON */}
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

            {/* SECTION 2: RECORDINGS TABLE */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold tracking-wide text-gray-300 flex items-center gap-2">
                <span>🎬</span> ඔබගේ පන්ති පටිගත කිරීම් <span className="text-xs font-normal text-gray-500">(Cloudflare R2)</span>
              </h2>
              
              {recordings.length === 0 ? (
                <div className="p-8 border border-dashed border-slate-800 rounded-2xl text-center text-gray-500 text-xs">
                  පටිගත කරන ලද පන්ති දර්ශන කිසිවක් හමුනොවීය.
                </div>
              ) : (
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
                      {recordings.map((rec, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/20 transition-colors">
                          <td className="p-4 font-mono text-gray-400">{rec.date}</td>
                          <td className="p-4 font-bold text-slate-200">{rec.title}</td>
                          <td className="p-4 text-right">
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(rec.link);
                                alert("පටිගත කිරීමේ සබැඳිය සාර්ථකව පිටපත් කර ගන්නා ලදී.");
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-bold text-[10px] transition-colors"
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

          </div>
        </div>

      </div>
    </div>
  );
}