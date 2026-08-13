"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

// ==================== TRANSLATIONS DICTIONARY ====================
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
    alertHostLimitError: "🚫 ඔබගේ ගිණුමේ දැනට පවතින්නේ Single Host Package එකකි.\n\nඑම නිසා ඔබට එකවර පැවැත්විය හැක්කේ එක් රැස්වීමක් (Meeting එකක්) පමණි.\n\nDual Host හෝ ඊට වැඩි Package එකක් Active කරගැනීමට Digimart Support අමතන්න.",
    whatsappConfirm: "👉 ඔබට දැන්ම WhatsApp හරහා Digimart Support සම්බන්ධ කර ගැනීමට අවශ්‍යද?",
    alertAllBusyError: "ERR_ALL_BUSY: ඔබ තෝරාගත් වේලාවට පද්ධතියේ නිදහස් Zoom Account එකක් නොමැත.",
    alertGeneralError: "🚫 පන්තිය සකස් කිරීමට නොහැකි විය. වේලාව නැවත පරීක්ෂා කරන්න.",
    alertServerError: "⚠️ සේවාදායකය සමඟ සම්බන්ධ වීමේ දෝෂයකි. කරුණාකර නැවත උත්සාහ කරන්න.",
    alertCancelConfirm: "⚠️ මෙම පන්තිය අවලංගු (Cancel) කිරීමට අවශ්‍ය බව තහවුරු කරන්න.\n\n• මෙම Zoom Link එක සහ Passcode එක සදහටම අක්‍රීය / අවලංගු වේ.\n• සිසුන්ට මෙම පන්තියට තවදුරටත් සම්බන්ධ විය නොහැක.\n• නැවත මෙම පන්තිය පැවැත්වීමට අවශ්‍ය නම් අලුතෙන් Class එකක් Schedule කිරීමට සිදුවේ.",
    alertCancelSuccess: "🗑️ පන්තිය සාර්ථකව අවලංගු (Cancel) කරන ලදී.",
    alertCancelError: "❌ පන්තිය අවලංගු කිරීමට නොහැකි විය.",
    alertCopySuccess: "📝 පන්තියේ විස්තර Clipboard එකට Copy කරගන්න ලදී.",
    alertCopyVideoSuccess: "🎬 පටිගත කිරීමේ සබැඳිය (Video Link) සාර්ථකව Copy කරගන්න ලදී."
  },
  en: {
    welcome: "Welcome",
    subHeader: "Digimart LMS Management Portal",
    signOut: "Sign Out",
    supportBtn: "Support",
    homeTab: "Home",
    scheduleTab: "Schedule Class",
    plannedTab: "Scheduled Classes",
    recordingsTab: "Recordings",
    plannedCount: "Scheduled Classes",
    recordingsCount: "Recordings",
    accStatus: "Account Status",
    activeAcc: "● Active Account",
    maxHostsLabel: "Max Concurrent Hosts",
    announcements: "Digimart Special Announcements & Offers",
    ad1Badge: "Special Offer",
    ad1Title: "🚀 Zoom 300 / 500 Participants Package Upgrade!",
    ad1Desc: "Has your student count increased? Easily upgrade to 300 or 500 capacity Zoom Pro Packages via Digimart LMS today.",
    ad1Support: "24/7 Live Support Available",
    ad1Btn: "💬 Contact Support",
    ad2Badge: "New Feature",
    ad2Title: "🌐 Want your own custom LMS Website?",
    ad2Desc: "Get your branded LMS Web Platform in minutes with Automated Card Payments, Student Attendance Tracking & Cloud Storage.",
    ad2Brand: "Digimart Smart LMS",
    ad2Btn: "✨ Learn More",
    scheduleAsk: "Need to schedule a new class?",
    scheduleSub: "Create a Zoom Meeting in just a few seconds.",
    scheduleNowBtn: "➕ Schedule New Class Now",
    createClassTitle: "Schedule a New Class",
    topicLabel: "Class Topic",
    topicPlaceholder: "Enter class topic",
    dateLabel: "Date",
    timeLabel: "Time",
    durationHoursLabel: "Duration (Hours)",
    durationMinutesLabel: "Duration (Minutes)",
    passcodeLabel: "Passcode",
    passcodePlaceholder: "Auto (Leave blank for auto passcode)",
    waitingRoom: "Waiting Room",
    hostVideo: "Host Video",
    participantVideo: "Participant Video",
    muteOnEntry: "Mute on Entry",
    autoRecordingLabel: "🎙️ Auto Recording Options",
    createBtn: "▶️ Create Zoom Class",
    creatingBtn: "⚙️ Creating Class...",
    plannedClassesTitle: "Scheduled Classes",
    noPlannedClasses: "👋 No classes scheduled for you yet.",
    scheduleFirstBtn: "➕ Schedule First Class",
    startClassBtn: "▶️ Start Class",
    copyDetailsBtn: "📋 Copy Details",
    cancelClassBtn: "❌ Cancel Class",
    recordingsTitle: "Your Class Recordings",
    cloudNote: "(Cloudflare R2 Storage)",
    noRecordings: "No class recordings found.",
    colDate: "DATE",
    colTitle: "CLASS TITLE",
    colAction: "ACTION",
    copyLinkBtn: "📋 Copy Link",
    daysLeftText: "{days} Days Left",
    expiredText: "❌ Account Expired",

    alertSuccessCreate: "📹 Zoom class scheduled and saved successfully.",
    alertHostLimitError: "🚫 Your account currently has a Single Host Package.\n\nTherefore, you can only run one meeting at a time.\n\nPlease contact Digimart Support to activate a Dual Host or higher package.",
    whatsappConfirm: "👉 Would you like to contact Digimart Support via WhatsApp now?",
    alertAllBusyError: "ERR_ALL_BUSY: No free Zoom Accounts available for the selected time slot.",
    alertGeneralError: "🚫 Unable to schedule class. Please verify the date and time.",
    alertServerError: "⚠️ Server connection error. Please try again.",
    alertCancelConfirm: "⚠️ Are you sure you want to cancel this class?\n\n• The Zoom Link and Passcode for this class will become permanently invalid.\n• Students will no longer be able to join this class.\n• You will need to schedule a new class if you wish to host it later.",
    alertCancelSuccess: "🗑️ Class canceled successfully.",
    alertCancelError: "❌ Failed to cancel class.",
    alertCopySuccess: "📝 Class details copied to Clipboard.",
    alertCopyVideoSuccess: "🎬 Video Recording link copied to Clipboard."
  },
  ta: {
    welcome: "வணக்கம்",
    subHeader: "Digimart LMS மேலாண்மை போர்டல்",
    signOut: "வெளியேறு",
    supportBtn: "உதவி",
    homeTab: "முகப்பு",
    scheduleTab: "வகுப்பு அட்டவணை",
    plannedTab: "திட்டமிடப்பட்ட வகுப்புகள்",
    recordingsTab: "பதிவுகள்",
    plannedCount: "திட்டமிடப்பட்ட வகுப்புகள்",
    recordingsCount: "பதிவுகள்",
    accStatus: "கணக்கு நிலை",
    activeAcc: "● செயலில் உள்ள கணக்கு",
    maxHostsLabel: "சமகால வகுப்பு வரம்பு",
    announcements: "Digimart சிறப்பு அறிவிப்புகள் & சலுகைகள்",
    ad1Badge: "சிறப்பு சலுகை",
    ad1Title: "🚀 Zoom 300 / 500 பங்கேற்பாளர்கள் பேக்கேஜ் அப் கிரேட்!",
    ad1Desc: "உங்கள் மாணவர் எண்ணிக்கை அதிகரித்துள்ளதா? Digimart LMS மூலம் 300 அல்லது 500 கொள்ளளவு கொண்ட Zoom Pro பேக்கேஜ்களை இன்றே பெறுங்கள்.",
    ad1Support: "24/7 நேரலை உதவி கிடைக்கும்",
    ad1Btn: "💬 தொடர்புகொள்ளவும்",
    ad2Badge: "புதிய அம்சம்",
    ad2Title: "🌐 சொந்தமாக LMS இணையதளம் உருவாக்க வேண்டுமா?",
    ad2Desc: "தானியங்கி அட்டை கொடுப்பனவுகள், மாணவர் வருகை கண்காணிப்பு மற்றும் வீடியோ சேமிப்பகத்துடன் உங்கள் பிராண்டட் LMS பிளாட்ஃபார்மைப் பெறுங்கள்.",
    ad2Brand: "Digimart Smart LMS",
    ad2Btn: "✨ மேலும் அறிய",
    scheduleAsk: "புதிய வகுப்பை திட்டமிட வேண்டுமா?",
    scheduleSub: "சில வினாடிகளில் Zoom கூட்டத்தை உருவாக்கவும்.",
    scheduleNowBtn: "➕ புதிய வகுப்பை திட்டமிடுங்கள்",
    createClassTitle: "புதிய வகுப்பை திட்டமிடுங்கள்",
    topicLabel: "வகுப்பு தலைப்பு",
    topicPlaceholder: "வகுப்பு தலைப்பை உள்ளிடவும்",
    dateLabel: "தேதி",
    timeLabel: "நேரம்",
    durationHoursLabel: "கால அளவு (மணி)",
    durationMinutesLabel: "கால அளவு (நிமிடங்கள்)",
    passcodeLabel: "கடவுச்சொல்",
    passcodePlaceholder: "Auto (தானாக உருவாக்க காலியாக விடவும்)",
    waitingRoom: "காத்திருப்பு அறை",
    hostVideo: "தொகுப்பாளர் வீடியோ",
    participantVideo: "பங்கேற்பாளர் வீடியோ",
    muteOnEntry: "நுழையும் போது முடக்கு",
    autoRecordingLabel: "🎙️ Auto Recording Options",
    createBtn: "▶️ Zoom வகுப்பை உருவாக்கு",
    creatingBtn: "⚙️ உருவாக்கப்படுகிறது...",
    plannedClassesTitle: "திட்டமிடப்பட்ட வகுப்புகள்",
    noPlannedClasses: "👋 உங்களுக்கு இன்னும் வகுப்புகள் எதுவும் திட்டமிடப்படவில்லை.",
    scheduleFirstBtn: "➕ முதல் வகுப்பை திட்டமிடுங்கள்",
    startClassBtn: "▶️ வகுப்பைத் தொடங்கு",
    copyDetailsBtn: "📋 விவரங்களை நகலெடு",
    cancelClassBtn: "❌ வகுப்பை ரத்து செய்",
    recordingsTitle: "உங்கள் வகுப்பு பதிவுகள்",
    cloudNote: "(Cloudflare R2 Storage)",
    noRecordings: "வகுப்பு பதிவுகள் எதுவும் கிடைக்கவில்லை.",
    colDate: "தேதி",
    colTitle: "வகுப்பு தலைப்பு",
    colAction: "செயல்பாடு",
    copyLinkBtn: "📋 லிங்கை நகலெடு",
    daysLeftText: "{days} நாட்கள் மீதமுள்ளன",
    expiredText: "❌ கணக்கு காலாவதியானது",

    alertSuccessCreate: "📹 Zoom வகுப்பு வெற்றிகரமாக திட்டமிடப்பட்டு சேமிக்கப்பட்டது.",
    alertHostLimitError: "🚫 உங்கள் கணக்கில் தற்போது Single Host Package மட்டுமே உள்ளது.\n\nஎனவே உங்களால் ஒரே நேரத்தில் ஒரு கூட்டத்தை மட்டுமே நடத்த முடியும்.\n\nPlease contact Digimart Support to activate a Dual Host or higher package.",
    whatsappConfirm: "👉 இப்போது WhatsApp மூலம் Digimart Support-ஐ தொடர்பு கொள்ள விரும்புகிறீர்களா?",
    alertAllBusyError: "ERR_ALL_BUSY: தேர்ந்தெடுக்கப்பட்ட நேரத்தில் இலவச Zoom கணக்குகள் எதுவும் கிடைக்கவில்லை.",
    alertGeneralError: "🚫 வகுப்பை திட்டமிட முடியவில்லை. நேரத்தை மீண்டும் சரிபார்க்கவும்.",
    alertServerError: "⚠️ சர்வர் இணைப்பு பிழை. மீண்டும் முயற்சிக்கவும்.",
    alertCancelConfirm: "⚠️ இந்த வகுப்பை ரத்து செய்ய விரும்புகிறீர்களா?\n\n• இந்த Zoom இணைப்பு மற்றும் கடவுச்சொல் நிரந்தரமாக செல்லுபடியாகாது.\n• மாணவர்கள் இந்த வகுப்பில் இனி இணைய முடியாது.\n• மீண்டும் வகுப்பை நடத்த விரும்பினால் புதிய வகுப்பை திட்டமிட வேண்டும்.",
    alertCancelSuccess: "🗑️ வகுப்பு வெற்றிகரமாக ரத்து செய்யப்பட்டது.",
    alertCancelError: "❌ வகுப்பை ரத்து செய்ய முடியவில்லை.",
    alertCopySuccess: "📝 வகுப்பு விவரங்கள் நகலெடுக்கப்பட்டன.",
    alertCopyVideoSuccess: "🎬 பதிவு செய்யப்பட்ட வீடியோ லிங்க் நகலெடுக்கப்பட்டது."
  }
};

