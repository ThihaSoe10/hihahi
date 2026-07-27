"use server";

import { adminDb } from "@/lib/firebase-admin";

export async function getSubmissions() {
  try {
    const candidatesSnap = await adminDb.collection("examCandidates").get();
    const submissionsSnap = await adminDb.collection("examSubmissions").get();
    const blacklistsSnap = await adminDb.collection("blacklist").get();

    const candidates = new Map();
    candidatesSnap.forEach(doc => candidates.set(doc.id, doc.data()));

    const blacklists = new Set();
    blacklistsSnap.forEach(doc => blacklists.add(doc.data().examId));

    const submissions: Record<string, unknown>[] = [];
    submissionsSnap.forEach(doc => {
      const sub = doc.data();
      const cand = candidates.get(doc.id) || {};
      
      submissions.push({
        examId: doc.id,
        candidateName: cand.candidateName || "Unknown",
        status: cand.status || sub.status || "unknown",
        startedAt: cand.startedAt ? cand.startedAt.toDate().toISOString() : null,
        completedAt: cand.completedAt ? cand.completedAt.toDate().toISOString() : null,
        isBlacklisted: blacklists.has(doc.id),
        answers: sub.answers || {},
        aiSuspected: sub.aiSuspected || false,
        adminNotes: sub.adminNotes || "",
      });
    });

    return { success: true, submissions };
  } catch (error) {
    console.error("Failed to get submissions:", error);
    return { success: false, error: "Failed to load submissions" };
  }
}

export async function updateSubmissionNotes(examId: string, aiSuspected: boolean, adminNotes: string) {
  try {
    await adminDb.collection("examSubmissions").doc(examId).update({
      aiSuspected,
      adminNotes
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to update notes:", error);
    return { success: false, error: "Failed to update notes" };
  }
}

export async function blacklistCandidate(examId: string, candidateName: string, reason: string) {
  try {
    const batch = adminDb.batch();
    
    // Add to blacklist collection
    const blacklistRef = adminDb.collection("blacklist").doc();
    batch.set(blacklistRef, {
      examId,
      candidateName,
      reason,
      blacklistedAt: new Date()
    });

    // Update candidate status
    const candidateRef = adminDb.collection("examCandidates").doc(examId);
    batch.update(candidateRef, {
      status: "blacklisted"
    });

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error("Failed to blacklist:", error);
    return { success: false, error: "Failed to blacklist candidate" };
  }
}
