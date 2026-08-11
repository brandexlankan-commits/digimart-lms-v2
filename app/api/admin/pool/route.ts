import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetDate = searchParams.get('date') || new Date().toISOString().split("T")[0];

  try {
    const spreadsheetId = "1iQeY5nyGO2pPU_Romyf3-px0pL9KYDEuJ_yyBu6VglM";
    const cacheBuster = Date.now();

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

    // 1. MEETINGS POOL DATA
    const meetingsText = await meetingsRes.text();
    const meetingsJsonString = meetingsText.substring(meetingsText.indexOf("{"), meetingsText.lastIndexOf("}") + 1);
    const meetingsData = JSON.parse(meetingsJsonString);
    const meetingRows = meetingsData.table.rows || [];

    const accounts: { [key: string]: any[] } = {};

    meetingRows.forEach((row: any) => {
      const dateCell = row.c[3];
      const rawV = dateCell?.v ? String(dateCell.v).trim() : "";
      const rawF = dateCell?.f ? String(dateCell.f).trim() : "";

      let rowDate = "";
      let rowTime = "12:00 PM";

      if (rawV.startsWith("Date(")) {
        const matches = rawV.match(/Date\((\d+),(\d+),(\d+),?(\d+)?,?(\d+)?/);
        if (matches) {
          const y = matches[1];
          const m = String(parseInt(matches[2], 10) + 1).padStart(2, "0");
          const d = String(matches[3]).padStart(2, "0");
          rowDate = `${y}-${m}-${d}`;

          let hrs = parseInt(matches[4] || "0", 10);
          const mins = String(matches[5] || "0").padStart(2, "0");
          const ampm = hrs >= 12 ? "PM" : "AM";
          hrs = hrs % 12 || 12;
          rowTime = `${String(hrs).padStart(2, "0")}:${mins} ${ampm}`;
        }
      } else if (rawF || rawV) {
        const sourceText = rawF || rawV;
        const dateMatch = sourceText.match(/(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) rowDate = dateMatch[1];

        const timeMatch = sourceText.match(/(\d{1,2}):(\d{2})/);
        if (timeMatch) {
          let hrs = parseInt(timeMatch[1], 10);
          const mins = timeMatch[2];
          const isPM = sourceText.toUpperCase().includes("PM");
          const isAM = sourceText.toUpperCase().includes("AM");
          
          if (isPM || isAM) {
            rowTime = `${String(hrs).padStart(2, "0")}:${mins} ${isPM ? 'PM' : 'AM'}`;
          } else {
            const ampm = hrs >= 12 ? "PM" : "AM";
            hrs = hrs % 12 || 12;
            rowTime = `${String(hrs).padStart(2, "0")}:${mins} ${ampm}`;
          }
        }
      }

      if (rowDate === targetDate) {
        const accId = row.c[10]?.v || "Pool Account";
        if (!accounts[accId]) accounts[accId] = [];

        accounts[accId].push({
          teacher_id: row.c[1]?.v || "N/A",
          topic: row.c[2]?.v || "No Topic",
          time: rowTime,
          duration: row.c[4]?.v || "60",
          zoom_id: row.c[5]?.v || "N/A",
          status: row.c[11]?.v || row.c[10]?.v || ""
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
        const expCell = row.c[10]; // Column K (Index 10)

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