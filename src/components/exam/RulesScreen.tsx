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
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="bg-white rounded-3xl shadow-sm p-10 border border-washi-panel text-sumi">
        <h1 className="text-3xl font-bold text-aizome mb-8 text-center">{t("title")}</h1>
        
        <ul className="space-y-4 mb-10 text-lg leading-relaxed list-disc list-inside bg-washi p-8 rounded-xl">
          <li>{t("rule1")}</li>
          <li className="font-bold text-kurenai">{t("rule2")}</li>
          <li>{t("rule3")}</li>
          <li>{t("rule4")}</li>
          <li className="font-bold text-kurenai">{t("rule5")}</li>
        </ul>

        <label className="flex items-center space-x-3 cursor-pointer mb-8 select-none border border-aizome/20 p-4 rounded-xl hover:bg-washi-panel transition-colors">
          <input
            type="checkbox"
            className="w-6 h-6 text-aizome rounded border-aizome/30 focus:ring-aizome"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
          />
          <span className="text-lg font-medium select-none">{t("checkbox")}</span>
        </label>

        <button
          onClick={onAccept}
          disabled={!accepted || isStarting}
          className="w-full bg-aizome text-white font-bold text-lg py-4 px-6 rounded-xl hover:bg-aizome-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isStarting ? "..." : t("start")}
        </button>
      </div>
    </div>
  );
}
