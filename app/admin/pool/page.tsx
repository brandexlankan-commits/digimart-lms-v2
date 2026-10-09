"use client";
import { useEffect, useState } from "react";

// 🎯 Live n8n Production Webhook URLs
const N8N_FORCE_END_WEBHOOK_URL = "https://n8n.epanthiya.com/webhook/admin-force-end";
const N8N_UPDATE_TEACHER_WEBHOOK_URL = "https://n8n.epanthiya.com/webhook/admin-update-teacher";

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
  expire_date?: string;
  expiry_date?: string;
  "Expire Date"?: string;
  email?: string;
  classes: SlotMeeting[];
}

interface PoolData {
  [accId: string]: PoolAccountInfo;
}

interface TeacherExpiry {
  teacher_id: string;
  teacher_name: string;
  username?: string;
  expiry_date: string;
  payment_status?: string;
  slip_url?: string;
  Slip_URL?: string;
  "Slip URL"?: string;
  last_slip_url?: string;
  slip_uploaded_at?: string;
}

export default function AdminPoolPage() {
  const [activeTab, setActiveTab] = useState<"pool" | "ending_schedule" | "expirations" | "zoom_accounts" | "bank_slips">("pool");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [poolData, setPoolData] = useState<PoolData>({});
  const [teachersList, setTeachersList] = useState<TeacherExpiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Expirations Tab States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "expired" | "soon" | "active" | "unpaid" | "paid" | "need_reminder" | "reminded" | "has_slip">("all");
  
  // Bank Slips Tab States
  const [slipSearchTerm, setSlipSearchTerm] = useState("");
  const [slipModalTeacher, setSlipModalTeacher] = useState<TeacherExpiry | null>(null);

  // Ending Schedule Tab States
  const [endingSearchTerm, setEndingSearchTerm] = useState("");
  const [endingFilter, setEndingFilter] = useState<"all" | "active" | "ended">("all");

  // Zoom Accounts Tab States
  const [zoomSearchTerm, setZoomSearchTerm] = useState("");
  const [zoomFilterType, setZoomFilterType] = useState<"all" | "expired" | "soon" | "active" | "inactive">("all");
  const [copiedZoomAccId, setCopiedZoomAccId] = useState<string | null>(null);

  // Copy Feedback States
  const [copiedTeacherId, setCopiedTeacherId] = useState<string | null>(null);
  const [copiedMeetingId, setCopiedMeetingId] = useState<string | null>(null);
  const [copiedIdOnly, setCopiedIdOnly] = useState<string | null>(null);
  const [lastCopiedUsername, setLastCopiedUsername] = useState<string | null>(null);

  // Reminded Teachers Set
  const [remindedTeacherIds, setRemindedTeacherIds] = useState<string[]>([]);

  // Action Loading States
  const [endingMeetingId, setEndingMeetingId] = useState<string | null>(null);
  const [savingTeacherId, setSavingTeacherId] = useState<string | null>(null);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setSelectedDate(today);
    fetchPoolData(today);

    try {
      const stored = localStorage.getItem(`digimart_reminded_${today}`);
      if (stored) {
        setRemindedTeacherIds(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load reminded teachers:", e);
    }
  }, []);

  const fetchPoolData = async (dateStr: string) => {
    setLoading(true);
    setFetchError(null);
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
        setPoolData(data?.accounts || {});
        setTeachersList(Array.isArray(data?.teachers) ? data.teachers : []);
      } else {
        setFetchError(`දත්ත ලබාගැනීමට නොහැකි විය (Server Status: ${res.status}).`);
      }
    } catch (err: any) {
      console.error("Fetch pool error:", err);
      setFetchError("සේවාදායකය සමඟ සම්බන්ධ විය නොහැක. කරුණාකර Reload කරන්න.");
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    fetchPoolData(newDate);
  };

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

  const getTeacherSlipUrl = (t?: TeacherExpiry | null) => {
    if (!t) return "";
    const url = t.slip_url || (t as any)["Slip URL"] || (t as any).Slip_URL || t.last_slip_url || "";
    return typeof url === "string" ? url.trim() : "";
  };

  const handleUpdateTeacher = async (teacherId: string, updates: { expiry_date?: string; payment_status?: string }) => {
    setSavingTeacherId(teacherId);

    setTeachersList((prev) =>
      prev.map((t) => (t.teacher_id === teacherId ? { ...t, ...updates } : t))
    );

    try {
      const targetTeacher = teachersList.find((t) => t.teacher_id === teacherId);
      const payload = {
        teacher_id: teacherId,
        teacher_name: targetTeacher?.teacher_name || "",
        username: targetTeacher?.username || "",
        expiry_date: updates.expiry_date !== undefined ? updates.expiry_date : (targetTeacher?.expiry_date || ""),
        payment_status: updates.payment_status !== undefined ? updates.payment_status : (targetTeacher?.payment_status || "UNPAID"),
      };

      await fetch(N8N_UPDATE_TEACHER_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("Failed to update teacher:", err);
    } finally {
      setSavingTeacherId(null);
    }
  };

  const handleExtendDays = async (teacher: TeacherExpiry, daysToAdd: number) => {
    let baseDate = new Date();
    if (teacher.expiry_date) {
      const currentExp = new Date(teacher.expiry_date);
      if (!isNaN(currentExp.getTime()) && currentExp.getTime() > baseDate.getTime()) {
        baseDate = currentExp;
      }
    }
    baseDate.setDate(baseDate.getDate() + daysToAdd);
    const newExpDate = baseDate.toISOString().split("T")[0];

    await handleUpdateTeacher(teacher.teacher_id, {
      expiry_date: newExpDate,
      payment_status: "PAID",
    });
  };

  const handleQuickRenew = async (teacher: TeacherExpiry) => {
    await handleExtendDays(teacher, 30);
  };

  const handleTogglePaymentStatus = (teacher: TeacherExpiry) => {
    const current = String(teacher.payment_status || "UNPAID").toUpperCase();
    const nextStatus = current === "PAID" ? "UNPAID" : "PAID";
    handleUpdateTeacher(teacher.teacher_id, { payment_status: nextStatus });
  };

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
        headers: { "Content-Type": "application/json" },
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
        setPoolData(data?.accounts || {});
        setTeachersList(Array.isArray(data?.teachers) ? data.teachers : []);
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

  const parseTimeToMinutes = (timeStr?: string) => {
    if (!timeStr) return 0;
    const match = String(timeStr).match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
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

    const rawStatus = String(m.status || m.Status || "").trim().toUpperCase();
    if (rawStatus === "STARTED" || rawStatus === "LIVE") return true;

    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const mStart = parseTimeToMinutes(m.time);
    const mDuration = Number(m.duration) || 60;
    const mEnd = mStart + mDuration;

    return currentMins >= mStart && currentMins <= mEnd;
  };

  const isMeetingUnstartedOverdue = (m: SlotMeeting) => {
    const rawStatus = String(m.status || m.Status || "").trim().toUpperCase();
    if (rawStatus === "ENDED" || rawStatus === "STARTED" || rawStatus === "LIVE" || rawStatus === "EARLY_ENDED") {
      return false;
    }

    if (!selectedDate) return false;
    const todayStr = new Date().toISOString().split("T")[0];
    if (selectedDate < todayStr) return true;
    if (selectedDate > todayStr) return false;

    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const mStart = parseTimeToMinutes(m.time);
    const mDuration = Number(m.duration) || 60;
    const mEnd = mStart + mDuration;

    return currentMins >= mEnd;
  };

  const isAccountBusyRightNow = (meetings: SlotMeeting[]) => {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    
    return (meetings || []).some((m) => {
      if (isMeetingEnded(m)) return false;

      const mStart = parseTimeToMinutes(m.time);
      const mDuration = Number(m.duration) || 60;
      const mEnd = mStart + mDuration;

      const bufferedStart = mStart - 60;
      const bufferedEnd = mEnd + 120;

      return currentMins >= bufferedStart && currentMins <= bufferedEnd;
    });
  };

  const getDaysRemaining = (expDateStr?: string) => {
    if (!expDateStr) return null;
    const cleanStr = String(expDateStr).trim();
    if (!cleanStr) return null;

    let expDate: Date | null = null;
    if (cleanStr.includes("/")) {
      const parts = cleanStr.split("/");
      if (parts.length === 3) {
        const m = parseInt(parts[0], 10) - 1;
        const d = parseInt(parts[1], 10);
        const y = parseInt(parts[2], 10);
        expDate = new Date(y, m, d);
      }
    } else {
      expDate = new Date(cleanStr);
    }

    if (!expDate || isNaN(expDate.getTime())) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expDate.setHours(0, 0, 0, 0);

    const diffTime = expDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // 🎯 DYNAMIC LIVE ORIGIN DIRECT PAY LINK (Login නැතිව කෙලින්ම ගුරුවරයාගේ ID එකට Open වන Link එක)
  const handleCopyReminder = (teacherName: string, teacherId: string, daysLeft: number | null) => {
    let daysText = "";
    if (daysLeft === null) {
      daysText = "ලඟදීම Expire වීමට නියමිතව";
    } else if (daysLeft <= 0) {
      daysText = "කාලය ඉකුත් වී (Expired)";
    } else {
      daysText = `තව දින ${daysLeft}කින් අවසන් වීමට`;
    }

    // 🎯 Live URL එක dynamic ලෙස ඔබ දැනට බ්‍රවුසර් එකේ open කරගෙන සිටින domain එකෙන්ම ලබා ගනී
    const currentOrigin = typeof window !== "undefined" ? window.location.origin : "https://epanthiya.com";
    const directPayLink = `${currentOrigin}/pay?id=${teacherId}`;

    const reminderMsg = `👋 *Hi ${teacherName}!* (Teacher ID: ${teacherId})

🔔 *Digimart LMS - Package Renewal Reminder*

ඔබගේ Digimart LMS සේවාව ${daysText} පවතින බැවින්, Zoom Classes බාධාවකින් තොරව කරගෙන යාමට පහත විස්තර අනුව Renewal එක සිදු කරගන්න.

📦 *Renewal Packages:*
• 15 Days Extension: *LKR 700*
• 30 Days Extension: *LKR 1,400*

🏛️ *Bank Details (Bank Transfer / Deposit):*
• Bank: *Sampath Bank*
• Account Name: *S.D.Nuwan Sameera Deshapriya*
• Account No: *1188 5747 0946*
• Branch: *Rambukkana Branch*

🚀 *Instant Activation (ස්ලිප් එක දමා Login වීමකින් තොරව ක්ෂණිකව Active කරගැනීමට):*
මුදල් තැන්පත් කළ පසු රිසිට්පත (Bank Slip) පහත ලින්ක් එකෙන් කෙලින්ම Upload කළ සැණින් Account එක Auto-Active (Paid) වේ.
👉 *Upload Slip Here:* ${directPayLink}

(නැතහොත් මෙම WhatsApp අංකයට Slip එක එවන්න)

*Thank you for choosing Digimart LMS!* ✨`;

    navigator.clipboard.writeText(reminderMsg);
    setCopiedTeacherId(teacherId);

    setRemindedTeacherIds((prev) => {
      if (!prev.includes(teacherId)) {
        const updated = [...prev, teacherId];
        const today = new Date().toISOString().split("T")[0];
        try {
          localStorage.setItem(`digimart_reminded_${today}`, JSON.stringify(updated));
        } catch (e) {
          console.error(e);
        }
        return updated;
      }
      return prev;
    });

    setTimeout(() => {
      setCopiedTeacherId(null);
    }, 2000);
  };

  const handleToggleRemindedStatus = (e: React.MouseEvent, teacherId: string) => {
    e.stopPropagation();
    setRemindedTeacherIds((prev) => {
      const today = new Date().toISOString().split("T")[0];
      let updated: string[];
      if (prev.includes(teacherId)) {
        updated = prev.filter((id) => id !== teacherId);
      } else {
        updated = [...prev, teacherId];
      }
      try {
        localStorage.setItem(`digimart_reminded_${today}`, JSON.stringify(updated));
      } catch (err) {
        console.error(err);
      }
      return updated;
    });
  };

  const handleCopyMeetingId = (zoomId: string) => {
    navigator.clipboard.writeText(String(zoomId));
    setCopiedMeetingId(zoomId);
    setTimeout(() => {
      setCopiedMeetingId(null);
    }, 2000);
  };

  const handleCopyTeacherIdOnly = (teacherId: string) => {
    navigator.clipboard.writeText(String(teacherId));
    setCopiedIdOnly(teacherId);
    setTimeout(() => {
      setCopiedIdOnly(null);
    }, 2000);
  };

  const handleCopyUsernameOnly = (username: string) => {
    if (!username || username === "N/A") return;
    navigator.clipboard.writeText(String(username));
    setLastCopiedUsername(username);
  };

  const handleCopyZoomAccountId = (accId: string) => {
    navigator.clipboard.writeText(String(accId));
    setCopiedZoomAccId(accId);
    setTimeout(() => {
      setCopiedZoomAccId(null);
    }, 2000);
  };

  const activeAccountKeys = Object.keys(poolData || {}).filter((accId) =>
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

    Object.entries(poolData || {}).forEach(([accId, accInfo]) => {
      (accInfo?.classes || []).forEach((m) => {
        const startMins = parseTimeToMinutes(m.time);
        const durationMins = Number(m.duration) || 60;
        const endMins = startMins + durationMins;

        const slotMins = Math.round(endMins / 30) * 30;
        const slotLabel = formatMinutesToTime(slotMins);
        const exactEndTimeStr = formatMinutesToTime(endMins);

        allEndingItems.push({
          accId,
          poolType: accInfo?.pool_type || "Zoom",
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
      const q = (endingSearchTerm || "").trim().toLowerCase();
      const acc = String(item.accId || "").toLowerCase();
      const tid = String(item.meeting?.teacher_id || "").toLowerCase();
      const top = String(item.meeting?.topic || "").toLowerCase();

      const matchesSearch = acc.includes(q) || tid.includes(q) || top.includes(q);

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
        const classes = groups[slotMins].sort((a, b) => String(a.accId).localeCompare(String(b.accId)));
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

  const earlyEndedMeetings = Object.entries(poolData || {}).flatMap(([accId, accInfo]) =>
    (accInfo?.classes || [])
      .filter((m) => {
        const status = String(m.status || m.Status || "").trim().toUpperCase();
        return status === "EARLY_ENDED";
      })
      .map((m) => {
        const startMins = parseTimeToMinutes(m.time);
        const durationMins = Number(m.duration) || 60;
        const endMins = startMins + durationMins;
        const scheduledEndTimeStr = formatMinutesToTime(endMins);

        return {
          accId,
          poolType: accInfo?.pool_type || "Zoom",
          scheduledEndTimeStr,
          ...m,
        };
      })
  );

  const unstartedOverdueMeetings = Object.entries(poolData || {}).flatMap(([accId, accInfo]) =>
    (accInfo?.classes || [])
      .filter((m) => isMeetingUnstartedOverdue(m))
      .map((m) => {
        const startMins = parseTimeToMinutes(m.time);
        const durationMins = Number(m.duration) || 60;
        const endMins = startMins + durationMins;
        const scheduledEndTimeStr = formatMinutesToTime(endMins);

        return {
          accId,
          poolType: accInfo?.pool_type || "Zoom",
          scheduledEndTimeStr,
          ...m,
        };
      })
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

  // Teachers Processing with Safe String Conversions
  const processedTeachers = (teachersList || []).map((t) => {
    const daysLeft = getDaysRemaining(t.expiry_date);
    const isReminded = remindedTeacherIds.includes(String(t.teacher_id));
    const slipUrl = getTeacherSlipUrl(t);
    return { ...t, daysLeft, isReminded, slipUrl };
  }).sort((a, b) => {
    if (a.daysLeft === null) return 1;
    if (b.daysLeft === null) return -1;
    return a.daysLeft - b.daysLeft;
  });

  const expiredCount = processedTeachers.filter(t => t.daysLeft !== null && t.daysLeft <= 0).length;
  const expiringSoonCount = processedTeachers.filter(t => t.daysLeft !== null && t.daysLeft > 0 && t.daysLeft <= 7).length;
  const unpaidCount = processedTeachers.filter(t => String(t.payment_status || "UNPAID").toUpperCase() === "UNPAID").length;
  const paidCount = processedTeachers.filter(t => String(t.payment_status || "").toUpperCase() === "PAID").length;
  const remindedCount = processedTeachers.filter(t => t.isReminded).length;
  const needReminderCount = processedTeachers.filter(t => !t.isReminded && (t.daysLeft !== null && t.daysLeft <= 7)).length;
  const teachersWithSlips = processedTeachers.filter(t => Boolean(t.slipUrl));

  const filteredTeachers = processedTeachers.filter((t) => {
    const q = (searchTerm || "").trim().toLowerCase();
    const id = String(t.teacher_id || "").toLowerCase();
    const name = String(t.teacher_name || "").toLowerCase();
    const user = String(t.username || "").toLowerCase();

    const matchesSearch = id.includes(q) || name.includes(q) || user.includes(q);

    if (!matchesSearch) return false;
    if (filterType === "expired") return t.daysLeft !== null && t.daysLeft <= 0;
    if (filterType === "soon") return t.daysLeft !== null && t.daysLeft > 0 && t.daysLeft <= 7;
    if (filterType === "active") return t.daysLeft !== null && t.daysLeft > 7;
    if (filterType === "unpaid") return String(t.payment_status || "UNPAID").toUpperCase() === "UNPAID";
    if (filterType === "paid") return String(t.payment_status || "").toUpperCase() === "PAID";
    if (filterType === "need_reminder") return !t.isReminded && (t.daysLeft !== null && t.daysLeft <= 7);
    if (filterType === "reminded") return t.isReminded;
    if (filterType === "has_slip") return Boolean(t.slipUrl);

    return true;
  });

  // Zoom Accounts Processing
  const processedZoomAccounts = Object.entries(poolData || {}).map(([accId, accInfo]) => {
    const rawStatus = String(
      accInfo?.status || 
      accInfo?.Status || 
      accInfo?.account_status || 
      ""
    ).trim();
    const isActive = rawStatus.toUpperCase() === "ACTIVE";
    const expDateStr = accInfo?.expire_date || accInfo?.expiry_date || accInfo?.["Expire Date"] || "";
    const daysLeft = getDaysRemaining(expDateStr);

    return {
      accId,
      poolType: accInfo?.pool_type || "100P",
      status: rawStatus || "Inactive",
      isActive,
      expireDate: expDateStr,
      email: accInfo?.email || (accInfo as any)?.["Email"] || "",
      classesCount: (accInfo?.classes || []).length,
      daysLeft,
    };
  }).sort((a, b) => {
    if (a.daysLeft !== null && b.daysLeft !== null) {
      return a.daysLeft - b.daysLeft;
    }
    if (a.daysLeft !== null) return -1;
    if (b.daysLeft !== null) return 1;
    return String(a.accId).localeCompare(String(b.accId));
  });

  const zoomExpiredCount = processedZoomAccounts.filter(a => a.daysLeft !== null && a.daysLeft <= 0).length;
  const zoomExpiringSoonCount = processedZoomAccounts.filter(a => a.daysLeft !== null && a.daysLeft > 0 && a.daysLeft <= 7).length;
  const zoomActiveCount = processedZoomAccounts.filter(a => a.isActive).length;
  const zoomInactiveCount = processedZoomAccounts.filter(a => !a.isActive).length;

  const filteredZoomAccounts = processedZoomAccounts.filter((a) => {
    const q = (zoomSearchTerm || "").trim().toLowerCase();
    const acc = String(a.accId || "").toLowerCase();
    const email = String(a.email || "").toLowerCase();
    const matchesSearch = acc.includes(q) || email.includes(q);
    if (!matchesSearch) return false;

    if (zoomFilterType === "expired") return a.daysLeft !== null && a.daysLeft <= 0;
    if (zoomFilterType === "soon") return a.daysLeft !== null && a.daysLeft > 0 && a.daysLeft <= 7;
    if (zoomFilterType === "active") return a.isActive;
    if (zoomFilterType === "inactive") return !a.isActive;

    return true;
  });

  const filteredSlips = teachersWithSlips.filter((t) => {
    const q = (slipSearchTerm || "").trim().toLowerCase();
    const id = String(t.teacher_id || "").toLowerCase();
    const name = String(t.teacher_name || "").toLowerCase();
    const user = String(t.username || "").toLowerCase();
    return id.includes(q) || name.includes(q) || user.includes(q);
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
              Zoom Pool Slots, Bank Slip Verifications, Teacher Subscriptions සහ Zoom Accounts Expirations එකම තැනින් සජීවීව Manage කරන්න.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => fetchPoolData(selectedDate)}
              className="px-3.5 py-2 bg-blue-950/80 hover:bg-blue-900 border border-blue-800/60 text-blue-300 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <span>🔄</span> Refresh Data
            </button>

            {activeTab !== "expirations" && activeTab !== "zoom_accounts" && activeTab !== "bank_slips" && (
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

        {/* ERROR NOTICE BANNER */}
        {fetchError && (
          <div className="p-4 bg-rose-950/80 border border-rose-700 rounded-2xl flex items-center justify-between gap-3 text-xs text-rose-300">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <p>{fetchError}</p>
            </div>
            <button 
              onClick={() => fetchPoolData(selectedDate)}
              className="px-3 py-1 bg-rose-800 hover:bg-rose-700 text-white rounded-lg font-bold cursor-pointer"
            >
              නැවත උත්සාහ කරන්න
            </button>
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
            onClick={() => setActiveTab("bank_slips")}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 relative cursor-pointer ${
              activeTab === "bank_slips" 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                : "bg-slate-900/60 text-gray-400 hover:bg-slate-900 hover:text-white border border-slate-800"
            }`}
          >
            <span>💳</span> Bank Slips Review
            {teachersWithSlips.length > 0 && (
              <span className="bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-black animate-pulse">
                {teachersWithSlips.length} Slips
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
            {needReminderCount > 0 ? (
              <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-black animate-pulse">
                {needReminderCount} Need Remind
              </span>
            ) : expiringSoonCount > 0 ? (
              <span className="bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-black">
                All Reminded
              </span>
            ) : null}
          </button>

          <button
            onClick={() => setActiveTab("zoom_accounts")}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 relative cursor-pointer ${
              activeTab === "zoom_accounts" 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                : "bg-slate-900/60 text-gray-400 hover:bg-slate-900 hover:text-white border border-slate-800"
            }`}
          >
            <span>🛡️</span> Zoom Accounts Tracker
            {zoomExpiredCount > 0 ? (
              <span className="bg-rose-500 text-white px-2 py-0.5 rounded-full text-[10px] font-black animate-pulse">
                {zoomExpiredCount} Expired
              </span>
            ) : zoomExpiringSoonCount > 0 ? (
              <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-black animate-pulse">
                {zoomExpiringSoonCount} Expiring Soon
              </span>
            ) : null}
          </button>
        </div>

        {/* LOADING INDICATOR */}
        {loading && (
          <div className="p-12 text-center text-blue-400 font-mono text-sm animate-pulse">
            ⚙️ Fetching Pool Slot &amp; Teacher Data from Server...
          </div>
        )}

        {/* ==================== TAB 1: ZOOM POOL VISUALIZER ==================== */}
        {!loading && activeTab === "pool" && (
          <div className="space-y-6 animate-fadeIn">
            {unstartedOverdueMeetings.length > 0 && (
              <div className="bg-gradient-to-r from-rose-950/50 via-[#0b132b] to-[#0b132b] border border-rose-500/60 rounded-2xl p-5 space-y-4 shadow-2xl animate-fadeIn">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800/80 pb-3 gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl animate-bounce">🚨</span>
                    <div>
                      <h2 className="text-sm font-black text-rose-400 font-mono tracking-wide">
                        OVERDUE UNSTARTED CLASSES ({unstartedOverdueMeetings.length}) - LOCKING ZOOM POOL
                      </h2>
                      <p className="text-[11px] text-gray-400">
                        පන්තියේ නියමිත කාලසීමාව (End Time) අවසන් වනතුරුත් Start නොකරන ලද පන්ති. Zoom Account එක නිදහස් කිරීමට "End &amp; Free Account" ඔබන්න.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-black bg-rose-950 text-rose-300 px-3 py-1 rounded-full border border-rose-800/80 animate-pulse">
                    Action Required
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
                        <th className="p-3">SCHEDULED END TIME</th>
                        <th className="p-3 text-right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-slate-200">
                      {unstartedOverdueMeetings.map((item, idx) => {
                        const isCopied = copiedMeetingId === item.zoom_id;
                        const isUpdating = endingMeetingId === item.zoom_id;

                        return (
                          <tr key={idx} className="hover:bg-slate-900/50 transition-colors bg-rose-950/10">
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
                            <td className="p-3 font-mono text-slate-300">
                              ⏰ {item.time} ({formatDuration(item.duration)})
                            </td>
                            <td className="p-3 font-mono font-bold text-rose-400">
                              🏁 {item.scheduledEndTimeStr} (Ended)
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
                                  className={`px-3 py-1.5 border text-[11px] font-mono font-black rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-md active:scale-95 ${
                                    isUpdating
                                      ? "bg-rose-950 border-rose-800 text-rose-300 opacity-60 cursor-wait"
                                      : "bg-rose-600 hover:bg-rose-500 border-rose-400 text-white shadow-rose-600/30"
                                  }`}
                                >
                                  {isUpdating ? "⏳ Freeing Account..." : "⏹️ End & Free Account"}
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

            {activeAccountKeys.length > 0 && (
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
                          const overdue = isMeetingUnstartedOverdue(m);

                          return (
                            <div 
                              key={mIdx} 
                              className={`p-3.5 rounded-xl space-y-2 transition-all border ${
                                ended
                                  ? "bg-slate-950/30 border-slate-900/50 opacity-60"
                                  : overdue
                                  ? "bg-rose-950/30 border-rose-600/70 shadow-md"
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
                                ) : overdue ? (
                                  <span className="text-[9px] font-mono font-black bg-rose-950 text-rose-300 px-2 py-0.5 rounded border border-rose-700 animate-pulse">
                                    ⚠️ OVERDUE
                                  </span>
                                ) : live ? (
                                  <span className="text-[9px] font-mono font-bold bg-rose-950 text-rose-400 px-2 py-0.5 rounded border border-rose-800/60 animate-pulse flex items-center gap-1">
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
          </div>
        )}

        {/* ==================== TAB 2: CLASS END TIMELINE ==================== */}
        {!loading && activeTab === "ending_schedule" && (
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

            <div className="space-y-6">
              {endingTimelineSlots.map((slotGroup, sIdx) => (
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
                    <span className="px-3 py-1 bg-amber-950/90 text-amber-300 border border-amber-800/80 text-sm font-black font-mono rounded-xl">
                      🏁 ENDING AT {slotGroup.timeLabel} ({slotGroup.classes.length} Classes)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {slotGroup.classes.map((item, cIdx) => (
                      <div key={cIdx} className="p-4 rounded-xl space-y-3 border bg-slate-950/80 border-slate-800/80">
                        <div className="flex justify-between items-center">
                          <span className="px-2.5 py-1 bg-blue-950 border border-blue-700 text-blue-300 font-bold font-mono text-xs rounded-lg">
                            ⚡ {item.accId}
                          </span>
                          <span className="text-[10px] font-bold text-amber-400 font-mono">
                            {item.meeting.time} ➔ {item.exactEndTimeStr}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-100 line-clamp-1">{item.meeting.topic}</h4>
                        <div className="text-[10px] text-gray-400 font-mono">👤 {item.meeting.teacher_id}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== TAB 3: BANK SLIPS REVIEW ==================== */}
        {!loading && activeTab === "bank_slips" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#0b132b] border border-slate-900 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-medium">Uploaded Bank Slips</p>
                  <h3 className="text-2xl font-black text-emerald-400 mt-1">{teachersWithSlips.length} Slips</h3>
                </div>
                <div className="w-10 h-10 bg-emerald-950 border border-emerald-900 rounded-xl flex items-center justify-center text-lg">💳</div>
              </div>

              <div className="bg-[#0b132b] border border-slate-900 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-medium">Paid Teachers</p>
                  <h3 className="text-2xl font-black text-blue-400 mt-1">{paidCount}</h3>
                </div>
                <div className="w-10 h-10 bg-blue-950 border border-blue-900 rounded-xl flex items-center justify-center text-lg">✅</div>
              </div>

              <div className="bg-[#0b132b] border border-slate-900 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-medium">Unpaid Subscriptions</p>
                  <h3 className="text-2xl font-black text-rose-400 mt-1">{unpaidCount}</h3>
                </div>
                <div className="w-10 h-10 bg-rose-950 border border-rose-900 rounded-xl flex items-center justify-center text-lg">⚠️</div>
              </div>
            </div>

            <div className="bg-[#0b132b] border border-slate-900 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="w-full sm:w-96">
                <input 
                  type="text"
                  placeholder="🔍 Search Teacher ID, Username or Name..."
                  value={slipSearchTerm}
                  onChange={(e) => setSlipSearchTerm(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Showing {filteredSlips.length} of {teachersWithSlips.length} Slips
              </p>
            </div>

            <div className="bg-[#0b132b]/60 border border-slate-900 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-900 bg-slate-950/80 text-gray-400 font-mono">
                      <th className="p-4">SLIP PREVIEW</th>
                      <th className="p-4">TEACHER ID</th>
                      <th className="p-4">TEACHER NAME</th>
                      <th className="p-4">STATUS</th>
                      <th className="p-4">CURRENT EXPIRE DATE</th>
                      <th className="p-4">EXTEND EXPIRY DATE</th>
                      <th className="p-4 text-right">ONE-CLICK APPROVAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60 text-slate-300">
                    {filteredSlips.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-10 text-center text-gray-500 font-mono">
                          👋 දැනට Upload කරන ලද Bank Slips කිසිවක් හමු නොවීය.
                        </td>
                      </tr>
                    ) : (
                      filteredSlips.map((t, idx) => {
                        const isSaving = savingTeacherId === t.teacher_id;
                        const slipUrl = t.slipUrl;

                        return (
                          <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                            <td className="p-4">
                              <div 
                                onClick={() => setSlipModalTeacher(t)}
                                className="w-14 h-14 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden cursor-pointer hover:border-blue-500 transition-all flex items-center justify-center group relative shadow-md"
                              >
                                {slipUrl ? (
                                  <>
                                    <img src={slipUrl} alt="Slip" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs transition-opacity">
                                      🔍
                                    </div>
                                  </>
                                ) : (
                                  <span className="text-gray-600 text-xs">No Slip</span>
                                )}
                              </div>
                            </td>

                            <td className="p-4 font-mono font-bold text-blue-400 whitespace-nowrap">
                              <span>👤 {t.teacher_id}</span>
                            </td>

                            <td className="p-4">
                              <div className="font-bold text-white text-xs">{t.teacher_name}</div>
                              {t.username && <div className="text-[11px] text-purple-400 font-mono mt-0.5">@{t.username}</div>}
                            </td>

                            <td className="p-4 whitespace-nowrap">
                              <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-emerald-950 border border-emerald-700 text-emerald-300">
                                ● PAID (ACTIVE)
                              </span>
                            </td>

                            <td className="p-4 font-mono text-xs whitespace-nowrap">
                              <span className="text-amber-400 font-bold bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                                📅 {t.expiry_date || "Not Set"}
                              </span>
                            </td>

                            <td className="p-4 whitespace-nowrap">
                              <input 
                                type="date"
                                value={t.expiry_date || ""}
                                onChange={(e) => handleUpdateTeacher(t.teacher_id, { expiry_date: e.target.value })}
                                disabled={isSaving}
                                className="bg-slate-950 border border-slate-700 hover:border-blue-500 text-blue-300 font-mono font-bold px-2.5 py-1 rounded-lg text-xs focus:outline-none cursor-pointer"
                              />
                            </td>

                            <td className="p-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setSlipModalTeacher(t)}
                                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-blue-400 font-bold text-[11px] rounded-xl transition cursor-pointer"
                                >
                                  👁️ View
                                </button>

                                <button
                                  onClick={() => handleExtendDays(t, 15)}
                                  disabled={isSaving}
                                  className="px-2.5 py-1.5 bg-blue-950 hover:bg-blue-900 border border-blue-700 text-blue-300 font-bold text-[11px] rounded-xl transition cursor-pointer"
                                >
                                  {isSaving ? "⏳" : "+15D"}
                                </button>

                                <button
                                  onClick={() => handleExtendDays(t, 30)}
                                  disabled={isSaving}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-xl transition cursor-pointer shadow-md"
                                >
                                  {isSaving ? "⏳" : "+30D Paid"}
                                </button>
                              </div>
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

        {/* ==================== TAB 4: TEACHER EXPIRATIONS TRACKER ==================== */}
        {!loading && activeTab === "expirations" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
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
                  <p className="text-xs text-gray-400 font-medium">Expiring Soon (≤ 7D)</p>
                  <h3 className="text-2xl font-black text-amber-400 mt-1">{expiringSoonCount}</h3>
                </div>
                <div className="w-10 h-10 bg-amber-950 border border-amber-900 rounded-xl flex items-center justify-center text-lg">⚠️</div>
              </div>

              <div className="bg-[#0b132b] border border-slate-900 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-medium">Bank Slips Uploaded</p>
                  <h3 className="text-2xl font-black text-emerald-400 mt-1">{teachersWithSlips.length}</h3>
                </div>
                <div className="w-10 h-10 bg-emerald-950 border border-emerald-900 rounded-xl flex items-center justify-center text-lg">💳</div>
              </div>

              <div className="bg-[#0b132b] border border-slate-900 p-4 rounded-2xl flex items-center justify-between col-span-2 sm:col-span-1">
                <div>
                  <p className="text-xs text-gray-400 font-medium">Active &amp; Paid</p>
                  <h3 className="text-2xl font-black text-emerald-400 mt-1">{paidCount}</h3>
                </div>
                <div className="w-10 h-10 bg-emerald-950 border border-emerald-900 rounded-xl flex items-center justify-center text-lg">✅</div>
              </div>
            </div>

            <div className="bg-[#0b132b] border border-slate-900 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="w-full md:w-80">
                <input 
                  type="text"
                  placeholder="🔍 Search Teacher ID, Username, or Name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto flex-wrap">
                <button
                  onClick={() => setFilterType("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filterType === "all" ? "bg-blue-600 text-white" : "bg-slate-900 text-gray-400 hover:text-white"
                  }`}
                >
                  All ({processedTeachers.length})
                </button>

                <button
                  onClick={() => setFilterType("need_reminder")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    filterType === "need_reminder" 
                      ? "bg-amber-500 text-slate-950 shadow-md font-black" 
                      : "bg-amber-950/40 border border-amber-800/60 text-amber-300 hover:bg-amber-900/40"
                  }`}
                >
                  <span>📩 Need Remind</span>
                  <span className="bg-amber-400/30 px-1.5 py-0.2 rounded-full text-[10px]">
                    {needReminderCount}
                  </span>
                </button>

                <button
                  onClick={() => setFilterType("reminded")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    filterType === "reminded" 
                      ? "bg-emerald-600 text-white shadow-md font-black" 
                      : "bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/40"
                  }`}
                >
                  <span>🔔 Reminded</span>
                  <span className="bg-emerald-400/30 px-1.5 py-0.2 rounded-full text-[10px]">
                    {remindedCount}
                  </span>
                </button>

                <button
                  onClick={() => setFilterType("has_slip")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    filterType === "has_slip" ? "bg-emerald-600 text-white font-black" : "bg-slate-900 text-emerald-400 hover:text-white"
                  }`}
                >
                  💳 Has Slip ({teachersWithSlips.length})
                </button>

                <button
                  onClick={() => setFilterType("unpaid")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filterType === "unpaid" ? "bg-rose-600 text-white" : "bg-slate-900 text-gray-400 hover:text-white"
                  }`}
                >
                  Unpaid ({unpaidCount})
                </button>

                <button
                  onClick={() => setFilterType("soon")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filterType === "soon" ? "bg-amber-600 text-white" : "bg-slate-900 text-gray-400 hover:text-white"
                  }`}
                >
                  ⚠️ Soon ({expiringSoonCount})
                </button>

                <button
                  onClick={() => setFilterType("expired")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filterType === "expired" ? "bg-red-900 text-white" : "bg-slate-900 text-gray-400 hover:text-white"
                  }`}
                >
                  🔴 Expired ({expiredCount})
                </button>

                <button
                  onClick={() => setFilterType("paid")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filterType === "paid" ? "bg-emerald-600 text-white" : "bg-slate-900 text-gray-400 hover:text-white"
                  }`}
                >
                  🟢 Paid ({paidCount})
                </button>
              </div>
            </div>

            <div className="bg-[#0b132b]/60 border border-slate-900 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-900 bg-slate-950/80 text-gray-400 font-mono">
                      <th className="p-4">TEACHER ID</th>
                      <th className="p-4">USERNAME</th>
                      <th className="p-4">STATUS / REMAINING DAYS</th>
                      <th className="p-4">REMINDER STATUS</th>
                      <th className="p-4">BANK SLIP</th>
                      <th className="p-4">TEACHER NAME</th>
                      <th className="p-4">PAYMENT STATUS</th>
                      <th className="p-4">EXPIRE DATE (SET)</th>
                      <th className="p-4 text-right">QUICK RENEW</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60 text-slate-300">
                    {filteredTeachers.map((t, idx) => {
                      const days = t.daysLeft;
                      const isSaving = savingTeacherId === t.teacher_id;
                      const isPaid = String(t.payment_status || "UNPAID").toUpperCase() === "PAID";
                      const isReminded = t.isReminded;
                      const isCopied = copiedTeacherId === t.teacher_id;
                      const isIdCopied = copiedIdOnly === t.teacher_id;
                      const isUserCopied = Boolean(t.username && lastCopiedUsername === t.username);
                      const slipUrl = t.slipUrl;

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
                            ⚠️ {days} Days Left
                          </span>
                        );
                      } else {
                        statusBadge = (
                          <span className="px-2.5 py-1 bg-emerald-950/80 border border-emerald-800 text-emerald-400 font-bold font-mono rounded-lg inline-flex items-center gap-1">
                            🟢 {days} Days Left
                          </span>
                        );
                      }

                      return (
                        <tr key={idx} className={`hover:bg-slate-900/40 transition-colors ${isUserCopied ? "bg-emerald-950/20 border-l-4 border-l-emerald-500" : ""}`}>
                          
                          <td className="p-4 font-mono font-bold text-blue-400 whitespace-nowrap">
                            <button
                              onClick={() => handleCopyTeacherIdOnly(t.teacher_id)}
                              className="hover:text-blue-300 inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>{t.teacher_id}</span>
                              {isIdCopied && <span className="text-[10px] text-emerald-400">✓</span>}
                            </button>
                          </td>

                          <td className="p-4 font-mono font-semibold whitespace-nowrap text-purple-300">
                            {t.username && t.username !== "N/A" ? (
                              <button
                                onClick={() => handleCopyUsernameOnly(t.username || "")}
                                className={`px-2 py-1 rounded-lg border text-xs cursor-pointer ${
                                  isUserCopied ? "bg-emerald-600 text-white border-emerald-400" : "bg-purple-950/40 border-purple-800/40 hover:text-white"
                                }`}
                              >
                                @{t.username}
                              </button>
                            ) : (
                              <span className="text-gray-500">N/A</span>
                            )}
                          </td>

                          <td className="p-4 whitespace-nowrap">{statusBadge}</td>

                          {/* 🎯 REMINDER STATUS BUTTON */}
                          <td className="p-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <button 
                                onClick={() => handleCopyReminder(t.teacher_name, t.teacher_id, days)}
                                title="Click to copy full renewal message with bank details & direct upload link"
                                className={`px-3 py-1.5 border text-[11px] font-bold rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 ${
                                  isCopied
                                    ? "bg-emerald-600 border-emerald-400 text-white shadow-emerald-600/30 font-black ring-2 ring-emerald-400/40"
                                    : isReminded
                                    ? "bg-emerald-950/50 hover:bg-emerald-900/60 border-emerald-800/70 text-emerald-300 font-semibold"
                                    : (days !== null && days <= 7)
                                    ? "bg-amber-600 hover:bg-amber-500 border-amber-500 text-slate-950 font-black animate-pulse"
                                    : "bg-slate-900 hover:bg-slate-800 border-slate-700 text-emerald-400"
                                }`}
                              >
                                {isCopied ? (
                                  <span>✅ Copied!</span>
                                ) : isReminded ? (
                                  <span>🔔 Reminded</span>
                                ) : (
                                  <span>📩 Send Remind</span>
                                )}
                              </button>

                              {isReminded && (
                                <button
                                  onClick={(e) => handleToggleRemindedStatus(e, t.teacher_id)}
                                  title="Reset reminder status"
                                  className="text-[11px] text-gray-500 hover:text-rose-400 p-1 rounded-lg hover:bg-slate-900 transition-colors"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          </td>

                          {/* BANK SLIP COLUMN */}
                          <td className="p-4 whitespace-nowrap">
                            {slipUrl ? (
                              <button
                                onClick={() => setSlipModalTeacher(t)}
                                className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer shadow-sm"
                              >
                                <span>💳</span>
                                <span>View Slip</span>
                              </button>
                            ) : (
                              <span className="text-gray-600 text-[11px] font-mono">No Slip</span>
                            )}
                          </td>

                          <td className="p-4 font-bold text-white max-w-xs truncate">{t.teacher_name}</td>

                          {/* PAYMENT STATUS TOGGLE */}
                          <td className="p-4 whitespace-nowrap">
                            <button
                              onClick={() => handleTogglePaymentStatus(t)}
                              disabled={isSaving}
                              className={`px-3 py-1 rounded-xl text-[11px] font-mono font-bold border transition-all cursor-pointer ${
                                isPaid
                                  ? "bg-emerald-950/80 border-emerald-600 text-emerald-300"
                                  : "bg-rose-950/80 border-rose-600 text-rose-300 animate-pulse"
                              }`}
                            >
                              {isPaid ? "✅ PAID" : "💳 UNPAID"}
                            </button>
                          </td>

                          {/* EXPIRE DATE INPUT */}
                          <td className="p-4 whitespace-nowrap">
                            <input
                              type="date"
                              value={t.expiry_date || ""}
                              onChange={(e) => handleUpdateTeacher(t.teacher_id, { expiry_date: e.target.value })}
                              disabled={isSaving}
                              className="bg-slate-950 border border-slate-700 text-blue-300 font-mono font-bold px-2 py-1 rounded-lg text-xs"
                            />
                          </td>

                          {/* QUICK RENEW */}
                          <td className="p-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => handleQuickRenew(t)}
                              disabled={isSaving}
                              className="px-3 py-1.5 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 font-bold text-[11px] rounded-xl cursor-pointer"
                            >
                              {isSaving ? "⏳" : "⚡ +30D Paid"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 5: ZOOM ACCOUNTS TRACKER ==================== */}
        {!loading && activeTab === "zoom_accounts" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-[#0b132b] border border-slate-900 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="w-full md:w-80">
                <input 
                  type="text"
                  placeholder="🔍 Search Account ID (e.g. zoom1) or Email..."
                  value={zoomSearchTerm}
                  onChange={(e) => setZoomSearchTerm(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto flex-wrap">
                <button
                  onClick={() => setZoomFilterType("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    zoomFilterType === "all" ? "bg-blue-600 text-white" : "bg-slate-900 text-gray-400 hover:text-white"
                  }`}
                >
                  All ({processedZoomAccounts.length})
                </button>
                <button
                  onClick={() => setZoomFilterType("expired")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    zoomFilterType === "expired" ? "bg-rose-600 text-white" : "bg-slate-900 text-gray-400 hover:text-white"
                  }`}
                >
                  🔴 Expired ({zoomExpiredCount})
                </button>
                <button
                  onClick={() => setZoomFilterType("soon")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    zoomFilterType === "soon" ? "bg-amber-600 text-white" : "bg-slate-900 text-gray-400 hover:text-white"
                  }`}
                >
                  ⚠️ Soon ({zoomExpiringSoonCount})
                </button>
              </div>
            </div>

            <div className="bg-[#0b132b]/60 border border-slate-900 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-900 bg-slate-950/80 text-gray-400 font-mono">
                      <th className="p-4">ZOOM ACCOUNT ID</th>
                      <th className="p-4">EMAIL</th>
                      <th className="p-4">REMAINING DAYS</th>
                      <th className="p-4">EXPIRE DATE</th>
                      <th className="p-4 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60 text-slate-300">
                    {filteredZoomAccounts.map((a, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-4 font-mono font-bold text-blue-400">⚡ {a.accId}</td>
                        <td className="p-4 font-mono text-slate-300">📧 {a.email || "N/A"}</td>
                        <td className="p-4 font-mono">
                          {a.daysLeft !== null && a.daysLeft <= 0 ? (
                            <span className="text-rose-400 font-bold">🔴 Expired {Math.abs(a.daysLeft)}D ago</span>
                          ) : (
                            <span className="text-emerald-400 font-bold">🟢 {a.daysLeft}D Left</span>
                          )}
                        </td>
                        <td className="p-4 font-mono font-bold text-amber-300">📅 {a.expireDate || "N/A"}</td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleCopyZoomAccountId(a.accId)}
                            className="px-3 py-1 bg-slate-900 border border-slate-700 text-blue-400 rounded-lg text-xs cursor-pointer"
                          >
                            📋 Copy
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 🖼️ ENHANCED BANK SLIP PREVIEW & APPROVAL MODAL ==================== */}
        {slipModalTeacher && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
            <div className="bg-[#0b132b] border border-slate-800 w-full max-w-3xl rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl relative">
              
              <button
                onClick={() => {
                  if (savingTeacherId) return;
                  setSlipModalTeacher(null);
                }}
                disabled={Boolean(savingTeacherId)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-900 p-2 rounded-xl border border-slate-800 text-xs cursor-pointer disabled:opacity-50"
              >
                ✕
              </button>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-3 gap-2">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <span>💳</span> Bank Slip Verification
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Teacher: <strong className="text-blue-400">{slipModalTeacher.teacher_name}</strong> (ID: <strong className="text-amber-400">{slipModalTeacher.teacher_id}</strong>)
                  </p>
                </div>

                {getTeacherSlipUrl(slipModalTeacher) && (
                  <button
                    onClick={() => window.open(getTeacherSlipUrl(slipModalTeacher), "_blank")}
                    className="px-3 py-1.5 bg-blue-950/80 hover:bg-blue-900 border border-blue-700/80 text-blue-300 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <span>🔍</span> Open in New Tab (Full Zoom)
                  </button>
                )}
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-2 flex items-center justify-center min-h-[300px] max-h-[520px] overflow-hidden relative group">
                {getTeacherSlipUrl(slipModalTeacher) ? (
                  <img
                    src={getTeacherSlipUrl(slipModalTeacher)}
                    alt="Bank Slip Full"
                    onClick={() => window.open(getTeacherSlipUrl(slipModalTeacher), "_blank")}
                    className="max-h-[500px] w-auto object-contain rounded-xl cursor-zoom-in group-hover:scale-[1.02] transition-transform"
                    title="Click to open full high-resolution image"
                  />
                ) : (
                  <div className="py-20 text-slate-500 text-xs italic">Slip image not available.</div>
                )}
              </div>

              <div className="bg-slate-950/80 border border-slate-900 p-4 rounded-2xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                  <div>
                    <span className="text-gray-400">Current Expiry: </span>
                    <strong className="text-amber-400">{slipModalTeacher.expiry_date || "Not Set"}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400">Status: </span>
                    <strong className="text-emerald-400">{slipModalTeacher.payment_status || "PAID"}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={async () => {
                      if (savingTeacherId) return;
                      await handleExtendDays(slipModalTeacher, 15);
                      setSlipModalTeacher(null);
                    }}
                    disabled={Boolean(savingTeacherId)}
                    className="py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-blue-600/20 cursor-pointer disabled:cursor-not-allowed text-center flex items-center justify-center gap-1.5"
                  >
                    {savingTeacherId === slipModalTeacher.teacher_id ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        <span>Updating Sheet...</span>
                      </>
                    ) : (
                      <>
                        <span>✅</span>
                        <span>Approve +15 Days (Rs. 700)</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={async () => {
                      if (savingTeacherId) return;
                      await handleExtendDays(slipModalTeacher, 30);
                      setSlipModalTeacher(null);
                    }}
                    disabled={Boolean(savingTeacherId)}
                    className="py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-black text-xs rounded-xl transition shadow-lg shadow-emerald-600/20 cursor-pointer disabled:cursor-not-allowed text-center flex items-center justify-center gap-1.5"
                  >
                    {savingTeacherId === slipModalTeacher.teacher_id ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        <span>Updating Sheet...</span>
                      </>
                    ) : (
                      <>
                        <span>🎉</span>
                        <span>Approve +30 Days (Rs. 1,400)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}