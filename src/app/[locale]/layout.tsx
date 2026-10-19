import type { Metadata } from "next";
import "../globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export const metadata: Metadata = {
  title: "Hisho (飛翔) - Next-generation trading software",
  description: "Trading software built for the Japanese stock market.",
};

import { setRequestLocale } from 'next-intl/server';

export default async function RootLayout({
  children,
  params: { locale },
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body
        className="bg-washi text-sumi min-h-screen flex flex-col antialiased"
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Header />
          <main className="flex-grow">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

function Header() {
  const t = useTranslations("Header");
  return (
    <header className="border-b border-aizome/15 bg-washi px-6 md:px-12">
      <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4">
        <Link href="/" className="flex items-baseline gap-2 text-aizome" aria-label="Hisho home"><span className="text-2xl font-semibold tracking-tight">Hisho</span><span className="text-sm">飛翔</span></Link>
        <nav className="flex items-center gap-5 text-sm md:gap-8" aria-label="Main navigation">
          <Link
            href="/"
            className="hidden font-medium text-sumi/75 transition-colors hover:text-aizome sm:inline"
          >
            {t("home")}
          </Link>
          <Link
            href="/#about"
            className="hidden font-medium text-sumi/75 transition-colors hover:text-aizome md:inline"
          >
            {t("about")}
          </Link>
          <Link
            href="/exam"
            className="rounded-md border border-aizome/25 px-3 py-2 font-semibold text-aizome transition-colors hover:bg-washi-panel"
          >
            {t("exam")}
          </Link>
        </nav>
        <LanguageSwitcher />
      </div>
    </header>
  );
}

function Footer() {
  const t = useTranslations("Footer");
  return (
    <footer className="mt-auto border-t border-aizome/15 bg-washi-panel/50 px-6 py-8 md:px-12">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 text-aizome md:flex-row md:items-center">
        <div className="text-lg font-semibold">Hisho <span className="text-sm font-normal">飛翔</span></div>
        <div className="text-sm text-sumi/65">
          {t("address")}
        </div>
        <div className="text-xs text-sumi/55">{t("copyright")}</div>
      </div>
    </footer>
  );
}
