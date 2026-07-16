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
    // URL එකට අගින් Random අංකයක් එකතු කරනවා Google Sheet Cache එකත් කඩන්න
    const res = await fetch(`https://docs.google.com/spreadsheets/d/1iQeY5nyGO2pPU_Romyf3-px0pL9KYDEuJ_yyBu6VglM/gviz/tq?tqx=out:json&sheet=Meetings&nocache=${Date.now()}`, { 
      cache: 'no-store' 
    });
    
    const text = await res.text();
    const jsonString = text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1);
    const data = JSON.parse(jsonString);
    const rows = data.table.rows;
    
    const filteredRows = rows.filter((row: any) => row.c[1]?.v === teacherId);

    const plannedClasses: any[] = [];
    const recordings: any[] = [];

    filteredRows.forEach((row: any) => {
      // 💡 ගූගල් ෂීට් එකේ Cell එකේ ඩේටා කියවීම (.v = raw අගය, .f = format වූ අගය)
      const dateCell = row.c[3];
      const rawV = dateCell?.v ? String(dateCell.v).trim() : "";
      const rawF = dateCell?.f ? String(dateCell.f).trim() : "";
      
      let finalDate = "";
      let finalTime = "12:00 PM";

      if (rawV.startsWith("Date(")) {
        // Date(2026,6,23,19,30,0) ෆෝමැට් එක ගැලවීම
        const matches = rawV.match(/Date\((\d+),(\d+),(\d+),?(\d+)?,?(\d+)?/);
        if (matches) {
          const y = matches[1];
          const m = String(parseInt(matches[2], 10) + 1).padStart(2, "0"); // මාසය 0න් පටන්ගන්නා නිසා +1
          const d = String(matches[3]).padStart(2, "0");
          finalDate = `${y}-${m}-${d}`;

          let hrs = parseInt(matches[4] || "0", 10);
          const mins = String(matches[5] || "0").padStart(2, "0");
          const ampm = hrs >= 12 ? "PM" : "AM";
          hrs = hrs % 12 || 12;
          finalTime = `${String(hrs).padStart(2, "0")}:${mins} ${ampm}`;
        }
      } else if (rawF || rawV) {
        // සාමාන්‍ය 2026-07-23 19:30:00 ෆෝමැට් එකක් නම්
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

    return NextResponse.json({ plannedClasses, recordings });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: 'සේවාදායක දෝෂයකි' }, { status: 500 });
  }
}