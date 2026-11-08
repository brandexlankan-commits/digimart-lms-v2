import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export async function POST(request: Request) {
  try {
    const endpoint = process.env.R2_ENDPOINT;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME;
    const publicDomain = process.env.R2_PUBLIC_DOMAIN;

    // 1. Check if ANY variable is missing
    if (!endpoint || !accessKeyId || !secretAccessKey || !bucketName || !publicDomain) {
      return NextResponse.json({ 
        error: "Missing R2 Environment Variables in Vercel",
        details: `Endpoint: ${!!endpoint}, AccessKey: ${!!accessKeyId}, SecretKey: ${!!secretAccessKey}, Bucket: ${!!bucketName}, Domain: ${!!publicDomain}`
      }, { status: 500 });
    }

    const s3Client = new S3Client({
      region: "auto",
      endpoint: endpoint,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
    });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const teacherId = formData.get("teacher_id") as string;

    if (!file || !teacherId) {
      return NextResponse.json({ error: "Missing file or teacher ID" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExtension = file.name.split('.').pop();
    const fileName = `${teacherId}-${Date.now()}.${fileExtension}`;
    
    // 2. Upload to Cloudflare R2
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: buffer,
        ContentType: file.type || "image/jpeg",
      })
    );

    const cleanPublicDomain = publicDomain.endsWith('/') ? publicDomain.slice(0, -1) : publicDomain;
    const publicUrl = `${cleanPublicDomain}/${fileName}`;

    return NextResponse.json({ success: true, url: publicUrl }, { status: 200 });

  } catch (error: any) {
    // 3. Return the EXACT error message from Cloudflare
    return NextResponse.json({ 
      error: "Cloudflare R2 Upload Failed", 
      details: error.message || error.name || "Unknown AWS SDK Error"
    }, { status: 500 });
  }
}