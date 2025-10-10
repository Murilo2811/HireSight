import React from 'react';
import { useTranslations } from '../../contexts/LanguageContext';
import { Button } from '../ui/Button';
import { ArrowRightIcon, PlayCircleIcon } from '../icons';

interface HeroSectionProps {
  onPrimaryCtaClick: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onPrimaryCtaClick }) => {
  const { t } = useTranslations();

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden py-20 animate-fade-in">
      {/* Decorative Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full filter blur-3xl opacity-50 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/10 rounded-full filter blur-3xl opacity-50 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="container relative z-10 mx-auto px-4 text-center">
        <div className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
          {t('hero.badge')}
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl md:text-7xl">
          {t('hero.title.line1')}{' '}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t('hero.title.line2')}
          </span>
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground sm:text-xl">
          {t('hero.subtitle')}
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Button size="lg" onClick={onPrimaryCtaClick}>
            {t('hero.cta.primary')}
            <ArrowRightIcon className="ml-2 h-5 w-5" />
          </Button>
          <Button size="lg" variant="outline" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
            <PlayCircleIcon className="mr-2 h-5 w-5" />
            {t('hero.cta.secondary')}
          </Button>
        </div>
        
        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3 max-w-3xl mx-auto">
            <div className="text-center">
                <p className="text-4xl font-bold text-primary">{t('hero.stats.stat1.value')}</p>
                <p className="text-muted-foreground">{t('hero.stats.stat1.label')}</p>
            </div>
             <div className="text-center">
                <p className="text-4xl font-bold text-primary">{t('hero.stats.stat2.value')}</p>
                <p className="text-muted-foreground">{t('hero.stats.stat2.label')}</p>
            </div>
             <div className="text-center">
                <p className="text-4xl font-bold text-primary">{t('hero.stats.stat3.value')}</p>
                <p className="text-muted-foreground">{t('hero.stats.stat3.label')}</p>
            </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
