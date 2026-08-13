import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetDate = searchParams.get('date') || new Date().toISOString().split("T")[0];

  try {
    const spreadsheetId = "1iQeY5nyGO2pPU_Romyf3-px0pL9KYDEuJ_yyBu6VglM";
    const cacheBuster = Date.now();
    const BUFFER_HOURS = 1; // 🎯 පැයක ආරක්ෂිත පරතරය (Buffer Time)

    const [meetingsRes, teachersRes] = await Promise.all([
      fetch(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=Meetings&nocache=${cacheBuster}`, { 
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
      }),
      fetch(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=Teachers&nocache=${cacheBuster}`, { 
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
      })
    ]);

    // 1. MEETINGS POOL DATA & BUFFER LOGIC
    const meetingsText = await meetingsRes.text();
    const meetingsJsonString = meetingsText.substring(meetingsText.indexOf("{"), meetingsText.lastIndexOf("}") + 1);
    const meetingsData = JSON.parse(meetingsJsonString);
    const meetingRows = meetingsData.table.rows || [];

    const accounts: { [key: string]: any[] } = {};

    meetingRows.forEach((row: any) => {
      const status = String(row.c[11]?.v || row.c[10]?.v || "").trim().toUpperCase();
      
      // 🎯 1. ENDED පන්ති මඟහැරීම (Ended වූ පසු account එක නිදහස් ලෙස සැලකේ)
      if (status === 'ENDED') {
        return;
      }

      const dateCell = row.c[3];
      const rawV = dateCell?.v ? String(dateCell.v).trim() : "";
      const rawF = dateCell?.f ? String(dateCell.f).trim() : "";

      let rowDate = "";
      let rowTime = "12:00 PM";
      let startTimestamp = NaN;

      if (rawV.startsWith("Date(")) {
        const matches = rawV.match(/Date\((\d+),(\d+),(\d+),?(\d+)?,?(\d+)?/);
        if (matches) {
          const y = parseInt(matches[1], 10);
          const m = parseInt(matches[2], 10);
          const d = parseInt(matches[3], 10);
          const hrs = parseInt(matches[4] || "0", 10);
          const mins = parseInt(matches[5] || "0", 10);

          rowDate = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          startTimestamp = Date.UTC(y, m, d, hrs, mins) - (5.5 * 60 * 60 * 1000);

          const ampm = hrs >= 12 ? "PM" : "AM";
          const formattedHrs = hrs % 12 || 12;
          rowTime = `${String(formattedHrs).padStart(2, "0")}:${String(mins).padStart(2, "0")} ${ampm}`;
        }
      } else if (rawF || rawV) {
        const sourceText = rawF || rawV;
        const dateMatch = sourceText.match(/(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) rowDate = dateMatch[1];

        const timeMatch = sourceText.match(/(\d{1,2}):(\d{2})/);
        if (timeMatch && rowDate) {
          let hrs = parseInt(timeMatch[1], 10);
          const mins = parseInt(timeMatch[2], 10);
          const isPM = sourceText.toUpperCase().includes("PM");
          const isAM = sourceText.toUpperCase().includes("AM");

          if (isPM && hrs < 12) hrs += 12;
          if (isAM && hrs === 12) hrs = 0;

          const [y, m, d] = rowDate.split('-').map(Number);
          startTimestamp = Date.UTC(y, m - 1, d, hrs, mins) - (5.5 * 60 * 60 * 1000);

          const ampm = hrs >= 12 ? "PM" : "AM";
          const formattedHrs = hrs % 12 || 12;
          rowTime = `${String(formattedHrs).padStart(2, "0")}:${String(mins).padStart(2, "0")} ${ampm}`;
        }
      }

      if (rowDate === targetDate && !isNaN(startTimestamp)) {
        const durationMin = Number(row.c[4]?.v || 120);
        const endTimestamp = startTimestamp + (durationMin * 60 * 1000);
        
        // 🎯 2. Buffer Time එක එකතු කිරීම (පන්තිය ඉවර වී තවත් පැයක් යනතුරු account එක busy ලෙස පෙන්වයි)
        const bufferedEndTimestamp = endTimestamp + (BUFFER_HOURS * 60 * 60 * 1000);

        const accId = row.c[10]?.v || "Pool Account";
        if (!accounts[accId]) accounts[accId] = [];

        accounts[accId].push({
          teacher_id: row.c[1]?.v || "N/A",
          topic: row.c[2]?.v || "No Topic",
          time: rowTime,
          duration: durationMin,
          zoom_id: row.c[5]?.v || "N/A",
          status: status || "SCHEDULED",
          startTimestamp,
          bufferedEndTimestamp
        });
      }
    });

    // 2. TEACHERS SUBSCRIPTION EXPIRY DATA
    const teachersList: any[] = [];
    try {
      const teachersText = await teachersRes.text();
      const teachersJsonString = teachersText.substring(teachersText.indexOf("{"), teachersText.lastIndexOf("}") + 1);
      const teachersData = JSON.parse(teachersJsonString);
      const teacherRows = teachersData.table.rows || [];

      teacherRows.forEach((row: any) => {
        const teacherId = row.c[0]?.v;
        const teacherName = row.c[1]?.v;
        const expCell = row.c[10];

        if (teacherId && String(teacherId).startsWith("teach_")) {
          let expiryDate = "";

          if (expCell) {
            const rawExpV = expCell.v ? String(expCell.v).trim() : "";
            const rawExpF = expCell.f ? String(expCell.f).trim() : "";

            if (rawExpV.startsWith("Date(")) {
              const matches = rawExpV.match(/Date\((\d+),(\d+),(\d+)/);
              if (matches) {
                const y = matches[1];
                const m = String(parseInt(matches[2], 10) + 1).padStart(2, "0");
                const d = String(matches[3]).padStart(2, "0");
                expiryDate = `${y}-${m}-${d}`;
              }
            } else {
              expiryDate = rawExpF || rawExpV;
            }
          }

          teachersList.push({
            teacher_id: teacherId,
            teacher_name: teacherName || "N/A",
            expiry_date: expiryDate
          });
        }
      });
    } catch (e) {
      console.error("Teachers Fetch Error:", e);
    }

    return NextResponse.json({ 
      accounts,
      teachers: teachersList 
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      }
    });

  } catch (error) {
    console.error("Admin Pool API Error:", error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}