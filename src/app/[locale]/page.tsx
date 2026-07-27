import { useTranslations } from 'next-intl';

export default function Home() {
  const tHero = useTranslations('Hero');
  const tAbout = useTranslations('About');
  const tTimeline = useTranslations('Timeline');
  const tEcommerce = useTranslations('Ecommerce');

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-24 space-y-24">
      {/* Hero Section */}
      <section className="text-center space-y-8 py-12">
        <h1 className="text-5xl md:text-7xl font-bold text-aizome tracking-tight">
          {tHero('title')}
        </h1>
        <p className="text-xl md:text-2xl text-aizome-light max-w-2xl mx-auto leading-relaxed">
          {tHero('tagline')}
        </p>
      </section>

      {/* About Section */}
      <section id="about" className="bg-white rounded-3xl shadow-sm p-10 md:p-16 border border-washi-panel">
        <h2 className="text-3xl font-bold text-aizome mb-6">{tAbout('title')}</h2>
        <p className="text-lg md:text-xl leading-relaxed text-sumi/80">
          {tAbout('description')}
        </p>
      </section>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Timeline Section */}
        <section className="bg-kurenai text-washi rounded-3xl p-10 md:p-12 shadow-md relative overflow-hidden flex flex-col justify-center">
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-4">{tTimeline('title')}</h2>
            <p className="text-lg md:text-xl text-washi/90">
              {tTimeline('description')}
            </p>
          </div>
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
        </section>

        {/* E-commerce Section */}
        <section className="bg-matsu text-washi rounded-3xl p-10 md:p-12 shadow-md relative overflow-hidden flex flex-col justify-center">
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-4">{tEcommerce('title')}</h2>
            <p className="text-lg md:text-xl text-washi/90">
              {tEcommerce('description')}
            </p>
          </div>
           <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
        </section>
      </div>
    </div>
  );
}
