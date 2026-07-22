import { NextResponse } from 'next/server';

// 💡 Vercel එකේ පරණ ඩේටා Cache වීම සම්පූර්ණයෙන්ම නවත්වන්න මේ පේළි දෙක අත්‍යවශ්‍යයි!
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teacherId = searchParams.get('teacher_id');

  if (!teacherId) {
    return NextResponse.json({ error: 'Teacher ID අත්‍යවශ්‍යයි' }, { status: 400 });
  }

  try {
    const spreadsheetId = "1iQeY5nyGO2pPU_Romyf3-px0pL9KYDEuJ_yyBu6VglM";
    const cacheBuster = Date.now();

    // 🚀 Meetings සහ Teachers කියන ෂීට් දෙකෙන්ම එකවර ඩේටා ලබාගනිමු (Promise.all)
    const [meetingsRes, teachersRes] = await Promise.all([
      fetch(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=Meetings&nocache=${cacheBuster}`, { cache: 'no-store' }),
      fetch(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=Teachers&nocache=${cacheBuster}`, { cache: 'no-store' })
    ]);

    // ------------------- 1. MEETINGS DATA PROCESSING -------------------
    const meetingsText = await meetingsRes.text();
    const meetingsJsonString = meetingsText.substring(meetingsText.indexOf("{"), meetingsText.lastIndexOf("}") + 1);
    const meetingsData = JSON.parse(meetingsJsonString);
    const rows = meetingsData.table.rows || [];

    const filteredRows = rows.filter((row: any) => row.c[1]?.v === teacherId);

    const plannedClasses: any[] = [];
    const recordings: any[] = [];

    filteredRows.forEach((row: any) => {
      const dateCell = row.c[3];
      const rawV = dateCell?.v ? String(dateCell.v).trim() : "";
      const rawF = dateCell?.f ? String(dateCell.f).trim() : "";
      
      let finalDate = "";
      let finalTime = "12:00 PM";

      if (rawV.startsWith("Date(")) {
        const matches = rawV.match(/Date\((\d+),(\d+),(\d+),?(\d+)?,?(\d+)?/);
        if (matches) {
          const y = matches[1];
          const m = String(parseInt(matches[2], 10) + 1).padStart(2, "0");
          const d = String(matches[3]).padStart(2, "0");
          finalDate = `${y}-${m}-${d}`;

          let hrs = parseInt(matches[4] || "0", 10);
          const mins = String(matches[5] || "0").padStart(2, "0");
          const ampm = hrs >= 12 ? "PM" : "AM";
          hrs = hrs % 12 || 12;
          finalTime = `${String(hrs).padStart(2, "0")}:${mins} ${ampm}`;
        }
      } else if (rawF || rawV) {
        const sourceText = rawF || rawV;
        const dateMatch = sourceText.match(/(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) finalDate = dateMatch[1];
        
        const timeMatch = sourceText.match(/(\d{1,2}):(\d{2})/);
        if (timeMatch) {
          let hrs = parseInt(timeMatch[1], 10);
          const mins = timeMatch[2];
          const isPM = sourceText.toUpperCase().includes("PM");
          const isAM = sourceText.toUpperCase().includes("AM");
          
          if (isPM || isAM) {
            finalTime = `${String(hrs).padStart(2, "0")}:${mins} ${isPM ? 'PM' : 'AM'}`;
          } else {
            const ampm = hrs >= 12 ? "PM" : "AM";
            hrs = hrs % 12 || 12;
            finalTime = `${String(hrs).padStart(2, "0")}:${mins} ${ampm}`;
          }
        }
      }

      const rowData = {
        topic: row.c[2]?.v,
        date: finalDate || (rawV.split('T')[0]),
        time: finalTime,
        duration: row.c[4]?.v,
        zoom_id: row.c[5]?.v,
        passcode: row.c[6]?.v,
        start_url: row.c[7]?.v, 
        join_url: row.c[8]?.v,  
        recording_url: row.c[9]?.v, 
        zoom_account_id: row.c[10]?.v || "Pool Account"
      };

      if (rowData.recording_url) {
        recordings.push({ date: rowData.date, title: rowData.topic, link: rowData.recording_url });
      } else {
        plannedClasses.push(rowData);
      }
    });

    // ------------------- 2. TEACHERS PROFILE DATA PROCESSING -------------------
    let profilePic = "";
    let teacherName = "";

    try {
      const teachersText = await teachersRes.text();
      const teachersJsonString = teachersText.substring(teachersText.indexOf("{"), teachersText.lastIndexOf("}") + 1);
      const teachersData = JSON.parse(teachersJsonString);
      const teacherRows = teachersData.table.rows || [];

      // අදාල Teacher ID එක තියෙන Row එක සොයාගැනීම
      const teacherRow = teacherRows.find((r: any) => r.c?.some((cell: any) => cell?.v === teacherId));

      if (teacherRow) {
        // Teacher Row එකේ තියෙන Cell අතරින් Image Link (http/https) එක සොයාගැනීම
        const picCell = teacherRow.c?.find((cell: any) => 
          cell?.v && typeof cell.v === 'string' && (cell.v.startsWith('http://') || cell.v.startsWith('https://'))
        );
        if (picCell) profilePic = picCell.v;

        // Teacher Name එක සොයාගැනීම (සාමාන්‍යයෙන් Teacher ID එකට ඊළඟට හෝ නමක් ලෙස ඇති Cell එක)
        const nameCell = teacherRow.c?.find((cell: any) => 
          cell?.v && typeof cell.v === 'string' && cell.v !== teacherId && !cell.v.startsWith('http')
        );
        if (nameCell) teacherName = nameCell.v;
      }
    } catch (e) {
      console.error("Teachers Sheet එක කියවීමේ දෝෂයකි:", e);
    }

    // ------------------- 3. RETURN EVERYTHING TO FRONTEND -------------------
    return NextResponse.json({ 
      plannedClasses, 
      recordings,
      profilePic,   // 📸 Google Sheet එකෙන් එන Profile Picture URL එක
      teacherName   // 👤 Google Sheet එකෙන් එන Teacher Name එක
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: 'සේවාදායක දෝෂයකි' }, { status: 500 });
  }
}