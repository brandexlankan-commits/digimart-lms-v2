"use client";

import { useState } from "react";

export default function CreateClassForm() {
  // Form එකේ දත්ත තියාගන්න States
  const [topic, setTopic] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [durationHours, setDurationHours] = useState("1");
  const [durationMinutes, setDurationMinutes] = useState("30");
  const [passcode, setPasscode] = useState("");
  const [loading, setLoading] = useState(false);
  const [zoomDetails, setZoomDetails] = useState<null | {
    start_url: string;
    join_url: string;
    meeting_id: string;
    password: string;
  }>(null);

  // 🚀 මෙන්න උඹ දුන්න ඇත්තම PRODUCTION WEBHOOK URL එක මචං
  const N8N_WEBHOOK_URL = "https://n8n.epanthiya.com/webhook/create-zoom-class";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setZoomDetails(null);

    // 💡 දැනට ලොග් වෙලා ඉන්න ගුරුවරයාගේ ID එක (දැනට teach_01 ලෙස දමා ඇත)
    const currentTeacherId = "teach_01"; 

    // n8n එකට යන ඩේටා පැකට් එක
    const payload = {
      teacher_id: currentTeacherId,
      topic: topic || "Digimart LMS Online Class",
      date: date, // Format: YYYY-MM-DD
      time: time, // Format: HH:MM
      durationHours: durationHours,
      durationMinutes: durationMinutes,
      passcode: passcode || Math.floor(100000 + Math.random() * 900000).toString(), // මුරපදයක් නැත්නම් ඔටෝ හැදේ
      host_video: true,
      participant_video: false,
      waiting_room: false,
      mute_upon_entry: true
    };

    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.status === "success") {
        setZoomDetails(data);
        alert("🎯 පන්තිය සාර්ථකව සකස් කරා මචං! ඩේටාබේස් එකටත් වැටුණා.");
      } else {
        alert("❌ සූම් ක්ලාස් එක හදන්න බැරි වුණා බං.");
      }
    } catch (error) {
      console.error("Error creating class:", error);
      alert("❌ n8n එකට කනෙක්ට් වෙන්න බැරි වුණා මචං!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md border border-gray-200">
      <h2 className="text-xl font-bold mb-4 text-gray-800">නව පන්තියක් සෑදීම (Digimart LMS)</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Topic */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">පන්තියේ මාතෘකාව (Topic)</label>
          <input type="text" className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="උදා: Combined Maths Theory" required />
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">දිනය (Date)</label>
            <input type="date" className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">වේලාව (Time)</label>
            <input type="time" className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value={time} onChange={(e) => setTime(e.target.value)} required />
          </div>
        </div>

        {/* Duration */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">පැය ගණන</label>
            <input type="number" className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value={durationHours} onChange={(e) => setDurationHours(e.target.value)} min="0" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">මිනිත්තු ගණන</label>
            <input type="number" className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} min="0" max="59" />
          </div>
        </div>

        {/* Passcode */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">සූම් මුරපදය (Zoom Passcode)</label>
          <input type="text" className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value={passcode} onChange={(e) => setPasscode(e.target.value)} placeholder="නොගැහුවොත් ඔටෝ හැදේ" />
        </div>

        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 font-semibold transition-colors disabled:bg-gray-400">
          {loading ? "ක්‍රියාවලිය සිදුවේ..." : "🚀 පන්තිය සාදන්න"}
        </button>
      </form>

      {/* සූම් ලින්ක් හැදුනට පස්සේ ඒවා ස්ක්‍රීන් එකේ පෙන්වන කොටස */}
      {zoomDetails && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="font-bold text-green-800 flex items-center gap-1">📹 Zoom පන්ති විස්තර:</h3>
          <div className="mt-2 space-y-1 text-sm text-gray-700">
            <p><strong>Meeting ID:</strong> {zoomDetails.meeting_id}</p>
            <p><strong>Password:</strong> {zoomDetails.password}</p>
          </div>
          <div className="mt-4 space-y-2">
            <a href={zoomDetails.start_url} target="_blank" rel="noopener noreferrer" className="block text-center bg-green-600 text-white p-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors">ගුරුතුමාට ඇතුල් වීමට (Start URL)</a>
            <a href={zoomDetails.join_url} target="_blank" rel="noopener noreferrer" className="block text-center bg-blue-600 text-white p-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">ළමයින්ට ඇතුල් වීමට (Join URL)</a>
          </div>
        </div>
      )}
    </div>
  );
}