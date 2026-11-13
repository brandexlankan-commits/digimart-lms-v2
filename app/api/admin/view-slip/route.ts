import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function hasPdfMagicBytes(buf: Buffer): boolean {
  return (
    buf.length >= 5 &&
    buf[0] === 0x25 && // %
    buf[1] === 0x50 && // P
    buf[2] === 0x44 && // D
    buf[3] === 0x46 && // F
    buf[4] === 0x2d    // -
  );
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get("url");
    const isDownload = searchParams.get("download") === "1";

    if (!fileUrl || (!fileUrl.startsWith("https://") && !fileUrl.startsWith("http://"))) {
      return NextResponse.json({ error: "Invalid file URL" }, { status: 400 });
    }

    const upstreamRes = await fetch(fileUrl, { cache: "no-store" });
    if (!upstreamRes.ok) {
      return NextResponse.json(
        { error: `Failed to fetch slip from storage (${upstreamRes.status})` },
        { status: upstreamRes.status }
      );
    }

    const arrayBuffer = await upstreamRes.arrayBuffer();
    let finalBuffer: Buffer = Buffer.from(arrayBuffer);

    // 1. Plain Base64 text ලෙස save වී ඇත්නම් (data:application/pdf;base64,JVBERi... හෝ JVBERi...)
    if (!hasPdfMagicBytes(finalBuffer)) {
      const headUtf8 = finalBuffer.subarray(0, 300).toString("utf8");
      const jvIndex = headUtf8.indexOf("JVBERi");
      if (jvIndex !== -1) {
        const fullUtf8 = finalBuffer.toString("utf8");
        const b64Start = fullUtf8.indexOf("JVBERi");
        const cleanB64 = fullUtf8
          .slice(b64Start)
          .replace(/["'\s\r\n]+$/g, "")
          .trim();
        const decoded = Buffer.from(cleanB64, "base64");
        if (hasPdfMagicBytes(decoded)) {
          finalBuffer = decoded;
        }
      }
    }

    // 2. n8n හිදී "data:application/pdf;base64," ඉවත් නොකර Base64 decode කර R2 වෙත save වී ඇත්නම්
    if (!hasPdfMagicBytes(finalBuffer)) {
      const reEncodedB64 = finalBuffer.toString("base64");
      const jvInReEncoded = reEncodedB64.indexOf("JVBERi");
      if (jvInReEncoded > 0 && jvInReEncoded < 200) {
        const recovered = Buffer.from(reEncodedB64.slice(jvInReEncoded), "base64");
        if (hasPdfMagicBytes(recovered)) {
          finalBuffer = recovered;
        }
      }
    }

    // 3. Latin1 -> UTF-8 mojibake ලෙස binary PDF bytes වෙනස් වී ඇත්නම් නිවැරදි කිරීම
    if (hasPdfMagicBytes(finalBuffer)) {
      const headHex = finalBuffer.subarray(0, 64).toString("hex");
      if (headHex.includes("c3a2c3a3")) {
        const fixedMojibake = Buffer.from(finalBuffer.toString("utf8"), "latin1");
        if (hasPdfMagicBytes(fixedMojibake)) {
          finalBuffer = fixedMojibake;
        }
      }
    }

    // 4. Magic bytes අනුව නිවැරදි Content-Type හඳුනා ගැනීම
    const isPngBytes =
      finalBuffer.length >= 4 &&
      finalBuffer[0] === 0x89 &&
      finalBuffer[1] === 0x50 &&
      finalBuffer[2] === 0x4e &&
      finalBuffer[3] === 0x47;

    const isJpegBytes =
      finalBuffer.length >= 3 &&
      finalBuffer[0] === 0xff &&
      finalBuffer[1] === 0xd8 &&
      finalBuffer[2] === 0xff;

    const isWebpBytes =
      finalBuffer.length >= 12 &&
      finalBuffer[0] === 0x52 &&
      finalBuffer[1] === 0x49 &&
      finalBuffer[2] === 0x46 &&
      finalBuffer[3] === 0x46 &&
      finalBuffer[8] === 0x57 &&
      finalBuffer[9] === 0x45 &&
      finalBuffer[10] === 0x42 &&
      finalBuffer[11] === 0x50;

    if (hasPdfMagicBytes(finalBuffer)) {
      const disposition = isDownload
        ? 'attachment; filename="bank-slip.pdf"'
        : 'inline; filename="bank-slip.pdf"';

      return new NextResponse(new Uint8Array(finalBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": disposition,
          "Content-Length": String(finalBuffer.length),
          "X-Content-Type-Options": "nosniff",
          "Cache-Control": "no-store, max-age=0",
        },
      });
    }

    if (isPngBytes || isJpegBytes || isWebpBytes) {
      const imgType = isPngBytes ? "image/png" : isJpegBytes ? "image/jpeg" : "image/webp";
      const imgExt = isPngBytes ? "png" : isJpegBytes ? "jpg" : "webp";
      const disposition = isDownload
        ? `attachment; filename="bank-slip.${imgExt}"`
        : `inline; filename="bank-slip.${imgExt}"`;

      return new NextResponse(new Uint8Array(finalBuffer), {
        status: 200,
        headers: {
          "Content-Type": imgType,
          "Content-Disposition": disposition,
          "Cache-Control": "no-store, max-age=0",
        },
      });
    }

    // 5. ගොනුව සම්පූර්ණයෙන්ම හිස් හෝ වෙනත් දෝෂයක් නම් පැහැදිලි පණිවිඩයක් පෙන්වීම
    const previewSnippet = finalBuffer
      .subarray(0, 120)
      .toString("utf8")
      .replace(/[<>&]/g, "");

    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <body style="background:#0f172a;color:#f8fafc;font-family:sans-serif;padding:24px;">
          <h3 style="color:#f87171;">⚠️ මෙම PDF ගොනුව Storage හි නිවැරදිව Save වී නොමැත</h3>
          <p style="font-size:13px;color:#cbd5e1;">File Size: ${finalBuffer.length} bytes</p>
          <pre style="background:#020617;padding:12px;border-radius:8px;font-size:11px;overflow:auto;color:#94a3b8;">${previewSnippet}</pre>
        </body>
      </html>`,
      {
        status: 422,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  } catch (error) {
    console.error("View slip proxy error:", error);
    return NextResponse.json({ error: "Failed to load bank slip" }, { status: 500 });
  }
}