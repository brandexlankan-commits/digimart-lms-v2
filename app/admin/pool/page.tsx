"use client";
import { useEffect, useState } from "react";

interface SlotMeeting {
  teacher_id: string;
  topic: string;
  time: string;
  duration: string;
  zoom_id: string;
}

interface PoolData {
  [accId: string]: SlotMeeting[];
}

export default function AdminPoolPage() {
  const [selectedDate, setSelectedDate] = useState("");
  const [poolData, setPoolData] = useState<PoolData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setSelectedDate(today);
    fetchPoolData(today);
  }, []);

  const fetchPoolData = async (dateStr: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/pool?date=${dateStr}`);
      if (res.ok) {
        const data = await res.json();
        setPoolData(data.accounts || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    fetchPoolData(newDate);
  };

  // 🎯 Duration එක පැය සහ විනාඩි බවට හරවන Helper Function එක
  const formatDuration = (totalMinutes: string | number) => {
    const mins = Number(totalMinutes) || 0;
    if (mins <= 0) return "0 Mins";

    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;

    if (hours === 0) {
      return `${remainingMins} Mins`;
    } else if (remainingMins === 0) {
      return `${hours} ${hours === 1 ? "Hour" : "Hours"}`;
    } else {
      return `${hours}h ${remainingMins}m`;
    }
  };

  // 🎯 Time string එක (e.g. "07:30 PM", "05:00 AM") Sort කිරීමට Minutes වලට හරවන Helper Function එක
  const parseTimeToMinutes = (timeStr: string) => {
    if (!timeStr) return 0;
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!match) return 0;

    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3]?.toUpperCase();

    if (period === "PM" && hours < 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    return hours * 60 + minutes;
  };

  const accountKeys = Object.keys(poolData);
  const totalClassesToday = accountKeys.reduce((acc, key) => acc + poolData[key].length, 0);

  return (
    <div className="min-h-screen bg-[#070b19] text-white p-4 sm:p-6 font-sans selection:bg-blue-600/30">
      <div className="max-w-[1500px] mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-900 pb-5 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-200">
              ⚡ Zoom Pool Live Visualizer
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Zoom Accounts වල Time Slots පිරී ඇති ආකාරය සජීවීව බලාගන්න.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-900 border border-slate-800 p-2 rounded-xl flex items-center gap-2">
              <span className="text-xs text-gray-400 font-bold">📅 Select Date:</span>
              <input 
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                className="bg-slate-950 border border-slate-800 text-blue-400 font-bold px-3 py-1 rounded-lg text-xs focus:outline-none cursor-pointer color-scheme-dark"
              />
            </div>
          </div>
        </div>

        {/* SUMMARY STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#0b132b] border border-slate-900 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium">Active Zoom Accounts</p>
              <h3 className="text-2xl font-black text-blue-400 mt-1">{accountKeys.length} Accounts</h3>
            </div>
            <div className="w-10 h-10 bg-blue-950 border border-blue-900 rounded-xl flex items-center justify-center text-lg">⚡</div>
          </div>

          <div className="bg-[#0b132b] border border-slate-900 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium">Total Scheduled Classes</p>
              <h3 className="text-2xl font-black text-emerald-400 mt-1">{totalClassesToday} Classes</h3>
            </div>
            <div className="w-10 h-10 bg-emerald-950 border border-emerald-900 rounded-xl flex items-center justify-center text-lg">📅</div>
          </div>

          <div className="bg-[#0b132b] border border-slate-900 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium">Pool Status</p>
              <h3 className="text-2xl font-black text-purple-400 mt-1">
                {totalClassesToday > 10 ? "🔥 High Demand" : "✅ Normal"}
              </h3>
            </div>
            <div className="w-10 h-10 bg-purple-950 border border-purple-900 rounded-xl flex items-center justify-center text-lg">📊</div>
          </div>
        </div>

        {/* VISUALIZER GRID */}
        {loading ? (
          <div className="p-12 text-center text-gray-500 text-sm animate-pulse">
            ⚙️ Fetching Pool Slot Data...
          </div>
        ) : accountKeys.length === 0 ? (
          <div className="p-12 border border-dashed border-slate-800 rounded-2xl text-center text-gray-500 text-xs">
            👋 මෙම දිනය ({selectedDate}) සඳහා Zoom Pool එකේ කිසිදු පන්තියක් Schedule කර නොමැත.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {accountKeys.map((accId, idx) => {
              // 🎯 Meetings ටික වේලාව (AM/PM) අනුව පිළිවෙලට Sort කරගැනීම
              const meetings = [...poolData[accId]].sort(
                (a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time)
              );

              return (
                <div key={idx} className="bg-[#0b132b] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                  
                  {/* Account Header */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-wider text-blue-400 bg-blue-950/80 px-2.5 py-0.5 rounded-full border border-blue-900/50">
                        Zoom Account
                      </span>
                      <h3 className="text-sm font-black text-white mt-1 font-mono">{accId}</h3>
                    </div>
                    <span className="bg-slate-900 text-emerald-400 font-bold text-xs px-2.5 py-1 rounded-xl border border-slate-800">
                      {meetings.length} Slots
                    </span>
                  </div>

                  {/* Scheduled Slots List */}
                  <div className="space-y-3">
                    {meetings.map((m, mIdx) => (
                      <div key={mIdx} className="bg-slate-950/80 border border-slate-900/80 p-3.5 rounded-xl space-y-2 hover:border-blue-800/50 transition-all">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-mono text-amber-400 font-bold">⏰ {m.time}</span>
                          <span className="text-[10px] text-gray-400 bg-slate-900 px-2 py-0.5 rounded font-mono">
                            ⏳ {formatDuration(m.duration)}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-slate-200 line-clamp-1">{m.topic}</h4>

                        <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono pt-1 border-t border-slate-900">
                          <span>👤 {m.teacher_id}</span>
                          <span>🆔 {m.zoom_id}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}