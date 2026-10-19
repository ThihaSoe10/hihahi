import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { cookies } from "next/headers";
import { adminDb } from "@/lib/firebase-admin";
import {
  DESIGN_EXTENSIONS, DESIGN_MAX_BYTES, EXAM_DURATION_MS,
  getQuestionType, VIDEO_EXTENSIONS, VIDEO_MAX_BYTES,
} from "@/lib/exam-config";

const mimeTypes: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
};

export async function POST(req: NextRequest) {
  try {
    const { questionNumber, filename, fileType, fileSize } = await req.json();
    const examId = cookies().get("EXAM_ID")?.value;

    const question = /^q(\d+)$/.exec(String(questionNumber));
    const kind = question ? getQuestionType(Number(question[1])) : null;
    const extension = typeof filename === "string" ? filename.split(".").pop()?.toLowerCase() : null;
    const allowed = kind === "design" ? DESIGN_EXTENSIONS : kind === "video" ? VIDEO_EXTENSIONS : [];
    const maxSize = kind === "design" ? DESIGN_MAX_BYTES : VIDEO_MAX_BYTES;
    if (!examId || !kind || kind === "text" || !extension || !allowed.includes(extension)
      || fileType !== mimeTypes[extension] || !Number.isSafeInteger(fileSize) || fileSize <= 0 || fileSize > maxSize) {
      return NextResponse.json(
        { error: "Invalid upload request" },
        { status: 400 }
      );
    }

    const candidate = (await adminDb.collection("examCandidates").doc(examId).get()).data();
    if (candidate?.status !== "in_progress" || !candidate.startedAt
      || Date.now() >= candidate.startedAt.toDate().getTime() + EXAM_DURATION_MS) {
      return NextResponse.json({ error: "Exam is closed" }, { status: 410 });
    }

    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME;

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
      console.error("R2 credentials not configured.");
      return NextResponse.json(
        { error: "Storage configuration error" },
        { status: 500 }
      );
    }

    const S3 = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });

    const key = `exams/${examId}/${questionNumber}/${crypto.randomUUID()}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: mimeTypes[extension],
    });

    const remainingSeconds = Math.max(1, Math.ceil((candidate.startedAt.toDate().getTime() + EXAM_DURATION_MS - Date.now()) / 1000));
    const url = await getSignedUrl(S3, command, { expiresIn: Math.min(900, remainingSeconds) });

    return NextResponse.json({ url, key });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
