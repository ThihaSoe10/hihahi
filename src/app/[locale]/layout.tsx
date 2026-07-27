import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "../globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

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
        className={`${notoSansJP.className} bg-washi text-sumi min-h-screen flex flex-col`}
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
    <header className="bg-washi-panel border-b border-aizome/10 py-4 px-6 md:px-12 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <div className="text-2xl font-bold text-aizome">Hisho</div>
        <nav className="hidden md:flex gap-6">
          <Link
            href="/"
            className="hover:text-aizome transition-colors font-medium text-sumi/80"
          >
            {t("home")}
          </Link>
          <Link
            href="#about"
            className="hover:text-aizome transition-colors font-medium text-sumi/80"
          >
            {t("about")}
          </Link>
          <Link
            href="/exam"
            className="hover:text-aizome transition-colors font-medium text-sumi/80"
          >
            {t("exam")}
          </Link>
        </nav>
      </div>
      <LanguageSwitcher />
    </header>
  );
}

function Footer() {
  const t = useTranslations("Footer");
  return (
    <footer className="bg-aizome text-washi py-8 px-6 md:px-12 mt-16">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-lg font-bold">Hisho</div>
        <div className="text-sm text-washi/80 text-center md:text-left">
          {t("address")}
        </div>
        <div className="text-sm text-washi/60">{t("copyright")}</div>
      </div>
    </footer>
  );
}
