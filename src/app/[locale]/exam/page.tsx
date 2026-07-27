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
    <div className="max-w-xl mx-auto px-6 py-16 md:py-24">
      <div className="bg-white rounded-3xl shadow-sm p-10 border border-washi-panel">
        <h1 className="text-3xl font-bold text-aizome mb-4 text-center">{t("title")}</h1>
        <p className="text-sumi/80 mb-8 text-center">{t("description")}</p>

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
              className="w-full px-4 py-3 rounded-lg border border-aizome/20 focus:border-aizome focus:ring-1 focus:ring-aizome outline-none transition-colors"
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
              className="w-full px-4 py-3 rounded-lg border border-aizome/20 focus:border-aizome focus:ring-1 focus:ring-aizome outline-none transition-colors"
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
            className="w-full bg-aizome text-white font-bold py-3 px-4 rounded-lg hover:bg-aizome-light transition-colors disabled:opacity-50"
          >
            {isLoading ? t("submitting") : t("submit")}
          </button>
        </form>
      </div>
    </div>
  );
}
