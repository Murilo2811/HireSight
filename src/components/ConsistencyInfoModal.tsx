import React from 'react';
import { useTranslations } from '../contexts/LanguageContext';
import { Button } from './ui/Button';
import { XCircleIcon } from './icons';

interface ConsistencyInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConsistencyInfoModal: React.FC<ConsistencyInfoModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslations();

  if (!isOpen) {
    return null;
  }

  const features = [
    'gapResolutions', 'consistencyScore', 'inconsistencies', 'softSkills', 
    'newInfo', 'notDiscussed', 'prosCons', 'updatedScore', 'finalDecision'
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-card text-card-foreground rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-primary">{t('consistencyInfo.title')}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <XCircleIcon className="w-6 h-6" />
          </Button>
        </header>
        <main className="p-6 overflow-y-auto space-y-6">
          <p className="text-muted-foreground">{t('consistencyInfo.intro1')}</p>

          <div>
            <h3 className="text-lg font-semibold mb-2">{t('consistencyInfo.whatIsItTitle')}</h3>
            <p className="mb-2">{t('consistencyInfo.whatIsItP1')}</p>
            <ul className="list-disc list-inside space-y-1 pl-4 text-muted-foreground">
              <li>{t('consistencyInfo.whatIsItSources.source1')}</li>
              <li>{t('consistencyInfo.whatIsItSources.source2')}</li>
              <li>{t('consistencyInfo.whatIsItSources.source3')}</li>
            </ul>
            <p className="mt-2">{t('consistencyInfo.whatIsItP2')}</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">{t('consistencyInfo.howItWorksTitle')}</h3>
            <p className="mb-4">{t('consistencyInfo.howItWorksP1')}</p>
            <div className="space-y-4">
              {features.map(featureKey => (
                 <div key={featureKey} className="p-3 bg-muted/50 rounded-md">
                    <h4 className="font-semibold text-foreground">{t(`consistencyInfo.features.${featureKey}.title`)}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{t(`consistencyInfo.features.${featureKey}.description`)}</p>
                 </div>
              ))}
            </div>
          </div>
          
          <p className="text-muted-foreground italic border-t pt-4">{t('consistencyInfo.conclusion')}</p>
        </main>
      </div>
    </div>
  );
};

export default ConsistencyInfoModal;