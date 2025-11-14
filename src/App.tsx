import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslations } from './contexts/LanguageContext';
import { getLlmService, GeminiInput } from './services/llmService';
import { RecruiterAnalysisResult, ConsistencyAnalysisResult, PreliminaryDecisionResult, RewrittenResumeResult, LlmConfig } from './types';
import { toast } from './components/ui/Toast';
import AuthPage from './components/AuthPage';
import Navbar from './components/sections/Navbar';
import HeroSection from './components/sections/HeroSection';
import FeaturesSection from './components/sections/FeaturesSection';
import InputSection from './components/sections/InputSection';
import ResultsSection from './components/sections/ResultsSection';
import SettingsModal from './components/SettingsModal';
import ProfilePage from './components/ProfilePage';
import LoadingSpinner from './components/LoadingSpinner';
import { downloadComponentAsPdf } from './utils/parsers';
import PrintableReport from './components/PrintableReport';

type AppView = 'landing' | 'app' | 'settings' | 'profile';

const App: React.FC = () => {
  const { t, language } = useTranslations();
  
  // App State
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('hireright_auth'));
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // LLM & API Key State
  const [llmConfig, setLlmConfig] = useState<LlmConfig>(() => {
    try {
        const storedConfig = localStorage.getItem('hireright_settings');
        if (storedConfig) {
            return JSON.parse(storedConfig);
        }
    } catch {}
    // Default config
    return { provider: 'gemini', model: 'gemini-2.5-flash', apiKeys: {} };
  });

  const llmService = useMemo(() => {
    try {
      return getLlmService(llmConfig)
    } catch(e) {
      const errorMessage = e instanceof Error ? e.message : 'error.unknown';
      toast.error(t(errorMessage));
      return null;
    }
  }, [llmConfig, t]);

  // Analysis State
  const [analysisResult, setAnalysisResult] = useState<RecruiterAnalysisResult | null>(null);
  const [preliminaryDecision, setPreliminaryDecision] = useState<PreliminaryDecisionResult | null>(null);
  const [consistencyResult, setConsistencyResult] = useState<ConsistencyAnalysisResult | null>(null);
  const [rewrittenResume, setRewrittenResume] = useState<RewrittenResumeResult | null>(null);
  const [interviewTranscript, setInterviewTranscript] = useState('');
  const [lastAnalysisInputs, setLastAnalysisInputs] = useState<{ jobInput: GeminiInput; resumeInput: GeminiInput } | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [activeAnalysis, setActiveAnalysis] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  
  // Effects
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  useEffect(() => {
    localStorage.setItem('hireright_settings', JSON.stringify(llmConfig));
  }, [llmConfig]);

  // Handlers
  const handleAuthSuccess = (remember: boolean) => {
    setIsAuthenticated(true);
    if (remember) {
      localStorage.setItem('hireright_auth', 'true');
    }
    setCurrentView('app');
    inputRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('hireright_auth');
    setCurrentView('landing');
  };

  const executeAnalysis = async (
    analysisFn: () => Promise<any>,
    stateSetter: (result: any) => void,
    analysisType: string
  ) => {
    if (!llmService) {
        const errorMsg = t('error.serviceNotInitialized');
        setError(errorMsg);
        toast.error(errorMsg);
        return;
    }
    setIsLoading(true);
    setActiveAnalysis(analysisType);
    setError(null);
    try {
      const result = await analysisFn();
      stateSetter(result);
      toast.success(t(`toast.success.${analysisType}`));
      return result; // Return result for chaining
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'error.unknown';
      setError(t(errorMessage));
      toast.error(t(errorMessage));
    } finally {
      setIsLoading(false);
      setActiveAnalysis(null);
    }
  };

  const handleAnalyze = async (inputs: { jobInput: GeminiInput; resumeInput: GeminiInput; }) => {
    if (!llmService) return;
    setAnalysisResult(null);
    setPreliminaryDecision(null);
    setConsistencyResult(null);
    setRewrittenResume(null);

    const result = await executeAnalysis(
      () => llmService.analyzeForRecruiter(inputs.jobInput, inputs.resumeInput, language),
      setAnalysisResult,
      'analyze'
    );
    if(result) {
        setLastAnalysisInputs({ jobInput: inputs.jobInput, resumeInput: inputs.resumeInput });
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  
  const handleGenerateDecision = async () => {
    if (!analysisResult || !llmService) return;
    await executeAnalysis(
      () => llmService.generatePreliminaryDecision(analysisResult, language),
      setPreliminaryDecision,
      'generateDecision'
    );
  };
  
  const handleAnalyzeConsistency = async () => {
    if (!analysisResult || !interviewTranscript || !llmService || !lastAnalysisInputs) return;
    await executeAnalysis(
      () => llmService.analyzeInterviewConsistency(lastAnalysisInputs.jobInput, lastAnalysisInputs.resumeInput, interviewTranscript, analysisResult.compatibilityGaps, language),
      setConsistencyResult,
      'analyzeConsistency'
    );
  };

  const handleRewriteResume = async () => {
    if (!lastAnalysisInputs || !llmService) return;
    await executeAnalysis(
      () => llmService.rewriteResumeForJob(lastAnalysisInputs.jobInput, lastAnalysisInputs.resumeInput, language),
      setRewrittenResume,
      'rewriteResume'
    );
  };

  const handleDownloadPdf = async () => {
    if (!analysisResult) return;
    setIsDownloadingPdf(true);
    try {
        const reportComponent = (
            <PrintableReport
                t={t}
                analysisResult={analysisResult}
                preliminaryDecision={preliminaryDecision}
                consistencyResult={consistencyResult}
                rewrittenResume={rewrittenResume}
            />
        );
        const filename = `${analysisResult.jobTitle.replace(/[^a-z0-9]/gi, '_')}_Full_Report.pdf`;
        await downloadComponentAsPdf(reportComponent, filename);
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'error.unknown';
        toast.error(t(errorMessage));
    } finally {
        setIsDownloadingPdf(false);
    }
  };

  const renderContent = () => {
    if (!isAuthenticated) return <AuthPage onAuthSuccess={handleAuthSuccess} />;

    switch (currentView) {
        case 'settings':
            return <SettingsModal onNavigateBack={() => setCurrentView('app')} onSave={setLlmConfig} initialConfig={llmConfig} />;
        case 'profile':
             return <ProfilePage onNavigateBack={() => setCurrentView('app')} />;
        case 'app':
        case 'landing': // Landing and app share some components but have different flows
            return (
                <>
                    {currentView === 'landing' && <HeroSection onPrimaryCtaClick={() => inputRef.current?.scrollIntoView({ behavior: 'smooth' })} />}
                    {currentView === 'landing' && <FeaturesSection />}
                    
                    <InputSection 
                        ref={inputRef}
                        onAnalyze={handleAnalyze} 
                        isLoading={isLoading && activeAnalysis === 'analyze'}
                        isLoggedIn={isAuthenticated}
                        onLoginClick={() => { /* Should not be called if authenticated */ }}
                    />

                    {isLoading && activeAnalysis === 'analyze' && (
                        <div className="text-center py-20">
                            <LoadingSpinner />
                            <p className="mt-4 text-muted-foreground">{t('analysis.loading')}</p>
                        </div>
                    )}
                    {error && activeAnalysis === 'analyze' && (
                        <div className="container mx-auto max-w-5xl my-8">
                            <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-lg">
                                <h3 className="font-bold">{t('error.title')}</h3>
                                <p>{error}</p>
                            </div>
                        </div>
                    )}

                    {analysisResult && (
                        <div ref={resultsRef}>
                            <ResultsSection
                                analysisResult={analysisResult}
                                preliminaryDecision={preliminaryDecision}
                                consistencyResult={consistencyResult}
                                rewrittenResume={rewrittenResume}
                                onGenerateDecision={handleGenerateDecision}
                                onRewriteResume={handleRewriteResume}
                                onAnalyzeConsistency={handleAnalyzeConsistency}
                                interviewTranscript={interviewTranscript}
                                setInterviewTranscript={setInterviewTranscript}
                                isLoading={isLoading}
                                activeAnalysis={activeAnalysis}
                                onDownloadPdf={handleDownloadPdf}
                                isDownloadingPdf={isDownloadingPdf}
                            />
                        </div>
                    )}
                </>
            );
        default:
            return null;
    }
  }

  return (
    <div className={`bg-background text-foreground min-h-screen font-sans antialiased`}>
      <Navbar
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        onNavigate={setCurrentView}
        theme={theme}
        toggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      />
      {renderContent()}
    </div>
  );
};

export default App;