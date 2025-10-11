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
import { toast } from '../ui/Toast';


type InputType = 'text' | 'url' | 'file';

interface InputSectionProps {
  onAnalyze: (inputs: { jobInput: any; resumeInput: any; interviewTranscript?: string }) => void;
  isLoading: boolean;
  isLoggedIn: boolean;
  onLoginClick: () => void;
}

const InputSection = forwardRef<HTMLDivElement, InputSectionProps>(
  ({ onAnalyze, isLoading, isLoggedIn, onLoginClick }, ref) => {
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
        const errorMessage = error instanceof Error ? error.message : String(error);
        toast.error(errorMessage);
        console.error("Error parsing inputs:", error);
      }
    };

    return (
      <section ref={ref} className="py-20 sm:py-32 bg-muted/20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('input.title')}</h2>
            <p className="mt-4 text-lg text-muted-foreground">{t('input.subtitle')}</p>
          </div>
          
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
                  {jobInputType === 'file' && <Input type="file" onChange={e => setJobDescriptionFile(e.target.files?.[0] || null)} accept=".pdf,.docx" />}
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
                   {resumeInputType === 'file' && <Input type="file" onChange={e => setResumeFile(e.target.files?.[0] || null)} accept=".pdf,.docx" />}
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