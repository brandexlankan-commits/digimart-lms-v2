"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Interface Definitions
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
  si: { welcome: "ආයුබෝවන්", subHeader: "Digimart LMS Management Portal", signOut: "Sign Out", supportBtn: "Support", homeTab: "Home", scheduleTab: "Schedule Class", plannedTab: "Scheduled Classes", recordingsTab: "Recordings", plannedCount: "සැලසුම් කළ පන්ති", recordingsCount: "පටිගත කිරීම් (Recordings)", accStatus: "ගිණුමේ තත්ත්වය", activeAcc: "● Active Account", maxHostsLabel: "එකවර පැවැත්විය හැකි පන්ති", announcements: "Digimart විශේෂ නිවේදන සහ පිරිනැමීම්", ad1Badge: "Special Offer", ad1Title: "🚀 Zoom 300 / 500 Participants Package Upgrade!", ad1Desc: "ඔබගේ ශිෂ්‍ය සංඛ්‍යාව වැඩි වී තිබේද? කිසිදු බාධාවකින් තොරව 300 හෝ 500 ලිමිට් ඇති Zoom Pro Packages අදම Digimart LMS හරහා පහසුවෙන් ලබාගන්න.", ad1Support: "24/7 Live Support Available", ad1Btn: "💬 Contact Support", ad2Badge: "New Feature", ad2Title: "🌐 ඔබගේම LMS වෙබ් අඩවියක් සාදා ගනිමුද?", ad2Desc: "Automated Card Payments, Student Attendance Tracking සහ Class Video Cloud Storage සමඟින් ඔබගේ නමින්ම LMS Web Platform එකක් මිනිත්තු කිහිපයකින් ස්ථාපනය කරගන්න.", ad2Brand: "Digimart Smart LMS", ad2Btn: "✨ වැඩිවිස්තර සඳහා", scheduleAsk: "අලුත් පන්තියක් සැලසුම් කිරීමට අවශ්‍යද?", scheduleSub: "තත්පර කිහිපයකින් Zoom Meeting එකක් සාදා ගන්න.", scheduleNowBtn: "➕ Schedule New Class Now", createClassTitle: "අලුත් Class එකක් Schedule කරමු", topicLabel: "Class Topic", topicPlaceholder: "පන්තියේ මාතෘකාව ඇතුලත් කරන්න", dateLabel: "Date", timeLabel: "Time", durationHoursLabel: "Duration (Hours)", durationMinutesLabel: "Duration (Minutes)", passcodeLabel: "Passcode", passcodePlaceholder: "Auto (හිස්ව තැබුවද Auto Passcode සෑදේ)", waitingRoom: "Waiting Room", hostVideo: "Host Video", participantVideo: "Participant Video", muteOnEntry: "Mute on Entry", autoRecordingLabel: "🎙️ Auto Recording Options", createBtn: "▶️ Create Zoom Class", creatingBtn: "⚙️ පන්තිය සකසමින්...", plannedClassesTitle: "සැලසුම් කර ඇති පන්ති", noPlannedClasses: "👋 ඔබ වෙනුවෙන් මෙතෙක් කිසිදු පන්තියක් සැලසුම් කර නොමැත.", scheduleFirstBtn: "➕ Schedule First Class", startClassBtn: "▶️ Start Class", copyDetailsBtn: "📋 Copy Details", cancelClassBtn: "❌ Cancel Class", recordingsTitle: "ඔබගේ පන්ති පටිගත කිරීම්", cloudNote: "(Cloudflare R2 Storage)", noRecordings: "පටිගත කරන ලද පන්ති දර්ශන කිසිවක් හමුනොවීය.", colDate: "DATE", colTitle: "CLASS TITLE", colAction: "ACTION", copyLinkBtn: "📋 Copy Link", daysLeftText: "දින {days} ක් ඉතිරියි", expiredText: "❌ කාලය ඉකුත් වී ඇත", alertSuccessCreate: "📹 සූම් පන්තිය සාර්ථකව සකස් කර දත්ත ගොනුවට ඇතුලත් කරන ලදී.", alertHostLimitError: "🚫 ඔබගේ ගිණුමේ දැනට පවතින්නේ Single Host Package එකකි.\n\nඑම නිසා ඔබට එකවර පැවැත්විය හැක්කේ එක් රැස්වීමක් (Meeting එකක්) පමණි.\n\nDual Host හෝ ඊට වැඩි Package එකක් Active කරගැනීමට Digimart Support අමතන්න.", whatsappConfirm: "👉 ඔබට දැන්ම WhatsApp හරහා Digimart Support සම්බන්ධ කර ගැනීමට අවශ්‍යද?", alertAllBusyError: "ERR_ALL_BUSY: ඔබ තෝරාගත් වේලාවට පද්ධතියේ නිදහස් Zoom Account එකක් නොමැත.", alertGeneralError: "🚫 පන්තිය සකස් කිරීමට නොහැකි විය. වේලාව නැවත පරීක්ෂා කරන්න.", alertServerError: "⚠️ සේවාදායකය සමඟ සම්බන්ධ වීමේ දෝෂයකි. කරුණාකර නැවත උත්සාහ කරන්න.", alertCancelConfirm: "⚠️ මෙම පන්තිය අවලංගු (Cancel) කිරීමට අවශ්‍ය බව තහවුරු කරන්න.\n\n• මෙම Zoom Link එක සහ Passcode එක සදහටම අක්‍රීය / අවලංගු වේ.\n• සිසුන්ට මෙම පන්තියට තවදුරටත් සම්බන්ධ විය නොහැක.\n• නැවත මෙම පන්තිය පැවැත්වීමට අවශ්‍ය නම් අලුතෙන් Class එකක් Schedule කිරීමට සිදුවේ.", alertCancelSuccess: "🗑️ පන්තිය සාර්ථකව අවලංගු (Cancel) කරන ලදී.", alertCancelError: "❌ පන්තිය අවලංගු කිරීමට නොහැකි විය.", alertCopySuccess: "📝 පන්තියේ විස්තර Clipboard එකට Copy කරගන්නා ලදී.", alertCopyVideoSuccess: "🎬 පටිගත කිරීමේ සබැඳිය (Video Link) සාර්ථකව Copy කරගන්නා ලදී."
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
    const savedLang = (localStorage.getItem("app_lang") as "si" | "en" | "ta") || "si";
    setLang(savedLang);
    const storedId = localStorage.getItem("teacher_id");
    if (!storedId) { router.push("/login"); } else { fetchTeacherData(storedId); }
  }, [router]);

  const handleLangChange = (newLang: "si" | "en" | "ta") => { setLang(newLang); localStorage.setItem("app_lang", newLang); };
  const t = translations[lang];

  const getMeetingPasscode = (item: Meeting) => item.passcode || item.password || item.pass || "123456";
  const getMeetingTime = (item: any) => item.time || item.startTime || item.start_time || "12:00 PM";
  const getMeetingJoinUrl = (item: Meeting) => item.join_url || item.start_url || (item.zoom_id ? `https://us06web.zoom.us/j/${item.zoom_id.toString().replace(/\D/g, "")}` : "");
  const formatDuration = (rawDuration: any) => { const totalMinutes = parseInt(String(rawDuration).replace(/[^0-9]/g, ""), 10) || 0; return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`; };
  const formatMeetingId = (id?: string) => { const clean = id?.toString().replace(/\D/g, "") || ""; return clean.length >= 10 ? `${clean.slice(0, 3)} ${clean.slice(3, 7)} ${clean.slice(7)}` : id; };

  const handleStartClass = (item: Meeting) => {
    const startUrl = `https://n8n.epanthiya.com/webhook/start-zoom-class?meeting_id=${item.zoom_id?.toString().replace(/\D/g, "") || item.meeting_id_row}`;
    window.open(startUrl, "_blank");
  };

  const fetchTeacherData = async (id: string) => {
    try {
      const response = await fetch(`/api/teacher/data?teacher_id=${id}&t=${Date.now()}`);
      if (response.ok) {
        const data = await response.json();
        setPlannedClasses(data.plannedClasses || []);
        setRecordings(data.recordings || []);
        setTeacherName(data.teacherName || "ගුරුතුමනි");
        setTeacherPic(data.profilePic || data.teacherPic || "");
        setMaxConcurrentHosts(data.maxConcurrentHosts || "1");
        setRemainingDays(data.daysRemaining !== undefined ? Number(data.daysRemaining) : null);
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
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
    <div className="min-h-screen bg-[#070b19] text-white font-sans p-6">
        <div className="flex gap-4 mb-6">
            <button onClick={() => setActiveTab("planned")} className="px-4 py-2 bg-blue-600 rounded-lg text-xs font-bold">Scheduled Classes ({plannedClasses.length})</button>
        </div>

        {activeTab === "planned" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plannedClasses.map((item, idx) => {
                    const rawStatus = String(item.status || (item as any).Status || "").trim().toUpperCase();
                    const isClassEnded = rawStatus === "ENDED";
                    const pass = getMeetingPasscode(item);
                    const classTime = getMeetingTime(item);

                    return (
                        <div key={idx} className="bg-[#0b132b] p-4 rounded-xl border border-slate-800">
                            <h3 className="font-bold text-sm mb-2">{item.topic}</h3>
                            <p className="text-xs text-slate-400">Status: {rawStatus}</p>
                            <div className="mt-4 space-y-2">
                                {!isClassEnded && (
                                    rawStatus === "STARTED" ? (
                                        <button disabled className="w-full py-2 bg-emerald-900 text-emerald-300 rounded-lg text-xs font-bold">🟢 Running...</button>
                                    ) : (
                                        <button onClick={() => handleStartClass(item)} className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold">Start Class</button>
                                    )
                                )}
                                <button onClick={() => handleCancelClass(item.meeting_id_row, item.zoom_id)} className="w-full py-2 bg-rose-950 text-rose-400 rounded-lg text-xs font-bold">Cancel Class</button>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
    </div>
  );
}