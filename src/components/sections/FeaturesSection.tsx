import React from 'react';
import { useTranslations } from '../../contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { BrainIcon, ZapIcon, ShieldIcon, TrendingUpIcon, FileTextIcon, UsersIcon } from '../icons';

const FeaturesSection: React.FC = () => {
  const { t } = useTranslations();

  const features = [
    { icon: BrainIcon, title: 'features.advancedAI.title', description: 'features.advancedAI.description' },
    { icon: ZapIcon, title: 'features.fastAnalysis.title', description: 'features.fastAnalysis.description' },
    { icon: ShieldIcon, title: 'features.secureData.title', description: 'features.secureData.description' },
    { icon: TrendingUpIcon, title: 'features.compatibilityScore.title', description: 'features.compatibilityScore.description' },
    { icon: FileTextIcon, title: 'features.detailedReports.title', description: 'features.detailedReports.description' },
    { icon: UsersIcon, title: 'features.multipleAnalyses.title', description: 'features.multipleAnalyses.description' },
  ];

  return (
    <section id="features" className="py-20 sm:py-32">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('features.title')}</h2>
          <p className="mt-4 text-lg text-muted-foreground">{t('features.subtitle')}</p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:scale-105 animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>{t(feature.title)}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{t(feature.description)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
