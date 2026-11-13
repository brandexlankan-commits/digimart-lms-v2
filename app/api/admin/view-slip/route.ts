import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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
        { error: `Failed to fetch slip (${upstreamRes.status})` },
        { status: upstreamRes.status }
      );
    }

    const arrayBuffer = await upstreamRes.arrayBuffer();
    let finalBuffer: Buffer = Buffer.from(arrayBuffer);

    // Base64 text ලෙස save වී ඇත්නම් binary බවට පත් කිරීම
    const headText = finalBuffer.subarray(0, 80).toString("utf8").trim();
    if (headText.startsWith("data:") && headText.includes(";base64,")) {
      const fullText = finalBuffer.toString("utf8").trim();
      const base64Part = fullText.slice(fullText.indexOf(";base64,") + 8);
      finalBuffer = Buffer.from(base64Part, "base64");
    } else if (headText.startsWith("JVBERi0")) {
      const fullText = finalBuffer.toString("utf8").trim();
      finalBuffer = Buffer.from(fullText, "base64");
    }

    // File signature (Magic bytes) පරීක්ෂා කර නිවැරදි Content-Type හඳුනා ගැනීම
    let contentType = "application/pdf";
    let ext = "pdf";

    const isPdfBytes =
      finalBuffer.length >= 4 &&
      finalBuffer[0] === 0x25 && // %
      finalBuffer[1] === 0x50 && // P
      finalBuffer[2] === 0x44 && // D
      finalBuffer[3] === 0x46;   // F

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

    if (isPdfBytes || fileUrl.toLowerCase().includes(".pdf")) {
      contentType = "application/pdf";
      ext = "pdf";
    } else if (isPngBytes) {
      contentType = "image/png";
      ext = "png";
    } else if (isJpegBytes) {
      contentType = "image/jpeg";
      ext = "jpg";
    } else if (isWebpBytes) {
      contentType = "image/webp";
      ext = "webp";
    }

    const disposition = isDownload
      ? `attachment; filename="bank-slip.${ext}"`
      : `inline; filename="bank-slip.${ext}"`;

    return new NextResponse(new Uint8Array(finalBuffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": disposition,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("View slip proxy error:", error);
    return NextResponse.json({ error: "Failed to load bank slip" }, { status: 500 });
  }
}