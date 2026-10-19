"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface RulesScreenProps {
  onAccept: () => void;
  isStarting: boolean;
}

export default function RulesScreen({ onAccept, isStarting }: RulesScreenProps) {
  const t = useTranslations("Session.Rules");
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 md:py-20">
      <div className="border border-aizome/15 bg-white p-6 text-sumi md:p-10">
        <p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-matsu">Hisho / Design internship</p>
        <h1 className="mb-8 text-3xl font-semibold tracking-tight text-aizome">{t("title")}</h1>
        
        <ul className="mb-8 space-y-4 border-y border-aizome/15 py-7 pl-5 text-base leading-relaxed list-disc marker:text-matsu">
          <li>{t("rule1")}</li>
          <li>{t("rule2")}</li>
          <li>{t("rule3")}</li>
          <li>{t("rule4")}</li>
          <li>{t("rule5")}</li>
        </ul>

        <label className="mb-8 flex cursor-pointer items-center gap-3 border border-aizome/15 bg-washi/50 p-4 transition-colors hover:bg-washi-panel">
          <input
            type="checkbox"
            className="h-5 w-5 shrink-0 text-aizome border-aizome/30 focus:ring-aizome"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
          />
          <span className="font-medium">{t("checkbox")}</span>
        </label>

        <button
          onClick={onAccept}
          disabled={!accepted || isStarting}
          className="w-full rounded-md bg-aizome px-6 py-4 text-lg font-semibold text-white transition-colors hover:bg-aizome-light disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isStarting ? "..." : t("start")}
        </button>
      </div>
    </div>
  );
}
