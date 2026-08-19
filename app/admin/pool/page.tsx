"use client";
import { useEffect, useState } from "react";

// 🎯 Live n8n Production Webhook URL
const N8N_FORCE_END_WEBHOOK_URL = "https://n8n.epanthiya.com/webhook/admin-force-end";

interface SlotMeeting {
  teacher_id: string;
  topic: string;
  time: string;
  duration: number | string;
  zoom_id: string;
  meeting_id_row?: string;
  status?: string;
  Status?: string;
  startTimestamp?: number;
  endTimestamp?: number;
  bufferedStartTimestamp?: number;
  bufferedEndTimestamp?: number;
}

interface PoolAccountInfo {
  account_id: string;
  pool_type: string;
  status?: string;
  Status?: string;
  account_status?: string;
  classes: SlotMeeting[];
}

interface PoolData {
  [accId: string]: PoolAccountInfo;
}

interface TeacherExpiry {
  teacher_id: string;
  teacher_name: string;
  expiry_date: string;
}

export default function AdminPoolPage() {
  const [activeTab, setActiveTab] = useState<"pool" | "ending_schedule" | "expirations">("pool");
  const [selectedDate, setSelectedDate] = useState("");
  const [poolData, setPoolData] = useState<PoolData>({});
  const [teachersList, setTeachersList] = useState<TeacherExpiry[]>([]);
  const [loading, setLoading] = useState(true);

  // Expirations Tab States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "expired" | "soon" | "active">("all");
  
  // Ending Schedule Tab States
  const [endingSearchTerm, setEndingSearchTerm] = useState("");
  const [endingFilter, setEndingFilter] = useState<"all" | "active" | "ended">("all");

  // Copy Feedback States
  const [copiedTeacherId, setCopiedTeacherId] = useState<string | null>(null);
  const [copiedMeetingId, setCopiedMeetingId] = useState<string | null>(null);

  // 🎯 Fast Action Loading State
  const [endingMeetingId, setEndingMeetingId] = useState<string | null>(null);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setSelectedDate(today);
    fetchPoolData(today);
  }, []);

  const fetchPoolData = async (dateStr: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/pool?date=${dateStr}&t=${Date.now()}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache"
        }
      });
      if (res.ok) {
        const data = await res.json();
        setPoolData(data.accounts || {});
        setTeachersList(data.teachers || []);
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

  // 🎯 Strict Verification: Status එක 'ACTIVE' පමණක් විය යුතුයි
  const isAccountActive = (accInfo?: PoolAccountInfo) => {
    if (!accInfo) return false;
    const rawStatus = String(
      accInfo.status || 
      accInfo.Status || 
      accInfo.account_status || 
      ""
    ).trim().toUpperCase();
    return rawStatus === "ACTIVE";
  };

  // 🎯 Instant Force End (No Alert / No Confirm Popups)
  const handleForceEndMeeting = async (meeting: SlotMeeting & { accId?: string }) => {
    const targetZoomId = String(meeting.zoom_id || "").trim();
    if (!targetZoomId) return;

    setEndingMeetingId(targetZoomId);

    setPoolData((prevData) => {
      const updated = { ...prevData };
      Object.keys(updated).forEach((accKey) => {
        if (updated[accKey]?.classes) {
          updated[accKey].classes = updated[accKey].classes.map((cls) => {
            if (String(cls.zoom_id).trim() === targetZoomId) {
              return { ...cls, status: "ENDED", Status: "ENDED" };
            }
            return cls;
          });
        }
      });
      return updated;
    });

    try {
      await fetch(N8N_FORCE_END_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          zoom_id: targetZoomId,
          meeting_id_row: meeting.meeting_id_row || targetZoomId,
          teacher_id: meeting.teacher_id,
          account_id: meeting.accId,
        }),
      });

      const res = await fetch(`/api/admin/pool?date=${selectedDate}&t=${Date.now()}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setPoolData(data.accounts || {});
        setTeachersList(data.teachers || []);
      }
    } catch (error) {
      console.error("Failed to update status in background:", error);
    } finally {
      setEndingMeetingId(null);
    }
  };

  const isMeetingEnded = (m: SlotMeeting) => {
    const rawStatus = String(m.status || m.Status || "").trim().toUpperCase();
    return rawStatus === "ENDED";
  };

  const formatDuration = (totalMinutes: string | number) => {
    const mins = Number(totalMinutes) || 0;
    if (mins <= 0) return "0 Mins";

    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;

    if (hours === 0) return `${remainingMins} Mins`;
    if (remainingMins === 0) return `${hours} ${hours === 1 ? "Hour" : "Hours"}`;
    return `${hours}h ${remainingMins}m`;
  };

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

  const formatMinutesToTime = (mins: number) => {
    const normalizedMins = ((mins % 1440) + 1440) % 1440;
    let h = Math.floor(normalizedMins / 60);
    const m = normalizedMins % 60;
    const ampm = h >= 12 ? "PM" : "AM";
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${ampm}`;
  };

  const isMeetingLiveNow = (m: SlotMeeting) => {
    if (isMeetingEnded(m)) return false;

    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const mStart = parseTimeToMinutes(m.time);
    const mDuration = Number(m.duration) || 60;
    const mEnd = mStart + mDuration;

    return currentMins >= mStart && currentMins <= mEnd;
  };

  const isAccountBusyRightNow = (meetings: SlotMeeting[]) => {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    
    return meetings.some((m) => {
      if (isMeetingEnded(m)) return false;

      const mStart = parseTimeToMinutes(m.time);
      const mDuration = Number(m.duration) || 60;
      const mEnd = mStart + mDuration;

      const bufferedStart = mStart - 60;
      const bufferedEnd = mEnd + 120;

      return currentMins >= bufferedStart && currentMins <= bufferedEnd;
    });
  };

  const getDaysRemaining = (expDateStr: string) => {
    if (!expDateStr) return null;
    const expDate = new Date(expDateStr);
    if (isNaN(expDate.getTime())) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expDate.setHours(0, 0, 0, 0);

    const diffTime = expDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleCopyReminder = (teacherName: string, teacherId: string, daysLeft: number | null) => {
    let daysText = "";
    if (daysLeft === null) {
      daysText = "ලඟදීම Expire වීමට නියමිතව";
    } else if (daysLeft <= 0) {
      daysText = "කාලය ඉකුත් වී (Expired)";
    } else {
      daysText = `තව දින ${daysLeft}කින් අවසන් වීමට`;
    }

    const reminderMsg = `👋 *Hi ${teacherName}!* (ID: ${teacherId})

🔔 *Digimart LMS - Renewal Notice*

ඔබගේ Digimart LMS Package එක ${daysText} ඇති බැවින්, අඛණ්ඩව Zoom සහ LMS සේවාවන් බාධාවකින් තොරව ලබා ගැනීමට කරුණාකර ඔබගේ Package Renewal එක සිදු කරගැනීමට කටයුතු කරන්න.

💬 *Package Renewal විස්තර සහ Payments සිදු කිරීම සඳහා කරුණාකර අප හා සම්බන්ධ වන්න.*

*Thank you for choosing Digimart LMS!* ✨`;

    navigator.clipboard.writeText(reminderMsg);
    setCopiedTeacherId(teacherId);
    setTimeout(() => {
      setCopiedTeacherId(null);
    }, 2000);
  };

  const handleCopyMeetingId = (zoomId: string) => {
    navigator.clipboard.writeText(zoomId);
    setCopiedMeetingId(zoomId);
    setTimeout(() => {
      setCopiedMeetingId(null);
    }, 2000);
  };

  // 🎯 STRICT FILTER: ACTIVE ACCOUNTS ONLY
  const activeAccountKeys = Object.keys(poolData).filter((accId) =>
    isAccountActive(poolData[accId])
  );

  const calculateNext4HoursAvailability = () => {
    const totalAccounts = activeAccountKeys.length;
    if (totalAccounts === 0) return [];

    const now = new Date();
    const currentHour = now.getHours();
    const hourlySlots = [];

    for (let i = 0; i < 4; i++) {
      const targetHour = (currentHour + i) % 24;
      const slotStartMins = targetHour * 60;
      const slotEndMins = slotStartMins + 60;

      const ampm = targetHour >= 12 ? "PM" : "AM";
      const displayHour = targetHour % 12 === 0 ? 12 : targetHour % 12;
      const timeLabel = `${displayHour.toString().padStart(2, "0")}:00 ${ampm}`;

      const busyAccounts: string[] = [];
      const availableAccounts: string[] = [];

      activeAccountKeys.forEach((accId) => {
        const accInfo = poolData[accId];
        const meetings = accInfo?.classes || [];
        
        const isBusy = meetings.some((m) => {
          if (isMeetingEnded(m)) return false;

          const mStart = parseTimeToMinutes(m.time);
          const mDuration = Number(m.duration) || 60;
          const mEnd = mStart + mDuration;

          const bufferedStart = mStart - 60;
          const bufferedEnd = mEnd + 120;

          return bufferedStart < slotEndMins && bufferedEnd > slotStartMins;
        });

        if (isBusy) busyAccounts.push(accId);
        else availableAccounts.push(accId);
      });

      hourlySlots.push({
        timeLabel,
        hour: targetHour,
        totalAccounts,
        availableCount: availableAccounts.length,
        busyCount: busyAccounts.length,
        availableAccounts,
        busyAccounts,
      });
    }

    return hourlySlots;
  };

  const get30MinuteEndingSlots = () => {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const allEndingItems: Array<{
      accId: string;
      poolType: string;
      meeting: SlotMeeting;
      startMins: number;
      durationMins: number;
      endMins: number;
      exactEndTimeStr: string;
      slotMins: number;
      slotLabel: string;
      isEnded: boolean;
      isLive: boolean;
    }> = [];

    Object.entries(poolData).forEach(([accId, accInfo]) => {
      (accInfo.classes || []).forEach((m) => {
        const startMins = parseTimeToMinutes(m.time);
        const durationMins = Number(m.duration) || 60;
        const endMins = startMins + durationMins;

        const slotMins = Math.round(endMins / 30) * 30;
        const slotLabel = formatMinutesToTime(slotMins);
        const exactEndTimeStr = formatMinutesToTime(endMins);

        allEndingItems.push({
          accId,
          poolType: accInfo.pool_type || "Zoom",
          meeting: m,
          startMins,
          durationMins,
          endMins,
          exactEndTimeStr,
          slotMins,
          slotLabel,
          isEnded: isMeetingEnded(m),
          isLive: isMeetingLiveNow(m),
        });
      });
    });

    const groups: { [slotMins: number]: typeof allEndingItems } = {};
    allEndingItems.forEach((item) => {
      const matchesSearch =
        item.accId.toLowerCase().includes(endingSearchTerm.toLowerCase()) ||
        item.meeting.teacher_id.toLowerCase().includes(endingSearchTerm.toLowerCase()) ||
        item.meeting.topic.toLowerCase().includes(endingSearchTerm.toLowerCase());

      if (!matchesSearch) return;

      if (endingFilter === "active" && item.isEnded) return;
      if (endingFilter === "ended" && !item.isEnded) return;

      if (!groups[item.slotMins]) groups[item.slotMins] = [];
      groups[item.slotMins].push(item);
    });

    return Object.keys(groups)
      .map(Number)
      .sort((a, b) => a - b)
      .map((slotMins) => {
        const classes = groups[slotMins].sort((a, b) => a.accId.localeCompare(b.accId));
        const timeLabel = formatMinutesToTime(slotMins);
        const isPast = currentMins > slotMins;
        const isEndingSoon = currentMins >= slotMins - 30 && currentMins <= slotMins;

        return {
          slotMins,
          timeLabel,
          classes,
          isPast,
          isEndingSoon,
        };
      });
  };

  const earlyEndedMeetings = Object.entries(poolData).flatMap(([accId, accInfo]) =>
    (accInfo.classes || [])
      .filter((m) => {
        const status = String(m.status || m.Status || "").trim().toUpperCase();
        return status === "EARLY_ENDED";
      })
      .map((m) => ({
        accId,
        poolType: accInfo.pool_type || "Zoom",
        ...m,
      }))
  );

  const busyAccountsNowCount = activeAccountKeys.filter((accId) => {
    const accInfo = poolData[accId];
    return isAccountBusyRightNow(accInfo?.classes || []);
  }).length;

  const activeClassesToday = activeAccountKeys.reduce((acc, key) => {
    const meetings = poolData[key]?.classes || [];
    return acc + meetings.filter(m => !isMeetingEnded(m)).length;
  }, 0);

  const upcoming4HoursSlots = calculateNext4HoursAvailability();
  const endingTimelineSlots = get30MinuteEndingSlots();

  const processedTeachers = teachersList.map(t => {
    const daysLeft = getDaysRemaining(t.expiry_date);
    return { ...t, daysLeft };
  }).sort((a, b) => {
    if (a.daysLeft === null) return 1;
    if (b.daysLeft === null) return -1;
    return a.daysLeft - b.daysLeft;
  });

  const expiredCount = processedTeachers.filter(t => t.daysLeft !== null && t.daysLeft <= 0).length;
  const expiringSoonCount = processedTeachers.filter(t => t.daysLeft !== null && t.daysLeft > 0 && t.daysLeft <= 7).length;
  const activeCount = processedTeachers.filter(t => t.daysLeft !== null && t.daysLeft > 7).length;

  const filteredTeachers = processedTeachers.filter(t => {
    const matchesSearch = t.teacher_id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.teacher_name.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (filterType === "expired") return t.daysLeft !== null && t.daysLeft <= 0;
    if (filterType === "soon") return t.daysLeft !== null && t.daysLeft > 0 && t.daysLeft <= 7;
    if (filterType === "active") return t.daysLeft !== null && t.daysLeft > 7;

    return true;
  });

  return (
    <div className="min-h-screen bg-[#070b19] text-white p-4 sm:p-6 font-sans selection:bg-blue-600/30">
      <div className="max-w-[1500px] mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-900 pb-5 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-200">
              ⚡ Digimart Admin Management Hub
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Zoom Pool Slots, Early Endings සහ Teacher Subscriptions එකම තැනින් සජීවීව නිරීක්ෂණය කරන්න.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => fetchPoolData(selectedDate)}
              className="px-3.5 py-2 bg-blue-950/80 hover:bg-blue-900 border border-blue-800/60 text-blue-300 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <span>🔄</span> Refresh Data
            </button>

            {activeTab !== "expirations" && (
              <div className="bg-slate-900 border border-slate-800 p-1.5 rounded-xl flex items-center gap-2">
                <span className="text-xs text-gray-400 font-bold pl-2">📅 Date:</span>
                <input 
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="bg-slate-950 border border-slate-800 text-blue-400 font-bold px-3 py-1 rounded-lg text-xs focus:outline-none cursor-pointer"
                />
              </div>
            )}
          </div>
        </div>

        {/* ⚠️ EARLY ENDED MEETINGS OVERVIEW */}
        {earlyEndedMeetings.length > 0 && (
          <div className="bg-gradient-to-r from-amber-950/40 via-[#0b132b] to-[#0b132b] border border-amber-500/50 rounded-2xl p-5 space-y-4 shadow-xl animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800/80 pb-3 gap-2">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">⚠️</span>
                <div>
                  <h2 className="text-sm font-black text-amber-400 font-mono tracking-wide">
                    EARLY ENDED MEETINGS ({earlyEndedMeetings.length})
                  </h2>
                  <p className="text-[11px] text-gray-400">
                    නියමිත Duration එක අවසන් වීමට පෙර Disconnect හෝ End වූ Meetings.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold bg-amber-950/80 text-amber-300 px-3 py-1 rounded-full border border-amber-800/60">
                Direct Release
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/80 text-gray-400 font-mono">
                    <th className="p-3">ZOOM ACCOUNT</th>
                    <th className="p-3">ZOOM MEETING ID</th>
                    <th className="p-3">TEACHER ID</th>
                    <th className="p-3">TOPIC</th>
                    <th className="p-3">SCHEDULED TIME</th>
                    <th className="p-3 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-slate-200">
                  {earlyEndedMeetings.map((item, idx) => {
                    const isCopied = copiedMeetingId === item.zoom_id;
                    const isUpdating = endingMeetingId === item.zoom_id;

                    return (
                      <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-3">
                          <span className="px-2.5 py-1 bg-blue-950 border border-blue-700 text-blue-300 font-black font-mono text-xs rounded-lg shadow-sm">
                            ⚡ {item.accId}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-amber-300 tracking-wider">
                          {item.zoom_id}
                        </td>
                        <td className="p-3 font-mono text-slate-300">
                          👤 {item.teacher_id}
                        </td>
                        <td className="p-3 font-medium text-slate-300 max-w-xs truncate">
                          {item.topic}
                        </td>
                        <td className="p-3 font-mono text-gray-400">
                          ⏰ {item.time} ({formatDuration(item.duration)})
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleCopyMeetingId(item.zoom_id)}
                              className={`px-3 py-1.5 border text-[11px] font-mono font-bold rounded-lg transition-all cursor-pointer shadow-sm active:scale-95 ${
                                isCopied
                                  ? "bg-amber-600 border-amber-500 text-slate-950 shadow-amber-600/30"
                                  : "bg-slate-900 hover:bg-slate-800 border-slate-700 text-amber-400 hover:text-amber-300"
                              }`}
                            >
                              {isCopied ? "✅ Copied" : "📋 Copy ID"}
                            </button>

                            <button
                              onClick={() => handleForceEndMeeting(item)}
                              disabled={isUpdating}
                              className={`px-3 py-1.5 border text-[11px] font-mono font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-sm active:scale-95 ${
                                isUpdating
                                  ? "bg-rose-950 border-rose-800 text-rose-300 opacity-60 cursor-wait"
                                  : "bg-rose-500/20 hover:bg-rose-500/30 border-rose-500/40 text-rose-300 hover:text-white"
                              }`}
                            >
                              {isUpdating ? "⏳ Ending..." : "⏹️ End Class"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB NAVIGATION HEADER */}
        <div className="flex items-center gap-2 border-b border-slate-900 pb-3 flex-wrap">
          <button
            onClick={() => setActiveTab("pool")}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "pool" 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                : "bg-slate-900/60 text-gray-400 hover:bg-slate-900 hover:text-white border border-slate-800"
            }`}
          >
            <span>⚡</span> Zoom Pool Visualizer
          </button>

          <button
            onClick={() => setActiveTab("ending_schedule")}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "ending_schedule" 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                : "bg-slate-900/60 text-gray-400 hover:bg-slate-900 hover:text-white border border-slate-800"
            }`}
          >
            <span>⏱️</span> Class End Timeline (30 Min)
            {activeClassesToday > 0 && (
              <span className="bg-blue-950 border border-blue-700 text-blue-300 px-2 py-0.5 rounded-full text-[10px] font-black">
                {activeClassesToday}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("expirations")}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 relative cursor-pointer ${
              activeTab === "expirations" 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                : "bg-slate-900/60 text-gray-400 hover:bg-slate-900 hover:text-white border border-slate-800"
            }`}
          >
            <span>📅</span> Teacher Expirations Tracker
            {expiringSoonCount > 0 && (
              <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-black animate-pulse">
                {expiringSoonCount}
              </span>
            )}
          </button>
        </div>

        {/* ==================== TAB 1: ZOOM POOL VISUALIZER (ACTIVE POOL ONLY) ==================== */}
        {activeTab === "pool" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#0b132b] border border-slate-900 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-medium">Busy / Total Active Accounts (Now)</p>
                  <h3 className="text-2xl font-black text-blue-400 mt-1">
                    {busyAccountsNowCount} <span className="text-sm font-normal text-slate-400">/ {activeAccountKeys.length} Busy</span>
                  </h3>
                </div>
                <div className="w-10 h-10 bg-blue-950 border border-blue-900 rounded-xl flex items-center justify-center text-lg">⚡</div>
              </div>

              <div className="bg-[#0b132b] border border-slate-900 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-medium">Active Scheduled Classes</p>
                  <h3 className="text-2xl font-black text-emerald-400 mt-1">{activeClassesToday} Classes</h3>
                </div>
                <div className="w-10 h-10 bg-emerald-950 border border-emerald-900 rounded-xl flex items-center justify-center text-lg">📅</div>
              </div>

              <div className="bg-[#0b132b] border border-slate-900 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-medium">Pool Demand Status</p>
                  <h3 className="text-2xl font-black text-purple-400 mt-1">
                    {activeClassesToday > 10 ? "🔥 High Demand" : "✅ Normal"}
                  </h3>
                </div>
                <div className="w-10 h-10 bg-purple-950 border border-purple-900 rounded-xl flex items-center justify-center text-lg">📊</div>
              </div>
            </div>

            {!loading && activeAccountKeys.length > 0 && (
              <div className="bg-[#0b132b] border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <h2 className="text-sm font-black text-white font-mono tracking-wide">
                      🕒 NEXT 4 HOURS LIVE AVAILABILITY (ACTIVE POOL)
                    </h2>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                    Active Slots Capacity
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {upcoming4HoursSlots.map((slot, idx) => {
                    const availabilityPercent = slot.totalAccounts > 0 
                      ? Math.round((slot.availableCount / slot.totalAccounts) * 100) 
                      : 0;
                    let badgeColor = "bg-emerald-950/80 text-emerald-400 border-emerald-800/60";
                    let progressColor = "bg-emerald-500";

                    if (availabilityPercent < 30) {
                      badgeColor = "bg-rose-950/80 text-rose-400 border-rose-800/60";
                      progressColor = "bg-rose-500";
                    } else if (availabilityPercent < 70) {
                      badgeColor = "bg-amber-950/80 text-amber-400 border-amber-800/60";
                      progressColor = "bg-amber-500";
                    }

                    return (
                      <div key={idx} className="bg-slate-950/90 border border-slate-800/80 p-4 rounded-xl space-y-3 relative overflow-hidden group hover:border-blue-700/50 transition-all">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-mono font-black text-amber-400 bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
                            ⏰ {slot.timeLabel}
                          </span>
                          <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border ${badgeColor}`}>
                            {slot.availableCount} / {slot.totalAccounts} Free
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-mono text-slate-400">
                            <span>Capacity</span>
                            <span className="font-bold text-slate-200">{availabilityPercent}% Free</span>
                          </div>
                          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                            <div className={`h-full ${progressColor} transition-all duration-500`} style={{ width: `${availabilityPercent}%` }}></div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-900/80 flex flex-wrap gap-1">
                          {slot.availableAccounts.length === 0 ? (
                            <span className="text-[10px] text-rose-400/80 italic font-mono">❌ All Active Accounts Busy</span>
                          ) : (
                            slot.availableAccounts.map((acc, aIdx) => (
                              <span key={aIdx} className="text-[9px] font-mono bg-blue-950/40 text-blue-300 px-1.5 py-0.5 rounded border border-blue-900/30">
                                {acc}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {loading ? (
              <div className="p-12 text-center text-gray-500 text-sm animate-pulse">
                ⚙️ Fetching Pool Slot Data...
              </div>
            ) : activeAccountKeys.length === 0 ? (
              <div className="p-8 sm:p-12 border border-dashed border-slate-800 rounded-2xl text-center text-gray-500 text-xs">
                👋 Status එක "ACTIVE" ලෙස සකසා ඇති Zoom Pool accounts කිසිවක් හමු නොවීය.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {activeAccountKeys.map((accId, idx) => {
                  const accInfo = poolData[accId];
                  const meetings = [...(accInfo?.classes || [])].sort(
                    (a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time)
                  );

                  return (
                    <div key={idx} className="bg-[#0b132b] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-mono tracking-wider text-blue-400 bg-blue-950/80 px-2.5 py-0.5 rounded-full border border-blue-900/50">
                              {accInfo?.pool_type || "Zoom"}
                            </span>
                            <span className="text-[9px] font-mono bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-900">
                              ACTIVE
                            </span>
                          </div>
                          <h3 className="text-sm font-black text-white mt-1 font-mono">{accId}</h3>
                        </div>
                        <span className="bg-slate-900 text-emerald-400 font-bold text-xs px-2.5 py-1 rounded-xl border border-slate-800">
                          {meetings.length} Classes
                        </span>
                      </div>

                      <div className="space-y-3">
                        {meetings.length === 0 ? (
                          <p className="text-xs text-slate-500 italic py-4 text-center">No classes scheduled for today.</p>
                        ) : (
                          meetings.map((m, mIdx) => {
                            const ended = isMeetingEnded(m);
                            const live = isMeetingLiveNow(m);

                            return (
                              <div 
                                key={mIdx} 
                                className={`p-3.5 rounded-xl space-y-2 transition-all border ${
                                  ended
                                    ? "bg-slate-950/30 border-slate-900/50 opacity-60"
                                    : live
                                    ? "bg-rose-950/20 border-rose-800/60 shadow-lg shadow-rose-950/20"
                                    : "bg-slate-950/80 border-slate-900/80 hover:border-blue-800/50"
                                }`}
                              >
                                <div className="flex justify-between items-center text-xs">
                                  <span className="font-mono text-amber-400 font-bold flex items-center gap-1">
                                    ⏰ {m.time}
                                  </span>
                                  {ended ? (
                                    <span className="text-[9px] font-mono font-bold bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                                      ⚪ ENDED
                                    </span>
                                  ) : live ? (
                                    <span className="text-[9px] font-mono font-bold bg-rose-950 text-rose-400 px-2 py-0.5 rounded border border-rose-800/60 animate-pulse flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                      🔴 LIVE NOW
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-mono font-bold bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-900/50">
                                      🟢 {m.status || "SCHEDULED"}
                                    </span>
                                  )}
                                </div>

                                <h4 className="text-xs font-bold text-slate-200 line-clamp-1">{m.topic}</h4>

                                <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono pt-1 border-t border-slate-900/80">
                                  <span>👤 {m.teacher_id}</span>
                                  <span>⏳ {formatDuration(m.duration)}</span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 2: 30-MIN CLASS END TIMELINE ==================== */}
        {activeTab === "ending_schedule" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-[#0b132b] border border-slate-900 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="w-full md:w-80">
                <input 
                  type="text"
                  placeholder="🔍 Search Zoom ID (e.g. zoom1), Teacher ID, Topic..."
                  value={endingSearchTerm}
                  onChange={(e) => setEndingSearchTerm(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
                <button
                  onClick={() => setEndingFilter("all")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    endingFilter === "all" ? "bg-blue-600 text-white" : "bg-slate-900 text-gray-400 hover:text-white"
                  }`}
                >
                  All Slots
                </button>
                <button
                  onClick={() => setEndingFilter("active")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    endingFilter === "active" ? "bg-emerald-600 text-white" : "bg-slate-900 text-gray-400 hover:text-white"
                  }`}
                >
                  🟢 Scheduled &amp; Live Only
                </button>
                <button
                  onClick={() => setEndingFilter("ended")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    endingFilter === "ended" ? "bg-slate-700 text-white" : "bg-slate-900 text-gray-400 hover:text-white"
                  }`}
                >
                  ⚪ Ended Classes
                </button>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center text-gray-500 text-sm animate-pulse font-mono">
                ⚙️ Loading Class Ending Timeline...
              </div>
            ) : endingTimelineSlots.length === 0 ? (
              <div className="p-12 border border-dashed border-slate-800 rounded-2xl text-center text-gray-500 text-xs">
                👋 තෝරාගත් දිනය සඳහා කිසිදු පන්තියක් අවසන් වීමට නියමිත නැත.
              </div>
            ) : (
              <div className="space-y-6">
                {endingTimelineSlots.map((slotGroup, sIdx) => {
                  return (
                    <div 
                      key={sIdx}
                      className={`bg-[#0b132b] border rounded-2xl p-5 space-y-4 transition-all ${
                        slotGroup.isEndingSoon
                          ? "border-amber-600/70 shadow-lg shadow-amber-950/20 bg-gradient-to-b from-[#0e1736] to-[#0b132b]"
                          : slotGroup.isPast
                          ? "border-slate-900 opacity-75"
                          : "border-slate-800"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800/80 pb-3 gap-2">
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 bg-amber-950/90 text-amber-300 border border-amber-800/80 text-sm font-black font-mono rounded-xl flex items-center gap-1.5 shadow-sm">
                            🏁 ENDING AT {slotGroup.timeLabel}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            ({slotGroup.classes.length} {slotGroup.classes.length === 1 ? "Class" : "Classes"} Freeing Up)
                          </span>
                        </div>

                        {slotGroup.isEndingSoon ? (
                          <span className="text-[10px] font-black font-mono px-3 py-1 bg-amber-500 text-slate-950 rounded-full animate-pulse flex items-center gap-1">
                            ⚠️ ENDING WITHIN 30 MINS
                          </span>
                        ) : slotGroup.isPast ? (
                          <span className="text-[10px] font-bold font-mono px-2.5 py-0.5 bg-slate-900 text-slate-500 rounded-lg border border-slate-800">
                            Passed Slot
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold font-mono px-2.5 py-0.5 bg-emerald-950 text-emerald-400 rounded-lg border border-emerald-900/50">
                            Upcoming
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {slotGroup.classes.map((item, cIdx) => {
                          return (
                            <div 
                              key={cIdx}
                              className={`p-4 rounded-xl space-y-3 border relative overflow-hidden transition-all ${
                                item.isEnded
                                  ? "bg-slate-950/40 border-slate-900 opacity-60"
                                  : item.isLive
                                  ? "bg-rose-950/20 border-rose-800/60 shadow-md"
                                  : "bg-slate-950/80 border-slate-800/80 hover:border-blue-700/60"
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <span className="px-2.5 py-1 bg-blue-950 border border-blue-700 text-blue-300 font-black font-mono text-xs rounded-lg shadow-sm">
                                    ⚡ {item.accId}
                                  </span>
                                  <span className="text-[9px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                                    {item.poolType}
                                  </span>
                                </div>

                                {item.isEnded ? (
                                  <span className="text-[9px] font-mono font-bold bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                                    ⚪ ENDED
                                  </span>
                                ) : item.isLive ? (
                                  <span className="text-[9px] font-mono font-bold bg-rose-950 text-rose-400 px-2 py-0.5 rounded border border-rose-800/60 animate-pulse">
                                    🔴 LIVE NOW
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-mono font-bold bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-900/50">
                                    🟢 {item.meeting.status || "SCHEDULED"}
                                  </span>
                                )}
                              </div>

                              <h4 className="text-xs font-bold text-slate-100 line-clamp-1">
                                {item.meeting.topic}
                              </h4>

                              <div className="space-y-1.5 pt-2 border-t border-slate-900/80 text-[11px] font-mono">
                                <div className="flex justify-between items-center text-amber-400">
                                  <span>🕐 {item.meeting.time} ➔ {item.exactEndTimeStr}</span>
                                  <span className="text-slate-400">⏳ {formatDuration(item.durationMins)}</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-400 text-[10px]">
                                  <span>👤 {item.meeting.teacher_id}</span>
                                  <span className="text-emerald-400 font-semibold">Account Frees At {slotGroup.timeLabel}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 3: TEACHER EXPIRATIONS TRACKER ==================== */}
        {activeTab === "expirations" && (
          <div className="space-y-6 animate-fadeIn">
            
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-[#0b132b] border border-slate-900 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-medium">Total Teachers</p>
                  <h3 className="text-2xl font-black text-blue-400 mt-1">{processedTeachers.length}</h3>
                </div>
                <div className="w-10 h-10 bg-blue-950 border border-blue-900 rounded-xl flex items-center justify-center text-lg">👨‍🏫</div>
              </div>

              <div className="bg-[#0b132b] border border-slate-900 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-medium">Expired Accounts</p>
                  <h3 className="text-2xl font-black text-rose-400 mt-1">{expiredCount}</h3>
                </div>
                <div className="w-10 h-10 bg-rose-950 border border-rose-900 rounded-xl flex items-center justify-center text-lg">🔴</div>
              </div>

              <div className="bg-[#0b132b] border border-slate-900 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-medium">Expiring Soon (≤ 7 Days)</p>
                  <h3 className="text-2xl font-black text-amber-400 mt-1">{expiringSoonCount}</h3>
                </div>
                <div className="w-10 h-10 bg-amber-950 border border-amber-900 rounded-xl flex items-center justify-center text-lg">⚠️</div>
              </div>

              <div className="bg-[#0b132b] border border-slate-900 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-medium">Active &amp; Safe (&gt; 7 Days)</p>
                  <h3 className="text-2xl font-black text-emerald-400 mt-1">{activeCount}</h3>
                </div>
                <div className="w-10 h-10 bg-emerald-950 border border-emerald-900 rounded-xl flex items-center justify-center text-lg">🟢</div>
              </div>
            </div>

            <div className="bg-[#0b132b] border border-slate-900 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="w-full md:w-80">
                <input 
                  type="text"
                  placeholder="🔍 Search Teacher Name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
                <button
                  onClick={() => setFilterType("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    filterType === "all" ? "bg-blue-600 text-white" : "bg-slate-900 text-gray-400 hover:text-white"
                  }`}
                >
                  All ({processedTeachers.length})
                </button>
                <button
                  onClick={() => setFilterType("soon")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    filterType === "soon" ? "bg-amber-600 text-white" : "bg-slate-900 text-gray-400 hover:text-white"
                  }`}
                >
                  ⚠️ Expiring Soon ({expiringSoonCount})
                </button>
                <button
                  onClick={() => setFilterType("expired")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    filterType === "expired" ? "bg-rose-600 text-white" : "bg-slate-900 text-gray-400 hover:text-white"
                  }`}
                >
                  🔴 Expired ({expiredCount})
                </button>
                <button
                  onClick={() => setFilterType("active")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    filterType === "active" ? "bg-emerald-600 text-white" : "bg-slate-900 text-gray-400 hover:text-white"
                  }`}
                >
                  🟢 Active ({activeCount})
                </button>
              </div>
            </div>

            <div className="bg-[#0b132b]/60 border border-slate-900 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-900 bg-slate-950/80 text-gray-400 font-mono">
                      <th className="p-4">TEACHER ID</th>
                      <th className="p-4">TEACHER NAME</th>
                      <th className="p-4">EXPIRE DATE</th>
                      <th className="p-4">STATUS / REMAINING DAYS</th>
                      <th className="p-4 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60 text-slate-300">
                    {filteredTeachers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-500 font-mono">
                          ❌ No teacher records found.
                        </td>
                      </tr>
                    ) : (
                      filteredTeachers.map((t, idx) => {
                        const days = t.daysLeft;

                        let statusBadge = null;
                        if (days === null) {
                          statusBadge = <span className="text-gray-500 font-mono">N/A</span>;
                        } else if (days <= 0) {
                          statusBadge = (
                            <span className="px-2.5 py-1 bg-rose-950/80 border border-rose-800 text-rose-400 font-bold font-mono rounded-lg inline-flex items-center gap-1">
                              🔴 Expired {Math.abs(days)} Days Ago
                            </span>
                          );
                        } else if (days <= 7) {
                          statusBadge = (
                            <span className="px-2.5 py-1 bg-amber-950/80 border border-amber-800 text-amber-400 font-bold font-mono rounded-lg inline-flex items-center gap-1 animate-pulse">
                              ⚠️ {days} {days === 1 ? "Day" : "Days"} Left
                            </span>
                          );
                        } else {
                          statusBadge = (
                            <span className="px-2.5 py-1 bg-emerald-950/80 border border-emerald-800 text-emerald-400 font-bold font-mono rounded-lg inline-flex items-center gap-1">
                              🟢 {days} Days Left
                            </span>
                          );
                        }

                        const isCopied = copiedTeacherId === t.teacher_id;

                        return (
                          <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                            <td className="p-4 font-mono font-bold text-blue-400">{t.teacher_id}</td>
                            <td className="p-4 font-bold text-white">{t.teacher_name}</td>
                            <td className="p-4 font-mono text-slate-300">{t.expiry_date || "N/A"}</td>
                            <td className="p-4">{statusBadge}</td>
                            <td className="p-4 text-right">
                              <button 
                                onClick={() => handleCopyReminder(t.teacher_name, t.teacher_id, days)}
                                className={`px-3.5 py-1.5 border text-[11px] font-bold rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 ${
                                  isCopied
                                    ? "bg-emerald-600 border-emerald-500 text-white shadow-emerald-600/30"
                                    : "bg-emerald-950 hover:bg-emerald-900 border-emerald-800 text-emerald-400"
                                }`}
                              >
                                {isCopied ? "✅ Copied!" : "📋 Copy Reminder"}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}