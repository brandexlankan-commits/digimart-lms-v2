import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetDate = searchParams.get('date') || new Date().toISOString().split('T')[0];

  try {
    const spreadsheetId = "1iQeY5nyGO2pPU_Romyf3-px0pL9KYDEuJ_yyBu6VglM";
    const cacheBuster = Date.now();

    const meetingsRes = await fetch(
      `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=Meetings&nocache=${cacheBuster}`,
      { cache: 'no-store' }
    );

    const meetingsText = await meetingsRes.text();
    const meetingsJsonString = meetingsText.substring(meetingsText.indexOf("{"), meetingsText.lastIndexOf("}") + 1);
    const meetingsData = JSON.parse(meetingsJsonString);
    const rows = meetingsData.table.rows || [];

    const accountPoolMap: { [accId: string]: any[] } = {};

    rows.forEach((row: any) => {
      const teacherId = row.c[1]?.v || "Unknown Teacher";
      const topic = row.c[2]?.v || "Untitled Class";
      const duration = row.c[4]?.v || "60";
      const zoomId = row.c[5]?.v || "";
      const zoomAccountId = row.c[10]?.v || "Unassigned / Pool";

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
          const ampm = isPM ? "PM" : "AM";
          hrs = hrs % 12 || 12;
          finalTime = `${String(hrs).padStart(2, "0")}:${mins} ${ampm}`;
        }
      }

      if (finalDate === targetDate) {
        if (!accountPoolMap[zoomAccountId]) {
          accountPoolMap[zoomAccountId] = [];
        }

        accountPoolMap[zoomAccountId].push({
          teacher_id: teacherId,
          topic,
          time: finalTime,
          duration,
          zoom_id: zoomId,
          date: finalDate
        });
      }
    });

    return NextResponse.json({
      status: "success",
      date: targetDate,
      accounts: accountPoolMap
    });

  } catch (error) {
    console.error("Pool Admin API Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}