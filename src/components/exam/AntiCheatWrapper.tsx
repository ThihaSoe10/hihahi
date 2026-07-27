"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export default function AntiCheatWrapper({ children }: { children: React.ReactNode }) {
  const t = useTranslations("Session.AntiCheat");
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    const blockEvent = (e: Event) => {
      e.preventDefault();
      setWarning(t("warning"));
      setTimeout(() => setWarning(null), 3000);
    };

    document.addEventListener("copy", blockEvent);
    document.addEventListener("cut", blockEvent);
    document.addEventListener("paste", blockEvent);
    document.addEventListener("contextmenu", blockEvent);

    return () => {
      document.removeEventListener("copy", blockEvent);
      document.removeEventListener("cut", blockEvent);
      document.removeEventListener("paste", blockEvent);
      document.removeEventListener("contextmenu", blockEvent);
    };
  }, [t]);

  return (
    <div className="select-none relative min-h-screen">
      {warning && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-kurenai text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce font-medium">
          {warning}
        </div>
      )}
      {children}
    </div>
  );
}
