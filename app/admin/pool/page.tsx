"use client";
import React, { useEffect, useState } from "react";

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
  slip_status?: string;
  Slip_Status?: string;
  "Slip Status"?: string;
  slip_url?: string;
  Slip_URL?: string;
  "Slip URL"?: string;
  last_slip_url?: string;
  slip_uploaded_at?: string;
}

export default function AdminPoolPage() {
  const [activeTab, setActiveTab] = useState<"pool" | "ending_schedule" | "bank_slips" | "expirations" | "zoom_accounts">("pool");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [poolData, setPoolData] = useState<PoolData>({});
  const [teachersList, setTeachersList] = useState<TeacherExpiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Expirations Tab States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "expired" | "soon" | "active" | "unpaid" | "paid" | "need_reminder" | "reminded" | "has_slip">("all");
  
  // Bank Slips Tab States
  const [slipSubTab, setSlipSubTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [slipSearchTerm, setSlipSearchTerm] = useState("");
  const [slipModalTeacher, setSlipModalTeacher] = useState<TeacherExpiry | null>(null);

  // Ending Schedule Tab States
  const [timelineSearch, setTimelineSearch] = useState("");
  const [timelineStatusFilter, setTimelineStatusFilter] = useState<"ALL" | "STARTED" | "SCHEDULED">("ALL");

  // Zoom Accounts Tab States
  const [zoomSearchTerm, setZoomSearchTerm] = useState("");
  const [zoomFilterType, setZoomFilterType] = useState<"all" | "expired" | "soon" | "active" | "inactive">("all");
  const [copiedZoomAccId, setCopiedZoomAccId] = useState<string | null>(null);

  // Copy Feedback States
  const [copiedTeacherId, setCopiedTeacherId] = useState<string | null>(null);
  const [copiedIdOnly, setCopiedIdOnly] = useState<string | null>(null);

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
      const storedReminded = localStorage.getItem(`digimart_reminded_${today}`);
      if (storedReminded) setRemindedTeacherIds(JSON.parse(storedReminded));
    } catch (e) {
      console.error("Failed to load reminded state:", e);
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

  const getTeacherSlipStatus = (t?: TeacherExpiry | null) => {
    if (!t) return "PENDING";
    const status = t.slip_status || (t as any)["Slip Status"] || (t as any).Slip_Status || "";
    const clean = String(status).trim().toUpperCase();
    return clean || "PENDING";
  };

  // Direct Teacher Login
  const handleLoginAsTeacher = (t: TeacherExpiry) => {
    try {
      localStorage.setItem("teacher_id", t.teacher_id);
      localStorage.setItem("teacher_name", t.teacher_name);
      if (t.username) localStorage.setItem("teacher_username", t.username);
      window.open("/dashboard", "_blank");
    } catch (e) {
      console.error("Failed to impersonate teacher:", e);
    }
  };

  // Google Sheet Update
  const handleUpdateTeacher = async (
    teacherId: string, 
    updates: { expiry_date?: string; payment_status?: string; slip_status?: string }
  ) => {
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
        payment_status: updates.payment_status !== undefined ? updates.payment_status : (targetTeacher?.payment_status || "PAID"),
        slip_status: updates.slip_status !== undefined ? updates.slip_status : (getTeacherSlipStatus(targetTeacher) || "Approved"),
      };

      await fetch(N8N_UPDATE_TEACHER_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("Failed to update teacher in sheet:", err);
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
      slip_status: "Approved",
    });
    setSlipModalTeacher(null);
  };

  const handleRejectSlip = async (teacher: TeacherExpiry) => {
    if (!confirm(`⚠️ Teacher: ${teacher.teacher_name} (ID: ${teacher.teacher_id}) ගේ Bank Slip එක Reject කිරීමට අවශ්‍ය බව තහවුරු කරන්න.`)) return;

    await handleUpdateTeacher(teacher.teacher_id, {
      payment_status: "UNPAID",
      slip_status: "Rejected",
    });
    setSlipModalTeacher(null);
  };

  const handleTogglePaymentStatus = (teacher: TeacherExpiry) => {
    const current = String(teacher.payment_status || "UNPAID").toUpperCase();
    const nextStatus = current === "PAID" ? "UNPAID" : "PAID";
    handleUpdateTeacher(teacher.teacher_id, { payment_status: nextStatus });
  };

  const handleForceEndMeeting = async (meeting: any) => {
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

  const handleFreeSlot = async (meeting: any) => {
    if (meeting.isStillInWindow) {
      const confirmMsg = `⚠️ අවධානයට:\n\nමෙම පන්තියේ නිල කාලසටහන:\n• ආරම්භක වේලාව: ${meeting.time}\n• නියමිත අවසන් වේලාව: ${meeting.scheduledEndTimeStr}\n(කාලසටහන අනුව තව මිනිත්තු ${meeting.minsRemaining}ක් ඉතිරිව ඇත - ගුරුවරයා Interval / Break එකක් ලබා දී තිබිය හැක).\n\nදැන් 'Free Slot' කළහොත් ගුරුවරයාට පන්තිය නැවත ආරම්භ කිරීමට නොහැකි වනු ඇත!\n\nඔබට මෙය සැබවින්ම Free කිරීමට අවශ්‍යද?`;
      if (!confirm(confirmMsg)) return;
    }
    await handleForceEndMeeting(meeting);
  };

  const isMeetingEnded = (m: SlotMeeting) => {
    const rawStatus = String(m.status || m.Status || "").trim().toUpperCase();
    return rawStatus === "ENDED";
  };

  const formatDuration = (totalMinutes: string | number) => {
    const mins = Number(totalMinutes) || 0;
    if (mins <= 0) return "0m";
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hours === 0) return `${remainingMins}m`;
    if (remainingMins === 0) return `${hours}h`;
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

  const handleCopyReminder = (teacherName: string, teacherId: string, daysLeft: number | null) => {
    let daysText = "";
    if (daysLeft === null) {
      daysText = "ලඟදීම Expire වීමට නියමිතව";
    } else if (daysLeft <= 0) {
      daysText = "කාලය ඉකුත් වී (Expired)";
    } else {
      daysText = `තව දින ${daysLeft}කින් අවසන් වීමට`;
    }

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

🚀 *Instant Activation & Instructions:*
1. මුදල් තැන්පත් කළ පසු රිසිට්පත (Bank Slip - JPG/PNG හෝ PDF) පහත ලින්ක් එකෙන් කෙලින්ම Upload කරන්න.
2. *ස්ලිප් එක දැමූ සැණින් ඔබගේ Account එක Auto-Active (Paid) වේ.*
3. ඔබගේ Zoom Classes පැවැත්වීමට හෝ Login වීමට කිසිදු බාධාවක් නොමැත.
4. ඔබගේ නව Expiry Date එක පැය 24ක් ඇතුළත පද්ධතියේ Verify වී Dashboard එකේ Update වනු ඇත.

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

  const handleCopyTeacherIdOnly = (teacherId: string) => {
    navigator.clipboard.writeText(String(teacherId));
    setCopiedIdOnly(teacherId);
    setTimeout(() => {
      setCopiedIdOnly(null);
    }, 2000);
  };

  const handleCopyZoomAccountId = (accId: string) => {
    navigator.clipboard.writeText(String(accId));
    setCopiedZoomAccId(accId);
    setTimeout(() => {
      setCopiedZoomAccId(null);
    }, 2000);
  };

  // 🎯 EARLY ENDED CLASSES CALCULATION WITH START & SCHEDULED END TIMES
  const earlyEndedClasses = Object.entries(poolData || {}).flatMap(([accId, accInfo]) =>
    (accInfo?.classes || [])
      .filter((m) => {
        const st = String(m.status || m.Status || "").trim().toUpperCase();
        return st === "EARLY_ENDED" || st === "ENDED_EARLY" || st.includes("EARLY");
      })
      .map((m) => {
        const startMins = parseTimeToMinutes(m.time);
        const durationMins = Number(m.duration) || 60;
        const endMins = startMins + durationMins;
        const scheduledEndTimeStr = formatMinutesToTime(endMins);

        const now = new Date();
        const currentMins = now.getHours() * 60 + now.getMinutes();
        const isStillInWindow = currentMins < endMins;
        const minsRemaining = isStillInWindow ? endMins - currentMins : 0;

        return {
          accId,
          poolType: accInfo?.pool_type || "Zoom",
          startMins,
          durationMins,
          endMins,
          scheduledEndTimeStr,
          isStillInWindow,
          minsRemaining,
          ...m,
        };
      })
  );

  // Active Zoom Accounts
  const activeAccountKeys = Object.keys(poolData || {}).filter((accId) => isAccountActive(poolData[accId]));
  const totalActivePool = activeAccountKeys.length;

  // 🎯 LIVE AVAILABILITY IN NEXT 6 HOURS (Hourly Slots)
  const getNextHoursAvailability = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const intervals = [];

    for (let i = 0; i < 6; i++) {
      const slotHour = (currentHour + i) % 24;
      const slotStart = slotHour * 60;
      const slotEnd = slotStart + 60;

      let busyCount = 0;
      activeAccountKeys.forEach((accId) => {
        const classes = poolData[accId]?.classes || [];
        const isBusy = classes.some((cls) => {
          if (isMeetingEnded(cls)) return false;
          const cStart = parseTimeToMinutes(cls.time);
          const cDur = Number(cls.duration) || 60;
          const cEnd = cStart + cDur;
          // Overlap check with 1-hour window
          return cStart < slotEnd && cEnd > slotStart;
        });
        if (isBusy) busyCount++;
      });

      const freeCount = Math.max(0, totalActivePool - busyCount);
      const startH = slotHour % 12 === 0 ? 12 : slotHour % 12;
      const endH = (slotHour + 1) % 12 === 0 ? 12 : (slotHour + 1) % 12;
      const startAmpm = slotHour >= 12 ? "PM" : "AM";
      const endAmpm = (slotHour + 1) >= 12 && (slotHour + 1) < 24 ? "PM" : "AM";

      intervals.push({
        timeRange: `${startH}:00 ${startAmpm} - ${endH}:00 ${endAmpm}`,
        freeCount,
        busyCount,
        isCurrent: i === 0,
      });
    }

    return intervals;
  };

  const nextHoursAvailability = getNextHoursAvailability();

  // 🎯 30-MIN TIMELINE GROUPED DATA (Chronological Grouping)
  const allActiveScheduledClasses = Object.entries(poolData || {}).flatMap(([accId, accInfo]) =>
    (accInfo?.classes || [])
      .filter((m) => !isMeetingEnded(m))
      .map((m) => {
        const startM = parseTimeToMinutes(m.time);
        const dur = Number(m.duration) || 60;
        const endM = startM + dur;
        const endStr = formatMinutesToTime(endM);
        const st = String(m.status || m.Status || "").trim().toUpperCase();
        const isStarted = st === "STARTED" || st === "LIVE";

        return {
          ...m,
          accId,
          poolType: accInfo?.pool_type || "100p",
          startM,
          dur,
          endM,
          endStr,
          isStarted,
        };
      })
  );

  // Unique end times sorted ascending
  const uniqueEndMinutes = Array.from(new Set(allActiveScheduledClasses.map((c) => c.endM))).sort((a, b) => a - b);

  const timelineGroups = uniqueEndMinutes.map((endM) => {
    let classes = allActiveScheduledClasses.filter((c) => c.endM === endM);

    if (timelineStatusFilter === "STARTED") {
      classes = classes.filter((c) => c.isStarted);
    } else if (timelineStatusFilter === "SCHEDULED") {
      classes = classes.filter((c) => !c.isStarted);
    }

    if (timelineSearch.trim()) {
      const q = timelineSearch.trim().toLowerCase();
      classes = classes.filter((c) => 
        c.accId.toLowerCase().includes(q) ||
        String(c.teacher_id).toLowerCase().includes(q) ||
        String(c.topic).toLowerCase().includes(q)
      );
    }

    return {
      endM,
      endStr: formatMinutesToTime(endM),
      classes,
    };
  }).filter((g) => g.classes.length > 0);

  // 🎯 ZOOM ACCOUNTS TRACKER (PRIORITIZED SORTING: EXPIRED FIRST, THEN 1-3 DAYS, THEN REST)
  const allZoomAccountsList = Object.keys(poolData || {})
    .map((accId) => {
      const acc = poolData[accId];
      const daysLeft = getDaysRemaining(acc.expire_date);
      const isActive = isAccountActive(acc);
      return {
        accId,
        poolType: acc.pool_type || "100p",
        status: isActive ? "ACTIVE" : "INACTIVE",
        expireDate: acc.expire_date || "",
        email: acc.email || "",
        daysLeft,
        classesCount: (acc.classes || []).length,
      };
    })
    .sort((a, b) => {
      // 1. Expired first (<= 0)
      const aExpired = a.daysLeft !== null && a.daysLeft <= 0;
      const bExpired = b.daysLeft !== null && b.daysLeft <= 0;
      if (aExpired && !bExpired) return -1;
      if (!aExpired && bExpired) return 1;
      if (aExpired && bExpired) return (a.daysLeft || 0) - (b.daysLeft || 0);

      // 2. Ascending order of days remaining (1 day, 2 days, 3 days...)
      if (a.daysLeft !== null && b.daysLeft !== null) {
        return a.daysLeft - b.daysLeft;
      }
      if (a.daysLeft === null) return 1;
      if (b.daysLeft === null) return -1;
      return 0;
    });

  const zoomExpiredCount = allZoomAccountsList.filter((a) => a.daysLeft !== null && a.daysLeft <= 0).length;
  const zoomCriticalCount = allZoomAccountsList.filter((a) => a.daysLeft !== null && a.daysLeft > 0 && a.daysLeft <= 3).length;
  const zoomActiveCount = allZoomAccountsList.filter((a) => a.status === "ACTIVE").length;

  const filteredZoomAccounts = allZoomAccountsList.filter((acc) => {
    const q = (zoomSearchTerm || "").trim().toLowerCase();
    if (q) {
      const matches = acc.accId.toLowerCase().includes(q) || acc.email.toLowerCase().includes(q);
      if (!matches) return false;
    }

    if (zoomFilterType === "expired") return acc.daysLeft !== null && acc.daysLeft <= 0;
    if (zoomFilterType === "soon") return acc.daysLeft !== null && acc.daysLeft > 0 && acc.daysLeft <= 3;
    if (zoomFilterType === "active") return acc.status === "ACTIVE";
    if (zoomFilterType === "inactive") return acc.status === "INACTIVE";

    return true;
  });

  // Teachers Processing
  const processedTeachers = (teachersList || []).map((t) => {
    const daysLeft = getDaysRemaining(t.expiry_date);
    const isReminded = remindedTeacherIds.includes(String(t.teacher_id));
    const slipUrl = getTeacherSlipUrl(t);
    const slipStatus = getTeacherSlipStatus(t);
    return { ...t, daysLeft, isReminded, slipUrl, slipStatus };
  }).sort((a, b) => {
    if (a.daysLeft === null) return 1;
    if (b.daysLeft === null) return -1;
    return a.daysLeft - b.daysLeft;
  });

  const expiredCount = processedTeachers.filter(t => t.daysLeft !== null && t.daysLeft <= 0).length;
  const needReminderCount = processedTeachers.filter(t => !t.isReminded && (t.daysLeft !== null && t.daysLeft <= 7)).length;

  const teachersWithSlips = processedTeachers.filter(t => Boolean(t.slipUrl));
  const pendingSlips = teachersWithSlips.filter(t => t.slipStatus === "PENDING" || !t.slipStatus);
  const approvedSlipsList = teachersWithSlips.filter(t => t.slipStatus === "APPROVED");
  const rejectedSlipsList = teachersWithSlips.filter(t => t.slipStatus === "REJECTED");

  const currentSlipsToDisplay = 
    slipSubTab === "pending" ? pendingSlips :
    slipSubTab === "approved" ? approvedSlipsList :
    rejectedSlipsList;

  const filteredSlips = currentSlipsToDisplay.filter((t) => {
    const q = (slipSearchTerm || "").trim().toLowerCase();
    const id = String(t.teacher_id || "").toLowerCase();
    const idDigits = id.replace(/\D/g, "");
    const name = String(t.teacher_name || "").toLowerCase();
    const user = String(t.username || "").toLowerCase();

    if (/^\d+$/.test(q)) {
      return idDigits === q || id.endsWith(`_${q}`) || id.includes(q);
    }
    return id.includes(q) || name.includes(q) || user.includes(q);
  });

  const filteredTeachers = processedTeachers.filter((t) => {
    const rawQ = (searchTerm || "").trim().toLowerCase();
    if (rawQ) {
      const id = String(t.teacher_id || "").toLowerCase();
      const idDigits = id.replace(/\D/g, "");
      const name = String(t.teacher_name || "").toLowerCase();
      const user = String(t.username || "").toLowerCase();

      const isNumericQuery = /^\d+$/.test(rawQ);
      let matchesSearch = false;
      if (isNumericQuery) {
        matchesSearch = idDigits === rawQ || id.endsWith(`_${rawQ}`) || id.includes(rawQ);
      } else {
        matchesSearch = id.includes(rawQ) || name.includes(rawQ) || user.includes(rawQ);
      }
      if (!matchesSearch) return false;
    }

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

  return (
    <div className="min-h-screen bg-[#070b19] text-white p-4 sm:p-6 font-sans selection:bg-blue-600/30">
      <div className="max-w-[1550px] mx-auto space-y-6">
        
        {/* TOP HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-900 pb-5 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-200">
              ⚡ Digimart Admin Management Hub
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Zoom Pool Slots, Bank Slip Verifications, Teacher Subscriptions සහ Zoom Accounts Expirations සජීවීව Manage කරන්න.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => fetchPoolData(selectedDate)}
              className="px-3.5 py-2 bg-blue-950/80 hover:bg-blue-900 border border-blue-800/60 text-blue-300 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <span>🔄</span> Refresh Data
            </button>

            {activeTab === "pool" && (
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

        {/* ERROR BANNER */}
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

        {/* 5-TAB NAVIGATION */}
        <div className="flex items-center gap-2 border-b border-slate-900 pb-3 flex-wrap">
          <button
            onClick={() => setActiveTab("pool")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "pool" 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                : "bg-slate-900/60 text-gray-400 hover:bg-slate-900 hover:text-white border border-slate-800"
            }`}
          >
            <span>⚡</span> Zoom Pool Visualizer
          </button>

          <button
            onClick={() => setActiveTab("ending_schedule")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "ending_schedule" 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                : "bg-slate-900/60 text-gray-400 hover:bg-slate-900 hover:text-white border border-slate-800"
            }`}
          >
            <span>⏱️</span> Class End Timeline (30 Min)
            {allActiveScheduledClasses.length > 0 && (
              <span className="bg-blue-950 text-blue-300 border border-blue-700/80 px-2 py-0.5 rounded-full text-[10px] font-black">
                {allActiveScheduledClasses.length} Active
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("bank_slips")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 relative cursor-pointer ${
              activeTab === "bank_slips" 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                : "bg-slate-900/60 text-gray-400 hover:bg-slate-900 hover:text-white border border-slate-800"
            }`}
          >
            <span>💳</span> Bank Slips Review
            {pendingSlips.length > 0 && (
              <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-black animate-pulse">
                {pendingSlips.length} New
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("expirations")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 relative cursor-pointer ${
              activeTab === "expirations" 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                : "bg-slate-900/60 text-gray-400 hover:bg-slate-900 hover:text-white border border-slate-800"
            }`}
          >
            <span>📅</span> Teacher Expirations Tracker
            {needReminderCount > 0 && (
              <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-black animate-pulse">
                {needReminderCount} Need Remind
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("zoom_accounts")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 relative cursor-pointer ${
              activeTab === "zoom_accounts" 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                : "bg-slate-900/60 text-gray-400 hover:bg-slate-900 hover:text-white border border-slate-800"
            }`}
          >
            <span>🛡️</span> Zoom Accounts Tracker
            {zoomExpiredCount > 0 && (
              <span className="bg-rose-500 text-white px-2 py-0.5 rounded-full text-[10px] font-black animate-pulse">
                {zoomExpiredCount} Expired
              </span>
            )}
          </button>
        </div>

        {/* LOADING INDICATOR */}
        {loading && (
          <div className="p-12 text-center text-blue-400 font-mono text-sm animate-pulse">
            ⚙️ Fetching Realtime Data from Server...
          </div>
        )}

        {/* ========================================================================= */}
        {/* ==================== TAB 1: ZOOM POOL VISUALIZER ======================== */}
        {/* ========================================================================= */}
        {!loading && activeTab === "pool" && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* ⚡ EARLY ENDED CLASSES TABLE */}
            {earlyEndedClasses.length > 0 && (
              <div className="bg-[#0b132b]/95 border-2 border-amber-500/50 rounded-3xl p-5 shadow-2xl space-y-3 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-amber-900/40 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl animate-bounce">⚡</span>
                    <h2 className="text-sm font-black text-amber-400 uppercase tracking-wider">
                      EARLY ENDED CLASSES ({earlyEndedClasses.length}) — AVAILABLE TO FREE SLOT
                    </h2>
                  </div>
                  <p className="text-[11px] text-amber-300/80 font-medium">
                    ⚠️ Interval / Break එකක සිටින පන්ති Free Slot නොකිරීමට Start Time හා Scheduled End Time පරීක්ෂා කරන්න.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/90 text-gray-400 font-mono text-[11px]">
                        <th className="p-3">ZOOM ACCOUNT</th>
                        <th className="p-3">MEETING ID</th>
                        <th className="p-3">TEACHER ID</th>
                        <th className="p-3">TOPIC</th>
                        <th className="p-3">START TIME</th>
                        <th className="p-3">SCHEDULED END</th>
                        <th className="p-3">TIME STATUS / INTERVAL CHECK</th>
                        <th className="p-3 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-200">
                      {earlyEndedClasses.map((item, idx) => {
                        const isEndingThis = endingMeetingId === item.zoom_id;
                        return (
                          <tr key={idx} className="hover:bg-slate-900/60 transition-colors">
                            <td className="p-3 font-mono font-bold text-amber-300 whitespace-nowrap">
                              ⚡ {item.accId}
                            </td>
                            <td className="p-3 font-mono font-bold text-amber-400 whitespace-nowrap">
                              {item.zoom_id}
                            </td>
                            <td className="p-3 font-mono text-blue-400 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1">
                                <span>👤</span> {item.teacher_id}
                              </span>
                            </td>
                            <td className="p-3 font-medium text-white max-w-[200px] truncate">
                              {item.topic}
                            </td>
                            <td className="p-3 font-mono font-bold text-blue-300 whitespace-nowrap">
                              🕒 {item.time || "N/A"}
                            </td>
                            <td className="p-3 font-mono whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className="font-bold text-purple-300">
                                  🏁 {item.scheduledEndTimeStr}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  ({formatDuration(item.durationMins)})
                                </span>
                              </div>
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              {item.isStillInWindow ? (
                                <span className="px-2.5 py-1 bg-amber-950/90 border border-amber-600/90 text-amber-300 font-bold font-mono rounded-lg text-[10px] inline-flex items-center gap-1 animate-pulse">
                                  ⏳ Break විය හැක (තව {item.minsRemaining}m)
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 bg-emerald-950/90 border border-emerald-700 text-emerald-300 font-bold font-mono rounded-lg text-[10px] inline-flex items-center gap-1">
                                  ✅ Schedule අවසන් ({item.scheduledEndTimeStr})
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right whitespace-nowrap">
                              <button
                                onClick={() => handleFreeSlot(item)}
                                disabled={isEndingThis}
                                className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition-all shadow-md flex items-center gap-1.5 ml-auto cursor-pointer ${
                                  item.isStillInWindow
                                    ? "bg-amber-600 hover:bg-amber-500 text-slate-950"
                                    : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white"
                                } disabled:opacity-50`}
                              >
                                <span>⚡</span>
                                <span>{isEndingThis ? "Freeing..." : "Free Slot Now"}</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 🎯 RESTORED: NEXT 6 HOURS LIVE AVAILABILITY PANEL */}
            <div className="bg-[#0b132b] border border-blue-900/60 rounded-3xl p-5 shadow-2xl space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📊</span>
                  <div>
                    <h3 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 uppercase tracking-wider">
                      NEXT 6 HOURS LIVE AVAILABILITY FORECAST (ACTIVE POOL: {totalActivePool})
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      ඉදිරි පැය 6 තුළ ඕනෑම වෙලාවක අලුත් පන්තියක් Schedule කිරීම සඳහා පවතින ඉතිරි Free Zoom Accounts ප්‍රමාණය.
                    </p>
                  </div>
                </div>
              </div>

              {/* Hourly Forecast Grid Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {nextHoursAvailability.map((hourSlot, hIdx) => {
                  const isHighDemand = hourSlot.freeCount <= 5;
                  const isModerate = hourSlot.freeCount > 5 && hourSlot.freeCount <= 15;

                  return (
                    <div 
                      key={hIdx}
                      className={`p-3.5 rounded-2xl border text-center transition-all ${
                        hourSlot.isCurrent 
                          ? "bg-blue-950/70 border-blue-500 ring-2 ring-blue-500/30 shadow-lg"
                          : "bg-slate-950/70 border-slate-800/90 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-[11px] font-mono font-bold text-gray-300 truncate">
                          {hourSlot.timeRange}
                        </span>
                        {hourSlot.isCurrent && (
                          <span className="text-[9px] bg-blue-500 text-white font-bold px-1 rounded">NOW</span>
                        )}
                      </div>

                      <div className="my-2">
                        <span className={`text-2xl font-black font-mono ${
                          isHighDemand ? "text-rose-400" : isModerate ? "text-amber-400" : "text-emerald-400"
                        }`}>
                          {hourSlot.freeCount}
                        </span>
                        <span className="text-[10px] text-gray-400 block font-medium">Free Accounts</span>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-black uppercase inline-block border ${
                        isHighDemand 
                          ? "bg-rose-950 text-rose-300 border-rose-800" 
                          : isModerate 
                          ? "bg-amber-950 text-amber-300 border-amber-800" 
                          : "bg-emerald-950 text-emerald-300 border-emerald-800"
                      }`}>
                        {isHighDemand ? "High Demand" : isModerate ? "Moderate" : "Available"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ZOOM POOL ACCOUNTS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.keys(poolData || {}).map((accId) => {
                const acc = poolData[accId];
                const isActive = isAccountActive(acc);
                const classes = acc?.classes || [];

                return (
                  <div
                    key={accId}
                    className="bg-[#0b132b]/80 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded-md bg-blue-950 border border-blue-800 font-mono text-blue-300 font-bold">
                            {acc.pool_type || "100p"}
                          </span>
                          <h3 className="text-base font-black text-white font-mono">{accId}</h3>
                        </div>
                        {acc.email && (
                          <p className="text-[11px] text-gray-400 truncate max-w-[220px] mt-0.5 font-mono">
                            {acc.email}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
                          isActive ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-rose-950 text-rose-400 border border-rose-800"
                        }`}>
                          {isActive ? "ACTIVE" : "INACTIVE"}
                        </span>
                        <p className="text-[10px] text-gray-500 mt-1 font-mono">
                          {classes.length} Classes
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {classes.length === 0 ? (
                        <p className="text-xs text-gray-500 italic py-4 text-center">
                          No classes scheduled for today.
                        </p>
                      ) : (
                        classes.map((cls, cIdx) => {
                          const isEnded = isMeetingEnded(cls);
                          const st = String(cls.status || cls.Status || "").trim().toUpperCase();
                          const isEarly = st === "EARLY_ENDED" || st.includes("EARLY");

                          return (
                            <div
                              key={cIdx}
                              className={`p-3 rounded-2xl border text-xs space-y-1.5 transition-all ${
                                isEnded
                                  ? "bg-slate-950/40 border-slate-900 opacity-60"
                                  : isEarly
                                  ? "bg-amber-950/40 border-amber-700/60"
                                  : "bg-slate-950/90 border-slate-800"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-mono font-bold text-blue-400 flex items-center gap-1">
                                  <span>⏰</span> {cls.time}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black ${
                                  isEnded ? "bg-slate-900 text-gray-400" :
                                  isEarly ? "bg-amber-500 text-slate-950" :
                                  "bg-emerald-950 text-emerald-400 border border-emerald-800"
                                }`}>
                                  {cls.status || "SCHEDULED"}
                                </span>
                              </div>

                              <p className="font-bold text-white truncate">{cls.topic}</p>

                              <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono pt-1 border-t border-slate-900">
                                <span>👤 {cls.teacher_id}</span>
                                <span>Duration: {formatDuration(cls.duration)}</span>
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

        {/* ========================================================================= */}
        {/* ==================== TAB 2: CLASS END TIMELINE (30 MIN) ================== */}
        {/* ========================================================================= */}
        {!loading && activeTab === "ending_schedule" && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* SEARCH AND FILTER BAR (MATCHING SCREENSHOT) */}
            <div className="bg-[#0b132b] border border-slate-800 p-4 rounded-3xl space-y-3 shadow-xl">
              <div className="relative w-full">
                <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400 text-sm">🔍</span>
                <input
                  type="text"
                  placeholder="Search Class, Teacher ID, Zoom Account..."
                  value={timelineSearch}
                  onChange={(e) => setTimelineSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTimelineStatusFilter("ALL")}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    timelineStatusFilter === "ALL" 
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30" 
                      : "bg-slate-900 text-gray-400 hover:text-white border border-slate-800"
                  }`}
                >
                  <span>📋 All</span>
                  <span className="bg-slate-950 px-1.5 py-0.2 rounded-full text-[10px]">
                    {allActiveScheduledClasses.length}
                  </span>
                </button>

                <button
                  onClick={() => setTimelineStatusFilter("SCHEDULED")}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    timelineStatusFilter === "SCHEDULED" 
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30" 
                      : "bg-slate-900 text-gray-400 hover:text-white border border-slate-800"
                  }`}
                >
                  <span>🟢 Scheduled Only</span>
                  <span className="bg-slate-950 text-blue-300 px-1.5 py-0.2 rounded-full text-[10px]">
                    {allActiveScheduledClasses.filter(c => !c.isStarted).length}
                  </span>
                </button>

                <button
                  onClick={() => setTimelineStatusFilter("STARTED")}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    timelineStatusFilter === "STARTED" 
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30" 
                      : "bg-slate-900 text-gray-400 hover:text-white border border-slate-800"
                  }`}
                >
                  <span>🔴 Started (Live)</span>
                  <span className="bg-slate-950 text-emerald-300 px-1.5 py-0.2 rounded-full text-[10px]">
                    {allActiveScheduledClasses.filter(c => c.isStarted).length}
                  </span>
                </button>
              </div>
            </div>

            {/* CHRONOLOGICAL TIMELINE BLOCKS (LIKE SCREENSHOT) */}
            <div className="space-y-5">
              {timelineGroups.length === 0 ? (
                <div className="bg-[#0b132b]/80 border border-slate-800 rounded-3xl p-12 text-center text-gray-500 italic">
                  කිසිදු Class එකක් හමු නොවීය.
                </div>
              ) : (
                timelineGroups.map((group, gIdx) => (
                  <div key={gIdx} className="space-y-2.5">
                    
                    {/* Time Slot Header Badge */}
                    <div className="flex items-center gap-2">
                      <span className="px-3.5 py-1.5 bg-gradient-to-r from-amber-950/80 to-amber-900/40 border border-amber-600/60 rounded-xl text-amber-300 font-mono font-black text-xs inline-flex items-center gap-1.5 shadow-md">
                        <span>🏁</span>
                        <span>{group.endStr} ({group.classes.length} {group.classes.length === 1 ? "Class" : "Classes"} Free)</span>
                      </span>
                    </div>

                    {/* Classes in this time slot */}
                    <div className="space-y-2">
                      {group.classes.map((cls, cIdx) => (
                        <div
                          key={cIdx}
                          className="bg-[#0b132b]/90 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-blue-950/80 border border-blue-700/80 text-blue-300 font-mono font-black rounded-xl text-xs">
                              ⚡ {cls.accId}
                            </span>

                            <div className="space-y-1">
                              <h4 className="text-sm font-bold text-white">{cls.topic}</h4>
                              <div className="flex items-center gap-3 text-[11px] text-gray-400 font-mono">
                                <span className="text-blue-400">👤 {cls.teacher_id}</span>
                                <span>•</span>
                                <span>Duration: {formatDuration(cls.duration)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between w-full md:w-auto md:justify-end gap-4 border-t md:border-t-0 pt-2 md:pt-0 border-slate-900">
                            <div className="text-left md:text-right font-mono">
                              <span className="text-xs font-bold text-blue-300 block">
                                🕒 {cls.time} ➔ {cls.endStr}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 border ${
                                cls.isStarted 
                                  ? "bg-emerald-950 text-emerald-400 border-emerald-800" 
                                  : "bg-slate-900 text-gray-400 border-slate-800"
                              }`}>
                                {cls.status || "SCHEDULED"}
                              </span>
                            </div>

                            <button
                              onClick={() => handleForceEndMeeting({ ...cls, accId: cls.accId })}
                              className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded-xl text-xs font-bold transition cursor-pointer"
                            >
                              End Meeting
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>
                ))
              )}
            </div>

          </div>
        )}

        {/* ==================== TAB 3: BANK SLIPS REVIEW ==================== */}
        {!loading && activeTab === "bank_slips" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-[#0b132b] border border-slate-900 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
                <button
                  onClick={() => setSlipSubTab("pending")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    slipSubTab === "pending"
                      ? "bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20"
                      : "bg-slate-900 text-gray-400 hover:text-white border border-slate-800"
                  }`}
                >
                  <span>⏳ Pending Approval</span>
                  <span className="bg-slate-950 text-amber-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    {pendingSlips.length}
                  </span>
                </button>

                <button
                  onClick={() => setSlipSubTab("approved")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    slipSubTab === "approved"
                      ? "bg-emerald-600 text-white font-black shadow-lg shadow-emerald-600/20"
                      : "bg-slate-900 text-gray-400 hover:text-white border border-slate-800"
                  }`}
                >
                  <span>✅ Approved</span>
                  <span className="bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    {approvedSlipsList.length}
                  </span>
                </button>

                <button
                  onClick={() => setSlipSubTab("rejected")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    slipSubTab === "rejected"
                      ? "bg-rose-600 text-white font-black shadow-lg shadow-rose-600/20"
                      : "bg-slate-900 text-gray-400 hover:text-white border border-slate-800"
                  }`}
                >
                  <span>❌ Rejected</span>
                  <span className="bg-rose-950 text-rose-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    {rejectedSlipsList.length}
                  </span>
                </button>
              </div>

              <div className="w-full md:w-80">
                <input 
                  type="text"
                  placeholder="🔍 Search ID (e.g. 69 or teach_69)..."
                  value={slipSearchTerm}
                  onChange={(e) => setSlipSearchTerm(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>

            <div className="bg-[#0b132b]/60 border border-slate-900 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-900 bg-slate-950/80 text-gray-400 font-mono">
                      <th className="p-4">SLIP PREVIEW</th>
                      <th className="p-4">TEACHER ID</th>
                      <th className="p-4">TEACHER NAME</th>
                      <th className="p-4">DATABASE STATUS</th>
                      <th className="p-4">EXPIRE DATE</th>
                      <th className="p-4 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60 text-slate-300">
                    {filteredSlips.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center p-8 text-gray-500 italic">
                          කිසිදු Bank Slip එකක් මෙම කාණ්ඩයේ හමු නොවීය.
                        </td>
                      </tr>
                    ) : (
                      filteredSlips.map((t, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                          <td className="p-4">
                            <button
                              onClick={() => setSlipModalTeacher(t)}
                              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-blue-400 font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1.5"
                            >
                              <span>👁️</span> View Slip
                            </button>
                          </td>
                          <td className="p-4 font-mono font-bold text-blue-400">
                            <button
                              onClick={() => handleLoginAsTeacher(t)}
                              title="Click to directly login to this teacher's dashboard"
                              className="hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <span>{t.teacher_id}</span>
                              <span className="text-[10px] text-amber-400 font-bold">↗</span>
                            </button>
                          </td>
                          <td className="p-4 font-bold text-white">{t.teacher_name}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-black ${
                              t.slipStatus === "PENDING" || !t.slipStatus ? "bg-amber-950 border border-amber-700 text-amber-300 animate-pulse" :
                              t.slipStatus === "APPROVED" ? "bg-emerald-950 border border-emerald-700 text-emerald-300" :
                              "bg-rose-950 border border-rose-700 text-rose-300"
                            }`}>
                              {t.slipStatus}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-amber-400">{t.expiry_date || "Not Set"}</td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleExtendDays(t, 15)}
                                className="px-2.5 py-1.5 bg-blue-950 hover:bg-blue-900 border border-blue-700 text-blue-300 font-bold rounded-xl text-[11px] cursor-pointer"
                              >
                                +15D
                              </button>
                              <button
                                onClick={() => handleExtendDays(t, 30)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-[11px] cursor-pointer shadow-md"
                              >
                                +30D Approve
                              </button>
                              {t.slipStatus !== "REJECTED" && (
                                <button
                                  onClick={() => handleRejectSlip(t)}
                                  className="px-2.5 py-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold rounded-xl text-[11px] cursor-pointer"
                                >
                                  ✕ Reject
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
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
            {/* STAT CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
                  <p className="text-xs text-gray-400 font-medium">Pending Slips</p>
                  <h3 className="text-2xl font-black text-amber-400 mt-1">{pendingSlips.length}</h3>
                </div>
                <div className="w-10 h-10 bg-amber-950 border border-amber-900 rounded-xl flex items-center justify-center text-lg">💳</div>
              </div>

              <div className="bg-[#0b132b] border border-slate-900 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-medium">Active &amp; Paid</p>
                  <h3 className="text-2xl font-black text-emerald-400 mt-1">
                    {processedTeachers.filter(t => String(t.payment_status || "").toUpperCase() === "PAID").length}
                  </h3>
                </div>
                <div className="w-10 h-10 bg-emerald-950 border border-emerald-900 rounded-xl flex items-center justify-center text-lg">✅</div>
              </div>
            </div>

            {/* SEARCH & FILTERS */}
            <div className="bg-[#0b132b] border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
              <div className="relative w-full md:w-96">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm">🔍</span>
                <input 
                  type="text"
                  placeholder="Type ID Number (e.g. 69, 169) or Name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-9 py-2.5 bg-slate-950 border-2 border-slate-800 focus:border-blue-500 rounded-xl text-xs font-mono font-bold text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm("")} className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-white text-xs cursor-pointer">✕</button>
                )}
              </div>

              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto flex-wrap">
                <button
                  onClick={() => setFilterType("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filterType === "all" ? "bg-blue-600 text-white font-black" : "bg-slate-900 text-gray-400 hover:text-white"
                  }`}
                >
                  All ({processedTeachers.length})
                </button>

                <button
                  onClick={() => setFilterType("need_reminder")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    filterType === "need_reminder" ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30" : "bg-amber-950/40 text-amber-300 border border-amber-800/60"
                  }`}
                >
                  <span>📩 Need Remind</span>
                  <span className="bg-amber-400/30 px-1.5 py-0.2 rounded-full text-[10px]">{needReminderCount}</span>
                </button>

                <button
                  onClick={() => setFilterType("expired")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filterType === "expired" ? "bg-rose-900 text-white font-black" : "bg-slate-900 text-gray-400 hover:text-white"
                  }`}
                >
                  🔴 Expired ({expiredCount})
                </button>

                <button
                  onClick={() => setFilterType("paid")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filterType === "paid" ? "bg-emerald-600 text-white font-black" : "bg-slate-900 text-gray-400 hover:text-white"
                  }`}
                >
                  🟢 Paid
                </button>
              </div>
            </div>

            {/* TEACHERS TABLE */}
            <div className="bg-[#0b132b]/60 border border-slate-900 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-900 bg-slate-950/80 text-gray-400 font-mono">
                      <th className="p-4">TEACHER ID</th>
                      <th className="p-4">USERNAME</th>
                      <th className="p-4">STATUS / DAYS LEFT</th>
                      <th className="p-4">REMINDER NOTICE</th>
                      <th className="p-4">TEACHER NAME</th>
                      <th className="p-4">PAYMENT STATUS</th>
                      <th className="p-4">EXPIRE DATE (SET)</th>
                      <th className="p-4 text-right">ONE-CLICK DASHBOARD</th>
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

                      let statusBadge = null;
                      if (days === null) {
                        statusBadge = <span className="text-gray-500 font-mono">N/A</span>;
                      } else if (days <= 0) {
                        statusBadge = (
                          <span className="px-2.5 py-1 bg-rose-950/80 border border-rose-800 text-rose-400 font-bold font-mono rounded-lg">
                            🔴 Expired {Math.abs(days)}D ago
                          </span>
                        );
                      } else if (days <= 7) {
                        statusBadge = (
                          <span className="px-2.5 py-1 bg-amber-950/80 border border-amber-800 text-amber-400 font-bold font-mono rounded-lg animate-pulse">
                            ⚠️ {days} Days Left
                          </span>
                        );
                      } else {
                        statusBadge = (
                          <span className="px-2.5 py-1 bg-emerald-950/80 border border-emerald-800 text-emerald-400 font-bold font-mono rounded-lg">
                            🟢 {days} Days Left
                          </span>
                        );
                      }

                      return (
                        <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                          <td className="p-4 font-mono font-bold text-blue-400 whitespace-nowrap">
                            <button
                              onClick={() => handleCopyTeacherIdOnly(t.teacher_id)}
                              className="hover:text-blue-300 inline-flex items-center gap-1 cursor-pointer bg-slate-950 px-2 py-1 rounded-lg border border-slate-800"
                            >
                              <span>{t.teacher_id}</span>
                              {isIdCopied && <span className="text-[10px] text-emerald-400">✓</span>}
                            </button>
                          </td>

                          <td className="p-4 font-mono font-semibold whitespace-nowrap text-purple-300">
                            {t.username ? `@${t.username}` : "N/A"}
                          </td>

                          <td className="p-4 whitespace-nowrap">{statusBadge}</td>

                          <td className="p-4 whitespace-nowrap">
                            <button 
                              onClick={() => handleCopyReminder(t.teacher_name, t.teacher_id, days)}
                              className={`px-3 py-1.5 border text-[11px] font-bold rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-sm ${
                                isCopied
                                  ? "bg-emerald-600 border-emerald-400 text-white font-black"
                                  : isReminded
                                  ? "bg-emerald-950/50 border-emerald-800/70 text-emerald-300"
                                  : (days !== null && days <= 7)
                                  ? "bg-amber-600 hover:bg-amber-500 text-slate-950 font-black animate-pulse"
                                  : "bg-slate-900 hover:bg-slate-800 text-emerald-400 border-slate-700"
                              }`}
                            >
                              {isCopied ? "✅ Copied!" : isReminded ? "🔔 Reminded" : "📩 Send Remind"}
                            </button>
                          </td>

                          <td className="p-4 font-bold text-white max-w-xs truncate">{t.teacher_name}</td>

                          <td className="p-4 whitespace-nowrap">
                            <button
                              onClick={() => handleTogglePaymentStatus(t)}
                              disabled={isSaving}
                              className={`px-3 py-1 rounded-xl text-[11px] font-mono font-bold border cursor-pointer ${
                                isPaid ? "bg-emerald-950 border-emerald-600 text-emerald-300" : "bg-rose-950 border-rose-600 text-rose-300 animate-pulse"
                              }`}
                            >
                              {isPaid ? "✅ PAID" : "💳 UNPAID"}
                            </button>
                          </td>

                          <td className="p-4 whitespace-nowrap">
                            <input
                              type="date"
                              value={t.expiry_date || ""}
                              onChange={(e) => handleUpdateTeacher(t.teacher_id, { expiry_date: e.target.value })}
                              disabled={isSaving}
                              className="bg-slate-950 border border-slate-700 text-blue-300 font-mono font-bold px-2 py-1 rounded-lg text-xs"
                            />
                          </td>

                          <td className="p-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => handleLoginAsTeacher(t)}
                              className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-[11px] rounded-xl shadow-md transition-all flex items-center gap-1.5 ml-auto cursor-pointer"
                              title="Directly enter this teacher's dashboard without credentials"
                            >
                              <span>🔑</span>
                              <span>Login as Teacher</span>
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

        {/* ========================================================================= */}
        {/* ==================== TAB 5: ZOOM ACCOUNTS TRACKER ======================= */}
        {/* ========================================================================= */}
        {!loading && activeTab === "zoom_accounts" && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* KPI STAT CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-[#0b132b] border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-medium">Total Accounts</p>
                  <h3 className="text-2xl font-black text-blue-400 mt-1">{allZoomAccountsList.length}</h3>
                </div>
                <div className="w-10 h-10 bg-blue-950 border border-blue-900 rounded-xl flex items-center justify-center text-lg">🛡️</div>
              </div>

              <div className="bg-[#0b132b] border border-rose-900/50 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-rose-300 font-medium">Expired (Renew Now)</p>
                  <h3 className="text-2xl font-black text-rose-400 mt-1">{zoomExpiredCount}</h3>
                </div>
                <div className="w-10 h-10 bg-rose-950 border border-rose-800 rounded-xl flex items-center justify-center text-lg">🔴</div>
              </div>

              <div className="bg-[#0b132b] border border-amber-900/50 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-amber-300 font-medium">Expiring in 1-3 Days</p>
                  <h3 className="text-2xl font-black text-amber-400 mt-1">{zoomCriticalCount}</h3>
                </div>
                <div className="w-10 h-10 bg-amber-950 border border-amber-800 rounded-xl flex items-center justify-center text-lg">⚠️</div>
              </div>

              <div className="bg-[#0b132b] border border-emerald-900/50 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-emerald-300 font-medium">Active &amp; Healthy</p>
                  <h3 className="text-2xl font-black text-emerald-400 mt-1">{zoomActiveCount}</h3>
                </div>
                <div className="w-10 h-10 bg-emerald-950 border border-emerald-800 rounded-xl flex items-center justify-center text-lg">🟢</div>
              </div>
            </div>

            {/* SEARCH & FILTERS BAR */}
            <div className="bg-[#0b132b] border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
              <div className="relative w-full md:w-96">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm">🔍</span>
                <input
                  type="text"
                  placeholder="Search Zoom Account (e.g. zoom16, email)..."
                  value={zoomSearchTerm}
                  onChange={(e) => setZoomSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-9 py-2.5 bg-slate-950 border-2 border-slate-800 focus:border-blue-500 rounded-xl text-xs font-mono font-bold text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
                />
                {zoomSearchTerm && (
                  <button onClick={() => setZoomSearchTerm("")} className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-white text-xs cursor-pointer">✕</button>
                )}
              </div>

              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto flex-wrap">
                <button
                  onClick={() => setZoomFilterType("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    zoomFilterType === "all" ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 font-black" : "bg-slate-900 text-gray-400 hover:text-white"
                  }`}
                >
                  All ({allZoomAccountsList.length})
                </button>

                <button
                  onClick={() => setZoomFilterType("expired")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    zoomFilterType === "expired" ? "bg-rose-600 text-white font-black shadow-md shadow-rose-600/30" : "bg-rose-950/50 text-rose-300 border border-rose-800/60"
                  }`}
                >
                  <span>🔴 Expired</span>
                  <span className="bg-rose-900 px-1.5 py-0.2 rounded-full text-[10px]">{zoomExpiredCount}</span>
                </button>

                <button
                  onClick={() => setZoomFilterType("soon")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    zoomFilterType === "soon" ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30" : "bg-amber-950/50 text-amber-300 border border-amber-800/60"
                  }`}
                >
                  <span>⚠️ 1-3 Days</span>
                  <span className="bg-amber-900 text-amber-200 px-1.5 py-0.2 rounded-full text-[10px]">{zoomCriticalCount}</span>
                </button>

                <button
                  onClick={() => setZoomFilterType("active")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    zoomFilterType === "active" ? "bg-emerald-600 text-white font-black" : "bg-slate-900 text-gray-400 hover:text-white"
                  }`}
                >
                  🟢 Active ({zoomActiveCount})
                </button>
              </div>
            </div>

            {/* SORTED ACCOUNTS TABLE */}
            <div className="bg-[#0b132b]/60 border border-slate-900 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-900 bg-slate-950/80 text-gray-400 font-mono text-[11px]">
                      <th className="p-4">ACCOUNT ID</th>
                      <th className="p-4">CAPACITY</th>
                      <th className="p-4">EXPIRY STATUS (ORDERED BY URGENCY)</th>
                      <th className="p-4">EXPIRE DATE</th>
                      <th className="p-4">ACCOUNT STATUS</th>
                      <th className="p-4">ZOOM EMAIL</th>
                      <th className="p-4 text-right">CLASSES TODAY</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60 text-slate-300">
                    {filteredZoomAccounts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center p-8 text-gray-500 italic">
                          කිසිදු Zoom Account එකක් මෙම කාණ්ඩයේ හමු නොවීය.
                        </td>
                      </tr>
                    ) : (
                      filteredZoomAccounts.map((acc, idx) => {
                        const isExpired = acc.daysLeft !== null && acc.daysLeft <= 0;
                        const isCritical = acc.daysLeft !== null && acc.daysLeft > 0 && acc.daysLeft <= 3;
                        const isCopied = copiedZoomAccId === acc.accId;

                        return (
                          <tr 
                            key={idx} 
                            className={`transition-colors ${
                              isExpired 
                                ? "bg-rose-950/20 hover:bg-rose-950/40" 
                                : isCritical 
                                ? "bg-amber-950/15 hover:bg-amber-950/30" 
                                : "hover:bg-slate-900/40"
                            }`}
                          >
                            <td className="p-4 font-mono font-bold whitespace-nowrap">
                              <button
                                onClick={() => handleCopyZoomAccountId(acc.accId)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs cursor-pointer transition ${
                                  isExpired 
                                    ? "bg-rose-950 border-rose-800 text-rose-300 hover:text-white" 
                                    : "bg-slate-950 border-slate-800 text-blue-400 hover:text-blue-300"
                                }`}
                              >
                                <span>⚡ {acc.accId}</span>
                                {isCopied ? <span className="text-[10px] text-emerald-400">✓</span> : <span className="text-[10px] opacity-60">📋</span>}
                              </button>
                            </td>

                            <td className="p-4 font-mono font-bold text-gray-300 whitespace-nowrap">
                              {acc.poolType}
                            </td>

                            {/* URGENCY BADGE */}
                            <td className="p-4 whitespace-nowrap">
                              {acc.daysLeft !== null ? (
                                isExpired ? (
                                  <span className="px-2.5 py-1 bg-rose-950 border border-rose-600 text-rose-300 font-mono font-black rounded-lg text-[10px] inline-flex items-center gap-1.5 animate-pulse">
                                    <span>🔴 EXPIRED</span>
                                    <span>({Math.abs(acc.daysLeft)} days ago)</span>
                                  </span>
                                ) : isCritical ? (
                                  <span className="px-2.5 py-1 bg-amber-950 border border-amber-600 text-amber-300 font-mono font-black rounded-lg text-[10px] inline-flex items-center gap-1.5 animate-pulse">
                                    <span>⚠️ CRITICAL</span>
                                    <span>({acc.daysLeft} {acc.daysLeft === 1 ? "Day" : "Days"} left)</span>
                                  </span>
                                ) : acc.daysLeft <= 7 ? (
                                  <span className="px-2.5 py-1 bg-yellow-950/80 border border-yellow-700 text-yellow-300 font-mono font-bold rounded-lg text-[10px]">
                                    ⏱️ {acc.daysLeft} Days left
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 bg-emerald-950 border border-emerald-700 text-emerald-400 font-mono font-bold rounded-lg text-[10px]">
                                    🟢 Active ({acc.daysLeft} Days)
                                  </span>
                                )
                              ) : (
                                <span className="text-gray-500 font-mono text-[11px]">N/A</span>
                              )}
                            </td>

                            <td className="p-4 font-mono font-bold text-amber-400 whitespace-nowrap">
                              {acc.expireDate || "Not Set"}
                            </td>

                            <td className="p-4 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black ${
                                acc.status === "ACTIVE" 
                                  ? "bg-emerald-950 text-emerald-400 border border-emerald-800" 
                                  : "bg-rose-950 text-rose-400 border border-rose-800"
                              }`}>
                                {acc.status}
                              </span>
                            </td>

                            <td className="p-4 font-mono text-gray-400 max-w-xs truncate">
                              {acc.email || "N/A"}
                            </td>

                            <td className="p-4 text-right font-mono font-bold text-blue-300 whitespace-nowrap">
                              {acc.classesCount}
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

        {/* MODAL PREVIEW FOR BANK SLIPS */}
        {slipModalTeacher && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
            <div className="bg-[#0b132b] border border-slate-800 w-full max-w-3xl rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl relative">
              <button
                onClick={() => setSlipModalTeacher(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-900 p-2 rounded-xl border border-slate-800 text-xs cursor-pointer"
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
                    <span>🔍</span> Open in New Tab
                  </button>
                )}
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-center justify-center min-h-[300px] max-h-[520px] overflow-hidden relative">
                {getTeacherSlipUrl(slipModalTeacher) ? (
                  getTeacherSlipUrl(slipModalTeacher).toLowerCase().includes(".pdf") ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-3 text-center">
                      <span className="text-5xl animate-bounce">📄</span>
                      <h4 className="text-sm font-bold text-white">PDF Bank Receipt Document</h4>
                      <a
                        href={getTeacherSlipUrl(slipModalTeacher)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition"
                      >
                        Open / Download PDF ↗
                      </a>
                    </div>
                  ) : (
                    <img
                      src={getTeacherSlipUrl(slipModalTeacher)}
                      alt="Bank Slip Full"
                      onClick={() => window.open(getTeacherSlipUrl(slipModalTeacher), "_blank")}
                      className="max-h-[500px] w-auto object-contain rounded-xl cursor-zoom-in"
                    />
                  )
                ) : (
                  <div className="py-20 text-slate-500 text-xs italic">Slip image not available.</div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 pt-1">
                <button
                  onClick={() => handleExtendDays(slipModalTeacher, 15)}
                  className="py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition shadow-md cursor-pointer"
                >
                  +15 Days Approve
                </button>
                <button
                  onClick={() => handleExtendDays(slipModalTeacher, 30)}
                  className="py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition shadow-md cursor-pointer"
                >
                  +30 Days Approve
                </button>
                <button
                  onClick={() => handleRejectSlip(slipModalTeacher)}
                  className="py-3 bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  ❌ Reject Slip
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}