"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { autosaveExam, submitExam } from "@/app/actions/examSession";
import {
  DESIGN_EXTENSIONS, DESIGN_MAX_BYTES, DESIGN_QUESTIONS, QUESTION_COUNT,
  TEXT_QUESTIONS, VIDEO_EXTENSIONS, VIDEO_MAX_BYTES, VIDEO_QUESTIONS,
} from "@/lib/exam-config";

interface ExamFormProps {
  initialAnswers: Record<string, string>;
  isExpired: boolean;
  onSubmitComplete: () => void;
}

type UploadState = { status: "uploading" | "completed" | "error"; progress: number; error?: string };

const contentTypes: Record<string, string> = {
  pdf: "application/pdf", png: "image/png", mp4: "video/mp4",
  mov: "video/quicktime", webm: "video/webm",
};

function filenameFromAnswer(answer?: string): string | null {
  if (!answer) return null;
  try { return JSON.parse(answer).filename || null; } catch { return null; }
}

export default function ExamForm({ initialAnswers, isExpired, onSubmitComplete }: ExamFormProps) {
  const t = useTranslations("Session.Exam");
  const tQ = useTranslations("Session.Exam.questions");
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [uploads, setUploads] = useState<Record<string, UploadState>>({});
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const answersRef = useRef(answers);
  const submittingRef = useRef(false);
  const expiredRef = useRef(isExpired);

  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { expiredRef.current = isExpired; }, [isExpired]);

  useEffect(() => {
    if (isExpired) return;
    const timeout = window.setTimeout(async () => {
      const result = await autosaveExam(answersRef.current);
      if (result.success) setLastSaved(new Date(result.timestamp).toLocaleTimeString());
    }, 2000);
    return () => window.clearTimeout(timeout);
  }, [answers, isExpired]);

  const updateAnswer = (id: string, value: string) => {
    if (expiredRef.current) return;
    answersRef.current = { ...answersRef.current, [id]: value };
    setAnswers(previous => ({ ...previous, [id]: value }));
  };

  const uploadFile = async (id: string, file: File | null, type: "design" | "video") => {
    if (!file || expiredRef.current) return;
    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    const allowed = type === "design" ? DESIGN_EXTENSIONS : VIDEO_EXTENSIONS;
    const limit = type === "design" ? DESIGN_MAX_BYTES : VIDEO_MAX_BYTES;
    if (!allowed.includes(extension) || file.size === 0 || file.size > limit) {
      setUploads(previous => ({ ...previous, [id]: {
        status: "error", progress: 0,
        error: t("invalidFile", { formats: allowed.map(item => `.${item}`).join(" / "), size: Math.round(limit / 1024 / 1024) }),
      } }));
      return;
    }
    const fileType = contentTypes[extension];
    setUploads(previous => ({ ...previous, [id]: { status: "uploading", progress: 0 } }));
    try {
      const response = await fetch("/api/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionNumber: id, filename: file.name, fileType, fileSize: file.size }),
      });
      if (!response.ok) throw new Error(response.status === 410 ? t("uploadClosed") : t("uploadPrepareError"));
      const { url, key } = await response.json();
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", url);
        xhr.setRequestHeader("Content-Type", fileType);
        xhr.upload.onprogress = event => {
          if (event.lengthComputable) {
            const progress = Math.round(event.loaded / event.total * 100);
            setUploads(previous => ({ ...previous, [id]: { status: "uploading", progress } }));
          }
        };
        xhr.onload = () => (xhr.status === 200 || xhr.status === 204) ? resolve() : reject(new Error(t("uploadHttpError", { status: xhr.status })));
        xhr.onerror = () => reject(new Error(t("uploadNetworkError")));
        xhr.send(file);
      });
      if (expiredRef.current) return;
      updateAnswer(id, JSON.stringify({ key, filename: file.name }));
      setUploads(previous => ({ ...previous, [id]: { status: "completed", progress: 100 } }));
    } catch (error) {
      setUploads(previous => ({ ...previous, [id]: {
        status: "error", progress: 0, error: error instanceof Error ? error.message : t("uploadUnknownError"),
      } }));
    }
  };

  const missing = [
    ...TEXT_QUESTIONS.filter(number => !answers[`q${number}`]?.trim()),
    ...[...DESIGN_QUESTIONS, ...VIDEO_QUESTIONS].filter(number => !filenameFromAnswer(answers[`q${number}`])),
  ];
  const completed = QUESTION_COUNT - missing.length;
  const uploading = Object.values(uploads).some(upload => upload.status === "uploading");
  const uploadError = Object.values(uploads).some(upload => upload.status === "error");

  const handleSubmit = async (automatic = false) => {
    if (submittingRef.current) return;
    if (!automatic && (missing.length > 0 || uploading || uploadError)) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    setSubmitError(false);
    const result = await submitExam(answersRef.current);
    if (result.success) {
      onSubmitComplete();
    } else {
      submittingRef.current = false;
      setIsSubmitting(false);
      setSubmitError(true);
    }
  };

  const renderUpload = (number: number, type: "design" | "video") => {
    const id = `q${number}`;
    const upload = uploads[id];
    const filename = filenameFromAnswer(answers[id]);
    return (
      <article key={id} className="rounded-xl border border-aizome/15 bg-white p-5 md:p-6">
        <div className="flex gap-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-washi-panel text-xs font-bold text-aizome">{number}</span>
          <div className="min-w-0 flex-1">
            <label htmlFor={id} className="block text-base font-medium leading-relaxed text-sumi">{tQ(id)}</label>
            <input id={id} type="file" disabled={isExpired || isSubmitting}
              accept={type === "design" ? ".pdf,.png,application/pdf,image/png" : ".mp4,.mov,.webm,video/mp4,video/quicktime,video/webm"}
              onChange={event => uploadFile(id, event.target.files?.[0] || null, type)}
              className="mt-4 block w-full max-w-full text-sm text-sumi/70 file:mr-4 file:rounded-md file:border-0 file:bg-aizome file:px-4 file:py-2.5 file:font-semibold file:text-white hover:file:bg-aizome-light disabled:opacity-50" />
            {upload?.status === "uploading" && <div className="mt-3">
              <div className="mb-1 text-sm text-aizome">{t("uploading", { percent: upload.progress })}</div>
              <div className="h-1.5 rounded-full bg-washi-panel"><div className="h-1.5 rounded-full bg-aizome" style={{ width: `${upload.progress}%` }} /></div>
            </div>}
            {upload?.status === "error" && <p className="mt-3 text-sm text-kurenai" role="alert">{upload.error}</p>}
            {filename && upload?.status !== "uploading" && <p className="mt-3 break-all text-sm text-matsu">✓ {type === "video" ? t("videoLabel", { name: filename }) : t("fileLabel", { name: filename })}</p>}
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="mx-auto max-w-5xl px-5 pb-36 pt-10 md:px-8 md:pt-14">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-5 border-b border-aizome/20 pb-6">
        <div><p className="mb-2 text-xs font-bold uppercase tracking-[.2em] text-matsu">Hisho / Design internship</p>
          <h1 className="text-3xl font-semibold tracking-tight text-aizome md:text-4xl">{t("sectionA")}</h1></div>
        <div className="min-w-44 text-right"><p className="text-sm font-medium text-sumi/65">{t("progress", { completed, total: QUESTION_COUNT })}</p>
          <div className="mt-2 h-1.5 rounded-full bg-washi-panel"><div className="h-1.5 rounded-full bg-aizome" style={{ width: `${completed / QUESTION_COUNT * 100}%` }} /></div>
          {lastSaved && <p className="mt-2 text-xs text-sumi/55">{t("savedAt")} {lastSaved}</p>}
        </div>
      </div>

      <nav className="mb-8 flex gap-2 overflow-x-auto pb-2 text-sm" aria-label="Exam sections">
        <a href="#section-a" className="whitespace-nowrap rounded-md border border-aizome/20 bg-white px-4 py-2 font-medium text-aizome hover:bg-washi-panel">A · {TEXT_QUESTIONS.length}</a>
        <a href="#section-b" className="whitespace-nowrap rounded-md border border-aizome/20 bg-white px-4 py-2 font-medium text-aizome hover:bg-washi-panel">B · {DESIGN_QUESTIONS.length}</a>
        <a href="#section-c" className="whitespace-nowrap rounded-md border border-aizome/20 bg-white px-4 py-2 font-medium text-aizome hover:bg-washi-panel">C · {VIDEO_QUESTIONS.length}</a>
      </nav>

      <fieldset disabled={isExpired || isSubmitting} className="space-y-16 disabled:opacity-75">
        <section id="section-a" className="scroll-mt-8 space-y-4" aria-label={t("sectionA")}>
          {TEXT_QUESTIONS.map(number => {
            const id = `q${number}`;
            return <div key={id} className="rounded-xl border border-aizome/15 bg-white p-5 md:p-6">
              <label htmlFor={id} className="flex items-start gap-4 text-base font-medium leading-relaxed text-sumi">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-washi-panel text-xs font-bold text-aizome">{number}</span>
                <span>{tQ(id)}</span>
              </label>
              <textarea id={id} rows={3} value={answers[id] || ""} onChange={event => updateAnswer(id, event.target.value)}
                className="mt-4 w-full resize-y rounded-lg border border-aizome/20 bg-washi/40 px-4 py-3 text-sumi outline-none transition focus:border-aizome focus:ring-2 focus:ring-aizome/15" />
            </div>;
          })}
        </section>

        <section id="section-b" className="scroll-mt-8 space-y-4" aria-label={t("sectionB")}>
          <div className="border-b border-aizome/20 pb-5"><h2 className="text-2xl font-semibold text-aizome">{t("sectionB")}</h2>
            <p className="mt-2 max-w-3xl leading-relaxed text-sumi/75">{t("sectionBBrief")}</p></div>
          {DESIGN_QUESTIONS.map(number => renderUpload(number, "design"))}
        </section>

        <section id="section-c" className="scroll-mt-8 space-y-4" aria-label={t("sectionC")}>
          <div className="border-b border-aizome/20 pb-5"><h2 className="text-2xl font-semibold text-aizome">{t("sectionC")}</h2>
            <p className="mt-2 max-w-3xl leading-relaxed text-sumi/75">{t("sectionCNote")}</p></div>
          {VIDEO_QUESTIONS.map(number => renderUpload(number, "video"))}
        </section>
      </fieldset>

      <div className="mt-12 rounded-xl border border-aizome/15 bg-white p-6 text-center">
        {missing.length > 0 && !isExpired && <p className="mb-4 text-sm text-sumi/65">{t("missing", { questions: missing.map(number => `Q${number}`).join(", ") })}</p>}
        {submitError && !isExpired && <p className="mb-4 text-sm text-kurenai" role="alert">{t("submitError")}</p>}
        <button type="button" onClick={() => handleSubmit()} disabled={isExpired || isSubmitting || uploading || uploadError || missing.length > 0}
          className="rounded-md bg-aizome px-10 py-3 font-semibold text-white transition hover:bg-aizome-light disabled:cursor-not-allowed disabled:opacity-40">
          {isSubmitting ? t("submitting") : t("submit")}
        </button>
      </div>

      <button type="button" id="examSubmitTrigger" className="hidden" onClick={() => handleSubmit(true)} />
      {isExpired && <div className="fixed inset-0 z-50 flex items-center justify-center bg-sumi/85 px-6 text-center text-white">
        <div className="max-w-lg"><div className="mb-5 font-mono text-5xl tabular-nums">00:00:00</div>
          <h2 className="text-2xl font-semibold">{t("timeUp")}</h2>
          {submitError && <><p className="mt-4 text-white/80" role="alert">{t("timeUpError")}</p>
            <button type="button" onClick={() => handleSubmit(true)} className="mt-5 rounded-md bg-white px-6 py-3 font-semibold text-aizome">{t("retrySubmit")}</button></>}
        </div>
      </div>}
    </div>
  );
}
