import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 🎯 n8n Teacher Update Webhook URL
const N8N_UPDATE_TEACHER_WEBHOOK_URL = "https://n8n.epanthiya.com/webhook/admin-update-teacher";

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

    // 🎯 Process Zoom Pool Accounts (Extracts Account ID, Status, Expire Date, and Email)
    const processPoolRows = (rows: any[], poolType: string) => {
      if (!Array.isArray(rows)) return;
      rows.forEach((row: any) => {
        const cells = row?.c || [];
        if (!cells || cells.length === 0) return;

        // Account ID: Column A (Index 0)
        const rawAccId = String(cells[0]?.v || "").trim();
        if (!rawAccId || rawAccId.toLowerCase().includes("account id")) return;

        // Status: Column E (Index 4)
        const statusVal = String(cells[4]?.v || "").trim().toUpperCase();
        const status = statusVal === "ACTIVE" ? "ACTIVE" : "INACTIVE";

        // 🎯 Expire Date: Column F (Index 5)
        const expCell = cells[5];
        let expireDate = "";
        if (expCell) {
          const rawExpV = expCell.v ? String(expCell.v).trim() : "";
          const rawExpF = expCell.f ? String(expCell.f).trim() : "";
          if (rawExpV.startsWith("Date(")) {
            const matches = rawExpV.match(/Date\((\d+),(\d+),(\d+)/);
            if (matches) {
              const y = matches[1];
              const m = String(parseInt(matches[2], 10) + 1).padStart(2, "0");
              const d = String(matches[3]).padStart(2, "0");
              expireDate = `${y}-${m}-${d}`;
            }
          } else {
            expireDate = rawExpF || rawExpV;
          }
        }

        // 🎯 Email: Column G (Index 6)
        let email = "";
        if (cells[6]) {
          email = String(cells[6]?.v || cells[6]?.f || "").trim();
        }

        allPoolAccounts.push({
          account_id: rawAccId,
          pool_type: poolType,
          status: status,
          expire_date: expireDate,
          email: email
        });
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
        expire_date: acc.expire_date,
        email: acc.email,
        classes: meetingsForAcc
      };
    });

    const teachersList: any[] = [];
    if (Array.isArray(teacherRows)) {
      teacherRows.forEach((row: any) => {
        const cells = row?.c || [];
        const teacherId = cells[0]?.v;
        const teacherName = cells[1]?.v;
        const username = cells[2]?.v || "";
        const expCell = cells[10];

        // 🎯 Payment Status Extraction (Scans for PAID / UNPAID)
        let paymentStatus = "UNPAID";
        cells.forEach((c: any) => {
          const v = String(c?.v || "").trim().toUpperCase();
          if (v === "PAID" || v === "UNPAID") {
            paymentStatus = v;
          }
        });

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
          teachersList.push({ 
            teacher_id: teacherId, 
            teacher_name: teacherName || "N/A", 
            username: username ? String(username).trim() : "N/A",
            expiry_date: expiryDate,
            payment_status: paymentStatus
          });
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

// 🎯 POST Endpoint to update Google Sheets via n8n
export async function POST(request: Request) {
  try {
    const body = await request.json();
    await fetch(N8N_UPDATE_TEACHER_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update Google Sheet" }, { status: 500 });
  }
}