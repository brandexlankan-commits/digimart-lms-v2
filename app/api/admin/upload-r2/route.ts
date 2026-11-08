import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Create an S3 client specifically tailored for Cloudflare R2
const createS3Client = () => {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    console.error("Missing R2 Environment Variables:", {
      endpoint: !!endpoint,
      accessKeyId: !!accessKeyId,
      secretAccessKey: !!secretAccessKey,
    });
    throw new Error("Missing Cloudflare R2 Credentials in Environment Variables");
  }

  return new S3Client({
    region: "auto",
    endpoint: endpoint,
    credentials: {
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
    },
    // Adding this is often necessary for R2 compatibility with aws-sdk v3
    forcePathStyle: true, 
  });
};

export async function POST(request: Request) {
  try {
    let s3Client;
    try {
      s3Client = createS3Client();
    } catch (clientError: any) {
       return NextResponse.json({ error: clientError.message }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const teacherId = formData.get("teacher_id") as string;
    const bucketName = process.env.R2_BUCKET_NAME;
    const publicDomain = process.env.R2_PUBLIC_DOMAIN;

    if (!file || !teacherId) {
      return NextResponse.json({ error: "Missing file or teacher ID in the request" }, { status: 400 });
    }

    if(!bucketName || !publicDomain) {
         console.error("Missing R2 Bucket Name or Public Domain:", {
            bucketName: !!bucketName,
            publicDomain: !!publicDomain
         });
         return NextResponse.json({ error: "Missing Bucket Name or Public Domain in Environment Variables" }, { status: 500 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Clean and create file name: teach_504-16982348.jpg
    const fileExtension = file.name.split('.').pop();
    const fileName = `${teacherId}-${Date.now()}.${fileExtension}`;
    const contentType = file.type || "image/jpeg";

    console.log(`Attempting to upload ${fileName} to bucket ${bucketName} at endpoint ${process.env.R2_ENDPOINT}`);

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: buffer,
        ContentType: contentType,
        // ACL "public-read" is sometimes not supported or needed depending on R2 bucket settings. 
        // If your bucket is public, it might not be strictly necessary, but we'll try without it first if it fails.
        // Let's remove ACL for Cloudflare R2 as they recommend managing public access via bucket settings/custom domains.
      })
    );

    // Clean up domain format just in case
    const cleanPublicDomain = publicDomain.endsWith('/') ? publicDomain.slice(0, -1) : publicDomain;
    const publicUrl = `${cleanPublicDomain}/${fileName}`;

    console.log("Upload successful:", publicUrl);

    return NextResponse.json({ success: true, url: publicUrl }, { status: 200 });
  } catch (error: any) {
    // Detailed error logging for Vercel Logs
    console.error("Detailed R2 Upload Error:", {
      message: error.message,
      name: error.name,
      code: error.$metadata?.httpStatusCode || error.Code,
      stack: error.stack
    });
    
    return NextResponse.json({ 
        error: "Failed to upload file to Cloudflare R2", 
        details: error.message 
    }, { status: 500 });
  }
}