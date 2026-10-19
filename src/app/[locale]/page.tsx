import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export default function Home() {
  const hero = useTranslations("Hero");
  const about = useTranslations("About");
  const timeline = useTranslations("Timeline");
  const ecommerce = useTranslations("Ecommerce");

  return (
    <div>
      <section className="border-b border-aizome/15 bg-washi">
        <div className="mx-auto grid max-w-7xl gap-14 px-6 py-20 md:px-12 md:py-28 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
          <div>
            <p className="mb-7 flex items-center gap-3 text-xs font-bold uppercase tracking-[.22em] text-matsu"><span className="h-px w-10 bg-matsu" />{hero("eyebrow")}</p>
            <h1 className="max-w-3xl text-6xl font-semibold leading-[1.05] tracking-[-.06em] text-aizome sm:text-7xl md:text-8xl">{hero("title")}</h1>
            <p className="mt-8 max-w-xl text-xl leading-relaxed text-sumi/75 md:text-2xl">{hero("tagline")}</p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link href="/exam" className="inline-flex min-h-12 items-center rounded-md bg-aizome px-6 font-semibold text-white transition hover:bg-aizome-light">{hero("cta")} <span aria-hidden="true" className="ml-6">↗</span></Link>
              <a href="#about" className="inline-flex min-h-12 items-center border-b border-aizome/50 px-1 font-medium text-aizome transition hover:border-aizome">{hero("aboutLink")}</a>
            </div>
          </div>
          <div aria-hidden="true" className="relative min-h-72 overflow-hidden border-l border-aizome/20 bg-washi-panel/50 p-7 md:min-h-96">
            <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(to right, rgba(23,62,63,.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(23,62,63,.08) 1px, transparent 1px)", backgroundSize: "46px 46px" }} />
            <div className="relative flex h-full flex-col justify-between">
              <div className="flex justify-between text-xs font-semibold tracking-[.18em] text-aizome/70"><span>飛翔 / HISHO</span><span>JAPAN</span></div>
              <div className="ml-auto max-w-xs border-l-2 border-matsu bg-washi p-6 shadow-sm">
                <span className="block text-5xl font-light tracking-tight text-aizome">飛翔</span>
                <span className="mt-3 block text-sm leading-relaxed text-sumi/60">Clarity in every decision.</span>
              </div>
              <div className="text-xs font-medium tracking-[.2em] text-aizome/60">01 — RESEARCH &nbsp; / &nbsp; 02 — DESIGN &nbsp; / &nbsp; 03 — BUILD</div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="mx-auto grid max-w-7xl gap-8 border-b border-aizome/15 px-6 py-20 md:grid-cols-[.35fr_1fr] md:px-12 md:py-28">
        <p className="text-xs font-bold uppercase tracking-[.22em] text-matsu">01 / {about("title")}</p>
        <div><h2 className="max-w-4xl text-3xl font-medium leading-snug tracking-tight text-aizome md:text-5xl">{about("title")}</h2>
          <p className="mt-7 max-w-3xl text-lg leading-8 text-sumi/75">{about("description")}</p></div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-20 md:grid-cols-2 md:gap-16 md:px-12 md:py-24">
        <div className="border-t-2 border-aizome pt-6"><p className="text-xs font-bold uppercase tracking-[.2em] text-matsu">{timeline("eyebrow")}</p>
          <h2 className="mt-5 text-2xl font-semibold text-aizome md:text-3xl">{timeline("title")}</h2>
          <p className="mt-4 max-w-lg leading-7 text-sumi/75">{timeline("description")}</p></div>
        <div className="border-t-2 border-aizome/30 pt-6"><p className="text-xs font-bold uppercase tracking-[.2em] text-matsu">{ecommerce("eyebrow")}</p>
          <h2 className="mt-5 text-2xl font-semibold text-aizome md:text-3xl">{ecommerce("title")}</h2>
          <p className="mt-4 max-w-lg leading-7 text-sumi/75">{ecommerce("description")}</p></div>
      </section>
    </div>
  );
}
