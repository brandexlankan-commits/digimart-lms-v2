import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Create an S3 client for Cloudflare R2
const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT || "",
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const teacherId = formData.get("teacher_id") as string;

    if (!file || !teacherId) {
      return NextResponse.json({ error: "Missing file or teacher ID" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // File Name Format: teach_504-16982348.jpg
    const fileExtension = file.name.split('.').pop();
    const fileName = `${teacherId}-${Date.now()}.${fileExtension}`;
    const contentType = file.type || "image/jpeg";

    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME || "",
        Key: fileName,
        Body: buffer,
        ContentType: contentType,
        ACL: "public-read",
      })
    );

    const publicUrl = `${process.env.R2_PUBLIC_DOMAIN}/${fileName}`;

    return NextResponse.json({ success: true, url: publicUrl }, { status: 200 });
  } catch (error: any) {
    console.error("R2 Upload Error:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}