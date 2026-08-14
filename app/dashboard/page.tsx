"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// ... (Interface ටික එහෙමම තියෙන්න) ...
interface Meeting {
  topic: string;
  date: string;
  time: string;
  duration: string;
  zoom_id?: string;
  passcode?: string;
  password?: string;
  pass?: string;
  start_url?: string;
  join_url?: string;
  zoom_account_id?: string;
  meeting_id_row?: string;
  startTime?: string;
  start_time?: string;
  status?: string;
  Status?: string;
}

interface Recording {
  date: string;
  title: string;
  link: string;
}

// (Translations Dictionary එක එහෙමම තියෙන්න)
const translations = {
  si: {
    welcome: "ආයුබෝවන්",
    subHeader: "Digimart LMS Management Portal",
    signOut: "Sign Out",
    supportBtn: "Support",
    homeTab: "Home",
    scheduleTab: "Schedule Class",
    plannedTab: "Scheduled Classes",
    recordingsTab: "Recordings",
    plannedCount: "සැලසුම් කළ පන්ති",
    recordingsCount: "පටිගත කිරීම් (Recordings)",
    accStatus: "ගිණුමේ තත්ත්වය",
    activeAcc: "● Active Account",
    maxHostsLabel: "එකවර පැවැත්විය හැකි පන්ති",
    announcements: "Digimart විශේෂ නිවේදන සහ පිරිනැමීම්",
    ad1Badge: "Special Offer",
    ad1Title: "🚀 Zoom 300 / 500 Participants Package Upgrade!",
    ad1Desc: "ඔබගේ ශිෂ්‍ය සංඛ්‍යාව වැඩි වී තිබේද? කිසිදු බාධාවකින් තොරව 300 හෝ 500 ලිමිට් ඇති Zoom Pro Packages අදම Digimart LMS හරහා පහසුවෙන් ලබාගන්න.",
    ad1Support: "24/7 Live Support Available",
    ad1Btn: "💬 Contact Support",
    ad2Badge: "New Feature",
    ad2Title: "🌐 ඔබගේම LMS වෙබ් අඩවියක් සාදා ගනිමුද?",
    ad2Desc: "Automated Card Payments, Student Attendance Tracking සහ Class Video Cloud Storage සමඟින් ඔබගේ නමින්ම LMS Web Platform එකක් මිනිත්තු කිහිපයකින් ස්ථාපනය කරගන්න.",
    ad2Brand: "Digimart Smart LMS",
    ad2Btn: "✨ වැඩිවිස්තර සඳහා",
    scheduleAsk: "අලුත් පන්තියක් සැලසුම් කිරීමට අවශ්‍යද?",
    scheduleSub: "තත්පර කිහිපයකින් Zoom Meeting එකක් සාදා ගන්න.",
    scheduleNowBtn: "➕ Schedule New Class Now",
    createClassTitle: "අලුත් Class එකක් Schedule කරමු",
    topicLabel: "Class Topic",
    topicPlaceholder: "පන්තියේ මාතෘකාව ඇතුලත් කරන්න",
    dateLabel: "Date",
    timeLabel: "Time",
    durationHoursLabel: "Duration (Hours)",
    durationMinutesLabel: "Duration (Minutes)",
    passcodeLabel: "Passcode",
    passcodePlaceholder: "Auto (හිස්ව තැබුවද Auto Passcode සෑදේ)",
    waitingRoom: "Waiting Room",
    hostVideo: "Host Video",
    participantVideo: "Participant Video",
    muteOnEntry: "Mute on Entry",
    autoRecordingLabel: "🎙️ Auto Recording Options",
    createBtn: "▶️ Create Zoom Class",
    creatingBtn: "⚙️ පන්තිය සකසමින්...",
    plannedClassesTitle: "සැලසුම් කර ඇති පන්ති",
    noPlannedClasses: "👋 ඔබ වෙනුවෙන් මෙතෙක් කිසිදු පන්තියක් සැලසුම් කර නොමැත.",
    scheduleFirstBtn: "➕ Schedule First Class",
    startClassBtn: "▶️ Start Class",
    copyStartLinkBtn: "🔗 Copy Start Link",
    copyDetailsBtn: "📋 Copy Details",
    cancelClassBtn: "❌ Cancel Class",
    recordingsTitle: "ඔබගේ පන්ති පටිගත කිරීම්",
    cloudNote: "(Cloudflare R2 Storage)",
    noRecordings: "පටිගත කරන ලද පන්ති දර්ශන කිසිවක් හමුනොවීය.",
    colDate: "DATE",
    colTitle: "CLASS TITLE",
    colAction: "ACTION",
    copyLinkBtn: "📋 Copy Link",
    daysLeftText: "දින {days} ක් ඉතිරියි",
    expiredText: "❌ කාලය ඉකුත් වී ඇත",
    alertSuccessCreate: "📹 සූම් පන්තිය සාර්ථකව සකස් කර දත්ත ගොනුවට ඇතුලත් කරන ලදී.",
    alertHostLimitError: "🚫 ඔබගේ ගිණුමේ දැනට පවතින්නේ Single Host Package එකකි.\n\nඑම නිසා ඔබට එකවර පැවැත්විය හැක්කේ එක් රැස්වීමක් (Meeting එකක්) පමණි.",
    whatsappConfirm: "👉 ඔබට දැන්ම WhatsApp හරහා Digimart Support සම්බන්ධ කර ගැනීමට අවශ්‍යද?",
    alertAllBusyError: "ERR_ALL_BUSY: ඔබ තෝරාගත් වේලාවට පද්ධතියේ නිදහස් Zoom Account එකක් නොමැත.",
    alertGeneralError: "🚫 පන්තිය සකස් කිරීමට නොහැකි විය. වේලාව නැවත පරීක්ෂා කරන්න.",
    alertServerError: "⚠️ සේවාදායකය සමඟ සම්බන්ධ වීමේ දෝෂයකි. කරුණාකර නැවත උත්සාහ කරන්න.",
    alertCancelConfirm: "⚠️ මෙම පන්තිය අවලංගු (Cancel) කිරීමට අවශ්‍ය බව තහවුරු කරන්න.",
    alertCancelSuccess: "🗑️ පන්තිය සාර්ථකව අවලංගු (Cancel) කරන ලදී.",
    alertCancelError: "❌ පන්තිය අවලංගු කිරීමට නොහැකි විය.",
    alertCopySuccess: "📝 පන්තියේ විස්තර Clipboard එකට Copy කරගන්න ලදී.",
    alertCopyStartLinkSuccess: "🔗 පන්තිය ආරම්භ කිරීමේ Link එක Copy කරන ලදී. (බටන් එක වැඩ නොකරන්නේ නම් මෙය Browser එකේ Paste කරන්න)",
    alertCopyVideoSuccess: "🎬 පටිගත කිරීමේ සබැඳිය (Video Link) සාර්ථකව Copy කරගන්න ලදී."
  },
  en: { /* ... අනිත් ලැන්වේජ් ටිකත් ඔහොමම තියන්න ... */ },
  ta: { /* ... අනිත් ලැන්වේජ් ටිකත් ඔහොමම තියන්න ... */ }
};

