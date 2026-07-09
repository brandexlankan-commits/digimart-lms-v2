"use client";
import { useState, useEffect } from "react";

export default function DashboardPage() {
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [teacherId, setTeacherId] = useState("teach_01g8x92n");
  const [teacherName, setTeacherName] = useState("ගුරුතුමනි");
  
  // ටෙස්ට් කිරීමට Mock Data (පසුව මේවා n8n/Google Sheet හරහා API එකෙන් ගමු)
  const [meetings, setMeetings] = useState<any[]>([
    { 
      id: 1, 
      topic: "Combined Maths - Pure Theory Class", 
      start_time: "2026-07-12T18:30:00", 
      duration: 120, 
      meeting_id: "845 2931 4920", 
      passcode: "123456", 
      start_url: "#",
      join_url: "https://zoom.us/j/84529314920" 
    },
    { 
      id: 2, 
      topic: "Combined Maths - Applied Revision", 
      start_time: "2026-07-15T15:00:00", 
      duration: 90, 
      meeting_id: "812 4021 3912", 
      passcode: "998877", 
      start_url: "#",
      join_url: "https://zoom.us/j/81240213912" 
    }
  ]);
  const [recordings, setRecordings] = useState<any[]>([
    { id: 1, date: "2026-07-08", title: "Combined Maths - Integration (Class 02)", r2_url: "https://r2.digimartlms.com/video1.mp4" },
    { id: 2, date: "2026-07-05", title: "Combined Maths - Integration (Class 01)", r2_url: "https://r2.digimartlms.com/video2.mp4" }
  ]);

  const [links, setLinks] = useState<{ 
    start_url: string; 
    join_url: string;
    meeting_id: string;
    password?: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    topic: "",
    date: "",
    time: "",
    duration: 60,
    passcode: "",
    waiting_room: true,
    host_video: true,
    participant_video: false,
    mute_upon_entry: true,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
      setTeacherName("නුවන් සමීර");
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const startDateTime = `${formData.date}T${formData.time}:00`;
    
    setTimeout(() => {
      const generatedMeetingId = "876 5432 1098";
      const generatedPass = formData.passcode || "995511";
      const generatedJoinUrl = "https://zoom.us/j/87654321098";

      setLinks({ 
        start_url: "https://zoom.us/s/mock_meeting_id", 
        join_url: generatedJoinUrl,
        meeting_id: generatedMeetingId,
        password: generatedPass
      });

      const newMeeting = {
        id: Date.now(),
        topic: formData.topic,
        start_time: startDateTime,
        duration: Number(formData.duration),
        meeting_id: generatedMeetingId,
        passcode: generatedPass,
        start_url: "https://zoom.us/s/mock_meeting_id",
        join_url: generatedJoinUrl
      };

      setMeetings((prev) => [...prev, newMeeting]);
      setLoading(false);
    }, 1500);
  };

  // ලස්සනට විස්තර ටික Copy කරගන්නා Function එක
  const copyInvitation = (meeting: any) => {
    const meetingDate = new Date(meeting.start_time).toLocaleDateString();
    const meetingTime = new Date(meeting.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const invitationText = `📢 *NEW ZOOM CLASS* 📢\n\n📌 *Topic:* ${meeting.topic}\n📅 *Date:* ${meetingDate}\n⏰ *Time:* ${meetingTime}\n⏳ *Duration:* ${meeting.duration} Mins\n\n👨‍🎓 *Student Join Link:*\n${meeting.join_url || '#'}\n\n🆔 *Meeting ID:* ${meeting.meeting_id}\n🔑 *Passcode:* ${meeting.passcode}\n\nThank You!\nPowered by Digimart LMS`;
    
    navigator.clipboard.writeText(invitationText);
    alert(`"${meeting.topic}" පන්තියේ WhatsApp Invitation එක සාර්ථකව Copy කරගත්තා! 💬`);
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-bold font-sans">
        <div className="text-center space-y-3">
          <span className="text-2xl animate-spin inline-block">⚙️</span>
          <p>Digimart Dashboard එක සූදානම් වෙමින් පවතී...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10 space-y-10 font-sans">
      
      {/* Header කොටස */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-blue-400">ආයුබෝවන්, {teacherName}! 👋</h1>
          <p className="text-sm text-gray-400 mt-1">Digimart LMS මඟින් ඔබගේ පන්ති සහ පටිගත කිරීම් මෙතැන් සිට පහසුවෙන් පාලනය කරන්න.</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-xl text-xs font-mono text-blue-400">
          Teacher ID: {teacherId ? `${teacherId.substring(0, 13)}...` : "Loading..."}
        </div>
      </div>

      {/* ප්‍රධාන Layout එක */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* වම් පැත්ත: Zoom Form එක */}
        <div className="lg:col-span-1">
          <div className="p-6 bg-slate-900 text-white rounded-xl shadow-lg border border-slate-800">
            <h2 className="text-xl font-bold mb-4 text-blue-400">අලුත් Class එකක් හදමු</h2>
            
            {!links ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Class Topic</label>
                  <input type="text" name="topic" required value={formData.topic} onChange={handleChange} className="w-full p-2.5 bg-slate-800 border border-slate-700/60 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500" placeholder="Grade 13 Pure Maths" />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-400 mb-1">Date</label>
                    <input type="date" name="date" required value={formData.date} onChange={handleChange} className="w-full p-2.5 bg-slate-800 border border-slate-700/60 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-400 mb-1">Time</label>
                    <input type="time" name="time" required value={formData.time} onChange={handleChange} className="w-full p-2.5 bg-slate-800 border border-slate-700/60 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500" />
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-400 mb-1">Duration (Min)</label>
                    <input type="number" name="duration" min="15" required value={formData.duration} onChange={handleChange} className="w-full p-2.5 bg-slate-800 border border-slate-700/60 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-400 mb-1">Passcode</label>
                    <input type="text" name="passcode" value={formData.passcode} onChange={handleChange} className="w-full p-2.5 bg-slate-800 border border-slate-700/60 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500" placeholder="Auto" />
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                    <input type="checkbox" name="waiting_room" className="rounded bg-slate-800 border-slate-700 text-blue-500" checked={formData.waiting_room} onChange={handleChange} /> Waiting Room
                  </label>
                  <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                    <input type="checkbox" name="host_video" className="rounded bg-slate-800 border-slate-700 text-blue-500" checked={formData.host_video} onChange={handleChange} /> Host Video
                  </label>
                  <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                    <input type="checkbox" name="participant_video" className="rounded bg-slate-800 border-slate-700 text-blue-500" checked={formData.participant_video} onChange={handleChange} /> Participant Video
                  </label>
                  <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                    <input type="checkbox" name="mute_upon_entry" className="rounded bg-slate-800 border-slate-700 text-blue-500" checked={formData.mute_upon_entry} onChange={handleChange} /> Mute on Entry
                  </label>
                </div>

                <button type="submit" disabled={loading} className="w-full py-3 mt-4 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-600/20">
                  {loading ? "⚙️ Meeting එක හදමින්..." : "▶️ Create Zoom Class"}
                </button>
              </form>
            ) : (
              <div className="p-4 bg-green-900/20 border border-green-800/60 rounded-2xl space-y-4">
                <p className="font-bold text-green-400 text-center text-sm">✅ Meeting එක සාර්ථකව හැදුවා!</p>
                
                <a href={links.start_url} target="_blank" rel="noreferrer" className="block w-full bg-blue-600 hover:bg-blue-700 py-2.5 rounded-xl text-white text-xs font-bold text-center transition-all">
                  🔗 Start Class (Host / Teacher)
                </a>

                <div className="grid grid-cols-2 gap-2 bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 text-xs">
                  <div>
                    <span className="text-gray-400 block">Meeting ID:</span>
                    <span className="font-mono text-gray-200 select-all">{links.meeting_id}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Passcode:</span>
                    <span className="font-mono text-gray-200 select-all">{links.password}</span>
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={() => {
                    const finalPass = links.password || "None";
                    const invitationText = `📢 *NEW ZOOM CLASS* 📢\n\n📌 *Topic:* ${formData.topic}\n📅 *Date:* ${formData.date}\n⏰ *Time:* ${formData.time}\n⏳ *Duration:* ${formData.duration} Mins\n\n👨‍🎓 *Student Join Link:*\n${links.join_url}\n\n🆔 *Meeting ID:* ${links.meeting_id}\n🔑 *Passcode:* ${finalPass}\n\nThank You!\nPowered by Digimart LMS`;
                    navigator.clipboard.writeText(invitationText);
                    alert("WhatsApp Invitation එක Copy කරගත්තා!");
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 py-2.5 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  💬 Copy WhatsApp Invitation
                </button>

                <button onClick={() => setLinks(null)} className="text-gray-400 text-xs hover:text-white block mx-auto underline pt-1"> 
                  + තව Class එකක් හදන්න 
                </button>
              </div>
            )}
          </div>
        </div>

        {/* දකුණු පැත්ත: Schedules සහ Recordings */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* සැලසුම් කර ඇති පන්ති ලැයිස්තුව */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-200 flex items-center gap-2">
              📅 සැලසුම් කර ඇති පන්ති ({meetings.length})
            </h2>
            
            {meetings.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-gray-500 text-sm">
                තවමත් කිසිදු පන්තියක් සැලසුම් කර නැත.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {meetings.map((meeting) => (
                  <div key={meeting.id} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 hover:border-slate-700 transition-all shadow-md">
                    <div className="flex justify-between items-center">
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full font-semibold">
                        {new Date(meeting.start_time).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-gray-400">⏳ {meeting.duration} Mins</span>
                    </div>
                    <h3 className="text-sm font-bold text-white truncate">{meeting.topic}</h3>
                    <div className="text-[11px] text-gray-400 font-mono space-y-1 bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                      <p>⏰ Time: {new Date(meeting.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      <p>🆔 ID: {meeting.meeting_id}</p>
                      <p>🔑 Pass: {meeting.passcode}</p>
                    </div>
                    
                    {/* බටන් 2 කෑල්ල: එකක් Start කරන්න, අනෙක Invitation එක Copy කරන්න */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <a href={meeting.start_url} target="_blank" rel="noreferrer" className="bg-slate-800 hover:bg-slate-700 text-center py-2 rounded-xl text-xs font-bold transition-all border border-slate-700/40">
                        ▶️ Start Class
                      </a>
                      <button 
                        type="button" 
                        onClick={() => copyInvitation(meeting)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs transition-all shadow-md shadow-emerald-600/10"
                      >
                        📋 Copy Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* පරණ රෙකෝඩින් ලැයිස්තුව */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-200 flex items-center gap-2">
              🎬 පන්ති පටිගත කිරීම් (Cloudflare R2)
            </h2>

            {recordings.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-gray-500 text-sm">
                පටිගත කරන ලද පන්ති කිසිවක් පද්ධතියේ නැත.
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-850/50 border-b border-slate-800 text-gray-400 text-xs uppercase font-semibold">
                      <th className="p-4 pl-6">Date</th>
                      <th className="p-4">Class Title</th>
                      <th className="p-4 text-right pr-6">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs text-gray-300">
                    {recordings.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-800/20 transition-all">
                        <td className="p-4 pl-6 font-mono text-gray-400">{rec.date}</td>
                        <td className="p-4 font-semibold text-white">{rec.title}</td>
                        <td className="p-4 text-right pr-6">
                          <button 
                            type="button"
                            onClick={() => {
                              const invitationText = `📢 *ZOOM CLASS RECORDING* 📢\n\n📌 *Topic:* ${rec.title}\n📅 *Date:* ${rec.date}\n\n🎬 *Watch Here:*\n${rec.r2_url}\n\nThank You!\nPowered by Digimart LMS`;
                              navigator.clipboard.writeText(invitationText);
                              alert("Recording WhatsApp Link එක Copy කරගත්තා!");
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl text-[11px] transition-all shadow-md shadow-emerald-600/10"
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
  );
}