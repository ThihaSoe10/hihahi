"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { autosaveExam, submitExam } from "@/app/actions/examSession";

interface ExamFormProps {
  initialAnswers: Record<string, string>;
  onSubmitComplete: () => void;
}

export default function ExamForm({ initialAnswers, onSubmitComplete }: ExamFormProps) {
  const t = useTranslations("Session.Exam");
  const tQ = useTranslations("Session.Exam.questions");

  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Upload States
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadStatus, setUploadStatus] = useState<Record<string, 'uploading' | 'completed' | 'error'>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  
  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const result = await autosaveExam(answersRef.current);
      if (result.success) {
        const timeString = new Date(result.timestamp).toLocaleTimeString();
        setLastSaved(timeString);
      }
    }, 30000); 

    return () => clearInterval(interval);
  }, []);

  const handleChange = (id: string, val: string) => {
    setAnswers(prev => ({ ...prev, [id]: val }));
  };

  const handleFileChange = async (id: string, file: File | null) => {
    if (!file) {
      handleChange(id, "");
      setUploadStatus(prev => { const s = {...prev}; delete s[id]; return s; });
      setUploadProgress(prev => { const p = {...prev}; delete p[id]; return p; });
      setUploadErrors(prev => { const e = {...prev}; delete e[id]; return e; });
      return;
    }

    const isSectionB = id.startsWith('q') && parseInt(id.slice(1)) >= 16 && parseInt(id.slice(1)) <= 20;
    const isSectionC = id.startsWith('q') && parseInt(id.slice(1)) >= 21;

    // Validate size and type
    if (isSectionB) {
      if (file.size > 20 * 1024 * 1024) {
        setUploadErrors(prev => ({...prev, [id]: "File exceeds 20MB limit."}));
        setUploadStatus(prev => ({...prev, [id]: 'error'}));
        return;
      }
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!['txt', 'js', 'ts', 'py', 'java', 'zip'].includes(ext || '')) {
        setUploadErrors(prev => ({...prev, [id]: "Invalid file type. Allowed: .txt, .js, .ts, .py, .java, .zip"}));
        setUploadStatus(prev => ({...prev, [id]: 'error'}));
        return;
      }
    }

    if (isSectionC) {
      if (file.size > 500 * 1024 * 1024) {
        setUploadErrors(prev => ({...prev, [id]: "File exceeds 500MB limit."}));
        setUploadStatus(prev => ({...prev, [id]: 'error'}));
        return;
      }
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!['mp4', 'mov', 'webm'].includes(ext || '')) {
        setUploadErrors(prev => ({...prev, [id]: "Invalid video format. Allowed: .mp4, .mov, .webm"}));
        setUploadStatus(prev => ({...prev, [id]: 'error'}));
        return;
      }
    }

    setUploadErrors(prev => { const newErr = {...prev}; delete newErr[id]; return newErr; });
    setUploadStatus(prev => ({...prev, [id]: 'uploading'}));
    setUploadProgress(prev => ({...prev, [id]: 0}));

    try {
      const res = await fetch("/api/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionNumber: id,
          filename: file.name,
          fileType: file.type || "application/octet-stream",
        })
      });

      if (!res.ok) throw new Error("Failed to get upload URL");
      const { url, key } = await res.json();

      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url, true);
      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
      
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(prev => ({...prev, [id]: percentComplete}));
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          setUploadStatus(prev => ({...prev, [id]: 'completed'}));
          handleChange(id, JSON.stringify({ key, filename: file.name, url }));
        } else {
          setUploadStatus(prev => ({...prev, [id]: 'error'}));
          setUploadErrors(prev => ({...prev, [id]: "Upload failed. Please try again."}));
        }
      };

      xhr.onerror = () => {
        setUploadStatus(prev => ({...prev, [id]: 'error'}));
        setUploadErrors(prev => ({...prev, [id]: "Network error during upload."}));
      };

      xhr.send(file);
    } catch (err) {
      console.error(err);
      setUploadStatus(prev => ({...prev, [id]: 'error'}));
      setUploadErrors(prev => ({...prev, [id]: "Upload failed. Please retry."}));
    }
  };

  const hasActiveUploads = Object.values(uploadStatus).some(status => status === 'uploading');
  const hasUploadErrors = Object.values(uploadStatus).some(status => status === 'error');

  // Helper to parse filename if it exists in answer string
  const getFilename = (id: string) => {
    try {
      const parsed = JSON.parse(answers[id]);
      return parsed.filename;
    } catch {
      return null;
    }
  };

  const missingQuestions: string[] = [];
  for (let i = 1; i <= 15; i++) {
    if (!answers[`q${i}`] || answers[`q${i}`].trim() === "") missingQuestions.push(`Q${i}`);
  }
  for (let i = 16; i <= 22; i++) {
    if (!answers[`q${i}`] || !getFilename(`q${i}`)) missingQuestions.push(`Q${i}`);
  }

  const handleSubmit = async (isAutoSubmit: boolean = false) => {
    if (!isAutoSubmit) {
      if (hasActiveUploads) {
        alert("Please wait for all uploads to finish before submitting.");
        return;
      }
      if (hasUploadErrors) {
        alert("Please fix all upload errors before submitting.");
        return;
      }
      if (missingQuestions.length > 0) {
        alert(`Please complete all 22 questions before submitting.\nMissing: ${missingQuestions.join(', ')}`);
        return;
      }
    }

    setIsSubmitting(true);
    const result = await submitExam(answersRef.current);
    if (result.success) {
      onSubmitComplete();
    } else {
      setIsSubmitting(false);
      if (!isAutoSubmit) {
        alert("Failed to submit. Please try again.");
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 pb-32 space-y-16">
      
      {lastSaved && (
        <div className="fixed top-6 right-6 bg-matsu text-washi px-4 py-2 rounded-lg shadow-md text-sm font-medium z-40 opacity-80">
          {t("savedAt")} {lastSaved}
        </div>
      )}

      {/* SECTION A */}
      <section className="space-y-10">
        <h2 className="text-2xl font-bold text-aizome border-b-2 border-aizome pb-2">{t("sectionA")}</h2>
        {[...Array(15)].map((_, i) => {
          const qId = `q${i + 1}`;
          return (
            <div key={qId} className="space-y-4">
              <label className="block text-lg font-medium text-sumi select-none">
                {i + 1}. {tQ(qId)}
              </label>
              <textarea
                className="w-full h-32 px-4 py-3 rounded-xl border border-aizome/20 focus:border-aizome focus:ring-1 focus:ring-aizome outline-none resize-y"
                value={answers[qId] || ""}
                onChange={(e) => handleChange(qId, e.target.value)}
                placeholder="..."
              />
            </div>
          );
        })}
      </section>

      {/* SECTION B */}
      <section className="space-y-10">
        <h2 className="text-2xl font-bold text-aizome border-b-2 border-aizome pb-2">{t("sectionB")}</h2>
        {[...Array(5)].map((_, i) => {
          const qId = `q${i + 16}`;
          const currentFilename = getFilename(qId);
          return (
            <div key={qId} className="space-y-4 bg-washi-panel p-6 rounded-2xl">
              <label className="block text-lg font-medium text-sumi select-none">
                {i + 16}. {tQ(qId)}
              </label>
              <div className="space-y-2">
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    accept=".txt,.js,.ts,.py,.java,.zip"
                    onChange={(e) => handleFileChange(qId, e.target.files?.[0] || null)}
                    className="block w-full text-sm text-sumi
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-aizome file:text-white
                      hover:file:bg-aizome-light cursor-pointer"
                  />
                  <div className="text-sm text-sumi/60 whitespace-nowrap">
                    {uploadStatus[qId] === 'uploading' && <span className="text-aizome font-bold">{uploadProgress[qId]}%</span>}
                    {uploadStatus[qId] === 'completed' && <span className="text-matsu font-bold">✓ Uploaded</span>}
                    {uploadStatus[qId] === 'error' && <span className="text-kurenai font-bold">✗ Failed</span>}
                  </div>
                </div>
                
                {/* Upload Status Elements */}
                {uploadStatus[qId] === 'uploading' && (
                  <div className="w-full bg-aizome/10 rounded-full h-1.5 mt-2">
                    <div className="bg-aizome h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress[qId]}%` }}></div>
                  </div>
                )}
                {uploadErrors[qId] && <div className="text-kurenai text-sm font-medium">{uploadErrors[qId]}</div>}
                {currentFilename && uploadStatus[qId] !== 'uploading' && (
                  <div className="text-sm text-sumi/80 font-medium bg-white px-3 py-1 rounded inline-block mt-2 shadow-sm border border-aizome/10">
                    File: {currentFilename}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </section>

      {/* SECTION C */}
      <section className="space-y-10">
        <h2 className="text-2xl font-bold text-aizome border-b-2 border-aizome pb-2">{t("sectionC")}</h2>
        {[...Array(2)].map((_, i) => {
          const qId = `q${i + 21}`;
          const currentFilename = getFilename(qId);
          return (
            <div key={qId} className="space-y-4 bg-washi p-6 rounded-2xl border border-kurenai/20">
              <label className="block text-lg font-medium text-sumi select-none">
                {i + 21}. {tQ(qId)}
              </label>
              <div className="space-y-2">
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    accept="video/mp4,video/quicktime,video/webm"
                    onChange={(e) => handleFileChange(qId, e.target.files?.[0] || null)}
                    className="block w-full text-sm text-sumi
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-kurenai file:text-white
                      hover:file:bg-kurenai/80 cursor-pointer"
                  />
                  <div className="text-sm text-sumi/60 whitespace-nowrap">
                    {uploadStatus[qId] === 'uploading' && <span className="text-kurenai font-bold">{uploadProgress[qId]}%</span>}
                    {uploadStatus[qId] === 'completed' && <span className="text-matsu font-bold">✓ Uploaded</span>}
                    {uploadStatus[qId] === 'error' && <span className="text-kurenai font-bold">✗ Failed</span>}
                  </div>
                </div>
                
                {/* Upload Status Elements */}
                {uploadStatus[qId] === 'uploading' && (
                  <div className="w-full bg-kurenai/10 rounded-full h-1.5 mt-2">
                    <div className="bg-kurenai h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress[qId]}%` }}></div>
                  </div>
                )}
                {uploadErrors[qId] && <div className="text-kurenai text-sm font-medium">{uploadErrors[qId]}</div>}
                {currentFilename && uploadStatus[qId] !== 'uploading' && (
                  <div className="text-sm text-sumi/80 font-medium bg-white px-3 py-1 rounded inline-block mt-2 shadow-sm border border-kurenai/20">
                    Video: {currentFilename}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </section>

      <div className="pt-10 flex flex-col items-center space-y-4">
        {missingQuestions.length > 0 && (
          <div className="text-kurenai font-medium text-sm text-center max-w-lg">
            Please complete all questions before submitting. Missing: {missingQuestions.join(', ')}
          </div>
        )}
        <button
          onClick={() => handleSubmit(false)}
          disabled={isSubmitting || hasActiveUploads || hasUploadErrors || missingQuestions.length > 0}
          className="bg-aizome text-white font-bold text-xl py-4 px-12 rounded-full hover:bg-aizome-light transition-colors disabled:opacity-50"
          title={hasActiveUploads ? "Please wait for uploads to finish" : (hasUploadErrors ? "Please fix upload errors" : "")}
        >
          {isSubmitting ? t("submitting") : t("submit")}
        </button>
      </div>
      
      {/* Hidden submit trigger for Timer */}
      <button 
        type="button"
        id="examSubmitTrigger" 
        className="hidden"
        onClick={() => handleSubmit(true)} 
      />
    </div>
  );
}
