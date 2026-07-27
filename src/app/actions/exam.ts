"use server";

import { adminDb } from "@/lib/firebase-admin";
import { cookies } from "next/headers";

export async function loginWithExamId(examId: string, candidateName: string) {
  if (!examId) {
    return { success: false, error: "Exam ID is required." };
  }

  try {
    const candidateRef = adminDb.collection("examCandidates").doc(examId);
    
    return await adminDb.runTransaction(async (transaction) => {
      const doc = await transaction.get(candidateRef);
      
      if (!doc.exists) {
        return { success: false, error: "Invalid Exam ID." };
      }
      
      const data = doc.data();
      const status = data?.status;
      
      if (status === "blacklisted") {
        return { success: false, error: "This candidate has been blacklisted. Access denied." };
      }
      
      if (status === "completed") {
        return { success: false, error: "This Exam ID has already been used and cannot be reused." };
      }
      
      if (status === "in_progress") {
        if (candidateName && !data?.candidateName) {
           transaction.update(candidateRef, { candidateName });
        }
        cookies().set("EXAM_ID", examId, { httpOnly: true, secure: true, path: "/" });
        return { success: true, status: "in_progress" };
      }
      
      if (status === "unused") {
        // 1. Mark candidate as in_progress (but don't start timer yet)
        transaction.update(candidateRef, {
          status: "in_progress",
          candidateName: candidateName || null
        });
        
        // 2. Create examSubmissions document
        const submissionRef = adminDb.collection("examSubmissions").doc(examId);
        transaction.set(submissionRef, {
          examId,
          status: "in_progress",
          answers: {}
        });
        
        cookies().set("EXAM_ID", examId, { httpOnly: true, secure: true, path: "/" });
        return { success: true, status: "started" };
      }
      
      return { success: false, error: "Unknown status." };
    });
    
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: "An internal error occurred." };
  }
}
