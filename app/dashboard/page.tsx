"use client";

import { useState, useEffect } from "react";
// 🚀 Next.js වල පාර වැරදෙන්නේ නැති වෙන්න @/ පාවිච්චි කරලා නූලටම ඉම්පෝට් කරා මචං
import CreateClassForm from "@/components/CreateClassForm";

export default function DashboardPage() {
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [teacherId, setTeacherId] = useState("teach_01g8x92n");
  const [teacherName, setTeacherName] = useState("ගුරුතුමනි");

  // ටෙස්ට් කිරීමට Mock Data (පසුව මෙවා n8n/Google Sheet හරහා API එකෙන් ගමු)
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

  // පේජ් එක ලෝඩ් වෙද්දී රන් වන කෑල්ල
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
    <div className="min-h-screen bg-gray-50 p-6">
      {/* 📋 Header කොටස */}
      <div className="max-w-5xl mx-auto mb-8 flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ආයුබෝවන්, {teacherName} 👋</h1>
          <p className="text-sm text-gray-500 mt-1">Digimart LMS කළමනාකරණ පද්ධතියට සාදරයෙන් පිළිගනිමු.</p>
        </div>
        <div className="text-right">
          <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border border-blue-100">
            ID: {teacherId}
          </span>
        </div>
      </div>

      {/* 🛠️ ප්‍රධාන Grid එක (වම් පැත්තේ Form එක, දකුණු පැත්තේ පන්ති ලැයිස්තුව) */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* 1. නව පන්තියක් සාදන Form එක (Col 1) */}
        <div className="md:col-span-1">
          <CreateClassForm />
        </div>

        {/* 2. පවතින පන්ති සහ රෙකෝඩින් ලැයිස්තුව (Col 2 & 3) */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              📅 ඔබගේ පන්ති කාලසටහන (Schedule)
            </h2>
            
            <div className="space-y-4">
              {meetings.map((meeting) => (
                <div key={meeting.id} className="p-4 bg-gray-50 rounded-md border border-gray-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-800">{meeting.topic}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      🗓️ {new Date(meeting.start_time).toLocaleDateString()} | ⏰ {new Date(meeting.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} ({meeting.duration} Mins)
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      <strong>ID:</strong> {meeting.meeting_id} | <strong>PW:</strong> {meeting.passcode}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <a href={meeting.join_url} target="_blank" rel="noopener noreferrer" className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-medium text-center transition-colors">
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
  );
}