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

// ==================== TRANSLATIONS DICTIONARY ====================
const translations = {
  si: {
    welcome: "ආයුබෝවන්",
    subHeader: "Digimart LMS Management Portal",
    signOut: "Sign Out",
    homeTab: "Home",
    scheduleTab: "Schedule Class",
    plannedTab: "Scheduled Classes",
    recordingsTab: "Recordings",
    plannedCount: "සැලසුම් කළ පන්ති",
    recordingsCount: "පටිගත කිරීම් (Recordings)",
    accStatus: "ගිණුමේ තත්ත්වය",
    activeAcc: "● Active Account",
    announcements: "Digimart විශේෂ නිවේදන සහ පිරිනැමීම්",
    // Ad 1
    ad1Badge: "Special Offer",
    ad1Title: "🚀 Zoom 300 / 500 Participants Package Upgrade!",
    ad1Desc: "ඔබගේ ශිෂ්‍ය සංඛ්‍යාව වැඩි වී තිබේද? කිසිදු බාධාවකින් තොරව 300 හෝ 500 ලිමිට් ඇති Zoom Pro Packages අදම Digimart LMS හරහා පහසුවෙන් ලබාගන්න.",
    ad1Support: "24/7 Live Support Available",
    ad1Btn: "💬 Contact Support",
    // Ad 2
    ad2Badge: "New Feature",
    ad2Title: "🌐 ඔබගේම LMS වෙබ් අඩවියක් සාදා ගනිමුද?",
    ad2Desc: "Automated Card Payments, Student Attendance Tracking සහ Class Video Cloud Storage සමඟින් ඔබගේ නමින්ම LMS Web Platform එකක් මිනිත්තු කිහිපයකින් ස්ථාපනය කරගන්න.",
    ad2Brand: "Digimart Smart LMS",
    ad2Btn: "✨ වැඩිවිස්තර සඳහා",
    // Home bottom
    scheduleAsk: "අලුත් පන්තියක් සැලසුම් කිරීමට අවශ්‍යද?",
    scheduleSub: "තත්පර කිහිපයකින් Zoom Meeting එකක් සාදා ගන්න.",
    scheduleNowBtn: "➕ Schedule New Class Now",
    // Form
    createClassTitle: "අලුත් Class එකක් Schedule කරමු",
    topicLabel: "Class Topic",
    topicPlaceholder: "පන්තියේ මාතෘකාව ඇතුලත් කරන්න",
    dateLabel: "Date",
    timeLabel: "Time",
    durationHoursLabel: "Duration (Hours)",
    durationMinutesLabel: "Duration (Minutes)",
    passcodeLabel: "Passcode",
    waitingRoom: "Waiting Room",
    hostVideo: "Host Video",
    participantVideo: "Participant Video",
    muteOnEntry: "Mute on Entry",
    createBtn: "▶️ Create Zoom Class",
    creatingBtn: "⚙️ පන්තිය සකසමින්...",
    // Planned Classes
    plannedClassesTitle: "සැලසුම් කර ඇති පන්ති",
    noPlannedClasses: "👋 ඔබ වෙනුවෙන් මෙතෙක් කිසිදු පන්තියක් සැලසුම් කර නොමැත.",
    scheduleFirstBtn: "➕ Schedule First Class",
    startClassBtn: "▶️ Start Class",
    copyDetailsBtn: "📋 Copy Details",
    cancelClassBtn: "❌ Cancel Class",
    // Recordings
    recordingsTitle: "ඔබගේ පන්ති පටිගත කිරීම්",
    cloudNote: "(Cloudflare R2 Storage)",
    noRecordings: "පටිගත කරන ලද පන්ති දර්ශන කිසිවක් හමුනොවීය.",
    colDate: "DATE",
    colTitle: "CLASS TITLE",
    colAction: "ACTION",
    copyLinkBtn: "📋 Copy Link",

    // 🔔 ALERTS & SYSTEM ERRORS (NEW TRILINGUAL MESSAGES)
    alertSuccessCreate: "📹 සූම් පන්තිය සාර්ථකව සකස් කර දත්ත ගොනුවට ඇතුලත් කරන ලදී.",
    alertHostLimitError: "🚫 ඔබගේ Package එක අනුව එකම වේලාවේ පැවැත්විය හැක්කේ උපරිම පන්ති ගණන ඉක්මවා ඇත. වෙනත් වේලාවක් තෝරන්න.",
    alertAllBusyError: "ERR_ALL_BUSY: ඔබ තෝරාගත් වේලාවට පද්ධතියේ නිදහස් Zoom Account එකක් නොමැත.",
    alertGeneralError: "🚫 පන්තිය සකස් කිරීමට නොහැකි විය. වේලාව නැවත පරීක්ෂා කරන්න.",
    alertServerError: "⚠️ සේවාදායකය සමඟ සම්බන්ධ වීමේ දෝෂයකි. කරුණාකර නැවත උත්සාහ කරන්න.",
    alertCancelConfirm: "⚠️ ඔබට මෙම පන්තිය අවලංගු (Cancel) කිරීමට අවශ්‍යද?\n\nමෙය සිදු කළ පසු අදාළ Zoom Time Slot එක ස්වයංක්‍රීයව නිදහස් වේ.",
    alertCancelSuccess: "🗑️ පන්තිය සාර්ථකව අවලංගු (Cancel) කරන ලදී.",
    alertCancelError: "❌ පන්තිය අවලංගු කිරීමට නොහැකි විය.",
    alertCopySuccess: "📝 පන්තියේ විස්තර Clipboard එකට Copy කරගන්නා ලදී.",
    alertCopyVideoSuccess: "🎬 පටිගත කිරීමේ සබැඳිය (Video Link) සාර්ථකව Copy කරගන්නා ලදී."
  },
  en: {
    welcome: "Welcome",
    subHeader: "Digimart LMS Management Portal",
    signOut: "Sign Out",
    homeTab: "Home",
    scheduleTab: "Schedule Class",
    plannedTab: "Scheduled Classes",
    recordingsTab: "Recordings",
    plannedCount: "Scheduled Classes",
    recordingsCount: "Recordings",
    accStatus: "Account Status",
    activeAcc: "● Active Account",
    announcements: "Digimart Special Announcements & Offers",
    // Ad 1
    ad1Badge: "Special Offer",
    ad1Title: "🚀 Zoom 300 / 500 Participants Package Upgrade!",
    ad1Desc: "Has your student count increased? Easily upgrade to 300 or 500 capacity Zoom Pro Packages via Digimart LMS today.",
    ad1Support: "24/7 Live Support Available",
    ad1Btn: "💬 Contact Support",
    // Ad 2
    ad2Badge: "New Feature",
    ad2Title: "🌐 Want your own custom LMS Website?",
    ad2Desc: "Get your branded LMS Web Platform in minutes with Automated Card Payments, Student Attendance Tracking & Cloud Storage.",
    ad2Brand: "Digimart Smart LMS",
    ad2Btn: "✨ Learn More",
    // Home bottom
    scheduleAsk: "Need to schedule a new class?",
    scheduleSub: "Create a Zoom Meeting in just a few seconds.",
    scheduleNowBtn: "➕ Schedule New Class Now",
    // Form
    createClassTitle: "Schedule a New Class",
    topicLabel: "Class Topic",
    topicPlaceholder: "Enter class topic",
    dateLabel: "Date",
    timeLabel: "Time",
    durationHoursLabel: "Duration (Hours)",
    durationMinutesLabel: "Duration (Minutes)",
    passcodeLabel: "Passcode",
    waitingRoom: "Waiting Room",
    hostVideo: "Host Video",
    participantVideo: "Participant Video",
    muteOnEntry: "Mute on Entry",
    createBtn: "▶️ Create Zoom Class",
    creatingBtn: "⚙️ Creating Class...",
    // Planned Classes
    plannedClassesTitle: "Scheduled Classes",
    noPlannedClasses: "👋 No classes scheduled for you yet.",
    scheduleFirstBtn: "➕ Schedule First Class",
    startClassBtn: "▶️ Start Class",
    copyDetailsBtn: "📋 Copy Details",
    cancelClassBtn: "❌ Cancel Class",
    // Recordings
    recordingsTitle: "Your Class Recordings",
    cloudNote: "(Cloudflare R2 Storage)",
    noRecordings: "No class recordings found.",
    colDate: "DATE",
    colTitle: "CLASS TITLE",
    colAction: "ACTION",
    copyLinkBtn: "📋 Copy Link",

    // 🔔 ALERTS & SYSTEM ERRORS
    alertSuccessCreate: "📹 Zoom class scheduled and saved successfully.",
    alertHostLimitError: "🚫 You have reached the maximum allowed concurrent live classes for your package. Please select another time slot.",
    alertAllBusyError: "ERR_ALL_BUSY: No free Zoom Accounts available for the selected time slot.",
    alertGeneralError: "🚫 Unable to schedule class. Please verify the date and time.",
    alertServerError: "⚠️ Server connection error. Please try again.",
    alertCancelConfirm: "⚠️ Are you sure you want to cancel this class?\n\nThis will free up the Zoom Time Slot automatically.",
    alertCancelSuccess: "🗑️ Class canceled successfully.",
    alertCancelError: "❌ Failed to cancel class.",
    alertCopySuccess: "📝 Class details copied to Clipboard.",
    alertCopyVideoSuccess: "🎬 Video Recording link copied to Clipboard."
  },
  ta: {
    welcome: "வணக்கம்",
    subHeader: "Digimart LMS மேலாண்மை போர்டல்",
    signOut: "வெளியேறு",
    homeTab: "முகப்பு",
    scheduleTab: "வகுப்பு அட்டவணை",
    plannedTab: "திட்டமிடப்பட்ட வகுப்புகள்",
    recordingsTab: "பதிவுகள்",
    plannedCount: "திட்டமிடப்பட்ட வகுப்புகள்",
    recordingsCount: "பதிவுகள்",
    accStatus: "கணக்கு நிலை",
    activeAcc: "● செயலில் உள்ள கணக்கு",
    announcements: "Digimart சிறப்பு அறிவிப்புகள் & சலுகைகள்",
    // Ad 1
    ad1Badge: "சிறப்பு சலுகை",
    ad1Title: "🚀 Zoom 300 / 500 பங்கேற்பாளர்கள் பேக்கேஜ் அப் கிரேட்!",
    ad1Desc: "உங்கள் மாணவர் எண்ணிக்கை அதிகரித்துள்ளதா? Digimart LMS மூலம் 300 அல்லது 500 கொள்ளளவு கொண்ட Zoom Pro பேக்கேஜ்களை இன்றே பெறுங்கள்.",
    ad1Support: "24/7 நேரலை உதவி கிடைக்கும்",
    ad1Btn: "💬 தொடர்புகொள்ளவும்",
    // Ad 2
    ad2Badge: "புதிய அம்சம்",
    ad2Title: "🌐 சொந்தமாக LMS இணையதளம் உருவாக்க வேண்டுமா?",
    ad2Desc: "தானியங்கி அட்டை கொடுப்பனவுகள், மாணவர் வருகை கண்காணிப்பு மற்றும் வீடியோ சேமிப்பகத்துடன் உங்கள் பிராண்டட் LMS பிளாட்ஃபார்மைப் பெறுங்கள்.",
    ad2Brand: "Digimart Smart LMS",
    ad2Btn: "✨ மேலும் அறிய",
    // Home bottom
    scheduleAsk: "புதிய வகுப்பை திட்டமிட வேண்டுமா?",
    scheduleSub: "சில வினாடிகளில் Zoom கூட்டத்தை உருவாக்கவும்.",
    scheduleNowBtn: "➕ புதிய வகுப்பை திட்டமிடுங்கள்",
    // Form
    createClassTitle: "புதிய வகுப்பை திட்டமிடுங்கள்",
    topicLabel: "வகுப்பு தலைப்பு",
    topicPlaceholder: "வகுப்பு தலைப்பை உள்ளிடவும்",
    dateLabel: "தேதி",
    timeLabel: "நேரம்",
    durationHoursLabel: "கால அளவு (மணி)",
    durationMinutesLabel: "கால அளவு (நிமிடங்கள்)",
    passcodeLabel: "கடவுச்சொல்",
    waitingRoom: "காத்திருப்பு அறை",
    hostVideo: "தொகுப்பாளர் வீடியோ",
    participantVideo: "பங்கேற்பாளர் வீடியோ",
    muteOnEntry: "நுழையும் போது முடக்கு",
    createBtn: "▶️ Zoom வகுப்பை உருவாக்கு",
    creatingBtn: "⚙️ உருவாக்கப்படுகிறது...",
    // Planned Classes
    plannedClassesTitle: "திட்டமிடப்பட்ட வகுப்புகள்",
    noPlannedClasses: "👋 உங்களுக்கு இன்னும் வகுப்புகள் எதுவும் திட்டமிடப்படவில்லை.",
    scheduleFirstBtn: "➕ முதல் வகுப்பை திட்டமிடுங்கள்",
    startClassBtn: "▶️ வகுப்பைத் தொடங்கு",
    copyDetailsBtn: "📋 விவரங்களை நகலெடு",
    cancelClassBtn: "❌ வகுப்பை ரத்து செய்",
    // Recordings
    recordingsTitle: "உங்கள் வகுப்பு பதிவுகள்",
    cloudNote: "(Cloudflare R2 Storage)",
    noRecordings: "வகுப்பு பதிவுகள் எதுவும் கிடைக்கவில்லை.",
    colDate: "தேதி",
    colTitle: "வகுப்பு தலைப்பு",
    colAction: "செயல்பாடு",
    copyLinkBtn: "📋 லிங்கை நகலெடு",

    // 🔔 ALERTS & SYSTEM ERRORS
    alertSuccessCreate: "📹 Zoom வகுப்பு வெற்றிகரமாக திட்டமிடப்பட்டு சேமிக்கப்பட்டது.",
    alertHostLimitError: "🚫 உங்கள் பேக்கேஜின் படி ஒரே நேரத்தில் நடத்தக்கூடிய நேரலை வகுப்புகளின் வரம்பை எட்டிவிட்டீர்கள்.",
    alertAllBusyError: "ERR_ALL_BUSY: தேர்ந்தெடுக்கப்பட்ட நேரத்தில் இலவச Zoom கணக்குகள் எதுவும் கிடைக்கவில்லை.",
    alertGeneralError: "🚫 வகுப்பை திட்டமிட முடியவில்லை. நேரத்தை மீண்டும் சரிபார்க்கவும்.",
    alertServerError: "⚠️ சர்வர் இணைப்பு பிழை. மீண்டும் முயற்சிக்கவும்.",
    alertCancelConfirm: "⚠️ இந்த வகுப்பை ரத்து செய்ய விரும்புகிறீர்களா?\n\nஇது Zoom நேரத்தை விடுவிக்கும்.",
    alertCancelSuccess: "🗑️ வகுப்பு வெற்றிகரமாக ரத்து செய்யப்பட்டது.",
    alertCancelError: "❌ வகுப்பை ரத்து செய்ய முடியவில்லை.",
    alertCopySuccess: "📝 வகுப்பு விவரங்கள் நகலெடுக்கப்பட்டன.",
    alertCopyVideoSuccess: "🎬 பதிவு செய்யப்பட்ட வீடியோ லிங்க் நகலெடுக்கப்பட்டது."
  }
};

