import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teacherId = searchParams.get('teacher_id');

  if (!teacherId) {
    return NextResponse.json({ error: 'Teacher ID අත්‍යවශ්‍යයි' }, { status: 400 });
  }

  try {
    // ගූගල් ෂීට් එකෙන් ලයිව් දත්ත ලබා ගැනීම
    const res = await fetch("https://docs.google.com/spreadsheets/d/1iQeY5nyGO2pPU_Romyf3-px0pL9KYDEuJ_yyBu6VglM/gviz/tq?tqx=out:json&sheet=Meetings", { cache: 'no-store' });
    const text = await res.text();
    const jsonString = text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1);
    const data = JSON.parse(jsonString);
    const rows = data.table.rows;
    
    // දැනට ලොග් වී සිටින ගුරුවරයාගේ ID එකට අනුව දත්ත පෙරහන් කිරීම
    const filteredRows = rows.filter((row: any) => row.c[1]?.v === teacherId);

    const plannedClasses: any[] = [];
    const recordings: any[] = [];

    filteredRows.forEach((row: any) => {
      const rowData = {
        topic: row.c[2]?.v,
        date: row.c[3]?.v ? row.c[3].v.split(' ')[0] : "",
        time: row.c[3]?.v ? row.c[3].v.split(' ')[1] : "",
        duration: row.c[4]?.v,
        zoom_id: row.c[5]?.v,
        passcode: row.c[6]?.v,
        start_url: row.c[7]?.v, // H Column එක (ගුරුතුමාට Host විදිහට පන්තිය ආරම්භ කිරීමට)
        join_url: row.c[8]?.v,  // I Column එක (සිසුන්ට සම්බන්ධ වීමට)
        recording_url: row.c[9]?.v, // J Column එක
      };

      // Recording URL එකක් තිබේ නම් එය පටිගත කිරීම් ලැයිස්තුවට වැටේ, නැතහොත් සැලසුම් කළ පන්තිවලට වැටේ
      if (rowData.recording_url) {
        recordings.push({ date: rowData.date, title: rowData.topic, link: rowData.recording_url });
      } else {
        plannedClasses.push(rowData);
      }
    });

    return NextResponse.json({ plannedClasses, recordings });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: 'දත්ත ලබා ගැනීමේ සේවාදායක දෝෂයකි' }, { status: 500 });
  }
}