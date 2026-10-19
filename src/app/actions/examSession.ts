"use server";

import { adminDb } from "@/lib/firebase-admin";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";
import { EXAM_DURATION_MS } from "@/lib/exam-config";

const SUBMISSION_NETWORK_GRACE_MS = 15 * 1000;

function hasExpired(startedAt: { toDate: () => Date } | undefined): boolean {
  return Boolean(startedAt && Date.now() >= startedAt.toDate().getTime() + EXAM_DURATION_MS);
}

function getExamId(): string {
  const cookieStore = cookies();
  const examId = cookieStore.get("EXAM_ID")?.value;
  if (!examId) {
    throw new Error("No active exam session.");
  }
  return examId;
}

export async function getExamState() {
  try {
    const examId = getExamId();
    const candidateRef = adminDb.collection("examCandidates").doc(examId);
    const submissionRef = adminDb.collection("examSubmissions").doc(examId);
    const [candidateDoc, submissionDoc] = await Promise.all([candidateRef.get(), submissionRef.get()]);

    if (!candidateDoc.exists || !submissionDoc.exists) {
      return { success: false, error: "Exam data not found." };
    }

    const candidate = candidateDoc.data()!;
    const submission = submissionDoc.data()!;

    if (candidate.status === "completed") {
      return { success: false, status: "completed" };
    }

    if (hasExpired(candidate.startedAt)) {
      await adminDb.runTransaction(async (transaction) => {
        const freshCandidate = await transaction.get(candidateRef);
        if (freshCandidate.data()?.status !== "in_progress") return;
        transaction.update(candidateRef, { status: "completed", completedAt: FieldValue.serverTimestamp() });
        transaction.update(submissionRef, { status: "completed", completedAt: FieldValue.serverTimestamp() });
      });
      cookies().delete("EXAM_ID");
      return { success: false, status: "completed" };
    }

    return {
      success: true,
      status: candidate.status,
      startedAt: candidate.startedAt ? candidate.startedAt.toDate().toISOString() : null,
      serverNow: new Date().toISOString(),
      answers: submission.answers || {},
    };
  } catch (error) {
    console.error("getExamState error:", error);
    return { success: false, error: "Failed to get exam state." };
  }
}

export async function startExamTimer() {
  try {
    const examId = getExamId();
    const candidateRef = adminDb.collection("examCandidates").doc(examId);
    const submissionRef = adminDb.collection("examSubmissions").doc(examId);

    const now = FieldValue.serverTimestamp();

    await adminDb.runTransaction(async (transaction) => {
      const doc = await transaction.get(candidateRef);
      if (!doc.exists) throw new Error("Not found");
      const data = doc.data();

      if (data?.status !== "in_progress") throw new Error("Exam is unavailable");
      if (!data.startedAt) {
        transaction.update(candidateRef, { startedAt: now });
        transaction.update(submissionRef, { startedAt: now });
      }
    });

    const updated = await candidateRef.get();
    return {
      success: true,
      startedAt: updated.data()?.startedAt?.toDate().toISOString(),
      serverNow: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Start exam error:", error);
    return { success: false, error: "Failed to start exam." };
  }
}

export type ExamActionResponse = 
  | { success: true; timestamp: string }
  | { success: false; error: string };

export async function autosaveExam(answers: Record<string, string>): Promise<ExamActionResponse> {
  try {
    const examId = getExamId();
    const submissionRef = adminDb.collection("examSubmissions").doc(examId);
    const candidateRef = adminDb.collection("examCandidates").doc(examId);
    const saved = await adminDb.runTransaction(async (transaction) => {
      const candidateDoc = await transaction.get(candidateRef);
      const candidate = candidateDoc.data();
      if (candidate?.status !== "in_progress" || !candidate.startedAt || hasExpired(candidate.startedAt)) return false;
      transaction.update(submissionRef, { answers, lastSavedAt: FieldValue.serverTimestamp() });
      return true;
    });
    if (!saved) return { success: false, error: "Exam is closed" };
    return { success: true, timestamp: new Date().toISOString() };
  } catch (error) {
    console.error("Autosave error:", error);
    return { success: false, error: "Failed to autosave" };
  }
}

export async function submitExam(answers: Record<string, string>): Promise<ExamActionResponse> {
  try {
    const examId = getExamId();
    const candidateRef = adminDb.collection("examCandidates").doc(examId);
    const submissionRef = adminDb.collection("examSubmissions").doc(examId);
    
    await adminDb.runTransaction(async (transaction) => {
      const [candidateDoc, submissionDoc] = await Promise.all([
        transaction.get(candidateRef),
        transaction.get(submissionRef),
      ]);
      const candidate = candidateDoc.data();
      if (candidate?.status !== "in_progress" || !candidate.startedAt || !submissionDoc.exists) {
        throw new Error("Exam is unavailable");
      }
      const deadline = candidate.startedAt.toDate().getTime() + EXAM_DURATION_MS;
      const finalAnswers = Date.now() <= deadline + SUBMISSION_NETWORK_GRACE_MS
        ? answers
        : (submissionDoc.data()?.answers || {});
      const completedAt = FieldValue.serverTimestamp();
      transaction.update(candidateRef, { status: "completed", completedAt });
      transaction.update(submissionRef, { status: "completed", completedAt, answers: finalAnswers });
    });

    cookies().delete("EXAM_ID");
    
    return { success: true, timestamp: new Date().toISOString() };
  } catch (error) {
    console.error("Submit error:", error);
    return { success: false, error: "Failed to submit" };
  }
}
