import React, { useState } from 'react';
import { useTranslations } from '../contexts/LanguageContext';
import { ApiKeys } from '../types';
import { ArrowLeftIcon } from './icons';
import { Button } from './ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Input } from './ui/Input';
import { Label } from './ui/Label';

interface SettingsModalProps {
    onNavigateBack: () => void;
    onSave: (keys: ApiKeys) => void;
    initialKeys: ApiKeys;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onNavigateBack, onSave, initialKeys }) => {
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
        <div className="bg-background text-foreground min-h-screen font-sans antialiased">
            <div className="container mx-auto px-4 py-8">
                 <header className="flex items-center mb-8">
                    <Button variant="outline" size="sm" onClick={onNavigateBack} className="mr-4">
                        <ArrowLeftIcon className="w-4 h-4 mr-2" />
                        {t('buttons.back')}
                    </Button>
                    <h1 className="text-3xl font-bold text-foreground">{t('settings.title')}</h1>
                </header>

                <main className="max-w-2xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('settings.subtitle')}</CardTitle>
                             <CardDescription>{t('settings.description')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <div>
                                    <Label htmlFor="openai-key" className="font-semibold">OpenAI</Label>
                                    <p className="text-xs text-muted-foreground mb-2">{t('settings.openaiKey')}</p>
                                    <Input
                                        id="openai-key"
                                        type="password"
                                        value={keys.openai || ''}
                                        onChange={e => handleChange('openai', e.target.value)}
                                        placeholder={t('settings.keyPlaceholder')}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="anthropic-key" className="font-semibold">Anthropic (Claude)</Label>
                                    <p className="text-xs text-muted-foreground mb-2">{t('settings.anthropicKey')}</p>
                                    <Input
                                        id="anthropic-key"
                                        type="password"
                                        value={keys.anthropic || ''}
                                        onChange={e => handleChange('anthropic', e.target.value)}
                                        placeholder={t('settings.keyPlaceholder')}
                                    />
                                </div>
                                 <div>
                                    <Label htmlFor="groq-key" className="font-semibold">Groq</Label>
                                    <p className="text-xs text-muted-foreground mb-2">{t('settings.groqKey')}</p>
                                    <Input
                                        id="groq-key"
                                        type="password"
                                        value={keys.groq || ''}
                                        onChange={e => handleChange('groq', e.target.value)}
                                        placeholder={t('settings.keyPlaceholder')}
                                    />
                                </div>
                            </div>
                            
                            <div className="mt-8 flex justify-end gap-3">
                                <Button variant="ghost" onClick={onNavigateBack}>
                                    {t('buttons.cancel')}
                                </Button>
                                <Button onClick={handleSave}>
                                    {t('buttons.save')}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </div>
        </div>
    );
};

export default SettingsModal;
