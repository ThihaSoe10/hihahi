"use client";

import { useEffect, useState, useCallback } from "react";
import { getExamState, startExamTimer } from "@/app/actions/examSession";
import { useRouter } from "@/i18n/routing";
import AntiCheatWrapper from "@/components/exam/AntiCheatWrapper";
import RulesScreen from "@/components/exam/RulesScreen";
import Timer from "@/components/exam/Timer";
import ExamForm from "@/components/exam/ExamForm";
import { useTranslations } from "next-intl";

export default function ExamSessionPage() {
  const t = useTranslations("Session.Exam");
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [examState, setExamState] = useState<{
    startedAt: string | null;
    answers: Record<string, string>;
    status: string;
  } | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    async function fetchState() {
      const result = await getExamState();
      if (!result.success) {
        if (result.status === "completed") {
          setIsCompleted(true);
        } else {
          setError(result.error || "Failed to load session");
        }
      } else {
        setExamState({
          startedAt: result.startedAt!,
          answers: result.answers!,
          status: result.status!,
        });
      }
      setIsLoading(false);
    }
    fetchState();
  }, []);

  const handleStart = async () => {
    setIsStarting(true);
    const result = await startExamTimer();
    if (result.success && result.startedAt) {
      setExamState(prev => prev ? { ...prev, startedAt: result.startedAt! } : null);
    } else {
      setError("Failed to start the exam. Please refresh and try again.");
    }
    setIsStarting(false);
  };

  const handleTimeUp = useCallback(() => {
    const trigger = document.getElementById("examSubmitTrigger");
    if (trigger) {
      trigger.click();
    }
  }, []);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-aizome font-bold text-xl animate-pulse">Loading...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-kurenai/20 text-center max-w-lg mx-auto">
          <p className="text-kurenai font-bold text-lg mb-6">{error}</p>
          <button onClick={() => router.push("/exam")} className="text-aizome underline font-medium">Return to Login</button>
        </div>
      </div>
    );
  }

  if (isCompleted || examState?.status === "completed") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-washi-panel text-center max-w-lg mx-auto">
          <div className="w-20 h-20 bg-matsu/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-matsu" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h1 className="text-3xl font-bold text-aizome mb-4">{t("completedTitle")}</h1>
          <p className="text-lg text-sumi/80">{t("completedMessage")}</p>
        </div>
      </div>
    );
  }

  if (!examState?.startedAt) {
    return <RulesScreen onAccept={handleStart} isStarting={isStarting} />;
  }

  return (
    <AntiCheatWrapper>
      <Timer startedAt={examState.startedAt} onTimeUp={handleTimeUp} />
      <ExamForm 
        initialAnswers={examState.answers} 
        onSubmitComplete={() => setIsCompleted(true)} 
      />
    </AntiCheatWrapper>
  );
}