export default function DashboardPage() {
  const router = useRouter();
  
  // Language State: 'si' | 'en' | 'ta'
  const [lang, setLang] = useState<"si" | "en" | "ta">("si");
  
  // Tab State: 'home' | 'schedule' | 'planned' | 'recordings'
  const [activeTab, setActiveTab] = useState<"home" | "schedule" | "planned" | "recordings">("home");

  const [teacherName, setTeacherName] = useState("ගුරුතුමනි");
  const [teacherId, setTeacherId] = useState("");
  const [teacherPic, setTeacherPic] = useState("");
  const [loading, setLoading] = useState(true);

  const [plannedClasses, setPlannedClasses] = useState<Meeting[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  
  // Form State
  const [topic, setTopic] = useState("");
  const [date, setDate] = useState("2026-08-01");
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
    const savedLang = (localStorage.getItem("app_lang") as "si" | "en" | "ta") || "si";
    setLang(savedLang);

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

  const handleLangChange = (newLang: "si" | "en" | "ta") => {
    setLang(newLang);
    localStorage.setItem("app_lang", newLang);
  };

  const t = translations[lang];

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
      console.error("Error fetching teacher data:", error);
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
      try { data = await response.json(); } catch (e) { data = {}; }

      if (response.ok && data.status === "success") {
        alert(t.alertSuccessCreate);
        setTopic("");
        fetchTeacherData(teacherId);
        setActiveTab("planned");
      } else {
        const rawError = data.message || data.errorMessage || data.error || "";
        
        // 🎯 DYNAMIC ERROR TRANSLATION MATCHING
        if (rawError.includes("උපරිම පන්ති") || rawError.includes("concurrent") || rawError.includes("Package")) {
          alert(t.alertHostLimitError);
        } else if (rawError.includes("ERR_ALL_BUSY")) {
          alert(t.alertAllBusyError);
        } else {
          alert(rawError || t.alertGeneralError);
        }
      }
    } catch (error: any) {
      console.error(error);
      alert(t.alertServerError);
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancelClass = async (meetingIdRow?: string, zoomMeetingId?: string) => {
    const idToCancel = meetingIdRow || zoomMeetingId;
    if (!idToCancel) return alert("⚠️ Meeting ID Not Found.");

    const isConfirmed = confirm(t.alertCancelConfirm);
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
      try { data = await response.json(); } catch (e) { data = {}; }

      if (response.ok && data.status === "success") {
        alert(t.alertCancelSuccess);
        fetchTeacherData(teacherId);
      } else {
        alert(data.message || t.alertCancelError);
      }
    } catch (error) {
      console.error(error);
      alert(t.alertServerError);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b19] flex items-center justify-center text-white font-sans">
        <p className="text-sm animate-pulse">⚙️ Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b19] text-white font-sans p-4 md:p-6 selection:bg-blue-600/30">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* ==================== HEADER SECTION ==================== */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-900 pb-5 gap-4">
          <div className="flex items-center gap-4">
            {teacherPic ? (
              <img 
                src={teacherPic} 
                alt={teacherName} 
                className="w-12 h-12 rounded-2xl object-cover border-2 border-blue-500/50 shadow-lg shadow-blue-500/10"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 border-2 border-blue-400/30 flex items-center justify-center text-lg font-black text-white shadow-lg">
                {teacherName.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-200">
                {t.welcome}, {teacherName}! 👋
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">{t.subHeader}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <span className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-blue-400 font-bold">
              ID: {teacherId}
            </span>

            {/* 🌐 LANGUAGE SWITCHER DROPDOWN */}
            <select 
              value={lang}
              onChange={(e) => handleLangChange(e.target.value as "si" | "en" | "ta")}
              className="bg-slate-900 border border-slate-800 text-xs text-blue-400 font-bold px-3 py-1.5 rounded-xl focus:outline-none cursor-pointer"
            >
              <option value="si">🇱🇰 සිංහල</option>
              <option value="en">🇬🇧 English</option>
              <option value="ta">🇱🇰 தமிழ்</option>
            </select>

            <button 
              onClick={handleLogout}
              className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/40 text-rose-400 text-xs font-bold rounded-xl transition-all"
            >
              {t.signOut}
            </button>
          </div>
        </div>

        {/* ==================== TABS NAVIGATION HEADER ==================== */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-900 no-scrollbar">
          
          <button
            onClick={() => setActiveTab("home")}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "home" 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                : "bg-slate-900/60 text-gray-400 hover:bg-slate-900 hover:text-white border border-slate-800"
            }`}
          >
            <span>🏠</span> {t.homeTab}
          </button>

          <button
            onClick={() => setActiveTab("schedule")}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "schedule" 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                : "bg-slate-900/60 text-gray-400 hover:bg-slate-900 hover:text-white border border-slate-800"
            }`}
          >
            <span>➕</span> {t.scheduleTab}
          </button>

          <button
            onClick={() => setActiveTab("planned")}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap relative ${
              activeTab === "planned" 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                : "bg-slate-900/60 text-gray-400 hover:bg-slate-900 hover:text-white border border-slate-800"
            }`}
          >
            <span>📅</span> {t.plannedTab}
            <span className="ml-1 bg-slate-950 text-blue-400 px-2 py-0.5 rounded-full text-[10px] font-bold border border-slate-800">
              {plannedClasses.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("recordings")}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap relative ${
              activeTab === "recordings" 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                : "bg-slate-900/60 text-gray-400 hover:bg-slate-900 hover:text-white border border-slate-800"
            }`}
          >
            <span>🎬</span> {t.recordingsTab}
            <span className="ml-1 bg-slate-950 text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-bold border border-slate-800">
              {recordings.length}
            </span>
          </button>

        </div>

        {/* ==================== TAB CONTENT AREAS ==================== */}

        {/* ----------------- 🏠 TAB 1: HOME (SUMMARY + PROMO AD BANNERS) ----------------- */}
        {activeTab === "home" && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#0b132b] border border-slate-900 p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-medium">{t.plannedCount}</p>
                  <h3 className="text-2xl font-black text-blue-400 mt-1">{plannedClasses.length}</h3>
                </div>
                <div className="w-12 h-12 bg-blue-950/60 border border-blue-900/40 rounded-xl flex items-center justify-center text-xl">📅</div>
              </div>

              <div className="bg-[#0b132b] border border-slate-900 p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-medium">{t.recordingsCount}</p>
                  <h3 className="text-2xl font-black text-emerald-400 mt-1">{recordings.length}</h3>
                </div>
                <div className="w-12 h-12 bg-emerald-950/60 border border-emerald-900/40 rounded-xl flex items-center justify-center text-xl">🎬</div>
              </div>

              <div className="bg-[#0b132b] border border-slate-900 p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-medium">{t.accStatus}</p>
                  <h3 className="text-base font-bold text-emerald-400 mt-1">{t.activeAcc}</h3>
                </div>
                <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-xl">⚡</div>
              </div>
            </div>

            {/* 🎯 DIGIMART ANNOUNCEMENTS & ADVERTISEMENTS SECTION */}
            <div className="space-y-4 pt-2">
              <h2 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                <span>📢</span> {t.announcements}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* AD CARD 1: ZOOM 300P / 500P PACKAGE UPGRADE */}
                <div className="bg-gradient-to-br from-blue-950/50 via-[#0b132b] to-indigo-950/40 border border-blue-800/40 p-6 rounded-2xl relative overflow-hidden group shadow-xl">
                  <div className="absolute top-3 right-3 bg-blue-600 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider text-white">
                    {t.ad1Badge}
                  </div>
                  <h3 className="text-base font-black text-blue-300">{t.ad1Title}</h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {t.ad1Desc}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs font-mono text-emerald-400 font-bold">{t.ad1Support}</span>
                    <a 
                      href="https://wa.me/94778538626?text=Hi%20Digimart!%20මම%20Zoom%20Package%20එකක්%20Upgrade%20කරගන්න%20විස්තර%20දැනගන්න%20කැමතියි." 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5"
                    >
                      {t.ad1Btn}
                    </a>
                  </div>
                </div>

                {/* AD CARD 2: AUTOMATED LMS / WEBSITE INTEGRATION */}
                <div className="bg-gradient-to-br from-purple-950/40 via-[#0b132b] to-slate-900 border border-purple-800/30 p-6 rounded-2xl relative overflow-hidden group shadow-xl">
                  <div className="absolute top-3 right-3 bg-purple-600 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider text-white">
                    {t.ad2Badge}
                  </div>
                  <h3 className="text-base font-black text-purple-300">{t.ad2Title}</h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {t.ad2Desc}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs font-mono text-purple-400 font-bold">{t.ad2Brand}</span>
                    <a 
                      href="https://wa.me/94778538626?text=Hi%20Digimart!%20මම%20LMS%20Website%20එකක්%20හදාගන්න%20විස්තර%20දැනගන්න%20කැමතියි." 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5"
                    >
                      {t.ad2Btn}
                    </a>
                  </div>
                </div>

              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="p-6 bg-[#0b132b] border border-slate-900 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-slate-200">{t.scheduleAsk}</h4>
                <p className="text-xs text-gray-500 mt-1">{t.scheduleSub}</p>
              </div>
              <button 
                onClick={() => setActiveTab("schedule")}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-blue-600/20"
              >
                {t.scheduleNowBtn}
              </button>
            </div>

          </div>
        )}

        {/* ----------------- ➕ TAB 2: SCHEDULE CLASS FORM ----------------- */}
        {activeTab === "schedule" && (
          <div className="max-w-2xl mx-auto bg-[#0b132b] border border-slate-900 p-6 rounded-2xl shadow-xl space-y-5 animate-fadeIn">
            <h2 className="text-base font-bold text-blue-400 flex items-center gap-2 border-b border-slate-900 pb-3">
              <span>🚀</span> {t.createClassTitle}
            </h2>
            
            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">{t.topicLabel}</label>
                <input 
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={t.topicPlaceholder}
                  className="w-full p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">{t.dateLabel}</label>
                  <input 
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 color-scheme-dark"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">{t.timeLabel}</label>
                  <div className="grid grid-cols-3 gap-1">
                    <select 
                      value={selectedHour} 
                      onChange={(e) => setSelectedHour(e.target.value)}
                      className="p-3 bg-slate-900/90 border border-slate-800 rounded-l-xl text-xs text-center focus:outline-none"
                    >
                      {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                    <select 
                      value={selectedMinute} 
                      onChange={(e) => setSelectedMinute(e.target.value)}
                      className="p-3 bg-slate-900/90 border-y border-slate-800 text-xs text-center focus:outline-none"
                    >
                      {["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <select 
                      value={selectedAmPm} 
                      onChange={(e) => setSelectedAmPm(e.target.value)}
                      className="p-3 bg-slate-900/90 border border-slate-800 rounded-r-xl text-xs text-center font-bold text-blue-400 focus:outline-none"
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">{t.durationHoursLabel}</label>
                  <select 
                    value={durationHours}
                    onChange={(e) => setDurationHours(e.target.value)}
                    className="w-full p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs focus:outline-none"
                  >
                    {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map(h => (
                      <option key={h} value={`${h} ${parseInt(h) === 1 ? 'Hr' : 'Hrs'}`}>{h} {parseInt(h) === 1 ? 'Hr' : 'Hrs'}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">{t.durationMinutesLabel}</label>
                  <select 
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs focus:outline-none"
                  >
                    <option>00 Min</option>
                    <option>15 Min</option>
                    <option>30 Min</option>
                    <option>45 Min</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">{t.passcodeLabel}</label>
                <input 
                  type="text"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-400 focus:outline-none"
                />
              </div>

              <div className="space-y-2.5 pt-2 border-t border-slate-900">
                <label className="flex items-center gap-3 text-xs text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={waitingRoom} onChange={(e) => setWaitingRoom(e.target.checked)} className="w-4 h-4 rounded bg-slate-900" />
                  <span>{t.waitingRoom}</span>
                </label>
                <label className="flex items-center gap-3 text-xs text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={hostVideo} onChange={(e) => setHostVideo(e.target.checked)} className="w-4 h-4 rounded bg-slate-900" />
                  <span>{t.hostVideo}</span>
                </label>
                <label className="flex items-center gap-3 text-xs text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={participantVideo} onChange={(e) => setParticipantVideo(e.target.checked)} className="w-4 h-4 rounded bg-slate-900" />
                  <span>{t.participantVideo}</span>
                </label>
                <label className="flex items-center gap-3 text-xs text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={muteOnEntry} onChange={(e) => setMuteOnEntry(e.target.checked)} className="w-4 h-4 rounded bg-slate-900" />
                  <span>{t.muteOnEntry}</span>
                </label>
              </div>

              <button 
                type="submit"
                disabled={formLoading}
                className="w-full py-3.5 mt-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 rounded-xl text-xs font-bold tracking-wide transition-all shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2"
              >
                {formLoading ? t.creatingBtn : t.createBtn}
              </button>
            </form>
          </div>
        )}

        {/* ----------------- 📅 TAB 3: SCHEDULED CLASSES ----------------- */}
        {activeTab === "planned" && (
          <div className="space-y-4 animate-fadeIn">
            <h2 className="text-sm font-bold tracking-wide text-gray-300 flex items-center justify-between">
              <span className="flex items-center gap-2">📅 {t.plannedClassesTitle}</span>
              <span className="bg-slate-900 text-blue-400 text-xs px-2.5 py-1 rounded-full border border-slate-800 font-bold">{plannedClasses.length} Classes</span>
            </h2>
            
            {plannedClasses.length === 0 ? (
              <div className="p-12 border border-dashed border-slate-800 rounded-2xl text-center text-gray-500 text-xs space-y-3">
                <p>{t.noPlannedClasses}</p>
                <button 
                  onClick={() => setActiveTab("schedule")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
                >
                  {t.scheduleFirstBtn}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {plannedClasses.map((item, idx) => (
                  <div key={idx} className="bg-[#0b132b]/60 border border-slate-900 p-5 rounded-2xl space-y-4 shadow-sm relative hover:border-slate-800 transition-colors">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] bg-blue-950 text-blue-400 font-bold px-2 py-1 rounded-md border border-blue-900/30">{item.date}</span>
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">⏳ {item.duration} Min</span>
                    </div>

                    <h3 className="text-xs font-bold tracking-wide text-slate-200 line-clamp-2">{item.topic}</h3>
                    
                    <div className="bg-slate-950/70 border border-slate-900/60 p-3 rounded-xl space-y-1.5 font-mono text-[11px] text-slate-400">
                      <p>⏰ Time: {item.time || item.startTime || "12:00 PM"}</p>
                      <p>🆔 ID: {item.zoom_id || "Loading..."}</p>
                      <p>🔑 Pass: {item.passcode}</p>
                      <p className="text-[10px] text-blue-400 font-bold">⚙️ Acc: {item.zoom_account_id || "Pool Acc"}</p>
                    </div>
                    
                    <div className="space-y-2 pt-1">
                      <div className="grid grid-cols-2 gap-2">
                        <a 
                          href={`https://n8n.epanthiya.com/webhook/start-zoom-class?meeting_id=${item.meeting_id_row || item.zoom_id}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-[10px] font-bold transition-colors text-center block text-white"
                        >
                          {t.startClassBtn}
                        </a>

                        <button 
                          onClick={() => {
                            const details = `✨ *DIGIMART LMS - CLASS DETAILS* ✨\n\n📌 *Topic:* ${item.topic}\n📅 *Date:* ${item.date}\n⏰ *Time:* ${item.time}\n\n🔐 *Meeting ID:* ${item.zoom_id}\n🔑 *Passcode:* ${item.passcode}\n\n🌐 *Join Link:* ${item.join_url}`;
                            navigator.clipboard.writeText(details);
                            alert(t.alertCopySuccess);
                          }}
                          className="py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-bold transition-colors"
                        >
                          {t.copyDetailsBtn}
                        </button>
                      </div>

                      <button 
                        onClick={() => handleCancelClass(item.meeting_id_row, item.zoom_id)}
                        className="w-full py-1.5 bg-rose-950/30 hover:bg-rose-900/50 border border-rose-900/40 text-rose-400 text-[10px] font-bold rounded-xl transition-all text-center"
                      >
                        {t.cancelClassBtn}
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ----------------- 🎬 TAB 4: RECORDINGS ----------------- */}
        {activeTab === "recordings" && (
          <div className="space-y-4 animate-fadeIn">
            <h2 className="text-sm font-bold tracking-wide text-gray-300 flex items-center justify-between">
              <span className="flex items-center gap-2">🎬 {t.recordingsTitle} <span className="text-xs font-normal text-gray-500">{t.cloudNote}</span></span>
              <span className="bg-slate-900 text-emerald-400 text-xs px-2.5 py-1 rounded-full border border-slate-800 font-bold">{recordings.length} Videos</span>
            </h2>
            
            {recordings.length === 0 ? (
              <div className="p-12 border border-dashed border-slate-800 rounded-2xl text-center text-gray-500 text-xs">
                {t.noRecordings}
              </div>
            ) : (
              <div className="bg-[#0b132b]/40 border border-slate-900 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-900 bg-slate-950/50 text-gray-400 font-medium">
                      <th className="p-4 w-[25%]">{t.colDate}</th>
                      <th className="p-4 w-[55%]">{t.colTitle}</th>
                      <th className="p-4 w-[20%] text-right">{t.colAction}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60 text-slate-300">
                    {recordings.map((rec, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/30 transition-colors">
                        <td className="p-4 font-mono text-gray-400">{rec.date}</td>
                        <td className="p-4 font-bold text-slate-200">{rec.title}</td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(rec.link);
                              alert(t.alertCopyVideoSuccess);
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[10px] transition-colors"
                          >
                            {t.copyLinkBtn}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}