import {
  RekognitionClient,
  DetectLabelsCommand,
  IndexFacesCommand,
  SearchFacesByImageCommand,
  CreateCollectionCommand,
  DescribeCollectionCommand,
} from "@aws-sdk/client-rekognition";
import { env } from "../../config/env.js";

const COLLECTION_ID = "eventvault-faces";
let collectionVerified = false;
let rekognitionClient: RekognitionClient | null = null;

const getRekognitionClient = (): RekognitionClient => {
  if (!rekognitionClient) {
    rekognitionClient = new RekognitionClient({
      region: env.awsRegion,
      credentials: {
        accessKeyId: env.awsAccessKeyId,
        secretAccessKey: env.awsSecretAccessKey,
      },
    });
  }
  return rekognitionClient;
};

const ensureCollectionExists = async (client: RekognitionClient) => {
  if (collectionVerified) return;
  try {
    await client.send(new DescribeCollectionCommand({ CollectionId: COLLECTION_ID }));
    collectionVerified = true;
  } catch (error: any) {
    if (error.name === "ResourceNotFoundException") {
      try {
        console.log(`Creating AWS Rekognition face collection: ${COLLECTION_ID}`);
        await client.send(new CreateCollectionCommand({ CollectionId: COLLECTION_ID }));
        collectionVerified = true;
      } catch (err) {
        console.error("Failed to create Rekognition face collection:", err);
      }
    } else {
      console.error("Failed to describe Rekognition collection:", error);
    }
  }
};

export const detectLabels = async (s3Key: string): Promise<string[]> => {
  if (!env.awsAccessKeyId || !env.awsSecretAccessKey || !env.awsS3BucketName) {
    return [];
  }
  try {
    const client = getRekognitionClient();
    const command = new DetectLabelsCommand({
      Image: {
        S3Object: {
          Bucket: env.awsS3BucketName,
          Name: s3Key,
        },
      },
      MaxLabels: 8,
      MinConfidence: 75,
    });
    const response = await client.send(command);
    return (response.Labels || [])
      .map((label) => (label.Name || "").toLowerCase())
      .filter((name) => name.length > 0);
  } catch (error) {
    console.error("AWS Rekognition detectLabels failed:", error);
    return [];
  }
};

export const indexReferenceSelfie = async (userId: string, s3Key: string): Promise<void> => {
  if (!env.awsAccessKeyId || !env.awsSecretAccessKey || !env.awsS3BucketName) {
    return;
  }
  try {
    const client = getRekognitionClient();
    await ensureCollectionExists(client);

    const command = new IndexFacesCommand({
      CollectionId: COLLECTION_ID,
      Image: {
        S3Object: {
          Bucket: env.awsS3BucketName,
          Name: s3Key,
        },
      },
      ExternalImageId: userId,
      MaxFaces: 1,
      QualityFilter: "AUTO",
    });
    await client.send(command);
    console.log(`Successfully indexed face print for User ${userId} using key ${s3Key}`);
  } catch (error) {
    console.error("AWS Rekognition indexReferenceSelfie failed:", error);
  }
};

export const searchFaces = async (s3Key: string): Promise<string[]> => {
  if (!env.awsAccessKeyId || !env.awsSecretAccessKey || !env.awsS3BucketName) {
    return [];
  }
  try {
    const client = getRekognitionClient();
    await ensureCollectionExists(client);

    const command = new SearchFacesByImageCommand({
      CollectionId: COLLECTION_ID,
      Image: {
        S3Object: {
          Bucket: env.awsS3BucketName,
          Name: s3Key,
        },
      },
      FaceMatchThreshold: 95,
      MaxFaces: 10,
    });
    const response = await client.send(command);
    const userIds = (response.FaceMatches || [])
      .filter((match) => match.Similarity !== undefined && match.Similarity >= 95)
      .map((match) => match.Face?.ExternalImageId || "")
      .filter((id) => id.length > 0);

    return Array.from(new Set(userIds));
  } catch (error: any) {
    if (error.name === "InvalidParameterException" && error.message.includes("does not contain faces")) {
      // No face found in this specific photo, return empty gracefully
      return [];
    }
    console.error("AWS Rekognition searchFaces failed:", error);
    return [];
  }
};

export const generateCaption = async (labels: string[]): Promise<string> => {
  if (labels.length === 0) {
    return "Event media upload";
  }

  const promptText = `Generate a short, friendly, and engaging social media caption (1 sentence) for an event photo that contains these elements: ${labels.join(", ")}. Do not wrap the text in quotes or add anything else.`;

  if (env.geminiApiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.geminiApiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: promptText,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (response.ok) {
        const payload: any = await response.json();
        const caption = payload.candidates?.[0]?.content?.parts?.[0]?.text;
        if (caption) {
          return caption.trim();
        }
      }
    } catch (err) {
      console.warn("Failed to generate caption with Gemini API, falling back:", err);
    }
  }

  const topLabels = labels.slice(0, 3).map((l) => l.toLowerCase());
  return `A wonderful capture featuring ${topLabels.join(", ")}.`;
};
