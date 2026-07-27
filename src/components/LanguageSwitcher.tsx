"use client";

import { useLocale } from 'next-intl';
import { ChangeEvent, useTransition } from 'react';
import { useRouter, usePathname } from '@/i18n/routing';

export default function LanguageSwitcher() {
  const [isPending, startTransition] = useTransition();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function onSelectChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextLocale = event.target.value;
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  }

  return (
    <select
      className="bg-washi border border-aizome/20 rounded px-2 py-1 text-sm focus:outline-none focus:border-aizome disabled:opacity-50 text-sumi cursor-pointer"
      defaultValue={locale}
      disabled={isPending}
      onChange={onSelectChange}
    >
      <option value="ja">日本語</option>
      <option value="en">English</option>
    </select>
  );
}
