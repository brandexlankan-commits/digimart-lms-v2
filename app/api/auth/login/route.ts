import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    const usernameInput = String(username || "").trim().toLowerCase();
    const passwordInput = String(password || "").trim();

    // 1. Next.js එකෙන්ම කෙලින්ම ගූගල් ෂීට් එකේ JSON එක කියවනවා
    const sheetRes = await fetch("https://docs.google.com/spreadsheets/d/1iQeY5nyGO2pPU_Romyf3-px0pL9KYDEuJ_yyBu6VglM/gviz/tq?tqx=out:json&sheet=Teachers", {
      cache: 'no-store' // හැමවෙලේම අලුත්ම ඩේටා ලයිව් ගන්න
    });
    
    const sheetText = await sheetRes.text();

    // Google Sheet JSON එක ක්ලීන් කරගැනීම
    const jsonString = sheetText.substring(sheetText.indexOf("{"), sheetText.lastIndexOf("}") + 1);
    const sheetJson = JSON.parse(jsonString);
    const rows = sheetJson.table.rows;

    // 2. ඩේටා ටික Array එකකට සකස් කරගැනීම
    const teachersData = rows.map((row: any) => {
      return {
        teacher_id: row.c[0]?.v,
        teacher_name: row.c[1]?.v,
        username: row.c[2]?.v,
        password: row.c[3]?.v,
        payment_status: row.c[6]?.v, // G column එක
      };
    });

    // 3. Username එක සොයනවා
    const matchedTeacher = teachersData.find((t: any) => {
      const sheetUsername = String(t.username || "").trim().toLowerCase();
      return sheetUsername === usernameInput;
    });

    if (!matchedTeacher) {
      return NextResponse.json({ status: "failed", message: "ඇතුලත් කළ Username එක වැරදියි බං!" });
    }

    // 4. Password එක සොයනවා
    const sheetPassword = String(matchedTeacher.password || "").trim();
    if (sheetPassword !== passwordInput) {
      return NextResponse.json({ status: "failed", message: "ඇතුලත් කළ Password එක වැරදියි බං!" });
    }

    // 5. Payment Status එක සොයනවා
    const paymentStatus = String(matchedTeacher.payment_status || "").trim().toLowerCase();
    if (paymentStatus !== "paid") {
      return NextResponse.json({ status: "suspended", message: "ඔබගේ ගෙවීම් කටයුතු සක්‍රීය නැත. කරුණාකර Digimart සහයෝගිතාව අමතන්න!" });
    }

    // 6. හැමදේම සාර්ථක නම් දත්ත ටික Frontend එකට යවනවා
    return NextResponse.json({
      status: "success",
      teacher_id: matchedTeacher.teacher_id,
      teacher_name: matchedTeacher.teacher_name
    });

  } catch (error) {
    console.error("Login API Error:", error);
    return NextResponse.json({ status: 'failed', message: 'සර්වර් එකේ බිඳවැටීමක් සිදුවිය!' }, { status: 500 });
  }
}