export default function DashboardPage() {
  const router = useRouter();
  const [lang, setLang] = useState<"si" | "en" | "ta">("si");
  const [activeTab, setActiveTab] = useState<"home" | "schedule" | "planned" | "recordings">("home");
  // ... (ඉතිරි states ටික එහෙමමයි) ...
  const [teacherName, setTeacherName] = useState("ගුරුතුමනි");
  const [teacherId, setTeacherId] = useState("");
  const [teacherPic, setTeacherPic] = useState("");
  const [maxConcurrentHosts, setMaxConcurrentHosts] = useState<string | number>("1");
  const [remainingDays, setRemainingDays] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [plannedClasses, setPlannedClasses] = useState<Meeting[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [topic, setTopic] = useState("");
  const [date, setDate] = useState("");
  const [selectedHour, setSelectedHour] = useState("07");
  const [selectedMinute, setSelectedMinute] = useState("00");
  const [selectedAmPm, setSelectedAmPm] = useState("PM");
  const [durationHours, setDurationHours] = useState("01 Hr");
  const [durationMinutes, setDurationMinutes] = useState("00 Min");
  const [passcode, setPasscode] = useState("Auto");
  const [waitingRoom, setWaitingRoom] = useState(false);
  const [hostVideo, setHostVideo] = useState(false);
  const [participantVideo, setParticipantVideo] = useState(false);
  const [muteOnEntry, setMuteOnEntry] = useState(true);
  const [autoRecording, setAutoRecording] = useState<"none" | "cloud" | "local">("none");
  const [formLoading, setFormLoading] = useState(false);

  // ... (useEffect, fetch, parse functions එහෙමමයි) ...
  useEffect(() => { /* ... */ }, [router]);
  const t = translations[lang];

  // අලුත් Copy function එක
  const handleCopyStartLink = (item: Meeting) => {
    const cleanZoomId = item.zoom_id ? item.zoom_id.toString().replace(/\D/g, "") : item.meeting_id_row;
    const startUrl = `https://n8n.epanthiya.com/webhook/start-zoom-class?meeting_id=${cleanZoomId}`;
    navigator.clipboard.writeText(startUrl);
    alert(t.alertCopyStartLinkSuccess);
  };

  // ... (ඉතුරු functions එහෙමමයි) ...

  return (
    <div className="min-h-screen bg-[#070b19] text-white font-sans p-3 sm:p-4 md:p-6">
      {/* ... (Header, Tabs එහෙමමයි) ... */}

      {/* PLANNED CLASSES - Updated Layout */}
      {activeTab === "planned" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plannedClasses.map((item, idx) => {
            // ... (Logic ටික එහෙමමයි) ...
            return (
              <div key={idx} className="bg-[#0b132b]/60 border border-slate-900 p-5 rounded-2xl flex flex-col justify-between">
                {/* Info Display */}
                <div className="space-y-3">
                   {/* ... (Date, Topic, Time display) ... */}
                </div>

                {/* ACTION SECTION - ලස්සනට සකස් කළ බටන්ස් */}
                <div className="space-y-2 mt-4">
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => handleStartClass(item)} className="py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[11px] font-black cursor-pointer shadow-md shadow-blue-900/20">
                      {t.startClassBtn}
                    </button>
                    <button onClick={() => { /* Copy Details Logic */ }} className="py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[11px] font-bold cursor-pointer">
                      {t.copyDetailsBtn}
                    </button>
                  </div>
                  
                  {/* අලුත් Copy Start Link බටන් එක */}
                  <button onClick={() => handleCopyStartLink(item)} className="w-full py-2 bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 rounded-xl text-[10px] font-bold flex items-center justify-center gap-2 cursor-pointer hover:bg-emerald-900/60 transition-all">
                    <span>🔗</span> {t.copyStartLinkBtn}
                  </button>
                  
                  <p className="text-[9px] text-slate-600 text-center italic mt-1">
                    * If start button fails, copy this link to start class manually.
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}