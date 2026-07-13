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

      // 🛠️ ISO Format (2026-07-13T12:35) හෝ සාමාන්‍ය Space Format නිවැරදිව වෙන් කරගැනීම
      if (rawDateTime) {
        if (rawDateTime.includes('T')) {
          const parts = rawDateTime.split('T');
          finalDate = parts[0];
          finalTime = parts[1].substring(0, 5); // තත්පර කෑල්ල තිබුණොත් අයින් කිරීමට (HH:MM)
        } else if (rawDateTime.includes(' ')) {
          const parts = rawDateTime.split(' ');
          finalDate = parts[0];
          finalTime = parts[1];
        } else {
          finalDate = rawDateTime;
        }
      }

      const rowData = {
        topic: row.c[2]?.v,
        date: finalDate,
        time: finalTime,
        duration: row.c[4]?.v,
        zoom_id: row.c[5]?.v,
        passcode: row.c[6]?.v,
        start_url: row.c[7]?.v, 
        join_url: row.c[8]?.v,  
        recording_url: row.c[9]?.v, 
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