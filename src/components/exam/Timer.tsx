"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";

interface TimerProps {
  startedAt: string;
  onTimeUp: () => void;
}

export default function Timer({ startedAt, onTimeUp }: TimerProps) {
  const t = useTranslations("Session.Timer");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const onTimeUpRef = useRef(onTimeUp);
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    const start = new Date(startedAt).getTime();
    const duration = 80 * 60 * 1000; // 80 minutes
    const deadline = start + duration;
    
    let timeIsUp = false;

    const tick = () => {
      const now = Date.now();
      const remaining = Math.max(0, deadline - now);
      
      setTimeLeft(remaining);

      if (remaining <= 0 && !timeIsUp) {
        timeIsUp = true;
        onTimeUpRef.current();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  if (timeLeft === null) return null;

  const minutes = Math.floor(timeLeft / 1000 / 60);
  const seconds = Math.floor((timeLeft / 1000) % 60);

  const isWarning = timeLeft < 5 * 60 * 1000;

  return (
    <div className={`fixed bottom-6 right-6 px-6 py-3 rounded-full shadow-lg font-bold text-xl border-2 flex items-center space-x-3 z-40 bg-white ${isWarning ? 'border-kurenai text-kurenai animate-pulse' : 'border-aizome text-aizome'}`}>
      <span className="text-sm uppercase tracking-wider">{t("remaining")}</span>
      <span className="font-mono text-2xl">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
}