export default function DashboardPage() {
  const router = useRouter();
  
  const [lang, setLang] = useState<"si" | "en" | "ta">("si");
  const [activeTab, setActiveTab] = useState<"home" | "schedule" | "planned" | "recordings">("home");

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

  useEffect(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    setDate(`${yyyy}-${mm}-${dd}`);

    let hours = today.getHours();
    const mins = today.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;

    let roundedMins = "00";
    if (mins >= 45) roundedMins = "45";
    else if (mins >= 30) roundedMins = "30";
    else if (mins >= 15) roundedMins = "15";

    setSelectedHour(String(hours).padStart(2, "0"));
    setSelectedMinute(roundedMins);
    setSelectedAmPm(ampm);

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

  const getMeetingPasscode = (item: Meeting) => {
    return item.passcode || item.password || item.pass || "123456";
  };

  const getMeetingTime = (item: any) => {
    if (item.time) return item.time;
    if (item.startTime) return item.startTime;
    if (item.start_time) return item.start_time;
    if (item["Start Time"]) {
      const match = item["Start Time"].match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i);
      if (match) return match[1];
    }
    return "12:00 PM";
  };

  const getMeetingJoinUrl = (item: Meeting) => {
    if (item.join_url) return item.join_url;
    if (item.start_url) return item.start_url;
    if (item.zoom_id) {
      const cleanId = item.zoom_id.toString().replace(/\D/g, "");
      return `https://us06web.zoom.us/j/${cleanId}`;
    }
    return "";
  };

  const parseDateTimeToTimestamp = (item: Meeting) => {
    const dateStr = item.date || (item as any)["Start Time"]?.split(" ")[0];
    const timeStr = getMeetingTime(item);

    if (!dateStr) return 0;

    let hours = 0;
    let minutes = 0;

    if (timeStr) {
      const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (match) {
        hours = parseInt(match[1], 10);
        minutes = parseInt(match[2], 10);
        const period = match[3]?.toUpperCase();

        if (period === "PM" && hours < 12) hours += 12;
        if (period === "AM" && hours === 12) hours = 0;
      }
    }

    const parts = dateStr.split("-").map((num: string) => parseInt(num, 10));
    if (parts.length === 3 && !isNaN(parts[0])) {
      return new Date(parts[0], parts[1] - 1, parts[2], hours, minutes).getTime();
    }

    return 0;
  };

  const formatDuration = (rawDuration: any) => {
    if (!rawDuration) return "0 Min";

    const digitsOnly = String(rawDuration).replace(/[^0-9]/g, "");
    const totalMinutes = parseInt(digitsOnly, 10);

    if (isNaN(totalMinutes) || totalMinutes <= 0) return "0 Min";

    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    if (hrs > 0 && mins > 0) {
      return `${hrs} ${hrs > 1 ? "Hrs" : "Hr"} ${mins} Min`;
    } else if (hrs > 0) {
      return `${hrs} ${hrs > 1 ? "Hrs" : "Hr"}`;
    } else {
      return `${mins} Min`;
    }
  };

  const formatMeetingId = (id?: string) => {
    if (!id) return "Loading...";
    const clean = id.toString().replace(/\D/g, "");
    if (clean.length === 11) {
      return `${clean.slice(0, 3)} ${clean.slice(3, 7)} ${clean.slice(7)}`;
    } else if (clean.length === 10) {
      return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
    }
    return id;
  };

  const handleStartClass = (item: Meeting) => {
    const startTimeMs = parseDateTimeToTimestamp(item);
    const durationMin = parseInt(String(item.duration || "120").replace(/\D/g, ""), 10) || 120;
    
    const endTimeMs = startTimeMs + (durationMin * 60 * 1000);
    const nowMs = Date.now();
    const ONE_HOUR_MS = 60 * 60 * 1000;

    const earliestAllowed = startTimeMs - ONE_HOUR_MS; 
    const latestAllowed = endTimeMs;                   

    if (nowMs < earliestAllowed) {
      alert("⏰ මෙම පන්තිය ආරම්භ කිරීමට තවමත් වේලාව පැමිණ නැත.\n\nපන්තිය ආරම්භ කළ හැක්කේ නියමිත වේලාවට පැයකට පෙර සිට පමණි.");
      return;
    }

    if (nowMs > latestAllowed) {
      alert("🚫 මෙම පන්තියේ සක්‍රීය කාල රාමුව (Time Frame) ඉක්මවා ඇත (Expired Class).\n\nවෙන් කළ කාලය අවසන් වී ඇති බැවින් මෙම පන්තිය ආරම්භ කළ නොහැක. කරුණාකර අලුතෙන් Class එකක් Schedule කරගන්න.");
      return;
    }

    const cleanZoomId = item.zoom_id ? item.zoom_id.toString().replace(/\D/g, "") : item.meeting_id_row;
    const startUrl = `https://n8n.epanthiya.com/webhook/start-zoom-class?meeting_id=${cleanZoomId}`;
    window.open(startUrl, "_blank");
  };

  const fetchTeacherData = async (id: string) => {
    try {
      const response = await fetch(`/api/teacher/data?teacher_id=${id}&t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });

      if (response.ok) {
        const data = await response.json();

        const rawClasses: Meeting[] = data.plannedClasses || [];
        const nowMs = Date.now();
        const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

        const activeScheduledClasses = rawClasses.filter((item) => {
          const startTimeMs = parseDateTimeToTimestamp(item);
          const durationMin = parseInt(String(item.duration || "120").replace(/\D/g, ""), 10) || 120;
          const endTimeMs = startTimeMs + (durationMin * 60 * 1000);

          const recordingUrl = (item as any)["Recording URL"] || (item as any).recording_url || "";
          const hasRecording = String(recordingUrl).trim() !== "";

          // 🎯 FIXED: Recording එකක් ආවත්, පන්තියට වෙන් කළ කාලය (Time window) තවම ඉවර නැත්නම් (e.g. මැදදී signal ගිහින් cut වුණා නම්) Schedule එක hide වන්නේ නැත. කාලය සම්පූර්ණයෙන්ම ඉවර නම් පමණක් hide වේ.
          if (hasRecording && nowMs > endTimeMs) return false;

          if (nowMs > (endTimeMs + TWELVE_HOURS_MS)) return false;

          return true;
        });

        const sortedClasses = activeScheduledClasses.sort((a, b) => {
          const timeA = parseDateTimeToTimestamp(a);
          const timeB = parseDateTimeToTimestamp(b);
          return timeA - timeB;
        });

        setPlannedClasses(sortedClasses);
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

        if (data.maxConcurrentHosts || data.max_concurrent_hosts || data.maxHosts) {
          setMaxConcurrentHosts(data.maxConcurrentHosts || data.max_concurrent_hosts || data.maxHosts);
        }

        if (data.expiryDate || data.expiry_date || data.paymentDate || data.daysRemaining) {
          if (data.daysRemaining !== undefined) {
            setRemainingDays(Number(data.daysRemaining));
          } else {
            const expStr = data.expiryDate || data.expiry_date;
            if (expStr) {
              const expDate = new Date(expStr);
              const today = new Date();
              const diffTime = expDate.getTime() - today.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              setRemainingDays(diffDays);
            }
          }
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

    const hoursNum = parseInt(durationHours.replace(/[^0-9]/g, ""), 10) || 0;
    const minsNum = parseInt(durationMinutes.replace(/[^0-9]/g, ""), 10) || 0;
    const totalDurationInMinutes = (hoursNum * 60) + minsNum;

    const cleanPasscode = passcode.trim();
    const finalPasscode = (!cleanPasscode || cleanPasscode.toLowerCase() === "auto")
      ? Math.floor(100000 + Math.random() * 900000).toString()
      : cleanPasscode;

    try {
      const response = await fetch("https://n8n.epanthiya.com/webhook/create-zoom-class-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacher_id: teacherId,
          topic,
          date,
          time: formattedTime,
          durationHours: hoursNum.toString(), 
          durationMinutes: minsNum.toString(),
          duration: totalDurationInMinutes.toString(),
          passcode: finalPasscode,
          waiting_room: waitingRoom,
          host_video: hostVideo,
          participant_video: participantVideo,
          mute_upon_entry: muteOnEntry,
          auto_recording: autoRecording
        })
      });

      let data: any = {};
      try { data = await response.json(); } catch (e) { data = {}; }

      if (response.ok && data.status === "success") {
        alert(t.alertSuccessCreate);
        setTopic("");
        setPasscode("Auto");
        setAutoRecording("none");
        fetchTeacherData(teacherId);
        setActiveTab("planned");
      } else {
        const waMessage = encodeURIComponent(`Hi Digimart! මම (Teacher ID: ${teacherId}, Name: ${teacherName}) මගේ Zoom Package එක Dual Host හෝ ඊට වැඩි එකකට Upgrade කරගන්න කැමතියි. විස්තර ලබා දෙන්න.`);
        const waUrl = `https://wa.me/94750204252?text=${waMessage}`;

        const goToWhatsApp = confirm(`${t.alertHostLimitError}\n\n${t.whatsappConfirm}`);
        
        if (goToWhatsApp) {
          window.open(waUrl, "_blank");
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
    localStorage.removeItem("teacher_name");
    localStorage.removeItem("teacher_id");
    localStorage.removeItem("teacher_pic");
    localStorage.removeItem("profile_pic");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b19] flex items-center justify-center text-white font-sans p-4">
        <p className="text-sm animate-pulse flex items-center gap-2">⚙️ Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b19] text-white font-sans p-3 sm:p-4 md:p-6 selection:bg-blue-600/30">
      <div className="max-w-[1400px] mx-auto space-y-5 sm:space-y-6">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center border-b border-slate-900 pb-4 md:pb-5 gap-4">
          <div className="flex items-center gap-3 sm:gap-4 w-full lg:w-auto">
            {teacherPic ? (
              <img 
                src={teacherPic} 
                alt={teacherName} 
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl object-cover border-2 border-blue-500/50 shadow-lg shadow-blue-500/10 flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 border-2 border-blue-400/30 flex items-center justify-center text-base sm:text-lg font-black text-white shadow-lg flex-shrink-0">
                {teacherName.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-200 truncate">
                {t.welcome}, {teacherName}! 👋
              </h1>
              <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5 truncate">{t.subHeader}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-start lg:justify-end text-xs">
            <span className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-xl font-mono text-blue-400 font-bold text-[11px] sm:text-xs">
              ID: {teacherId}
            </span>

            <span className="px-2.5 py-1.5 bg-purple-950/50 border border-purple-800/40 rounded-xl font-mono text-purple-300 font-bold flex items-center gap-1 text-[11px] sm:text-xs">
              <span>⚡ Max Hosts:</span>
              <span className="bg-purple-600 text-white px-1.5 py-0.5 rounded text-[10px]">{maxConcurrentHosts}</span>
            </span>

            <a 
              href={`https://wa.me/94750204252?text=${encodeURIComponent(`Hi Digimart! මම (Teacher ID: ${teacherId}, Name: ${teacherName}) Digimart LMS Portal එක සම්බන්ධයෙන් සහය ලබා ගැනීමට අවශ්‍යයි.`)}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 bg-emerald-950/70 hover:bg-emerald-900/90 border border-emerald-700/50 text-emerald-400 font-bold rounded-xl transition-all flex items-center gap-1 shadow-md cursor-pointer text-[11px] sm:text-xs"
            >
              <span>💬</span>
              <span>{t.supportBtn}</span>
            </a>

            <select 
              value={lang}
              onChange={(e) => handleLangChange(e.target.value as "si" | "en" | "ta")}
              className="bg-slate-900 border border-slate-800 text-blue-400 font-bold px-2 py-1.5 rounded-xl focus:outline-none cursor-pointer text-[11px] sm:text-xs"
            >
              <option value="si">🇱🇰 සිංහල</option>
              <option value="en">🇬🇧 English</option>
              <option value="ta">🇱🇰 தமிழ்</option>
            </select>

            <button 
              onClick={handleLogout}
              className="px-2.5 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/40 text-rose-400 font-bold rounded-xl transition-all text-[11px] sm:text-xs ml-auto lg:ml-0 cursor-pointer"
            >
              {t.signOut}
            </button>
          </div>
        </div>

        {/* TABS NAVIGATION HEADER */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-900 scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0">
          <button
            onClick={() => setActiveTab("home")}
            className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === "home" 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                : "bg-slate-900/60 text-gray-400 hover:bg-slate-900 hover:text-white border border-slate-800"
            }`}
          >
            <span>🏠</span> {t.homeTab}
          </button>

          <button
            onClick={() => setActiveTab("schedule")}
            className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === "schedule" 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                : "bg-slate-900/60 text-gray-400 hover:bg-slate-900 hover:text-white border border-slate-800"
            }`}
          >
            <span>➕</span> {t.scheduleTab}
          </button>

          <button
            onClick={() => setActiveTab("planned")}
            className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap relative cursor-pointer ${
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
            className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap relative cursor-pointer ${
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

        {/* TAB 1: HOME */}
        {activeTab === "home" && (
          <div className="space-y-5 sm:space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-[#0b132b] border border-slate-900 p-4 sm:p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-medium">{t.plannedCount}</p>
                  <h3 className="text-xl sm:text-2xl font-black text-blue-400 mt-1">{plannedClasses.length}</h3>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-950/60 border border-blue-900/40 rounded-xl flex items-center justify-center text-lg sm:text-xl">📅</div>
              </div>

              <div className="bg-[#0b132b] border border-slate-900 p-4 sm:p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-medium">{t.recordingsCount}</p>
                  <h3 className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">{recordings.length}</h3>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-950/60 border border-emerald-900/40 rounded-xl flex items-center justify-center text-lg sm:text-xl">🎬</div>
              </div>

              <div className="bg-[#0b132b] border border-slate-900 p-4 sm:p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-medium">{t.maxHostsLabel}</p>
                  <h3 className="text-xl sm:text-2xl font-black text-purple-400 mt-1">{maxConcurrentHosts} Host(s)</h3>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-950/60 border border-purple-900/40 rounded-xl flex items-center justify-center text-lg sm:text-xl">⚡</div>
              </div>

              <div className="bg-[#0b132b] border border-slate-900 p-4 sm:p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-medium">{t.accStatus}</p>
                  
                  {remainingDays === null ? (
                    <h3 className="text-sm sm:text-base font-bold text-emerald-400 mt-1">{t.activeAcc}</h3>
                  ) : remainingDays > 5 ? (
                    <h3 className="text-sm sm:text-base font-bold text-emerald-400 mt-1">
                      ● {t.daysLeftText.replace("{days}", remainingDays.toString())}
                    </h3>
                  ) : remainingDays > 0 ? (
                    <h3 className="text-sm sm:text-base font-bold text-amber-400 mt-1 animate-pulse">
                      ⚠️ {t.daysLeftText.replace("{days}", remainingDays.toString())}
                    </h3>
                  ) : (
                    <h3 className="text-sm sm:text-base font-bold text-rose-500 mt-1">
                      {t.expiredText}
                    </h3>
                  )}
                </div>

                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-lg sm:text-xl">
                  {remainingDays === null || remainingDays > 5 ? "✅" : remainingDays > 0 ? "⏳" : "❌"}
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-1 sm:pt-2">
              <h2 className="text-xs sm:text-sm font-bold text-gray-300 flex items-center gap-2">
                <span>📢</span> {t.announcements}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-gradient-to-br from-blue-950/50 via-[#0b132b] to-indigo-950/40 border border-blue-800/40 p-5 sm:p-6 rounded-2xl relative overflow-hidden group shadow-xl flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="inline-block bg-blue-600 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider text-white">
                      {t.ad1Badge}
                    </div>
                    <h3 className="text-sm sm:text-base font-black text-blue-300">{t.ad1Title}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {t.ad1Desc}
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-900/60">
                    <span className="text-xs font-mono text-emerald-400 font-bold">{t.ad1Support}</span>
                    <a 
                      href="https://wa.me/94750204252?text=Hi%20Digimart!%20මම%20Zoom%20Package%20එකක්%20Upgrade%20කරගන්න%20විස්තර%20දැනගන්න%20කැමතියි." 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5"
                    >
                      {t.ad1Btn}
                    </a>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-950/40 via-[#0b132b] to-slate-900 border border-purple-800/30 p-5 sm:p-6 rounded-2xl relative overflow-hidden group shadow-xl flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="inline-block bg-purple-600 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider text-white">
                      {t.ad2Badge}
                    </div>
                    <h3 className="text-sm sm:text-base font-black text-purple-300">{t.ad2Title}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {t.ad2Desc}
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-900/60">
                    <span className="text-xs font-mono text-purple-400 font-bold">{t.ad2Brand}</span>
                    <a 
                      href="https://wa.me/94750204252?text=Hi%20Digimart!%20මම%20LMS%20Website%20එකක්%20හදාගන්න%20විස්තර%20දැනගන්න%20කැමතියි." 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5"
                    >
                      {t.ad2Btn}
                    </a>
                  </div>
                </div>

              </div>
            </div>

            <div className="p-4 sm:p-6 bg-[#0b132b] border border-slate-900 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-200">{t.scheduleAsk}</h4>
                <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">{t.scheduleSub}</p>
              </div>
              <button 
                onClick={() => setActiveTab("schedule")}
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-blue-600/20 text-center cursor-pointer"
              >
                {t.scheduleNowBtn}
              </button>
            </div>

          </div>
        )}

        {/* TAB 2: SCHEDULE CLASS FORM */}
        {activeTab === "schedule" && (
          <div className="max-w-2xl mx-auto bg-[#0b132b] border border-slate-900 p-4 sm:p-6 rounded-2xl shadow-xl space-y-4 sm:space-y-5 animate-fadeIn">
            <h2 className="text-sm sm:text-base font-bold text-blue-400 flex items-center gap-2 border-b border-slate-900 pb-3">
              <span>🚀</span> {t.createClassTitle}
            </h2>
            
            <form onSubmit={handleCreateClass} className="space-y-3.5 sm:space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">{t.topicLabel}</label>
                <input 
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={t.topicPlaceholder}
                  className="w-full p-2.5 sm:p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">{t.dateLabel}</label>
                  <input 
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2.5 sm:p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 color-scheme-dark"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">{t.timeLabel}</label>
                  <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
                    <select 
                      value={selectedHour} 
                      onChange={(e) => setSelectedHour(e.target.value)}
                      className="p-2.5 sm:p-3 bg-slate-900/90 border border-slate-800 rounded-l-xl text-xs text-center focus:outline-none cursor-pointer"
                    >
                      {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                    
                    <select 
                      value={selectedMinute} 
                      onChange={(e) => setSelectedMinute(e.target.value)}
                      className="p-2.5 sm:p-3 bg-slate-900/90 border-y border-slate-800 text-xs text-center focus:outline-none cursor-pointer"
                    >
                      {["00", "15", "30", "45"].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>

                    <select 
                      value={selectedAmPm} 
                      onChange={(e) => setSelectedAmPm(e.target.value)}
                      className="p-2.5 sm:p-3 bg-slate-900/90 border border-slate-800 rounded-r-xl text-xs text-center font-bold text-blue-400 focus:outline-none cursor-pointer"
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">{t.durationHoursLabel}</label>
                  <select 
                    value={durationHours}
                    onChange={(e) => setDurationHours(e.target.value)}
                    className="w-full p-2.5 sm:p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs focus:outline-none cursor-pointer"
                  >
                    {Array.from({ length: 13 }, (_, i) => String(i).padStart(2, "0")).map(h => (
                      <option key={h} value={`${h} ${parseInt(h) === 1 ? 'Hr' : 'Hrs'}`}>{h} {parseInt(h) === 1 ? 'Hr' : 'Hrs'}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">{t.durationMinutesLabel}</label>
                  <select 
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full p-2.5 sm:p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs focus:outline-none cursor-pointer"
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
                  placeholder={t.passcodePlaceholder}
                  className="w-full p-2.5 sm:p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-colors font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  {t.autoRecordingLabel}
                </label>
                <select 
                  value={autoRecording}
                  onChange={(e) => setAutoRecording(e.target.value as "none" | "cloud" | "local")}
                  className="w-full p-2.5 sm:p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-blue-400 font-bold focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="none">❌ Disable Auto Recording (Default)</option>
                  <option value="cloud">☁️ Cloud Recording (Save on Zoom Cloud)</option>
                  <option value="local">💻 Local Recording (Save on Computer)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-900">
                <label className="flex items-center gap-2.5 text-xs text-gray-300 cursor-pointer select-none">
                  <input type="checkbox" checked={waitingRoom} onChange={(e) => setWaitingRoom(e.target.checked)} className="w-4 h-4 rounded bg-slate-900 accent-blue-600" />
                  <span>{t.waitingRoom}</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs text-gray-300 cursor-pointer select-none">
                  <input type="checkbox" checked={hostVideo} onChange={(e) => setHostVideo(e.target.checked)} className="w-4 h-4 rounded bg-slate-900 accent-blue-600" />
                  <span>{t.hostVideo}</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs text-gray-300 cursor-pointer select-none">
                  <input type="checkbox" checked={participantVideo} onChange={(e) => setParticipantVideo(e.target.checked)} className="w-4 h-4 rounded bg-slate-900 accent-blue-600" />
                  <span>{t.participantVideo}</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs text-gray-300 cursor-pointer select-none">
                  <input type="checkbox" checked={muteOnEntry} onChange={(e) => setMuteOnEntry(e.target.checked)} className="w-4 h-4 rounded bg-slate-900 accent-blue-600" />
                  <span>{t.muteOnEntry}</span>
                </label>
              </div>

              <button 
                type="submit"
                disabled={formLoading}
                className="w-full py-3 sm:py-3.5 mt-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 rounded-xl text-xs font-bold tracking-wide transition-all shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 cursor-pointer"
              >
                {formLoading ? t.creatingBtn : t.createBtn}
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: SCHEDULED CLASSES */}
        {activeTab === "planned" && (
          <div className="space-y-4 animate-fadeIn">
            <h2 className="text-xs sm:text-sm font-bold tracking-wide text-gray-300 flex items-center justify-between">
              <span className="flex items-center gap-2">📅 {t.plannedClassesTitle}</span>
              <span className="bg-slate-900 text-blue-400 text-xs px-2.5 py-1 rounded-full border border-slate-800 font-bold">{plannedClasses.length} Classes</span>
            </h2>
            
            {plannedClasses.length === 0 ? (
              <div className="p-8 sm:p-12 border border-dashed border-slate-800 rounded-2xl text-center text-gray-500 text-xs">
                <p>{t.noPlannedClasses}</p>
                <button 
                  onClick={() => setActiveTab("schedule")}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  {t.scheduleFirstBtn}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                {plannedClasses.map((item, idx) => {
                  const pass = getMeetingPasscode(item);
                  const classTime = getMeetingTime(item);
                  const joinUrl = getMeetingJoinUrl(item);

                  const rawStatus = String(
                    item.status || 
                    (item as any).Status || 
                    ""
                  ).trim().toUpperCase();

                  const isClassEnded = rawStatus === "ENDED";

                  const startTimeMs = parseDateTimeToTimestamp(item);
                  const durationMin = parseInt(String(item.duration || "120").replace(/\D/g, ""), 10) || 120;
                  const endTimeMs = startTimeMs + (durationMin * 60 * 1000);
                  const nowMs = Date.now();
                  const isTimeExpired = nowMs > endTimeMs;

                  return (
                    <div key={idx} className="bg-[#0b132b]/60 border border-slate-900 p-4 sm:p-5 rounded-2xl space-y-3.5 shadow-sm relative hover:border-slate-800 transition-colors flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-blue-950 text-blue-400 font-bold px-2 py-0.5 rounded border border-blue-900/30">
                              {item.date || (item as any)["Start Time"]?.split(" ")[0]}
                            </span>
                            
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              rawStatus === "STARTED" ? "bg-emerald-950/80 text-emerald-400 border-emerald-800/50" :
                              rawStatus === "SCHEDULED" ? "bg-blue-950/80 text-blue-400 border-blue-900/50" :
                              "bg-amber-950/80 text-amber-400 border-amber-800/50"
                            }`}>
                              {rawStatus}
                            </span>
                          </div>
                          
                          <span className="text-[10px] text-gray-300 flex items-center gap-1 font-bold">
                            ⏳ {formatDuration(item.duration)}
                          </span>
                        </div>

                        <h3 className="text-xs font-bold tracking-wide text-slate-200 line-clamp-2">{item.topic}</h3>
                        
                        <div className="bg-slate-950/70 border border-slate-900/60 p-2.5 sm:p-3 rounded-xl space-y-1 font-mono text-[11px] text-slate-400">
                          <p>⏰ Time: {classTime}</p>
                          <p>🆔 ID: {formatMeetingId(item.zoom_id)}</p>
                          <p>🔑 Pass: {pass}</p>
                          <p className="text-[10px] text-blue-400 font-bold">⚙️ Acc: {item.zoom_account_id || "Pool Acc"}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 pt-1">
                        {isClassEnded ? (
                          <div className="w-full py-2.5 bg-amber-950/40 border border-amber-800/50 text-amber-400 text-[11px] font-bold rounded-xl text-center select-none flex items-center justify-center gap-1.5 shadow-inner">
                            <span>⏳</span>
                            <span>Class Ended / Recording Processing...</span>
                          </div>
                        ) : rawStatus === "STARTED" && isTimeExpired ? (
                          <div className="space-y-2">
                            <div className="w-full py-2.5 bg-blue-950/40 border border-blue-800/50 text-blue-400 text-[11px] font-bold rounded-xl text-center select-none flex items-center justify-center gap-1.5 shadow-inner">
                              <span>⚙️</span>
                              <span>Processing Recording...</span>
                            </div>
                            <button 
                              onClick={() => {
                                const warningMsg = `⚠️ පන්තිය ඉවත් කිරීමට (Delete Schedule) පෙර කරුණාකර අවධානය යොමු කරන්න:\n\n` +
                                                   `• මෙම පන්තිය සඳහා Cloud Recording එකක් පද්ධතියට ලැබෙන්නේ නැත (Recording එකක් එන්නේ නැත).\n` +
                                                   `• Zoom Account Slot එක වහාම නිදහස් වන අතර නැවත මෙම Link එක භාවිත කළ නොහැක.\n\n` +
                                                   `ඔබට මෙය අනිවාර්යයෙන්ම Delete කිරීමට අවශ්‍යද?`;
                                if (confirm(warningMsg)) {
                                  handleCancelClass(item.meeting_id_row, item.zoom_id);
                                }
                              }}
                              className="w-full py-1.5 bg-rose-950/30 hover:bg-rose-900/50 border border-rose-900/40 text-rose-400 text-[10px] font-bold rounded-xl transition-all text-center cursor-pointer"
                            >
                              🗑️ Delete Schedule
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <button 
                                onClick={() => handleStartClass(item)}
                                className="py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-[10px] font-bold transition-colors text-center block text-white w-full cursor-pointer"
                              >
                                {t.startClassBtn}
                              </button>

                              <button 
                                onClick={() => {
                                  const formattedId = formatMeetingId(item.zoom_id);
                                  const details = `🎓 *${teacherName} is inviting you to a scheduled Zoom meeting.* ✨\n\n📌 *Topic:* ${item.topic}\n📅 *Date:* ${item.date || (item as any)["Start Time"]?.split(" ")[0]}\n⏰ *Time:* ${classTime}\n\n🔐 *Meeting ID:* ${formattedId}\n🔑 *Passcode:* ${pass}\n\n🌐 *Join Link:* ${joinUrl}`;
                                  navigator.clipboard.writeText(details);
                                  alert(t.alertCopySuccess);
                                }}
                                className="py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-bold transition-colors cursor-pointer"
                              >
                                {t.copyDetailsBtn}
                              </button>
                            </div>

                            {rawStatus === "STARTED" ? (
                              <button 
                                onClick={() => {
                                  const warningMsg = `⚠️ පන්තිය ඉවත් කිරීමට (Delete Schedule) පෙර කරුණාකර අවධානය යොමු කරන්න:\n\n` +
                                                     `• මෙම පන්තිය සඳහා Cloud Recording එකක් පද්ධතියට ලැබෙන්නේ නැත (Recording එකක් එන්නේ නැත).\n` +
                                                     `• Zoom Account Slot එක වහාම නිදහස් වන අතර නැවත මෙම Link එක භාවිත කළ නොහැක.\n\n` +
                                                     `ඔබට මෙය අනිවාර්යයෙන්ම Delete කිරීමට අවශ්‍යද?`;
                                  if (confirm(warningMsg)) {
                                    handleCancelClass(item.meeting_id_row, item.zoom_id);
                                  }
                                }}
                                className="w-full py-1.5 bg-rose-950/30 hover:bg-rose-900/50 border border-rose-900/40 text-rose-400 text-[10px] font-bold rounded-xl transition-all text-center cursor-pointer"
                              >
                                🗑️ Delete Schedule
                              </button>
                            ) : rawStatus === "SCHEDULED" && (
                              <button 
                                onClick={() => handleCancelClass(item.meeting_id_row, item.zoom_id)}
                                className="w-full py-1.5 bg-rose-950/30 hover:bg-rose-900/50 border border-rose-900/40 text-rose-400 text-[10px] font-bold rounded-xl transition-all text-center cursor-pointer"
                              >
                                {t.cancelClassBtn}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: RECORDINGS */}
        {activeTab === "recordings" && (
          <div className="space-y-4 animate-fadeIn">
            <h2 className="text-xs sm:text-sm font-bold tracking-wide text-gray-300 flex items-center justify-between">
              <span className="flex items-center gap-2">🎬 {t.recordingsTitle} <span className="hidden sm:inline text-xs font-normal text-gray-500">{t.cloudNote}</span></span>
              <span className="bg-slate-900 text-emerald-400 text-xs px-2.5 py-1 rounded-full border border-slate-800 font-bold">{recordings.length} Videos</span>
            </h2>
            
            {recordings.length === 0 ? (
              <div className="p-8 sm:p-12 border border-dashed border-slate-800 rounded-2xl text-center text-gray-500 text-xs">
                {t.noRecordings}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="block sm:hidden space-y-3">
                  {recordings.map((rec, idx) => (
                    <div key={idx} className="bg-[#0b132b]/60 border border-slate-900 p-4 rounded-2xl space-y-2.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono text-blue-400 bg-blue-950/50 px-2 py-0.5 rounded border border-blue-900/30">{rec.date}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-200">{rec.title}</h4>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(rec.link);
                          alert(t.alertCopyVideoSuccess);
                        }}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-[11px] transition-colors text-center cursor-pointer"
                      >
                        {t.copyLinkBtn}
                      </button>
                    </div>
                  ))}
                </div>

                <div className="hidden sm:block bg-[#0b132b]/40 border border-slate-900 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-900 bg-slate-950/50 text-gray-400 font-medium">
                        <th className="p-4 w-[25%]" suppressHydrationWarning>{t.colDate}</th>
                        <th className="p-4 w-[55%]">{t.colTitle}</th>
                        <th className="p-4 w-[20%] text-right">{t.colAction}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/60 text-slate-300">
                      {recordings.map((rec, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/30 transition-colors">
                          <td className="p-4 font-mono text-gray-400" suppressHydrationWarning>{rec.date}</td>
                          <td className="p-4 font-bold text-slate-200">{rec.title}</td>
                          <td className="p-4 text-right">
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(rec.link);
                                alert(t.alertCopyVideoSuccess);
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[10px] transition-colors cursor-pointer"
                            >
                              {t.copyLinkBtn}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}