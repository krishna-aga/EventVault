import { PutObjectCommand, GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../../config/env.js";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const UPLOAD_DIR_NAME = "uploads";
const LOCAL_UPLOAD_DIR = path.resolve(process.cwd(), "public", UPLOAD_DIR_NAME);

// Ensure local uploads directory exists
if (!fs.existsSync(LOCAL_UPLOAD_DIR)) {
  fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
}

const isS3Configured = (): boolean => {
  return !!(
    env.awsAccessKeyId &&
    env.awsSecretAccessKey &&
    env.awsS3BucketName
  );
};

let s3Client: S3Client | null = null;

const getS3Client = (): S3Client => {
  if (!s3Client) {
    s3Client = new S3Client({
      region: env.awsRegion,
      credentials: {
        accessKeyId: env.awsAccessKeyId,
        secretAccessKey: env.awsSecretAccessKey,
      },
    });
  }
  return s3Client;
};

export interface UploadResult {
  fileUrl: string;
  thumbnailUrl: string | null;
  fileType: "photo" | "video";
  fileSize: number;
}

export const uploadFile = async (
  file: Express.Multer.File,
): Promise<UploadResult> => {
  const fileExt = path.extname(file.originalname);
  const uniqueName = `${crypto.randomUUID()}${fileExt}`;
  
  // Determine file type
  const isVideo = file.mimetype.startsWith("video/");
  const fileType = isVideo ? ("video" as const) : ("photo" as const);
  
  if (isS3Configured()) {
    try {
      const client = getS3Client();
      const uploadParams = {
        Bucket: env.awsS3BucketName,
        Key: uniqueName,
        Body: file.buffer,
        ContentType: file.mimetype,
      };
      
      await client.send(new PutObjectCommand(uploadParams));
      
      const fileUrl = `https://${env.awsS3BucketName}.s3.${env.awsRegion}.amazonaws.com/${uniqueName}`;
      return {
        fileUrl,
        thumbnailUrl: null, // S3 compression/thumbnail processing can be integrated in later phases
        fileType,
        fileSize: file.size,
      };
    } catch (error) {
      console.warn("Failed S3 upload, falling back to local storage:", error);
    }
  }

  // Fallback: Local Storage
  const destinationPath = path.join(LOCAL_UPLOAD_DIR, uniqueName);
  await fs.promises.writeFile(destinationPath, file.buffer);
  
  // The local server URL will be constructed using host (e.g. /uploads/filename)
  const fileUrl = `/uploads/${uniqueName}`;
  return {
    fileUrl,
    thumbnailUrl: null,
    fileType,
    fileSize: file.size,
  };
};

export const deleteFile = async (fileUrl: string): Promise<void> => {
  if (!fileUrl) return;

  const filename = path.basename(fileUrl);

  if (isS3Configured() && fileUrl.includes(".amazonaws.com/")) {
    try {
      const client = getS3Client();
      // Delete from S3 logic (can be expanded with DeleteObjectCommand)
      // For now we log it or execute it if bucket config is fully valid
    } catch (error) {
      console.error("Failed to delete file from S3:", error);
    }
    return;
  }

  // Delete local file
  const localFilePath = path.join(LOCAL_UPLOAD_DIR, filename);
  if (fs.existsSync(localFilePath)) {
    try {
      await fs.promises.unlink(localFilePath);
    } catch (error) {
      console.error("Failed to delete local file:", error);
    }
  }
};

export const downloadFileBuffer = async (fileUrl: string): Promise<Buffer> => {
  const filename = path.basename(fileUrl);
  if (isS3Configured() && fileUrl.includes(".amazonaws.com/")) {
    const client = getS3Client();
    const command = new GetObjectCommand({
      Bucket: env.awsS3BucketName,
      Key: filename,
    });
    const response = await client.send(command);
    const responseBody = response.Body;
    if (responseBody) {
      const chunks: any[] = [];
      for await (const chunk of responseBody as any) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    }
    throw new Error("Empty body from S3");
  }

  const localFilePath = path.join(LOCAL_UPLOAD_DIR, filename);
  return await fs.promises.readFile(localFilePath);
};

export const signFileUrl = async (fileUrl: string): Promise<string> => {
  if (!fileUrl) return fileUrl;

  // If local static path, don't sign
  if (!fileUrl.startsWith("http://") && !fileUrl.startsWith("https://")) {
    return fileUrl;
  }

  if (isS3Configured() && fileUrl.includes(".amazonaws.com/")) {
    try {
      const filename = path.basename(fileUrl);
      const client = getS3Client();
      const command = new GetObjectCommand({
        Bucket: env.awsS3BucketName,
        Key: filename,
      });
      return await getSignedUrl(client, command, { expiresIn: 3600 });
    } catch (error) {
      console.warn("Failed to generate S3 presigned URL:", error);
    }
  }

  return fileUrl;
};
