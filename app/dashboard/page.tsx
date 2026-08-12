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

const translations = {
  si: {
    welcome: "ආයුබෝවන්", subHeader: "Digimart LMS Management Portal", signOut: "Sign Out", supportBtn: "Support", homeTab: "Home", scheduleTab: "Schedule Class", plannedTab: "Scheduled Classes", recordingsTab: "Recordings", plannedCount: "සැලසුම් කළ පන්ති", recordingsCount: "පටිගත කිරීම් (Recordings)", accStatus: "ගිණුමේ තත්ත්වය", activeAcc: "● Active Account", maxHostsLabel: "එකවර පැවැත්විය හැකි පන්ති", announcements: "Digimart විශේෂ නිවේදන සහ පිරිනැමීම්", ad1Badge: "Special Offer", ad1Title: "🚀 Zoom 300 / 500 Participants Package Upgrade!", ad1Desc: "ඔබගේ ශිෂ්‍ය සංඛ්‍යාව වැඩි වී තිබේද? කිසිදු බාධාවකින් තොරව 300 හෝ 500 ලිමිට් ඇති Zoom Pro Packages අදම Digimart LMS හරහා පහසුවෙන් ලබාගන්න.", ad1Support: "24/7 Live Support Available", ad1Btn: "💬 Contact Support", ad2Badge: "New Feature", ad2Title: "🌐 ඔබගේම LMS වෙබ් අඩවියක් සාදා ගනිමුද?", ad2Desc: "Automated Card Payments, Student Attendance Tracking සහ Class Video Cloud Storage සමඟින් ඔබගේ නමින්ම LMS Web Platform එකක් මිනිත්තු කිහිපයකින් ස්ථාපනය කරගන්න.", ad2Brand: "Digimart Smart LMS", ad2Btn: "✨ වැඩිවිස්තර සඳහා", scheduleAsk: "අලුත් පන්තියක් සැලසුම් කිරීමට අවශ්‍යද?", scheduleSub: "තත්පර කිහිපයකින් Zoom Meeting එකක් සාදා ගන්න.", scheduleNowBtn: "➕ Schedule New Class Now", createClassTitle: "අලුත් Class එකක් Schedule කරමු", topicLabel: "Class Topic", topicPlaceholder: "පන්තියේ මාතෘකාව ඇතුලත් කරන්න", dateLabel: "Date", timeLabel: "Time", durationHoursLabel: "Duration (Hours)", durationMinutesLabel: "Duration (Minutes)", passcodeLabel: "Passcode", passcodePlaceholder: "Auto (හිස්ව තැබුවද Auto Passcode සෑදේ)", waitingRoom: "Waiting Room", hostVideo: "Host Video", participantVideo: "Participant Video", muteOnEntry: "Mute on Entry", autoRecordingLabel: "🎙️ Auto Recording Options", createBtn: "▶️ Create Zoom Class", creatingBtn: "⚙️ පන්තිය සකසමින්...", plannedClassesTitle: "සැලසුම් කර ඇති පන්ති", noPlannedClasses: "👋 ඔබ වෙනුවෙන් මෙතෙක් කිසිදු පන්තියක් සැලසුම් කර නොමැත.", scheduleFirstBtn: "➕ Schedule First Class", startClassBtn: "▶️ Start Class", copyDetailsBtn: "📋 Copy Details", cancelClassBtn: "❌ Cancel Class", recordingsTitle: "ඔබගේ පන්ති පටිගත කිරීම්", cloudNote: "(Cloudflare R2 Storage)", noRecordings: "පටිගත කරන ලද පන්ති දර්ශන කිසිවක් හමුනොවීය.", colDate: "DATE", colTitle: "CLASS TITLE", colAction: "ACTION", copyLinkBtn: "📋 Copy Link", daysLeftText: "දින {days} ක් ඉතිරියි", expiredText: "❌ කාලය ඉකුත් වී ඇත", alertSuccessCreate: "📹 සූම් පන්තිය සාර්ථකව සකස් කර දත්ත ගොනුවට ඇතුලත් කරන ලදී.", alertHostLimitError: "🚫 ඔබගේ ගිණුමේ දැනට පවතින්නේ Single Host Package එකකි.\n\nඑම නිසා ඔබට එකවර පැවැත්විය හැක්කේ එක් රැස්වීමක් (Meeting එකක්) පමණි.\n\nDual Host හෝ ඊට වැඩි Package එකක් Active කරගැනීමට Digimart Support අමතන්න.", whatsappConfirm: "👉 ඔබට දැන්ම WhatsApp හරහා Digimart Support සම්බන්ධ කර ගැනීමට අවශ්‍යද?", alertAllBusyError: "ERR_ALL_BUSY: ඔබ තෝරාගත් වේලාවට පද්ධතියේ නිදහස් Zoom Account එකක් නොමැත.", alertGeneralError: "🚫 පන්තිය සකස් කිරීමට නොහැකි විය. වේලාව නැවත පරීක්ෂා කරන්න.", alertServerError: "⚠️ සේවාදායකය සමඟ සම්බන්ධ වීමේ දෝෂයකි. කරුණාකර නැවත උත්සාහ කරන්න.", alertCancelConfirm: "⚠️ මෙම පන්තිය අවලංගු (Cancel) කිරීමට අවශ්‍ය බව තහවුරු කරන්න.\n\n• මෙම Zoom Link එක සහ Passcode එක සදහටම අක්‍රීය / අවලංගු වේ.\n• සිසුන්ට මෙම පන්තියට තවදුරටත් සම්බන්ධ විය නොහැක.\n• නැවත මෙම පන්තිය පැවැත්වීමට අවශ්‍ය නම් අලුතෙන් Class එකක් Schedule කිරීමට සිදුවේ.", alertCancelSuccess: "🗑️ පන්තිය සාර්ථකව අවලංගු (Cancel) කරන ලදී.", alertCancelError: "❌ පන්තිය අවලංගු කිරීමට නොහැකි විය.", alertCopySuccess: "📝 පන්තියේ විස්තර Clipboard එකට Copy කරගන්නා ලදී.", alertCopyVideoSuccess: "🎬 පටිගත කිරීමේ සබැඳිය (Video Link) සාර්ථකව Copy කරගන්නා ලදී."
  },
  en: { welcome: "Welcome", subHeader: "Digimart LMS Management Portal", signOut: "Sign Out", supportBtn: "Support", homeTab: "Home", scheduleTab: "Schedule Class", plannedTab: "Scheduled Classes", recordingsTab: "Recordings", plannedCount: "Scheduled Classes", recordingsCount: "Recordings", accStatus: "Account Status", activeAcc: "● Active Account", maxHostsLabel: "Max Concurrent Hosts", announcements: "Digimart Special Announcements & Offers", ad1Badge: "Special Offer", ad1Title: "🚀 Zoom 300 / 500 Participants Package Upgrade!", ad1Desc: "Has your student count increased? Easily upgrade to 300 or 500 capacity Zoom Pro Packages via Digimart LMS today.", ad1Support: "24/7 Live Support Available", ad1Btn: "💬 Contact Support", ad2Badge: "New Feature", ad2Title: "🌐 Want your own custom LMS Website?", ad2Desc: "Get your branded LMS Web Platform in minutes with Automated Card Payments, Student Attendance Tracking & Cloud Storage.", ad2Brand: "Digimart Smart LMS", ad2Btn: "✨ Learn More", scheduleAsk: "Need to schedule a new class?", scheduleSub: "Create a Zoom Meeting in just a few seconds.", scheduleNowBtn: "➕ Schedule New Class Now", createClassTitle: "Schedule a New Class", topicLabel: "Class Topic", topicPlaceholder: "Enter class topic", dateLabel: "Date", timeLabel: "Time", durationHoursLabel: "Duration (Hours)", durationMinutesLabel: "Duration (Minutes)", passcodeLabel: "Passcode", passcodePlaceholder: "Auto (Leave blank for auto passcode)", waitingRoom: "Waiting Room", hostVideo: "Host Video", participantVideo: "Participant Video", muteOnEntry: "Mute on Entry", autoRecordingLabel: "🎙️ Auto Recording Options", createBtn: "▶️ Create Zoom Class", creatingBtn: "⚙️ Creating Class...", plannedClassesTitle: "Scheduled Classes", noPlannedClasses: "👋 No classes scheduled for you yet.", scheduleFirstBtn: "➕ Schedule First Class", startClassBtn: "▶️ Start Class", copyDetailsBtn: "📋 Copy Details", cancelClassBtn: "❌ Cancel Class", recordingsTitle: "Your Class Recordings", cloudNote: "(Cloudflare R2 Storage)", noRecordings: "No class recordings found.", colDate: "DATE", colTitle: "CLASS TITLE", colAction: "ACTION", copyLinkBtn: "📋 Copy Link", daysLeftText: "{days} Days Left", expiredText: "❌ Account Expired", alertSuccessCreate: "📹 Zoom class scheduled and saved successfully.", alertHostLimitError: "🚫 Your account currently has a Single Host Package.\n\nTherefore, you can only run one meeting at a time.\n\nPlease contact Digimart Support to activate a Dual Host or higher package.", whatsappConfirm: "👉 Would you like to contact Digimart Support via WhatsApp now?", alertAllBusyError: "ERR_ALL_BUSY: No free Zoom Accounts available for the selected time slot.", alertGeneralError: "🚫 Unable to schedule class. Please verify the date and time.", alertServerError: "⚠️ Server connection error. Please try again.", alertCancelConfirm: "⚠️ Are you sure you want to cancel this class?\n\n• The Zoom Link and Passcode for this class will become permanently invalid.\n• Students will no longer be able to join this class.\n• You will need to schedule a new class if you wish to host it later.", alertCancelSuccess: "🗑️ Class canceled successfully.", alertCancelError: "❌ Failed to cancel class.", alertCopySuccess: "📝 Class details copied to Clipboard.", alertCopyVideoSuccess: "🎬 Video Recording link copied to Clipboard."
  },
  ta: { welcome: "வணக்கம்", subHeader: "Digimart LMS மேலாண்மை போர்டல்", signOut: "வெளியேறு", supportBtn: "உதவி", homeTab: "முகப்பு", scheduleTab: "வகுப்பு அட்டவணை", plannedTab: "திட்டமிடப்பட்ட வகுப்புகள்", recordingsTab: "பதிவுகள்", plannedCount: "திட்டமிடப்பட்ட வகுப்புகள்", recordingsCount: "பதிவுகள்", accStatus: "கணக்கு நிலை", activeAcc: "● செயலில் உள்ள கணக்கு", maxHostsLabel: "சமகால வகுப்பு வரம்பு", announcements: "Digimart சிறப்பு அறிவிப்புகள் & சலுகைகள்", ad1Badge: "சிறப்பு சலுகை", ad1Title: "🚀 Zoom 300 / 500 பங்கேற்பாளர்கள் பேக்கேஜ் அப் கிரேட்!", ad1Desc: "உங்கள் மாணவர் எண்ணிக்கை அதிகரித்துள்ளதா? Digimart LMS மூலம் 300 அல்லது 500 கொள்ளளவு கொண்ட Zoom Pro பேக்கேஜ்களை இன்றே பெறுங்கள்.", ad1Support: "24/7 நேரலை உதவி கிடைக்கும்", ad1Btn: "💬 தொடர்புகொள்ளவும்", ad2Badge: "புதிய அம்சம்", ad2Title: "🌐 சொந்தமாக LMS இணையதளம் உருவாக்க வேண்டுமா?", ad2Desc: "தானியங்கி அட்டை கொடுப்பனவுகள், மாணவர் வருகை கண்காணிப்பு மற்றும் வீடியோ சேமிப்பகத்துடன் உங்கள் பிராண்டட் LMS பிளாட்ஃபார்மைப் பெறுங்கள்.", ad2Brand: "Digimart Smart LMS", ad2Btn: "✨ மேலும் அறிய", scheduleAsk: "புதிய வகுப்பை திட்டமிட வேண்டுமா?", scheduleSub: "சில வினாடிகளில் Zoom கூட்டத்தை உருவாக்கவும்.", scheduleNowBtn: "➕ புதிய வகுப்பை திட்டமிடுங்கள்", createClassTitle: "புதிய வகுப்பை திட்டமிடுங்கள்", topicLabel: "வகுப்பு தலைப்பு", topicPlaceholder: "வகுப்பு தலைப்பை உள்ளிடவும்", dateLabel: "தேதி", timeLabel: "நேரம்", durationHoursLabel: "கால அளவு (மணி)", durationMinutesLabel: "கால அளவு (நிமிடங்கள்)", passcodeLabel: "கடவுச்சொல்", passcodePlaceholder: "Auto (தானாக உருவாக்க காலியாக விடவும்)", waitingRoom: "காத்திருப்பு அறை", hostVideo: "தொகுப்பாளர் வீடியோ", participantVideo: "பங்கேற்பாளர் வீடியோ", muteOnEntry: "நுழையும் போது முடக்கு", autoRecordingLabel: "🎙️ Auto Recording Options", createBtn: "▶️ Zoom வகுப்பை உருவாக்கு", creatingBtn: "⚙️ உருவாக்கப்படுகிறது...", plannedClassesTitle: "திட்டமிடப்பட்ட வகுப்புகள்", noPlannedClasses: "👋 உங்களுக்கு இன்னும் வகுப்புகள் எதுவும் திட்டமிடப்படவில்லை.", scheduleFirstBtn: "➕ முதல் வகுப்பை திட்டமிடுங்கள்", startClassBtn: "▶️ வகுப்பைத் தொடங்கு", copyDetailsBtn: "📋 விவரங்களை நகலெடு", cancelClassBtn: "❌ வகுப்பை ரத்து செய்", recordingsTitle: "உங்கள் வகுப்பு பதிவுகள்", cloudNote: "(Cloudflare R2 Storage)", noRecordings: "வகுப்பு பதிவுகள் எதுவும் கிடைக்கவில்லை.", colDate: "தேதி", colTitle: "வகுப்பு தலைப்பு", colAction: "செயல்பாடு", copyLinkBtn: "📋 லிங்கை நகலெடு", daysLeftText: "{days} நாட்கள் மீதமுள்ளன", expiredText: "❌ கணக்கு காலாவதியானது", alertSuccessCreate: "📹 Zoom வகுப்பு வெற்றிகரமாக திட்டமிடப்பட்டு சேமிக்கப்பட்டது.", alertHostLimitError: "🚫 உங்கள் கணக்கில் தற்போது Single Host Package மட்டுமே உள்ளது.\n\nஎனவே உங்களால் ஒரே நேரத்தில் ஒரு கூட்டத்தை மட்டுமே நடத்த முடியும்.\n\nPlease contact Digimart Support to activate a Dual Host or higher package.", whatsappConfirm: "👉 இப்போது WhatsApp மூலம் Digimart Support-ஐ தொடர்பு கொள்ள விரும்புகிறீர்களா?", alertAllBusyError: "ERR_ALL_BUSY: தேர்ந்தெடுக்கப்பட்ட நேரத்தில் இலவச Zoom கணக்குகள் எதுவும் கிடைக்கவில்லை.", alertGeneralError: "🚫 வகுப்பை திட்டமிட முடியவில்லை. நேரத்தை மீண்டும் சரிபார்க்கவும்.", alertServerError: "⚠️ சர்வர் இணைப்பு பிழை. மீண்டும் முயற்சிக்கவும்.", alertCancelConfirm: "⚠️ இந்த வகுப்பை ரத்து செய்ய விரும்புகிறீர்களா?\n\n• இந்த Zoom இணைப்பு மற்றும் கடவுச்சொல் நிரந்தரமாக செல்லுபடியாகாது.\n• மாணவர்கள் இந்த வகுப்பில் இனி இணைய முடியாது.\n• மீண்டும் வகுப்பை நடத்த விரும்பினால் புதிய வகுப்பை திட்டமிட வேண்டும்.", alertCancelSuccess: "🗑️ வகுப்பு வெற்றிகரமாக ரத்து செய்யப்பட்டது.", alertCancelError: "❌ வகுப்பை ரத்து செய்ய முடியவில்லை.", alertCopySuccess: "📝 வகுப்பு விவரங்கள் நகலெடுக்கப்பட்டன.", alertCopyVideoSuccess: "🎬 பதிவு செய்யப்பட்ட வீடியோ லிங்க் நகலெடுக்கப்பட்டது."
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
  const [waitingRoom, setWaitingRoom] = useState(true);
  const [hostVideo, setHostVideo] = useState(true);
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
    if (mins >= 45) roundedMins = "45"; else if (mins >= 30) roundedMins = "30"; else if (mins >= 15) roundedMins = "15";
    setSelectedHour(String(hours).padStart(2, "0")); setSelectedMinute(roundedMins); setSelectedAmPm(ampm);
    const savedLang = (localStorage.getItem("app_lang") as "si" | "en" | "ta") || "si";
    setLang(savedLang);
    const storedName = localStorage.getItem("teacher_name");
    const storedId = localStorage.getItem("teacher_id");
    const storedPic = localStorage.getItem("teacher_pic") || localStorage.getItem("profile_pic");
    if (!storedId) { router.push("/login"); } else { setTeacherName(storedName || "ගුරුතුමනි"); setTeacherId(storedId); if (storedPic) setTeacherPic(storedPic); fetchTeacherData(storedId); }
  }, [router]);

  const handleLangChange = (newLang: "si" | "en" | "ta") => { setLang(newLang); localStorage.setItem("app_lang", newLang); };
  const t = translations[lang];

  const getMeetingPasscode = (item: Meeting) => item.passcode || item.password || item.pass || "123456";
  const getMeetingTime = (item: any) => item.time || item.startTime || item.start_time || "12:00 PM";
  const getMeetingJoinUrl = (item: Meeting) => item.join_url || item.start_url || (item.zoom_id ? `https://us06web.zoom.us/j/${item.zoom_id.toString().replace(/\D/g, "")}` : "");
  
  const parseDateTimeToTimestamp = (item: Meeting) => {
    const dateStr = item.date || (item as any)["Start Time"]?.split(" ")[0];
    const timeStr = getMeetingTime(item);
    if (!dateStr) return 0;
    let hours = 0; let minutes = 0;
    if (timeStr) {
      const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (match) { hours = parseInt(match[1], 10); minutes = parseInt(match[2], 10); const period = match[3]?.toUpperCase(); if (period === "PM" && hours < 12) hours += 12; if (period === "AM" && hours === 12) hours = 0; }
    }
    const parts = dateStr.split("-").map((num: string) => parseInt(num, 10));
    if (parts.length === 3 && !isNaN(parts[0])) return new Date(parts[0], parts[1] - 1, parts[2], hours, minutes).getTime();
    return 0;
  };

  const formatDuration = (rawDuration: any) => {
    const totalMinutes = parseInt(String(rawDuration).replace(/[^0-9]/g, ""), 10) || 0;
    const hrs = Math.floor(totalMinutes / 60); const mins = totalMinutes % 60;
    return hrs > 0 ? `${hrs} ${hrs > 1 ? "Hrs" : "Hr"} ${mins > 0 ? mins + " Min" : ""}` : `${mins} Min`;
  };
  
  const formatMeetingId = (id?: string) => { const clean = id?.toString().replace(/\D/g, "") || ""; return clean.length >= 10 ? `${clean.slice(0, 3)} ${clean.slice(3, 7)} ${clean.slice(7)}` : id; };

  const handleStartClass = (item: Meeting) => {
    const startTimeMs = parseDateTimeToTimestamp(item);
    const nowMs = Date.now();
    const ONE_HOUR_MS = 60 * 60 * 1000;
    if (nowMs < (startTimeMs - ONE_HOUR_MS)) { alert("⏰ පන්තියට තවමත් වේලාව නොවේ."); return; }
    const startUrl = `https://n8n.epanthiya.com/webhook/start-zoom-class?meeting_id=${item.zoom_id?.toString().replace(/\D/g, "") || item.meeting_id_row}`;
    window.open(startUrl, "_blank");
  };

  const fetchTeacherData = async (id: string) => {
    try {
      const response = await fetch(`/api/teacher/data?teacher_id=${id}&t=${Date.now()}`);
      if (response.ok) {
        const data = await response.json();
        setPlannedClasses((data.plannedClasses || []).sort((a: Meeting, b: Meeting) => parseDateTimeToTimestamp(a) - parseDateTimeToTimestamp(b)));
        setRecordings(data.recordings || []);
        if (data.profilePic || data.teacherPic) setTeacherPic(data.profilePic || data.teacherPic);
        if (data.teacherName) setTeacherName(data.teacherName);
        setMaxConcurrentHosts(data.maxConcurrentHosts || "1");
        if (data.daysRemaining !== undefined) setRemainingDays(Number(data.daysRemaining));
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault(); setFormLoading(true);
    const totalDurationInMinutes = (parseInt(durationHours) * 60) + parseInt(durationMinutes);
    try {
      const response = await fetch("https://n8n.epanthiya.com/webhook/create-zoom-class-v2", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacher_id: teacherId, topic, date, time: `${selectedHour}:${selectedMinute} ${selectedAmPm}`, duration: totalDurationInMinutes.toString(), passcode: passcode === "Auto" ? Math.floor(100000 + Math.random() * 900000).toString() : passcode, waiting_room: waitingRoom, host_video: hostVideo, participant_video: participantVideo, mute_upon_entry: muteOnEntry, auto_recording: autoRecording })
      });
      if (response.ok) { alert(t.alertSuccessCreate); setTopic(""); fetchTeacherData(teacherId); setActiveTab("planned"); } else { alert(t.alertHostLimitError); }
    } catch { alert(t.alertServerError); } finally { setFormLoading(false); }
  };

  const handleCancelClass = async (meetingIdRow?: string, zoomMeetingId?: string) => {
    if (!confirm(t.alertCancelConfirm)) return;
    try {
      const response = await fetch("https://n8n.epanthiya.com/webhook/cancel-zoom-class", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meeting_id_row: meetingIdRow, zoom_meeting_id: zoomMeetingId, teacher_id: teacherId })
      });
      if (response.ok) { alert(t.alertCancelSuccess); fetchTeacherData(teacherId); } else { alert(t.alertCancelError); }
    } catch { alert(t.alertServerError); }
  };

  const handleLogout = () => { localStorage.clear(); router.push("/login"); };

  if (loading) return <div className="min-h-screen bg-[#070b19] flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#070b19] text-white font-sans p-4 sm:p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* TOP HEADER */}
        <div className="bg-[#0b132b]/80 border border-slate-900 backdrop-blur-md p-4 sm:p-5 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl">
          <div className="flex items-center gap-3.5">
            {teacherPic ? (
              <img src={teacherPic} alt="Profile" className="w-12 h-12 rounded-2xl object-cover border-2 border-slate-800 shadow-md" />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center font-bold text-lg text-white shadow-md">
                {teacherName.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
                {t.welcome}, {teacherName} 👋
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">{t.subHeader}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end flex-wrap">
            <div className="flex bg-slate-950/80 border border-slate-800 p-1 rounded-xl text-xs">
              <button onClick={() => handleLangChange("si")} className={`px-2.5 py-1 rounded-lg font-bold transition-all ${lang === "si" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}>සිංහල</button>
              <button onClick={() => handleLangChange("en")} className={`px-2.5 py-1 rounded-lg font-bold transition-all ${lang === "en" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}>ENG</button>
              <button onClick={() => handleLangChange("ta")} className={`px-2.5 py-1 rounded-lg font-bold transition-all ${lang === "ta" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}>தமிழ்</button>
            </div>

            <button onClick={() => window.open("https://wa.me/94778538626", "_blank")} className="px-3.5 py-2 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/50 text-emerald-400 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer">
              <span>💬</span> {t.supportBtn}
            </button>

            <button onClick={handleLogout} className="px-3.5 py-2 bg-rose-950/30 hover:bg-rose-900/50 border border-rose-900/40 text-rose-400 text-xs font-bold rounded-xl transition-all cursor-pointer">
              {t.signOut}
            </button>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex gap-2 border-b border-slate-900 pb-3 overflow-x-auto">
          <button onClick={() => setActiveTab("home")} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${activeTab === "home" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-[#0b132b]/40 text-slate-400 hover:text-white hover:bg-[#0b132b]"}`}>
            🏠 {t.homeTab}
          </button>
          <button onClick={() => setActiveTab("schedule")} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${activeTab === "schedule" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-[#0b132b]/40 text-slate-400 hover:text-white hover:bg-[#0b132b]"}`}>
            ➕ {t.scheduleTab}
          </button>
          <button onClick={() => setActiveTab("planned")} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${activeTab === "planned" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-[#0b132b]/40 text-slate-400 hover:text-white hover:bg-[#0b132b]"}`}>
            📅 {t.plannedTab} <span className="bg-slate-800 text-slate-200 px-1.5 py-0.2 rounded-full text-[10px]">{plannedClasses.length}</span>
          </button>
          <button onClick={() => setActiveTab("recordings")} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${activeTab === "recordings" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-[#0b132b]/40 text-slate-400 hover:text-white hover:bg-[#0b132b]"}`}>
            🎥 {t.recordingsTab} <span className="bg-slate-800 text-slate-200 px-1.5 py-0.2 rounded-full text-[10px]">{recordings.length}</span>
          </button>
        </div>

        {/* TAB 1: HOME */}
        {activeTab === "home" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-[#0b132b]/60 border border-slate-900 p-5 rounded-3xl space-y-2">
                <p className="text-xs text-slate-400 font-medium">{t.plannedCount}</p>
                <h3 className="text-2xl font-black text-blue-400">{plannedClasses.length}</h3>
              </div>
              <div className="bg-[#0b132b]/60 border border-slate-900 p-5 rounded-3xl space-y-2">
                <p className="text-xs text-slate-400 font-medium">{t.accStatus}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-400">{t.activeAcc}</span>
                  {remainingDays !== null && (
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-bold">
                      {remainingDays > 0 ? t.daysLeftText.replace("{days}", String(remainingDays)) : t.expiredText}
                    </span>
                  )}
                </div>
              </div>
              <div className="bg-[#0b132b]/60 border border-slate-900 p-5 rounded-3xl space-y-2">
                <p className="text-xs text-slate-400 font-medium">{t.maxHostsLabel}</p>
                <h3 className="text-2xl font-black text-purple-400">{maxConcurrentHosts} Host(s)</h3>
              </div>
            </div>

            {/* Announcements */}
            <div className="bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/40 border border-blue-900/30 p-6 rounded-3xl space-y-4 shadow-xl">
              <div className="flex items-center gap-2">
                <span className="text-xs bg-blue-600 text-white font-bold px-2.5 py-1 rounded-xl shadow-sm">📢 {t.announcements}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="bg-slate-950/60 border border-slate-900 p-4 rounded-2xl space-y-3">
                  <span className="text-[10px] bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold px-2 py-0.5 rounded">{t.ad1Badge}</span>
                  <h4 className="text-xs font-bold text-slate-200">{t.ad1Title}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{t.ad1Desc}</p>
                  <button onClick={() => window.open("https://wa.me/94778538626", "_blank")} className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md">
                    {t.ad1Btn}
                  </button>
                </div>
                <div className="bg-slate-950/60 border border-slate-900 p-4 rounded-2xl space-y-3">
                  <span className="text-[10px] bg-purple-500/10 border border-purple-500/30 text-purple-400 font-bold px-2 py-0.5 rounded">{t.ad2Badge}</span>
                  <h4 className="text-xs font-bold text-slate-200">{t.ad2Title}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{t.ad2Desc}</p>
                  <button onClick={() => window.open("https://wa.me/94778538626", "_blank")} className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md">
                    {t.ad2Btn}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SCHEDULE CLASS */}
        {activeTab === "schedule" && (
          <div className="bg-[#0b132b]/60 border border-slate-900 p-6 sm:p-8 rounded-3xl max-w-2xl mx-auto space-y-6 shadow-xl">
            <h2 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3">📅 {t.createClassTitle}</h2>
            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">{t.topicLabel}</label>
                <input type="text" required value={topic} onChange={(e) => setTopic(e.target.value)} placeholder={t.topicPlaceholder} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-600" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">{t.dateLabel}</label>
                  <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-600" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">{t.timeLabel}</label>
                  <div className="grid grid-cols-3 gap-2">
                    <select value={selectedHour} onChange={(e) => setSelectedHour(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-2 py-2.5 text-xs text-white">
                      {["01","02","03","04","05","06","07","08","09","10","11","12"].map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <select value={selectedMinute} onChange={(e) => setSelectedMinute(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-2 py-2.5 text-xs text-white">
                      {["00","15","30","45"].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select value={selectedAmPm} onChange={(e) => setSelectedAmPm(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-2 py-2.5 text-xs text-white">
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">{t.durationHoursLabel}</label>
                  <select value={durationHours} onChange={(e) => setDurationHours(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white">
                    {["00 Hr", "01 Hr", "02 Hr", "03 Hr", "04 Hr"].map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">{t.durationMinutesLabel}</label>
                  <select value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white">
                    {["00 Min", "15 Min", "30 Min", "45 Min"].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">{t.passcodeLabel}</label>
                <input type="text" value={passcode} onChange={(e) => setPasscode(e.target.value)} placeholder={t.passcodePlaceholder} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-600" />
              </div>

              <div className="pt-2">
                <p className="text-xs font-bold text-slate-300 mb-2">{t.autoRecordingLabel}</p>
                <div className="grid grid-cols-3 gap-2">
                  <button type="button" onClick={() => setAutoRecording("none")} className={`py-2 rounded-xl text-xs font-bold border transition-all ${autoRecording === "none" ? "bg-blue-600 border-blue-500 text-white" : "bg-slate-950 border-slate-800 text-slate-400"}`}>None</button>
                  <button type="button" onClick={() => setAutoRecording("cloud")} className={`py-2 rounded-xl text-xs font-bold border transition-all ${autoRecording === "cloud" ? "bg-blue-600 border-blue-500 text-white" : "bg-slate-950 border-slate-800 text-slate-400"}`}>Cloud (Zoom)</button>
                  <button type="button" onClick={() => setAutoRecording("local")} className={`py-2 rounded-xl text-xs font-bold border transition-all ${autoRecording === "local" ? "bg-blue-600 border-blue-500 text-white" : "bg-slate-950 border-slate-800 text-slate-400"}`}>Local</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={waitingRoom} onChange={(e) => setWaitingRoom(e.target.checked)} className="rounded bg-slate-950 border-slate-800 text-blue-600" /> {t.waitingRoom}
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={muteOnEntry} onChange={(e) => setMuteOnEntry(e.target.checked)} className="rounded bg-slate-950 border-slate-800 text-blue-600" /> {t.muteOnEntry}
                </label>
              </div>

              <button type="submit" disabled={formLoading} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-2xl transition-all shadow-lg shadow-blue-600/30 cursor-pointer mt-4">
                {formLoading ? t.creatingBtn : t.createBtn}
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: PLANNED CLASSES */}
        {activeTab === "planned" && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-200">📅 {t.plannedClassesTitle} ({plannedClasses.length})</h2>
            {plannedClasses.length === 0 ? (
              <div className="p-12 border border-dashed border-slate-800 rounded-3xl text-center text-slate-500 text-xs space-y-3">
                <p>{t.noPlannedClasses}</p>
                <button onClick={() => setActiveTab("schedule")} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer">{t.scheduleFirstBtn}</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {plannedClasses.map((item, idx) => {
                  const pass = getMeetingPasscode(item);
                  const classTime = getMeetingTime(item);
                  const joinUrl = getMeetingJoinUrl(item);
                  const rawStatus = String(item.status || (item as any).Status || "").trim().toUpperCase();
                  const isClassEnded = rawStatus === "ENDED";

                  return (
                    <div key={idx} className="bg-[#0b132b]/60 border border-slate-900 p-5 rounded-3xl space-y-3.5 shadow-sm flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] bg-blue-950 text-blue-400 font-bold px-2 py-0.5 rounded border border-blue-900/30">
                            {item.date || (item as any)["Start Time"]?.split(" ")[0]}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">⏳ {formatDuration(item.duration)}</span>
                        </div>
                        <h3 className="text-xs font-bold text-slate-200 line-clamp-2">{item.topic}</h3>
                        <div className="bg-slate-950/70 border border-slate-900/60 p-3 rounded-xl space-y-1 font-mono text-[11px] text-slate-400">
                          <p>⏰ Time: {classTime}</p>
                          <p>🆔 ID: {formatMeetingId(item.zoom_id)}</p>
                          <p>🔑 Pass: {pass}</p>
                          <p className="text-[10px] text-blue-400 font-bold">⚙️ Acc: {item.zoom_account_id || "Pool Acc"}</p>
                          <p className="text-[10px] text-slate-500 font-bold">Status: {rawStatus}</p>
                        </div>
                      </div>

                      <div className="space-y-2 pt-1">
                        {isClassEnded ? (
                          <div className="w-full py-2.5 bg-amber-950/40 border border-amber-800/50 text-amber-400 text-[11px] font-bold rounded-xl text-center flex items-center justify-center gap-1.5">
                            <span>⏳</span> Class Ended / Recording Processing...
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              {rawStatus === "STARTED" ? (
                                <button disabled className="py-2 bg-emerald-950/40 border border-emerald-800/50 text-emerald-400 rounded-xl text-[10px] font-bold text-center cursor-not-allowed">
                                  🟢 Running...
                                </button>
                              ) : (
                                <button onClick={() => handleStartClass(item)} className="py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-[10px] font-bold text-white transition-all cursor-pointer">
                                  {t.startClassBtn}
                                </button>
                              )}
                              <button onClick={() => {
                                const formattedId = formatMeetingId(item.zoom_id);
                                const details = `🎓 *${teacherName} is inviting you to a scheduled Zoom meeting.* ✨\n\n📌 *Topic:* ${item.topic}\n📅 *Date:* ${item.date || (item as any)["Start Time"]?.split(" ")[0]}\n⏰ *Time:* ${classTime}\n\n🔐 *Meeting ID:* ${formattedId}\n🔑 *Passcode:* ${pass}\n\n🌐 *Join Link:* ${joinUrl}`;
                                navigator.clipboard.writeText(details);
                                alert(t.alertCopySuccess);
                              }} className="py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-bold transition-all cursor-pointer">
                                {t.copyDetailsBtn}
                              </button>
                            </div>
                            {rawStatus === "SCHEDULED" && (
                              <button onClick={() => handleCancelClass(item.meeting_id_row, item.zoom_id)} className="w-full py-1.5 bg-rose-950/30 hover:bg-rose-900/50 border border-rose-900/40 text-rose-400 text-[10px] font-bold rounded-xl transition-all cursor-pointer">
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
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-200">🎥 {t.recordingsTitle} <span className="text-[10px] text-slate-500 font-normal">{t.cloudNote}</span></h2>
            {recordings.length === 0 ? (
              <div className="p-12 border border-dashed border-slate-800 rounded-3xl text-center text-slate-500 text-xs">
                {t.noRecordings}
              </div>
            ) : (
              <div className="bg-[#0b132b]/60 border border-slate-900 rounded-3xl overflow-hidden shadow-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-900 bg-slate-950/40 text-[10px] text-slate-400 font-bold">
                      <th className="p-4">{t.colDate}</th>
                      <th className="p-4">{t.colTitle}</th>
                      <th className="p-4 text-right">{t.colAction}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/50 text-xs">
                    {recordings.map((rec, index) => (
                      <tr key={index} className="hover:bg-slate-900/20 transition-colors">
                        <td className="p-4 font-mono text-slate-400">{rec.date}</td>
                        <td className="p-4 font-bold text-slate-200">{rec.title}</td>
                        <td className="p-4 text-right">
                          <button onClick={() => { navigator.clipboard.writeText(rec.link); alert(t.alertCopyVideoSuccess); }} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-bold transition-all cursor-pointer">
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