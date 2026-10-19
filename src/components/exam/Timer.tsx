"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { EXAM_DURATION_MS } from "@/lib/exam-config";

interface TimerProps {
  startedAt: string;
  serverNow: string;
  onTimeUp: () => void;
}

export default function Timer({ startedAt, serverNow, onTimeUp }: TimerProps) {
  const t = useTranslations("Session.Timer");
  const deadline = new Date(startedAt).getTime() + EXAM_DURATION_MS;
  const clockOffset = useRef(new Date(serverNow).getTime() - Date.now());
  const [remaining, setRemaining] = useState(() => Math.max(0, deadline - Date.now() - clockOffset.current));
  const callback = useRef(onTimeUp);
  const fired = useRef(false);

  useEffect(() => { callback.current = onTimeUp; }, [onTimeUp]);

  useEffect(() => {
    const tick = () => {
      const next = Math.max(0, deadline - Date.now() - clockOffset.current);
      setRemaining(next);
      if (next === 0 && !fired.current) {
        fired.current = true;
        callback.current();
      }
    };
    tick();
    const interval = window.setInterval(tick, 1000);
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("focus", tick);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", tick);
      window.removeEventListener("focus", tick);
    };
  }, [deadline]);

  const totalSeconds = Math.ceil(remaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const warning = remaining <= 10 * 60 * 1000;

  return (
    <div className={`fixed bottom-0 inset-x-0 z-40 border-t px-5 py-3 shadow-[0_-8px_30px_rgba(18,40,41,.08)] ${warning ? "border-kurenai/30 bg-[#fff5f1]" : "border-aizome/15 bg-white"}`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-5">
        <span className="text-xs font-semibold uppercase tracking-[.18em] text-sumi/70">{t("remaining")}</span>
        <span className={`font-mono text-2xl font-semibold tabular-nums tracking-tight md:text-3xl ${warning ? "text-kurenai" : "text-aizome"}`} role="timer" aria-live="off">
          {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </span>
      </div>
      <div className="absolute bottom-0 left-0 h-1 bg-aizome transition-[width] duration-1000 ease-linear" style={{ width: `${remaining / EXAM_DURATION_MS * 100}%` }} />
    </div>
  );
}
