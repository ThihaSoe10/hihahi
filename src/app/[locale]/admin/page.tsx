"use client";

import { useEffect, useState } from "react";
import { getSubmissions, updateSubmissionNotes, blacklistCandidate } from "@/app/actions/admin";
import { getDownloadUrl } from "@/app/actions/s3";

interface Submission {
  examId: string;
  candidateName: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  isBlacklisted: boolean;
  answers: Record<string, string>;
  aiSuspected: boolean;
  adminNotes: string;
}

export default function AdminDashboard() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);

  // Detail view states
  const [aiSuspected, setAiSuspected] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [blacklistReason, setBlacklistReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isBlacklisting, setIsBlacklisting] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    const res = await getSubmissions();
    if (res.success) {
      setSubmissions((res.submissions as unknown as Submission[]) || []);
    } else {
      setError(res.error || "Failed to load");
    }
    setLoading(false);
  };

  const handleSelect = (sub: Submission) => {
    setSelectedSub(sub);
    setAiSuspected(sub.aiSuspected || false);
    setAdminNotes(sub.adminNotes || "");
    setBlacklistReason("");
  };

  const handleSaveNotes = async () => {
    if (!selectedSub) return;
    setIsSaving(true);
    const res = await updateSubmissionNotes(selectedSub.examId as string, aiSuspected, adminNotes);
    if (res.success) {
      alert("Notes saved successfully");
      await fetchSubmissions(); // refresh list
      // update local selected state
      setSelectedSub({...selectedSub, aiSuspected, adminNotes});
    } else {
      alert("Failed to save: " + res.error);
    }
    setIsSaving(false);
  };

  const handleBlacklist = async () => {
    if (!selectedSub) return;
    if (!blacklistReason) {
      alert("Please provide a reason for blacklisting.");
      return;
    }
    if (!confirm(`Are you sure you want to blacklist ${selectedSub.candidateName}? This cannot be easily undone.`)) return;
    
    setIsBlacklisting(true);
    const res = await blacklistCandidate(selectedSub.examId as string, selectedSub.candidateName as string, blacklistReason);
    if (res.success) {
      alert("Candidate blacklisted successfully.");
      setSelectedSub(null);
      await fetchSubmissions();
    } else {
      alert("Failed to blacklist: " + res.error);
    }
    setIsBlacklisting(false);
  };

  const downloadFile = async (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.key) throw new Error("No key found");
      const res = await getDownloadUrl(parsed.key);
      if (res.success && res.url) {
        window.open(res.url, "_blank");
      } else {
        alert("Failed to get download link");
      }
    } catch {
      alert("Could not parse file data.");
    }
  };

  if (loading) {
    return <div className="p-8 text-aizome font-bold animate-pulse">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="p-8 text-kurenai font-bold">{error}</div>;
  }

  return (
    <div className="flex h-screen bg-washi overflow-hidden">
      {/* Sidebar List */}
      <div className="w-1/3 bg-white border-r border-aizome/10 overflow-y-auto">
        <div className="p-6 bg-washi-panel border-b border-aizome/10">
          <h1 className="text-2xl font-bold text-aizome">Exam Submissions</h1>
          <p className="text-sm text-sumi/60 mt-1">{submissions.length} total records</p>
        </div>
        <div className="divide-y divide-aizome/10">
          {submissions.map(sub => (
            <div 
              key={sub.examId}
              onClick={() => handleSelect(sub)}
              className={`p-4 cursor-pointer hover:bg-washi transition-colors ${selectedSub?.examId === sub.examId ? 'bg-washi border-l-4 border-aizome' : 'border-l-4 border-transparent'}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-sumi">{sub.candidateName || "Unknown"}</h3>
                  <p className="text-xs text-sumi/60 font-mono mt-1">{sub.examId}</p>
                </div>
                <div className="text-right">
                  {sub.isBlacklisted ? (
                    <span className="text-xs px-2 py-1 bg-kurenai text-white rounded font-bold">Blacklisted</span>
                  ) : sub.status === 'completed' ? (
                    <span className="text-xs px-2 py-1 bg-matsu text-white rounded font-bold">Completed</span>
                  ) : sub.status === 'in_progress' ? (
                    <span className="text-xs px-2 py-1 bg-aizome text-white rounded font-bold">In Progress</span>
                  ) : (
                    <span className="text-xs px-2 py-1 bg-sumi/20 text-sumi rounded font-bold">Unused</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Detail View */}
      <div className="flex-1 overflow-y-auto bg-washi p-8">
        {selectedSub ? (
          <div className="max-w-4xl mx-auto space-y-8 pb-32">
            
            {/* Header */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-aizome/10 flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-bold text-aizome mb-2">{selectedSub.candidateName}</h2>
                <div className="font-mono text-sumi/60">{selectedSub.examId}</div>
              </div>
              <div className="text-right text-sm space-y-1">
                <div><strong>Started:</strong> {selectedSub.startedAt ? new Date(selectedSub.startedAt).toLocaleString() : 'N/A'}</div>
                <div><strong>Completed:</strong> {selectedSub.completedAt ? new Date(selectedSub.completedAt).toLocaleString() : 'N/A'}</div>
              </div>
            </div>

            {/* Admin Controls */}
            {!selectedSub.isBlacklisted && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-aizome/10 space-y-6">
                <h3 className="text-xl font-bold text-aizome border-b border-aizome/10 pb-2">Admin Review</h3>
                
                <div>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={aiSuspected}
                      onChange={e => setAiSuspected(e.target.checked)}
                      className="w-5 h-5 text-aizome rounded focus:ring-aizome"
                    />
                    <span className="font-medium text-kurenai">Flag: Suspected AI Usage</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-sumi mb-2">Admin Notes (Internal Reasoning)</label>
                  <textarea 
                    value={adminNotes}
                    onChange={e => setAdminNotes(e.target.value)}
                    className="w-full h-24 px-4 py-3 rounded-lg border border-aizome/20 focus:border-aizome focus:ring-1 outline-none resize-y"
                    placeholder="Enter manual review notes here..."
                  />
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-aizome/10">
                  <button 
                    onClick={handleSaveNotes}
                    disabled={isSaving}
                    className="bg-aizome text-white px-6 py-2 rounded-lg font-bold hover:bg-aizome-light transition-colors disabled:opacity-50"
                  >
                    {isSaving ? "Saving..." : "Save Notes"}
                  </button>

                  <div className="flex space-x-2">
                    <input 
                      type="text" 
                      placeholder="Reason for blacklisting..."
                      value={blacklistReason}
                      onChange={e => setBlacklistReason(e.target.value)}
                      className="px-4 py-2 rounded-lg border border-kurenai/20 focus:border-kurenai outline-none text-sm w-64"
                    />
                    <button 
                      onClick={handleBlacklist}
                      disabled={isBlacklisting || !blacklistReason}
                      className="bg-kurenai text-white px-4 py-2 rounded-lg font-bold hover:bg-kurenai/80 transition-colors disabled:opacity-50"
                    >
                      {isBlacklisting ? "Wait..." : "Blacklist Candidate"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {selectedSub.isBlacklisted && (
              <div className="bg-kurenai/10 p-6 rounded-2xl border border-kurenai/20 text-kurenai font-bold text-center">
                This candidate is blacklisted.
              </div>
            )}

            {/* Answers */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-aizome border-b border-aizome/10 pb-2">Exam Submission</h3>
              
              {Object.keys(selectedSub.answers || {}).length === 0 && (
                <div className="text-sumi/60 italic">No answers submitted yet.</div>
              )}

              {Object.keys(selectedSub.answers || {}).sort().map(qId => {
                const isFile = qId.startsWith('q') && parseInt(qId.slice(1)) >= 16;
                const ans = selectedSub.answers[qId];

                return (
                  <div key={qId} className="bg-white p-6 rounded-xl shadow-sm border border-washi-panel">
                    <div className="font-bold text-aizome mb-3">Question {qId.replace('q', '')}</div>
                    {isFile ? (
                      <div>
                        {ans ? (
                          <button 
                            onClick={() => downloadFile(ans)}
                            className="flex items-center space-x-2 text-aizome hover:text-aizome-light font-medium underline"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                            <span>View / Download Attachment</span>
                          </button>
                        ) : (
                          <span className="text-sumi/40 italic">No file uploaded</span>
                        )}
                      </div>
                    ) : (
                      <div className="text-sumi whitespace-pre-wrap">{ans || <span className="text-sumi/40 italic">No answer provided</span>}</div>
                    )}
                  </div>
                );
              })}
            </div>
            
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sumi/40 text-lg font-medium">
            Select a submission from the sidebar to view details.
          </div>
        )}
      </div>
    </div>
  );
}
