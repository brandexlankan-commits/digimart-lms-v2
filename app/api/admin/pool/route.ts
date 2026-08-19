import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetDate = searchParams.get('date') || new Date().toISOString().split("T")[0];

  try {
    const spreadsheetId = "1iQeY5nyGO2pPU_Romyf3-px0pL9KYDEuJ_yyBu6VglM";
    const cacheBuster = Date.now();
    const BUFFER_HOURS = 1;

    const [meetingsRes, teachersRes, poolRes, pool300Res] = await Promise.all([
      fetch(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=Meetings&nocache=${cacheBuster}`, { cache: 'no-store' }).catch(() => null),
      fetch(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=Teachers&nocache=${cacheBuster}`, { cache: 'no-store' }).catch(() => null),
      fetch(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=Zoom_Pool&nocache=${cacheBuster}`, { cache: 'no-store' }).catch(() => null),
      fetch(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=Zoom_Pool_300&nocache=${cacheBuster}`, { cache: 'no-store' }).catch(() => null)
    ]);

    async function parseSheet(res: Response | null) {
      if (!res || !res.ok) return [];
      try {
        const text = await res.text();
        const start = text.indexOf("{");
        const end = text.lastIndexOf("}");
        if (start === -1 || end === -1) return [];
        const jsonStr = text.substring(start, end + 1);
        const parsed = JSON.parse(jsonStr);
        return parsed?.table?.rows || [];
      } catch (e) {
        return [];
      }
    }

    const [meetingRows, teacherRows, poolRows, pool300Rows] = await Promise.all([
      parseSheet(meetingsRes),
      parseSheet(teachersRes),
      parseSheet(poolRes),
      parseSheet(pool300Res)
    ]);

    const allPoolAccounts: any[] = [];

    const processPoolRows = (rows: any[], poolType: string) => {
      if (!Array.isArray(rows)) return;
      rows.forEach((row: any) => {
        const cells = row?.c || [];
        let accountId = "";
        let status = "INACTIVE"; // 🎯 Default INACTIVE (Blank status accounts are skipped)

        cells.forEach((cell: any, idx: number) => {
          const val = cell?.v ? String(cell.v).trim() : "";
          if ((idx === 0 || idx === 1) && val && !accountId && !val.toLowerCase().includes('status')) {
            accountId = val;
          }
          // Sheet එකේ Active ලෙස Type කර තිබුණහොත් පමණක් ACTIVE වේ
          if (val.toLowerCase() === 'active') {
            status = "ACTIVE";
          }
        });

        if (accountId && status === 'ACTIVE') {
          allPoolAccounts.push({
            account_id: accountId,
            pool_type: poolType,
            status: status
          });
        }
      });
    };

    processPoolRows(poolRows, '100p');
    processPoolRows(pool300Rows, '300p');

    const accountMeetingsMap: { [key: string]: any[] } = {};

    if (Array.isArray(meetingRows)) {
      meetingRows.forEach((row: any) => {
        const cells = row?.c || [];
        const status = String(cells[11]?.v || cells[10]?.v || "").trim().toUpperCase();

        if (status === 'ENDED') return;

        const dateCell = cells[3];
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

            const parts = rowDate.split('-').map(Number);
            if (parts.length === 3) {
              const [y, m, d] = parts;
              startTimestamp = Date.UTC(y, m - 1, d, hrs, mins) - (5.5 * 60 * 60 * 1000);
            }

            const ampm = hrs >= 12 ? "PM" : "AM";
            const formattedHrs = hrs % 12 || 12;
            rowTime = `${String(formattedHrs).padStart(2, "0")}:${String(mins).padStart(2, "0")} ${ampm}`;
          }
        }

        if (rowDate === targetDate && !isNaN(startTimestamp)) {
          const durationMin = Number(cells[4]?.v || 120);
          const endTimestamp = startTimestamp + (durationMin * 60 * 1000);
          const bufferedStartTimestamp = startTimestamp - (BUFFER_HOURS * 60 * 60 * 1000);
          const bufferedEndTimestamp = endTimestamp + (BUFFER_HOURS * 60 * 60 * 1000);

          const accId = String(cells[10]?.v || "").trim();
          if (accId) {
            if (!accountMeetingsMap[accId]) accountMeetingsMap[accId] = [];
            accountMeetingsMap[accId].push({
              teacher_id: cells[1]?.v || "N/A",
              topic: cells[2]?.v || "No Topic",
              time: rowTime,
              duration: durationMin,
              zoom_id: cells[5]?.v || "N/A",
              status: status || "SCHEDULED",
              startTimestamp,
              endTimestamp,
              bufferedStartTimestamp,
              bufferedEndTimestamp
            });
          }
        }
      });
    }

    const formattedAccounts: { [key: string]: any } = {};

    allPoolAccounts.forEach(acc => {
      const meetingsForAcc = accountMeetingsMap[acc.account_id] || [];
      formattedAccounts[acc.account_id] = {
        account_id: acc.account_id,
        pool_type: acc.pool_type,
        status: acc.status,
        classes: meetingsForAcc
      };
    });

    const teachersList: any[] = [];
    if (Array.isArray(teacherRows)) {
      teacherRows.forEach((row: any) => {
        const cells = row?.c || [];
        const teacherId = cells[0]?.v;
        const teacherName = cells[1]?.v;
        const expCell = cells[10];

        if (teacherId && String(teacherId).startsWith("teach_")) {
          let expiryDate = "";
          if (expCell) {
            const rawExpV = expCell.v ? String(expCell.v).trim() : "";
            const rawExpF = expCell.f ? String(expCell.f).trim() : "";
            if (rawExpV.startsWith("Date(")) {
              const matches = rawExpV.match(/Date\((\d+),(\d+),(\d+)/);
              if (matches) {
                expiryDate = `${matches[1]}-${String(parseInt(matches[2], 10) + 1).padStart(2, "0")}-${String(matches[3]).padStart(2, "0")}`;
              }
            } else {
              expiryDate = rawExpF || rawExpV;
            }
          }
          teachersList.push({ teacher_id: teacherId, teacher_name: teacherName || "N/A", expiry_date: expiryDate });
        }
      });
    }

    return NextResponse.json({ 
      targetDate,
      accounts: formattedAccounts,
      teachers: teachersList 
    }, {
      headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' }
    });

  } catch (error) {
    console.error("Admin Pool API Error:", error);
    return NextResponse.json({ accounts: {}, teachers: [], error: 'Server Error' }, { status: 200 });
  }
}