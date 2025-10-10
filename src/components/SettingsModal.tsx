import React, { useState } from 'react';
import { useTranslations } from '../contexts/LanguageContext';
import { ApiKeys } from '../services/llmService';
import { ArrowLeftIcon } from './icons';

interface SettingsPageProps {
    onNavigateBack: () => void;
    onSave: (keys: ApiKeys) => void;
    initialKeys: ApiKeys;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigateBack, onSave, initialKeys }) => {
    const { t } = useTranslations();
    const [keys, setKeys] = useState<ApiKeys>(initialKeys);

    const handleSave = () => {
        onSave(keys);
        onNavigateBack();
    };
    
    const handleChange = (provider: keyof ApiKeys, value: string) => {
        setKeys(prev => ({ ...prev, [provider]: value }));
    };

    return (
        <div className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white min-h-screen font-sans transition-colors duration-300">
            <div className="container mx-auto px-4 py-8">
                 <header className="flex items-center mb-8">
                    <button onClick={onNavigateBack} className="flex items-center gap-2 px-3 py-1.5 text-sm rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors mr-4">
                        <ArrowLeftIcon className="w-4 h-4" />
                        {t('buttons.back')}
                    </button>
                    <h1 className="text-3xl font-bold text-cyan-500 dark:text-cyan-400">{t('settings.title')}</h1>
                </header>

                <main className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-200 dark:border-transparent">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{t('settings.description')}</p>
                    
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="openai-key" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('settings.openaiKey')}</label>
                            <input
                                id="openai-key"
                                type="password"
                                value={keys.openai || ''}
                                onChange={e => handleChange('openai', e.target.value)}
                                placeholder={t('settings.keyPlaceholder')}
                                className="mt-1 w-full p-2 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                            />
                        </div>
                        <div>
                            <label htmlFor="anthropic-key" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('settings.anthropicKey')}</label>
                            <input
                                id="anthropic-key"
                                type="password"
                                value={keys.anthropic || ''}
                                onChange={e => handleChange('anthropic', e.target.value)}
                                placeholder={t('settings.keyPlaceholder')}
                                 className="mt-1 w-full p-2 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                            />
                        </div>
                         <div>
                            <label htmlFor="groq-key" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('settings.groqKey')}</label>
                            <input
                                id="groq-key"
                                type="password"
                                value={keys.groq || ''}
                                onChange={e => handleChange('groq', e.target.value)}
                                placeholder={t('settings.keyPlaceholder')}
                                 className="mt-1 w-full p-2 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                            />
                        </div>
                    </div>
                    
                    <div className="mt-8 flex justify-end gap-3">
                        <button onClick={onNavigateBack} className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                            {t('buttons.cancel')}
                        </button>
                        <button onClick={handleSave} className="px-6 py-2 text-sm font-medium text-white bg-cyan-600 rounded-md hover:bg-cyan-700 transition-colors">
                            {t('buttons.save')}
                        </button>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default SettingsPage;