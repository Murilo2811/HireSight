import React, { useState } from 'react';
import { useTranslations } from '../contexts/LanguageContext';
import { ApiKeys, LlmConfig, LlmProvider } from '../types';
import { ArrowLeftIcon } from './icons';
import { Button } from './ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { toast } from './ui/Toast';
import { Select } from './ui/Select';

const AVAILABLE_MODELS: Record<LlmProvider, { id: string, name: string }[]> = {
    gemini: [
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' }
    ],
    openai: [
        { id: 'gpt-4o', name: 'GPT-4o' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
    ],
    anthropic: [
        { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
        { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
        { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' }
    ],
    groq: [
        { id: 'llama3-8b-8192', name: 'LLaMA3 8b' },
        { id: 'llama3-70b-8192', name: 'LLaMA3 70b' },
        { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' }
    ]
};

interface SettingsModalProps {
    onNavigateBack: () => void;
    onSave: (config: LlmConfig) => void;
    initialConfig: LlmConfig;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onNavigateBack, onSave, initialConfig }) => {
    const { t } = useTranslations();
    const [config, setConfig] = useState<LlmConfig>(initialConfig);

    const handleSave = () => {
        onSave(config);
        toast.success(t('toast.success.saveSettings'))
        onNavigateBack();
    };
    
    const handleApiKeyChange = (provider: keyof ApiKeys, value: string) => {
        setConfig(prev => ({ 
            ...prev, 
            apiKeys: { ...prev.apiKeys, [provider]: value } 
        }));
    };
    
    const handleProviderChange = (newProvider: LlmProvider) => {
        const newModel = AVAILABLE_MODELS[newProvider][0].id;
        setConfig(prev => ({ ...prev, provider: newProvider, model: newModel }));
    };

    const handleModelChange = (newModel: string) => {
        setConfig(prev => ({ ...prev, model: newModel }));
    };

    return (
        <div className="bg-background text-foreground min-h-screen font-sans antialiased animate-fade-in">
            <div className="container mx-auto px-4 py-8">
                 <header className="flex items-center mb-8">
                    <Button variant="outline" size="sm" onClick={onNavigateBack} className="mr-4">
                        <ArrowLeftIcon className="w-4 h-4 mr-2" />
                        {t('buttons.back')}
                    </Button>
                    <h1 className="text-3xl font-bold text-foreground">{t('settings.title')}</h1>
                </header>

                <main className="max-w-2xl mx-auto space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('settings.aiProvider.title')}</CardTitle>
                            <CardDescription>{t('settings.aiProvider.description')}</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="provider-select">{t('settings.aiProvider.providerLabel')}</Label>
                                <Select
                                    id="provider-select"
                                    value={config.provider}
                                    onChange={(e) => handleProviderChange(e.target.value as LlmProvider)}
                                >
                                    {Object.keys(AVAILABLE_MODELS).map(provider => (
                                        <option key={provider} value={provider} className="capitalize">{provider}</option>
                                    ))}
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="model-select">{t('settings.aiProvider.modelLabel')}</Label>
                                <Select
                                    id="model-select"
                                    value={config.model}
                                    onChange={(e) => handleModelChange(e.target.value)}
                                    disabled={!config.provider}
                                >
                                {AVAILABLE_MODELS[config.provider]?.map(model => (
                                        <option key={model.id} value={model.id}>{model.name}</option>
                                    ))}
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

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
                                        value={config.apiKeys.openai || ''}
                                        onChange={e => handleApiKeyChange('openai', e.target.value)}
                                        placeholder={t('settings.keyPlaceholder')}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="anthropic-key" className="font-semibold">Anthropic (Claude)</Label>
                                    <p className="text-xs text-muted-foreground mb-2">{t('settings.anthropicKey')}</p>
                                    <Input
                                        id="anthropic-key"
                                        type="password"
                                        value={config.apiKeys.anthropic || ''}
                                        onChange={e => handleApiKeyChange('anthropic', e.target.value)}
                                        placeholder={t('settings.keyPlaceholder')}
                                    />
                                </div>
                                 <div>
                                    <Label htmlFor="groq-key" className="font-semibold">Groq</Label>
                                    <p className="text-xs text-muted-foreground mb-2">{t('settings.groqKey')}</p>
                                    <Input
                                        id="groq-key"
                                        type="password"
                                        value={config.apiKeys.groq || ''}
                                        onChange={e => handleApiKeyChange('groq', e.target.value)}
                                        placeholder={t('settings.keyPlaceholder')}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <div className="mt-8 flex justify-end gap-3">
                        <Button variant="ghost" onClick={onNavigateBack}>
                            {t('buttons.cancel')}
                        </Button>
                        <Button onClick={handleSave}>
                            {t('buttons.save')}
                        </Button>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default SettingsModal;