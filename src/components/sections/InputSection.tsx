import React, { useState, forwardRef } from 'react';
import { useTranslations } from '../../contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { BriefcaseIcon, FileTextIcon, MicIcon, UploadIcon, GlobeIcon } from '../icons';
import { parseDocumentFile, parseUrlContent } from '../../utils/parsers';
import { LlmConfig, LlmProvider } from '../../types';
import { Select } from '../ui/Select';


type InputType = 'text' | 'url' | 'file';

interface InputSectionProps {
  onAnalyze: (inputs: { jobInput: any; resumeInput: any; interviewTranscript?: string }) => void;
  isLoading: boolean;
  isLoggedIn: boolean;
  onLoginClick: () => void;
  llmConfig: LlmConfig;
  onLlmConfigChange: (config: LlmConfig) => void;
}

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

const InputSection = forwardRef<HTMLDivElement, InputSectionProps>(
  ({ onAnalyze, isLoading, isLoggedIn, onLoginClick, llmConfig, onLlmConfigChange }, ref) => {
    const { t } = useTranslations();

    // State for Job Input
    const [jobInputType, setJobInputType] = useState<InputType>('text');
    const [jobDescriptionText, setJobDescriptionText] = useState('');
    const [jobDescriptionUrl, setJobDescriptionUrl] = useState('');
    const [jobDescriptionFile, setJobDescriptionFile] = useState<File | null>(null);

    // State for Resume Input
    const [resumeInputType, setResumeInputType] = useState<Omit<InputType, 'url'>>('text');
    const [resumeText, setResumeText] = useState('');
    const [resumeFile, setResumeFile] = useState<File | null>(null);

    // State for Interview Transcript
    const [interviewTranscript, setInterviewTranscript] = useState('');

    const isAnalyzeDisabled =
      isLoading ||
      (jobInputType === 'text' && !jobDescriptionText) ||
      (jobInputType === 'url' && !jobDescriptionUrl) ||
      (jobInputType === 'file' && !jobDescriptionFile) ||
      (resumeInputType === 'text' && !resumeText) ||
      (resumeInputType === 'file' && !resumeFile);

    const getJobInput = async () => {
      if (jobInputType === 'text') return { content: jobDescriptionText, format: 'text' as const };
      if (jobInputType === 'url') {
        const content = await parseUrlContent(jobDescriptionUrl);
        return { content, format: 'text' as const };
      }
      if (jobInputType === 'file' && jobDescriptionFile) return parseDocumentFile(jobDescriptionFile);
      throw new Error(t('error.jobDescriptionMissing'));
    };

    const getResumeInput = async () => {
      if (resumeInputType === 'text') return { content: resumeText, format: 'text' as const };
      if (resumeInputType === 'file' && resumeFile) return parseDocumentFile(resumeFile);
      throw new Error(t('error.resumeMissing'));
    };

    const handleAnalyzeClick = async () => {
      if (isAnalyzeDisabled) return;
      try {
        const jobInput = await getJobInput();
        const resumeInput = await getResumeInput();
        onAnalyze({ jobInput, resumeInput, interviewTranscript });
      } catch (error) {
        console.error("Error parsing inputs:", error);
      }
    };
    
    const handleProviderChange = (newProvider: LlmProvider) => {
        const newModel = AVAILABLE_MODELS[newProvider][0].id;
        onLlmConfigChange({ ...llmConfig, provider: newProvider, model: newModel });
    };

    const handleModelChange = (newModel: string) => {
        onLlmConfigChange({ ...llmConfig, model: newModel });
    };

    return (
      <section ref={ref} className="py-20 sm:py-32 bg-muted/20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('input.title')}</h2>
            <p className="mt-4 text-lg text-muted-foreground">{t('input.subtitle')}</p>
          </div>
          
          <Card className="mb-6">
            <CardHeader>
                <CardTitle>{t('settings.aiProvider.title')}</CardTitle>
                <CardDescription>{t('settings.aiProvider.description')}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <Label htmlFor="provider-select">{t('settings.aiProvider.providerLabel')}</Label>
                    <Select
                        id="provider-select"
                        value={llmConfig.provider}
                        onInput={(e) => handleProviderChange((e.target as HTMLSelectElement).value as LlmProvider)}
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
                        value={llmConfig.model}
                        onInput={(e) => handleModelChange((e.target as HTMLSelectElement).value)}
                        disabled={!llmConfig.provider}
                    >
                       {AVAILABLE_MODELS[llmConfig.provider]?.map(model => (
                            <option key={model.id} value={model.id}>{model.name}</option>
                        ))}
                    </Select>
                 </div>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-lg animate-slide-up">
            <Tabs defaultValue="job">
              <CardHeader>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="job"><BriefcaseIcon className="mr-2 h-4 w-4" />{t('input.job.tab')}</TabsTrigger>
                  <TabsTrigger value="resume"><FileTextIcon className="mr-2 h-4 w-4" />{t('input.resume.tab')}</TabsTrigger>
                  <TabsTrigger value="interview"><MicIcon className="mr-2 h-4 w-4" />{t('input.interview.tab')}</TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent>
                {/* Job Tab */}
                <TabsContent value="job">
                  <div className="text-center mb-4">
                    <Tabs defaultValue="text" onValueChange={(v) => setJobInputType(v as InputType)}>
                        <TabsList>
                            <TabsTrigger value="text"><FileTextIcon className="mr-2 h-4 w-4"/>{t('input.type.text')}</TabsTrigger>
                            <TabsTrigger value="url"><GlobeIcon className="mr-2 h-4 w-4"/>{t('input.type.url')}</TabsTrigger>
                            <TabsTrigger value="file"><UploadIcon className="mr-2 h-4 w-4"/>{t('input.type.file')}</TabsTrigger>
                        </TabsList>
                    </Tabs>
                  </div>
                  {jobInputType === 'text' && <Textarea value={jobDescriptionText} onChange={e => setJobDescriptionText(e.target.value)} placeholder={t('input.job.placeholder')} className="h-72" />}
                  {jobInputType === 'url' && <Input type="url" value={jobDescriptionUrl} onChange={e => setJobDescriptionUrl(e.target.value)} placeholder={t('input.job.urlPlaceholder')} />}
                  {jobInputType === 'file' && <Input type="file" onChange={e => setJobDescriptionFile(e.target.files?.[0] || null)} accept=".txt,.pdf,.doc,.docx" />}
                </TabsContent>

                {/* Resume Tab */}
                <TabsContent value="resume">
                  <div className="text-center mb-4">
                    <Tabs defaultValue="text" onValueChange={(v) => setResumeInputType(v as 'text' | 'file')}>
                        <TabsList>
                            <TabsTrigger value="text"><FileTextIcon className="mr-2 h-4 w-4"/>{t('input.type.text')}</TabsTrigger>
                            <TabsTrigger value="file"><UploadIcon className="mr-2 h-4 w-4"/>{t('input.type.file')}</TabsTrigger>
                        </TabsList>
                    </Tabs>
                  </div>
                   {resumeInputType === 'text' && <Textarea value={resumeText} onChange={e => setResumeText(e.target.value)} placeholder={t('input.resume.placeholder')} className="h-72" />}
                   {resumeInputType === 'file' && <Input type="file" onChange={e => setResumeFile(e.target.files?.[0] || null)} accept=".txt,.pdf,.doc,.docx" />}
                </TabsContent>

                {/* Interview Tab */}
                <TabsContent value="interview">
                    <Label htmlFor="interview-transcript" className="text-muted-foreground">{t('input.interview.label')}</Label>
                    <Textarea id="interview-transcript" value={interviewTranscript} onChange={e => setInterviewTranscript(e.target.value)} placeholder={t('input.interview.placeholder')} className="h-72 mt-2" />
                    <p className="text-xs text-muted-foreground mt-2">{t('input.interview.info')}</p>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
          
          <div className="mt-6 flex justify-end">
            {isLoggedIn ? (
                <Button size="lg" onClick={handleAnalyzeClick} disabled={isAnalyzeDisabled}>
                {isLoading && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2"></div>}
                {isLoading ? t('input.button.loading') : t('input.button.analyze')}
                </Button>
            ) : (
                <div className="text-center w-full">
                    <p className="mb-4 text-muted-foreground">{t('input.loginPrompt.text')}</p>
                    <Button size="lg" onClick={onLoginClick}>{t('input.loginPrompt.button')}</Button>
                </div>
            )}
          </div>
        </div>
      </section>
    );
  }
);

InputSection.displayName = "InputSection";
export default InputSection;