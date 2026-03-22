import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT!,
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle: true, // required for MinIO
});

const BUCKET = process.env.S3_BUCKET || "portfolio";
const PUBLIC_URL = process.env.S3_PUBLIC_URL || process.env.S3_ENDPOINT!;

export async function uploadFile(
  filepath: string,
  body: Buffer | ReadableStream | NodeJS.ReadableStream,
  contentType: string,
): Promise<{ url: string }> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: filepath,
      Body: body as any,
      ContentType: contentType,
      ACL: "public-read",
    }),
  );
  return { url: `${PUBLIC_URL}/${BUCKET}/${filepath}` };
}
