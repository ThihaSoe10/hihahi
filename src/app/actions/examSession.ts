"use server";

import { adminDb } from "@/lib/firebase-admin";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";

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
    const candidateDoc = await adminDb.collection("examCandidates").doc(examId).get();
    const submissionDoc = await adminDb.collection("examSubmissions").doc(examId).get();

    if (!candidateDoc.exists || !submissionDoc.exists) {
      return { success: false, error: "Exam data not found." };
    }

    const candidate = candidateDoc.data()!;
    const submission = submissionDoc.data()!;

    if (candidate.status === "completed") {
      return { success: false, status: "completed" };
    }

    return {
      success: true,
      status: candidate.status,
      startedAt: candidate.startedAt ? candidate.startedAt.toDate().toISOString() : null,
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

      if (!data?.startedAt) {
        transaction.update(candidateRef, { startedAt: now });
        transaction.update(submissionRef, { startedAt: now });
      }
    });

    const updated = await candidateRef.get();
    return {
      success: true,
      startedAt: updated.data()?.startedAt?.toDate().toISOString(),
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
    const candidateDoc = await adminDb.collection("examCandidates").doc(examId).get();
    const candidateData = candidateDoc.data();
    
    if (candidateData?.startedAt) {
      const startedAt = candidateData.startedAt.toDate();
      const elapsed = Date.now() - startedAt.getTime();
      const maxDuration = 80 * 60 * 1000; // 80 minutes
      const gracePeriod = 60 * 1000; // 1 minute grace period
      
      if (elapsed > maxDuration + gracePeriod) {
        return submitExam(answers);
      }
    }

    await submissionRef.update({
      answers,
      lastSavedAt: FieldValue.serverTimestamp()
    });
    
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
    
    const now = FieldValue.serverTimestamp();

    const batch = adminDb.batch();
    
    batch.update(candidateRef, {
      status: "completed",
      completedAt: now
    });
    
    batch.update(submissionRef, {
      status: "completed",
      completedAt: now,
      answers,
    });
    
    await batch.commit();

    cookies().delete("EXAM_ID");
    
    return { success: true, timestamp: new Date().toISOString() };
  } catch (error) {
    console.error("Submit error:", error);
    return { success: false, error: "Failed to submit" };
  }
}
