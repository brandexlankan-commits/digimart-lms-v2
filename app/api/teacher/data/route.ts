import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teacherId = searchParams.get('teacher_id');

  if (!teacherId) {
    return NextResponse.json({ error: 'Teacher ID අත්‍යවශ්‍යයි' }, { status: 400 });
  }

  try {
    const res = await fetch("https://docs.google.com/spreadsheets/d/1iQeY5nyGO2pPU_Romyf3-px0pL9KYDEuJ_yyBu6VglM/gviz/tq?tqx=out:json&sheet=Meetings", { cache: 'no-store' });
    const text = await res.text();
    const jsonString = text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1);
    const data = JSON.parse(jsonString);
    const rows = data.table.rows;
    
    const filteredRows = rows.filter((row: any) => row.c[1]?.v === teacherId);

    const plannedClasses: any[] = [];
    const recordings: any[] = [];

    filteredRows.forEach((row: any) => {
      const rawDateTime = row.c[3]?.v ? String(row.c[3].v).trim() : "";
      let finalDate = "";
      let finalTime = "";

      if (rawDateTime) {
        // 💡 Google gviz API එකෙන් එන Date(2026,6,16,19,30,0) කියන ෆෝමැට් එක නූලටම ගැලවීම:
        if (rawDateTime.startsWith("Date(")) {
          const matches = rawDateTime.match(/Date\((\d+),(\d+),(\d+),?(\d+)?,?(\d+)?/);
          if (matches) {
            const year = matches[1];
            // gviz වල ජූලි මාසය එන්නේ 6 විදිහට (0-indexed). ඒ නිසා +1 කරලා 7 කරනවා.
            const month = String(parseInt(matches[2], 10) + 1).padStart(2, "0");
            const day = String(matches[3]).padStart(2, "0");
            
            finalDate = `${year}-${month}-${day}`;

            // වෙලාව (පැය සහ මිනිත්තු) වෙන් කරගැනීම
            let hours = parseInt(matches[4] || "0", 10);
            const minutes = String(matches[5] || "0").padStart(2, "0");
            
            const ampm = hours >= 12 ? "PM" : "AM";
            hours = hours % 12;
            hours = hours ? hours : 12; // 0 නම් පැය 12 කරනවා
            
            finalTime = `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
          }
        } else {
          // යම් හෙයකින් සාමාන්‍ය Standard format එකකින් තිබුණහොත් පරණ ලොජික් එක ක්‍රියාත්මක වේ:
          const dateMatch = rawDateTime.match(/^(\d{4}-\d{2}-\d{2})/);
          if (dateMatch) finalDate = dateMatch[1];

          const isPM = rawDateTime.toUpperCase().includes("PM");
          const isAM = rawDateTime.toUpperCase().includes("AM");
          const timeMatch = rawDateTime.match(/(\d{1,2}):(\d{2})/);
          
          if (timeMatch) {
            const hours = timeMatch[1].padStart(2, "0");
            const minutes = timeMatch[2];
            
            if (isPM) {
              finalTime = `${hours}:${minutes} PM`;
            } else if (isAM) {
              finalTime = `${hours}:${minutes} AM`;
            } else {
              let h = parseInt(hours, 10);
              const ampm = h >= 12 ? "PM" : "AM";
              h = h % 12;
              h = h ? h : 12;
              finalTime = `${String(h).padStart(2, "0")}:${minutes} ${ampm}`;
            }
          }
        }
      }

      const rowData = {
        topic: row.c[2]?.v,
        date: finalDate || rawDateTime.split('T')[0] || rawDateTime.split(' ')[0],
        time: finalTime || "12:00 PM",
        duration: row.c[4]?.v,
        zoom_id: row.c[5]?.v,
        passcode: row.c[6]?.v,
        start_url: row.c[7]?.v, 
        join_url: row.c[8]?.v,  
        recording_url: row.c[9]?.v, 
        // 💡 ෂීට් එකේ K කොලම් එකේ (Index 10) තියෙන zoom1 / zoom2 කෙටි නම ඩෑෂ්බෝඩ් එකට පාස් කිරීම:
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