"use client";

import { useState, useEffect } from "react";
// 🚀 n8n සූම් ෆෝම් එක ඉම්පෝට් කරගන්නවා
import CreateClassForm from "@/components/CreateClassForm";

export default function DashboardPage() {
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [teacherId, setTeacherId] = useState("teach_01g8x92n");
  const [teacherName, setTeacherName] = useState("ගුරුතුමනි");

  // පරණ ඩෑෂ්බෝඩ් එකේ තිබ්බ Mock Data ටික මම ඒ විදිහටම හැදුවා මචං
  const [meetings, setMeetings] = useState<any[]>([
    {
      id: 1,
      topic: "Combined Maths - Pure Theory Class",
      start_time: "2026-07-12T18:30:00",
      duration: 120,
      meeting_id: "845 2931 4920",
      passcode: "123456",
      start_url: "#",
      join_url: "https://zoom.us/j/84529314920",
    },
    {
      id: 2,
      topic: "Combined Maths - Applied Revision",
      start_time: "2026-07-15T15:00:00",
      duration: 90,
      meeting_id: "812 4021 3912",
      passcode: "998877",
      start_url: "#",
      join_url: "https://zoom.us/j/81240213912",
    },
  ]);

  useEffect(() => {
    setPageLoading(false);
  }, []);

  if (pageLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <p className="text-lg font-semibold text-gray-600">ඩෑෂ්බෝඩ් එක ලෝඩ් වෙමින් පවතී...</p>
      </div>
    );
  }

  return (
    // 🎨 ඔයාගේ පරණ ඩෑෂ්බෝඩ් එකේ තිබ්බ Wrapper CSS එක මම ආපහු හැදුවා මචං Layout එක ලස්සනට තියාගන්න
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* 📋 Header Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 flex items-center gap-2">
              ආයුබෝවන්, {teacherName} <span className="animate-bounce">👋</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">Digimart LMS කළමනාකරණ පද්ධතියට සාදරයෙන් පිළිගනිමු.</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 px-4 py-2 rounded-xl">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Teacher ID</p>
            <p className="text-sm font-bold text-blue-700">{teacherId}</p>
          </div>
        </div>

        {/* 🛠️ Main Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* 1. වම් පැත්තේ අපේ අලුත් සූම් ෆෝම් එක (Cols 5) */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
            <CreateClassForm />
          </div>

          {/* 2. දකුණු පැත්තේ ඔයාගේ පරණ පන්ති ලැයිස්තුව (Cols 7) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-xl">📅</span>
                <h2 className="text-lg font-bold text-slate-800 tracking-tight">
                  ඔබගේ පන්ති කාලසටහන (Schedule)
                </h2>
              </div>
              
              <div className="space-y-4">
                {meetings.map((meeting) => (
                  <div key={meeting.id} className="p-5 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-all flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-800 text-base">{meeting.topic}</h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">🗓️ {new Date(meeting.start_time).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1">⏰ {new Date(meeting.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        <span className="bg-slate-200/60 px-2 py-0.5 rounded text-slate-600 font-medium">⏳ {meeting.duration} Mins</span>
                      </div>
                      <p className="text-xs text-slate-600 pt-1">
                        <span className="bg-slate-100 px-2 py-1 rounded"><strong>ID:</strong> {meeting.meeting_id}</span>
                        <span className="bg-slate-100 px-2 py-1 rounded ml-2"><strong>PW:</strong> {meeting.passcode}</span>
                      </p>
                    </div>
                    <div className="flex sm:justify-end">
                      <a href={meeting.join_url} target="_blank" rel="noopener noreferrer" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold tracking-wide shadow-sm shadow-blue-200 transition-colors inline-block text-center whitespace-nowrap">
                        Join Class
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}