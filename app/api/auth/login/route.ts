import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // 1. Next.js එකෙන්ම කෙලින්ම ගූගල් ෂීට් එකේ JSON එක කියවනවා
    const sheetRes = await fetch("https://docs.google.com/spreadsheets/d/1iQeY5nyGO2pPU_Romyf3-px0pL9KYDEuJ_yyBu6VglM/gviz/tq?tqx=out:json&sheet=Teachers", {
      cache: 'no-store' // හැමවෙලේම අලුත්ම ඩේටා ගන්න
    });
    
    const sheetText = await sheetRes.text();

    // Google Sheet JSON එක ක්ලීන් කරගැනීම
    const jsonString = sheetText.substring(sheetText.indexOf("{"), sheetText.lastIndexOf("}") + 1);
    const sheetJson = JSON.parse(jsonString);
    const rows = sheetJson.table.rows;

    // ඩේටා ටික Array එකකට සකස් කරගැනීම
    const teachersData = rows.map((row: any) => {
      return {
        "Teacher ID": row.c[0]?.v,
        "Teacher Name": row.c[1]?.v,
        "Username": row.c[2]?.v,
        "Password": row.c[3]?.v,
        "Payment Status": row.c[6]?.v, // G column එක
      };
    });

    // 2. n8n එකට ලොගින් ඩේටා සමඟ ෂීට් එකේ ඩේටා ඔක්කොම එකපාර POST කරනවා
    const n8nResponse = await fetch("https://n8n.epanthiya.com/webhook/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        password,
        teachersData
      })
    });

    const authResult = await n8nResponse.json();
    return NextResponse.json(authResult);

  } catch (error) {
    console.error("Login API Error:", error);
    return NextResponse.json({ status: 'failed', message: 'සර්වර් එකේ බිඳවැටීමක් සිදුවිය!' }, { status: 500 });
  }
}