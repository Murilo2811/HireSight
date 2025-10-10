import React, { useState, useRef, useEffect } from 'react';
import { useTranslations } from './contexts/LanguageContext';
import {
  RecruiterAnalysisResult,
  ConsistencyAnalysisResult,
  PreliminaryDecisionResult,
  RewrittenResumeResult,
} from './types';
import { getLlmService, LlmConfig } from './services/llmService';

// Importa as novas seções
import Navbar from './components/sections/Navbar';
import HeroSection from './components/sections/HeroSection';
import FeaturesSection from './components/sections/FeaturesSection';
import InputSection from './components/sections/InputSection';
import ResultsSection from './components/sections/ResultsSection';
import AuthPage from './components/AuthPage';
// FIX: Import `toast` which is now properly exported from the Toast component file.
import { Toaster, toast } from './components/ui/Toast';

type View = 'home' | 'auth';

const App: React.FC = () => {
  const { t, language } = useTranslations();
  const [view, setView] = useState<View>('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Referência para scroll
  const analysisSectionRef = useRef<HTMLDivElement>(null);

  // Estados de Resultados
  const [analysisResult, setAnalysisResult] =
    useState<RecruiterAnalysisResult | null>(null);
  const [preliminaryDecision, setPreliminaryDecision] =
    useState<PreliminaryDecisionResult | null>(null);
  const [consistencyResult, setConsistencyResult] =
    useState<ConsistencyAnalysisResult | null>(null);
  const [rewrittenResume, setRewrittenResume] =
    useState<RewrittenResumeResult | null>(null);

  // Estados de Loading e Erro
  const [isLoading, setIsLoading] = useState(false);
  const [activeAnalysis, setActiveAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // FIX: Added state for LLM configuration to align with the new multi-provider architecture.
  const [llmConfig, setLlmConfig] = useState<LlmConfig>({
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    apiKeys: {},
  });

  // Efeito para "roteamento" simples
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#auth') {
        setView('auth');
      } else {
        setView('home');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Seta a view inicial baseada no hash
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (newView: View) => {
    window.location.hash = newView;
  };
  
  const handleStartAnalysisClick = () => {
    if (!isLoggedIn) {
      navigate('auth');
      toast.error(t('auth.toast.loginRequired'));
    } else {
      analysisSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleAuthSuccess = () => {
    setIsLoggedIn(true);
    navigate('home');
    toast.success(t('auth.toast.loginSuccess'));
    setTimeout(() => {
        analysisSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 300)
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    toast.info(t('auth.toast.logoutSuccess'));
  };

  const resetAllResults = () => {
    setAnalysisResult(null);
    setPreliminaryDecision(null);
    setConsistencyResult(null);
    setRewrittenResume(null);
    setError(null);
  };

  // FIX: Updated the generic LLM action executor to work with service methods that don't require a single params object.
  const executeLlmAction = async <T,>(
    action: () => Promise<T>,
    actionName: string,
    setResult: (result: T | null) => void
  ) => {
    setIsLoading(true);
    setActiveAnalysis(actionName);
    setError(null);
    try {
      const result = await action();
      setResult(result);
      toast.success(t(`toast.${actionName}Success`));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : t('error.unknown');
      setError(errorMessage);
      toast.error(`${t('error.title')}: ${errorMessage}`);
    } finally {
      setIsLoading(false);
      setActiveAnalysis(null);
    }
  };

  // FIX: Updated handler to use the LLM service factory and call the service method with positional arguments.
  const handleAnalyze = async (inputs: {
    jobInput: any;
    resumeInput: any;
  }) => {
    resetAllResults();
    const service = getLlmService(llmConfig);
    executeLlmAction(
      () => service.analyzeForRecruiter(inputs.jobInput, inputs.resumeInput, language),
      'analyze',
      setAnalysisResult
    );
  };
  
  // FIX: Updated handler to use the LLM service factory.
  const handleGenerateDecision = async () => {
    if (!analysisResult) return;
    const service = getLlmService(llmConfig);
    executeLlmAction(
      () => service.generatePreliminaryDecision(analysisResult, language),
      'generateDecision',
      setPreliminaryDecision
    );
  };
  
  // FIX: Updated handler to use the LLM service factory.
  const handleAnalyzeConsistency = async (inputs: { jobInput: any; resumeInput: any; interviewTranscript: string; }) => {
    if (!analysisResult) return;
    const service = getLlmService(llmConfig);
    executeLlmAction(
      () => service.analyzeInterviewConsistency(inputs.jobInput, inputs.resumeInput, inputs.interviewTranscript, analysisResult.compatibilityGaps, language),
      'analyzeConsistency',
      setConsistencyResult
    );
  };

  // FIX: Updated handler to use the LLM service factory.
  const handleRewriteResume = async (inputs: { jobInput: any; resumeInput: any; }) => {
     if (!analysisResult) return;
     const service = getLlmService(llmConfig);
     executeLlmAction(
      () => service.rewriteResumeForJob(inputs.jobInput, inputs.resumeInput, language),
      'rewriteResume',
      setRewrittenResume
    );
  };

  if (view === 'auth') {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="bg-background text-foreground font-sans antialiased">
      <Toaster />
      <Navbar
        isLoggedIn={isLoggedIn}
        onLoginClick={() => navigate('auth')}
        onLogoutClick={handleLogout}
      />
      <main className="flex-1">
        <HeroSection onPrimaryCtaClick={handleStartAnalysisClick} />
        <FeaturesSection />
        <InputSection
          ref={analysisSectionRef}
          onAnalyze={handleAnalyze}
          isLoading={isLoading && activeAnalysis === 'analyze'}
          isLoggedIn={isLoggedIn}
          onLoginClick={() => navigate('auth')}
        />
        {error && (
            <div className="container max-w-5xl my-8">
                 <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-lg">
                    <h4 className="font-bold">{t('error.title')}</h4>
                    <p className="text-sm">{error}</p>
                </div>
            </div>
        )}
        {analysisResult && (
          <ResultsSection
            analysisResult={analysisResult}
            preliminaryDecision={preliminaryDecision}
            consistencyResult={consistencyResult}
            rewrittenResume={rewrittenResume}
            onGenerateDecision={handleGenerateDecision}
            onAnalyzeConsistency={handleAnalyzeConsistency}
            onRewriteResume={handleRewriteResume}
            isLoading={isLoading}
            activeAnalysis={activeAnalysis}
          />
        )}
      </main>
    </div>
  );
};

export default App;
