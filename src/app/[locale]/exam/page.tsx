"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { loginWithExamId } from "@/app/actions/exam";

export default function ExamLogin() {
  const t = useTranslations("Exam");
  const router = useRouter();
  
  const [examId, setExamId] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await loginWithExamId(examId, candidateName);
      
      if (result.success) {
        // Redirect to the exam session
        router.push("/exam/session");
      } else {
        // Map error message from server to translations
        if (result.error === "Invalid Exam ID.") {
          setError(t("errors.invalid"));
        } else if (result.error === "This Exam ID has already been used and cannot be reused.") {
          setError(t("errors.completed"));
        } else {
          setError(result.error || t("errors.internal"));
        }
      }
    } catch (err) {
      console.error(err);
      setError(t("errors.internal"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-5 py-14 md:py-24">
      <div className="border border-aizome/15 bg-white p-6 md:p-10">
        <p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-matsu">Hisho / Design internship</p>
        <h1 className="mb-3 text-3xl font-semibold tracking-tight text-aizome">{t("title")}</h1>
        <p className="mb-8 text-sumi/70">{t("description")}</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="examId" className="block text-sm font-medium text-sumi mb-2">
              {t("examIdLabel")}
            </label>
            <input
              type="text"
              id="examId"
              required
              value={examId}
              onChange={(e) => setExamId(e.target.value)}
              className="w-full rounded-md border border-aizome/25 bg-washi/40 px-4 py-3 outline-none transition-colors focus:border-aizome focus:ring-2 focus:ring-aizome/15"
              placeholder="HISHO-XXXX-XXXX"
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-sumi mb-2">
              {t("nameLabel")}
            </label>
            <input
              type="text"
              id="name"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              className="w-full rounded-md border border-aizome/25 bg-washi/40 px-4 py-3 outline-none transition-colors focus:border-aizome focus:ring-2 focus:ring-aizome/15"
              placeholder="John Doe"
            />
          </div>

          {error && (
            <div className="p-4 bg-kurenai/10 border border-kurenai/20 text-kurenai rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !examId.trim()}
              className="w-full rounded-md bg-aizome px-4 py-3 font-semibold text-white transition-colors hover:bg-aizome-light disabled:opacity-40"
          >
            {isLoading ? t("submitting") : t("submit")}
          </button>
        </form>
      </div>
    </div>
  );
}
