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
      aria-label="Language"
      className="cursor-pointer rounded-md border border-aizome/20 bg-transparent px-2 py-2 text-sm text-sumi focus:border-aizome focus:outline-none disabled:opacity-50"
      defaultValue={locale}
      disabled={isPending}
      onChange={onSelectChange}
    >
      <option value="ja">日本語</option>
      <option value="en">English</option>
    </select>
  );
}
