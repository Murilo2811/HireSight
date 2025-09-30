import React, { useState, useMemo, useRef } from 'react';
import { useTranslations } from './contexts/LanguageContext';
import { analyzeForRecruiter, analyzeInterviewConsistency } from './services/geminiService';
import { parseDocumentFile, parseUrlContent } from './utils/parsers';
import { RecruiterAnalysisResult, ConsistencyAnalysisResult } from './types';
import LoadingSpinner from './components/LoadingSpinner';
import { FileTextIcon, GlobeIcon, UploadIcon } from './components/icons';

type JobInputType = 'text' | 'url' | 'file';
type ResumeInputType = 'text' | 'file';

const App: React.FC = () => {
  const { t, language, setLanguage } = useTranslations();
  
  const [jobInputType, setJobInputType] = useState<JobInputType>('text');
  const [resumeInputType, setResumeInputType] = useState<ResumeInputType>('text');

  const [jobDescriptionText, setJobDescriptionText] = useState('');
  const [jobDescriptionUrl, setJobDescriptionUrl] = useState('');
  const [jobDescriptionFile, setJobDescriptionFile] = useState<File | null>(null);

  const [resumeText, setResumeText] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  
  const [interviewTranscript, setInterviewTranscript] = useState('');

  const [analysisResult, setAnalysisResult] = useState<RecruiterAnalysisResult | null>(null);
  const [consistencyResult, setConsistencyResult] = useState<ConsistencyAnalysisResult | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzingConsistency, setIsAnalyzingConsistency] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [consistencyError, setConsistencyError] = useState<string | null>(null);

  const jobDescriptionFileRef = useRef<HTMLInputElement>(null);
  const resumeFileRef = useRef<HTMLInputElement>(null);
  
  const isAnalyzeDisabled = useMemo(() => {
    if (isLoading) return true;
    const isJobInputMissing = 
        (jobInputType === 'text' && !jobDescriptionText) ||
        (jobInputType === 'url' && !jobDescriptionUrl) ||
        (jobInputType === 'file' && !jobDescriptionFile);
    const isResumeInputMissing = 
        (resumeInputType === 'text' && !resumeText) ||
        (resumeInputType === 'file' && !resumeFile);
    return isJobInputMissing || isResumeInputMissing;
  }, [isLoading, jobInputType, jobDescriptionText, jobDescriptionUrl, jobDescriptionFile, resumeInputType, resumeText, resumeFile]);

  const getJobInput = async () => {
    if (jobInputType === 'text') {
      return { content: jobDescriptionText, format: 'text' as const };
    } else if (jobInputType === 'url') {
      const content = await parseUrlContent(jobDescriptionUrl);
      return { content, format: 'text' as const };
    } else if (jobInputType === 'file' && jobDescriptionFile) {
      return parseDocumentFile(jobDescriptionFile);
    }
    throw new Error(t('error.jobDescriptionMissing'));
  };

  const getResumeInput = async () => {
    if (resumeInputType === 'text') {
      return { content: resumeText, format: 'text' as const };
    } else if (resumeInputType === 'file' && resumeFile) {
      return parseDocumentFile(resumeFile);
    }
    throw new Error(t('error.resumeMissing'));
  };

  const handleAnalyze = async () => {
    if (isAnalyzeDisabled) return;

    setIsLoading(true);
    setAnalysisResult(null);
    setConsistencyResult(null); 
    setError(null);
    setConsistencyError(null);

    try {
      const jobInput = await getJobInput();
      const resumeInput = await getResumeInput();
      const result = await analyzeForRecruiter(jobInput, resumeInput, language);
      setAnalysisResult(result);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : t('error.unknown');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeConsistency = async () => {
    if (!interviewTranscript) return;

    setIsAnalyzingConsistency(true);
    setConsistencyResult(null);
    setConsistencyError(null);

    try {
        const jobInput = await getJobInput();
        const resumeInput = await getResumeInput();

        const result = await analyzeInterviewConsistency(jobInput, resumeInput, interviewTranscript, language);
        setConsistencyResult(result);
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : t('error.unknownConsistency');
        setConsistencyError(errorMessage);
    } finally {
        setIsAnalyzingConsistency(false);
    }
  };

  const handleClearJobDescription = () => {
    setJobDescriptionText('');
    setJobDescriptionUrl('');
    setJobDescriptionFile(null);
    if (jobDescriptionFileRef.current) {
      jobDescriptionFileRef.current.value = '';
    }
  };

  const handleClearResume = () => {
    setResumeText('');
    setResumeFile(null);
    if (resumeFileRef.current) {
      resumeFileRef.current.value = '';
    }
  };
  
  const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
        active
          ? 'bg-gray-700 text-white border-b-2 border-cyan-400'
          : 'text-gray-400 hover:bg-gray-800 hover:text-gray-300'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans">
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-cyan-400">{t('appTitle')}</h1>
          <div className="flex gap-2">
            <button onClick={() => setLanguage('en')} className={`px-3 py-1 text-sm rounded ${language === 'en' ? 'bg-cyan-500 text-white' : 'bg-gray-700'}`}>EN</button>
            <button onClick={() => setLanguage('pt')} className={`px-3 py-1 text-sm rounded ${language === 'pt' ? 'bg-cyan-500 text-white' : 'bg-gray-700'}`}>PT</button>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="flex flex-col gap-6">
            {/* Job Description Input */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-200">{t('jobDescription.title')}</h2>
                <button onClick={handleClearJobDescription} className="flex items-center gap-1.5 px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.1 3.1 12 3 11.9 3.1C10.4 3.5 9 4.6 8.2 6.2c-.3.6-.5 1.2-.5 1.8 0 .4.1.8.2 1.2l.2.7.2.7c.3.8.7 1.6 1.2 2.3l.2.3.2.3c.2.2.3.4.5.6s.4.4.6.6l.3.2.3.2c.7.5 1.5.9 2.3 1.2l.7.2.7.2c.4.1.8.2 1.2.2.6 0 1.2-.2 1.8-.5 1.6-.8 2.7-2.2 3.1-3.7l.1-.6V12v-.1-.1l-.1-.6c-.4-1.5-1.5-2.8-3.1-3.2l-.6-.1h-.1V8h-.1l-.6.1zM12 8.5c-.3 0-.5.2-.5.5v2.5c0 .3.2.5.5.5s.5-.2.5-.5V9c0-.3-.2-.5-.5-.5zm0 5.5c-.3 0-.5.2-.5.5v.5c0 .3.2.5.5.5s.5-.2.5-.5v-.5c0-.3-.2-.5-.5-.5z" /><path d="m21.6 14.1-3.2-1.3c-.4-.1-.8.1-1 .4l-1.3 1.3c-1.3-1.3-2.3-2.3-3.6-3.6l1.3-1.3c.3-.3.5-.7.4-1L14.1 5.4c-.1-.4-.5-.7-.9-.7H12c-.5 0-.9.4-1 .9l-.7 3.2c-.1.4.1.8.4 1l1.3 1.3c1.3 1.3 2.3 2.3 3.6 3.6l-1.3 1.3c-.3.3-.5.7-.4 1l.7 3.2c.1.5.6.9 1.1.9h1.2c.4 0 .8-.3.9-.7z" /></svg>
                  {t('buttons.clear')}
                </button>
              </div>
              <div className="border-b border-gray-600 mb-4">
                  <div className="flex -mb-px">
                      <TabButton active={jobInputType === 'text'} onClick={() => setJobInputType('text')}><FileTextIcon className="w-4 h-4" /> {t('jobDescription.pasteText')}</TabButton>
                      <TabButton active={jobInputType === 'url'} onClick={() => setJobInputType('url')}><GlobeIcon className="w-4 h-4" /> {t('jobDescription.fromUrl')}</TabButton>
                      <TabButton active={jobInputType === 'file'} onClick={() => setJobInputType('file')}><UploadIcon className="w-4 h-4" /> {t('jobDescription.uploadFile')}</TabButton>
                  </div>
              </div>
              {jobInputType === 'text' && <textarea value={jobDescriptionText} onChange={e => setJobDescriptionText(e.target.value)} placeholder={t('jobDescription.textPlaceholder')} className="w-full h-40 p-3 bg-gray-700 rounded border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition" />}
              {jobInputType === 'url' && <input type="url" value={jobDescriptionUrl} onChange={e => setJobDescriptionUrl(e.target.value)} placeholder={t('jobDescription.urlPlaceholder')} className="w-full p-3 bg-gray-700 rounded border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition" />}
              {jobInputType === 'file' && <input ref={jobDescriptionFileRef} type="file" onChange={e => setJobDescriptionFile(e.target.files ? e.target.files[0] : null)} accept=".pdf,.docx" className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-700" />}
            </div>

            {/* Resume Input */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-200">{t('resume.title')}</h2>
                <button onClick={handleClearResume} className="flex items-center gap-1.5 px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors">
                   <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.1 3.1 12 3 11.9 3.1C10.4 3.5 9 4.6 8.2 6.2c-.3.6-.5 1.2-.5 1.8 0 .4.1.8.2 1.2l.2.7.2.7c.3.8.7 1.6 1.2 2.3l.2.3.2.3c.2.2.3.4.5.6s.4.4.6.6l.3.2.3.2c.7.5 1.5.9 2.3 1.2l.7.2.7.2c.4.1.8.2 1.2.2.6 0 1.2-.2 1.8-.5 1.6-.8 2.7-2.2 3.1-3.7l.1-.6V12v-.1-.1l-.1-.6c-.4-1.5-1.5-2.8-3.1-3.2l-.6-.1h-.1V8h-.1l-.6.1zM12 8.5c-.3 0-.5.2-.5.5v2.5c0 .3.2.5.5.5s.5-.2.5-.5V9c0-.3-.2-.5-.5-.5zm0 5.5c-.3 0-.5.2-.5.5v.5c0 .3.2.5.5.5s.5-.2.5-.5v-.5c0-.3-.2-.5-.5-.5z" /><path d="m21.6 14.1-3.2-1.3c-.4-.1-.8.1-1 .4l-1.3 1.3c-1.3-1.3-2.3-2.3-3.6-3.6l1.3-1.3c.3-.3.5-.7.4-1L14.1 5.4c-.1-.4-.5-.7-.9-.7H12c-.5 0-.9.4-1 .9l-.7 3.2c-.1.4.1.8.4 1l1.3 1.3c1.3 1.3 2.3 2.3 3.6 3.6l-1.3 1.3c-.3.3-.5.7-.4 1l.7 3.2c.1.5.6.9 1.1.9h1.2c.4 0 .8-.3.9-.7z" /></svg>
                  {t('buttons.clear')}
                </button>
              </div>
              <div className="border-b border-gray-600 mb-4">
                  <div className="flex -mb-px">
                      <TabButton active={resumeInputType === 'text'} onClick={() => setResumeInputType('text')}><FileTextIcon className="w-4 h-4" /> {t('resume.pasteText')}</TabButton>
                      <TabButton active={resumeInputType === 'file'} onClick={() => setResumeInputType('file')}><UploadIcon className="w-4 h-4" /> {t('resume.uploadFile')}</TabButton>
                  </div>
              </div>
              {resumeInputType === 'text' && <textarea value={resumeText} onChange={e => setResumeText(e.target.value)} placeholder={t('resume.textPlaceholder')} className="w-full h-40 p-3 bg-gray-700 rounded border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition" />}
              {resumeInputType === 'file' && <input ref={resumeFileRef} type="file" onChange={e => setResumeFile(e.target.files ? e.target.files[0] : null)} accept=".pdf,.docx" className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-700" />}
            </div>
            
            <button onClick={handleAnalyze} disabled={isAnalyzeDisabled} className="w-full bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-cyan-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed flex justify-center items-center gap-2">
              {isLoading ? <><LoadingSpinner /> {t('buttons.analyzing')}</> : t('buttons.analyze')}
            </button>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg space-y-6">
            <div>
                <h2 className="text-2xl font-semibold mb-4 border-b border-gray-600 pb-2 text-gray-200">{t('analysis.title')}</h2>
                {isLoading && <div className="flex flex-col items-center justify-center h-full text-gray-400"><LoadingSpinner /><p className="mt-4">{t('analysis.loading')}</p></div>}
                {error && <div className="bg-red-900 border border-red-500 text-red-200 px-4 py-3 rounded-lg"><p className="font-bold">{t('error.title')}</p><p>{error}</p></div>}
                {analysisResult && <RecruiterAnalysisResultDisplay result={analysisResult} />}
                {!isLoading && !error && !analysisResult && <div className="flex items-center justify-center h-full text-gray-500">{t('analysis.placeholder')}</div>}
            </div>

            {analysisResult && !isLoading && (
              <div className="border-t border-cyan-500 pt-6">
                <h2 className="text-2xl font-semibold mb-4 text-gray-200">{t('consistency.title')}</h2>
                <textarea 
                  value={interviewTranscript} 
                  onChange={e => setInterviewTranscript(e.target.value)} 
                  placeholder={t('consistency.placeholder')} 
                  className="w-full h-32 p-3 bg-gray-700 rounded border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition mb-4" 
                />
                <button 
                  onClick={handleAnalyzeConsistency} 
                  disabled={!interviewTranscript || isAnalyzingConsistency} 
                  className="w-full bg-teal-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  {isAnalyzingConsistency ? <><LoadingSpinner /> {t('buttons.analyzingConsistency')}</> : t('buttons.analyzeConsistency')}
                </button>
                {isAnalyzingConsistency && <div className="flex flex-col items-center justify-center text-gray-400 mt-4"><LoadingSpinner /><p className="mt-2">{t('consistency.loading')}</p></div>}
                {consistencyError && <div className="mt-4 bg-red-900 border border-red-500 text-red-200 px-4 py-3 rounded-lg"><p className="font-bold">{t('error.title')}</p><p>{consistencyError}</p></div>}
                {consistencyResult && <ConsistencyResultDisplay result={consistencyResult} />}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

const getScoreColor = (score: number) => {
    if (score >= 80) return { text: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500' };
    if (score >= 60) return { text: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500' };
    return { text: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500' };
};

const ScoreBadge: React.FC<{ score: number }> = ({ score }) => {
    const { text, bg } = getScoreColor(score);
    return (
        <span className={`px-2.5 py-1 text-xs font-bold ${text} ${bg} rounded-full`}>
            {score}
        </span>
    );
};

const RecruiterAnalysisResultDisplay: React.FC<{ result: RecruiterAnalysisResult }> = ({ result }) => {
  const { t } = useTranslations();
  const [isHighlightingEnabled, setIsHighlightingEnabled] = useState(true);

  const scoreColors = getScoreColor(result.overallFitScore);

  // Memoize the keyword list for performance
  const keywords = useMemo(() => {
    const allKeywords = [
      ...(result.requiredSkillsMatch?.items || []),
      ...(result.niceToHaveSkillsMatch?.items || []),
    ];
    
    // Extract individual words from skill phrases, clean them up, and remove duplicates.
    const processedKeywords = allKeywords
      .flatMap(skill => skill.split(/[\s,./()]+/)) // Split by common delimiters
      .map(word => word.trim().replace(/[.,;:]$/, '')) // Trim and remove trailing punctuation
      .filter(word => word && word.length > 2); // Filter out empty strings and short words

    return [...new Set(processedKeywords)];
  }, [result.requiredSkillsMatch, result.niceToHaveSkillsMatch]);

  // Function to highlight keywords in a given text
  const highlightKeywords = (text: string | undefined) => {
    if (!isHighlightingEnabled || !text || !keywords.length) {
      return text;
    }

    // Escape special characters in keywords for safe regex creation
    const escapedKeywords = keywords.map(kw => kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
    const regex = new RegExp(`\\b(${escapedKeywords.join('|')})\\b`, 'gi');
    const parts = text.split(regex);

    return (
      <>
        {parts.map((part, index) => {
          const isKeyword = keywords.some(kw => kw.toLowerCase() === part.toLowerCase());
          return isKeyword ? (
            <mark key={index} className="bg-yellow-400/80 text-gray-900 font-semibold px-1 py-0.5 rounded-sm">
              {part}
            </mark>
          ) : (
            <React.Fragment key={index}>{part}</React.Fragment>
          );
        })}
      </>
    );
  };


  return (
    <div className="space-y-6 text-gray-300">
      <div className="p-4 bg-gray-700/50 rounded-lg">
        <h3 className="text-xl font-bold text-cyan-400">{result.jobTitle}</h3>
        <div className="flex items-center justify-between mt-2">
            <div className="flex items-baseline gap-4">
                <p className={`text-4xl font-bold ${scoreColors.text}`}>{result.overallFitScore}<span className="text-2xl">%</span></p>
                <p className="text-lg font-semibold text-gray-200">{t('analysis.overallFit')}</p>
            </div>
            <button
                onClick={() => setIsHighlightingEnabled(prev => !prev)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    isHighlightingEnabled
                    ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-600'
                    : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                }`}
            >
                {isHighlightingEnabled ? t('highlight.disable') : t('highlight.enable')}
            </button>
        </div>
      </div>
      
      <ResultSection title={t('analysis.summary')}>
        <p>{highlightKeywords(result.summary)}</p>
      </ResultSection>

      <ResultSection title={t('analysis.fitExplanation')}>
        <p>{highlightKeywords(result.fitExplanation)}</p>
      </ResultSection>

      {result.compatibilityGaps && result.compatibilityGaps.length > 0 && (
        <ResultSection title={t('analysis.compatibilityGaps')}>
            <ul className="list-disc list-inside space-y-1 text-yellow-300">
                {result.compatibilityGaps?.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
        </ResultSection>
      )}

      <ResultSection title={t('analysis.keyResponsibilities')} score={result.keyResponsibilitiesMatch?.score}>
        <ul className="list-disc list-inside space-y-1">
          {result.keyResponsibilitiesMatch?.items.map((item, index) => <li key={index}>{item}</li>)}
        </ul>
      </ResultSection>

      <ResultSection title={t('analysis.requiredSkills')} score={result.requiredSkillsMatch?.score}>
        <ul className="list-disc list-inside space-y-1">
          {result.requiredSkillsMatch?.items.map((item, index) => <li key={index}>{item}</li>)}
        </ul>
      </ResultSection>

      {result.niceToHaveSkillsMatch?.items && result.niceToHaveSkillsMatch.items.length > 0 && (
        <ResultSection title={t('analysis.niceToHaveSkills')} score={result.niceToHaveSkillsMatch?.score}>
            <ul className="list-disc list-inside space-y-1">
            {result.niceToHaveSkillsMatch?.items.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
        </ResultSection>
      )}

      {result.redFlags && result.redFlags.length > 0 && (
          <ResultSection title={t('analysis.redFlags')}>
            <ul className="list-disc list-inside space-y-1 text-yellow-300">
              {result.redFlags?.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
          </ResultSection>
      )}

      <ResultSection title={t('analysis.interviewQuestions')}>
        <ul className="list-decimal list-inside space-y-2">
          {result.interviewQuestions?.map((item, index) => <li key={index}>{item}</li>)}
        </ul>
      </ResultSection>
      
      {result.companyCultureFit?.analysis && (
          <ResultSection title={t('analysis.companyCulture')} score={result.companyCultureFit.score}>
            <p>{result.companyCultureFit.analysis}</p>
          </ResultSection>
      )}

      {result.salaryAndBenefits && (
          <ResultSection title={t('analysis.salaryAndBenefits')}>
            <p>{result.salaryAndBenefits}</p>
          </ResultSection>
      )}
    </div>
  );
};

const ConsistencyResultDisplay: React.FC<{ result: ConsistencyAnalysisResult }> = ({ result }) => {
    const { t } = useTranslations();
    const {text: consistencyScoreColor} = getScoreColor(result.consistencyScore);
    const {text: updatedFitScoreColor} = getScoreColor(result.updatedOverallFitScore);

    const getRecommendationStyle = (recommendation: string) => {
        switch (recommendation) {
            case 'Strong Fit': return 'bg-green-600 text-green-100';
            case 'Partial Fit': return 'bg-yellow-600 text-yellow-100';
            case 'Weak Fit': return 'bg-red-600 text-red-100';
            default: return 'bg-gray-600 text-gray-100';
        }
    };
    
    const getHiringDecisionStyle = (decision: string) => {
        if (decision === 'Recommended for Hire') {
            return 'bg-green-600 text-green-100';
        }
        return 'bg-red-600 text-red-100';
    };
    
    const CheckIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 inline-block flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
    );

    const XIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 inline-block flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
    );

    return (
        <div className="space-y-6 text-gray-300 mt-4">
             <div className="p-4 bg-gray-700/50 rounded-lg space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                        <p className="text-sm text-gray-400 mb-1">{t('consistency.updatedOverallFit')}</p>
                        <p className={`text-3xl font-bold ${updatedFitScoreColor}`}>{result.updatedOverallFitScore}<span className="text-xl">%</span></p>
                    </div>
                     <div>
                        <p className="text-sm text-gray-400 mb-1">{t('consistency.hiringDecision')}</p>
                        <span className={`px-4 py-2 text-base font-bold rounded-full ${getHiringDecisionStyle(result.hiringDecision)}`}>
                            {t(result.hiringDecision === 'Recommended for Hire' ? 'consistency.recommended' : 'consistency.notRecommended')}
                        </span>
                    </div>
                </div>
                <div className="border-t border-gray-600 pt-4 flex justify-between items-center text-sm">
                    <div className="flex items-baseline gap-2">
                        <p className="font-semibold text-gray-200">{t('consistency.consistencyScore')}:</p>
                        <p className={`font-bold ${consistencyScoreColor}`}>{result.consistencyScore}%</p>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <p className="font-semibold text-gray-200">{t('consistency.recommendation')}:</p>
                         <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${getRecommendationStyle(result.recommendation)}`}>
                            {result.recommendation}
                        </span>
                    </div>
                </div>
            </div>

            <ResultSection title={t('consistency.summary')}>
                <p>{result.summary}</p>
            </ResultSection>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {result.prosForHiring && result.prosForHiring.length > 0 && (
                    <ResultSection title={t('consistency.prosForHiring')}>
                        <ul className="space-y-2">
                            {result.prosForHiring.map((item, index) => 
                                <li key={index} className="flex items-start text-green-300">
                                    <CheckIcon />
                                    <span>{item}</span>
                                </li>
                            )}
                        </ul>
                    </ResultSection>
                )}

                {result.consForHiring && result.consForHiring.length > 0 && (
                    <ResultSection title={t('consistency.consForHiring')}>
                        <ul className="space-y-2">
                            {result.consForHiring.map((item, index) => 
                                <li key={index} className="flex items-start text-red-400">
                                    <XIcon />
                                    <span>{item}</span>
                                </li>
                            )}
                        </ul>
                    </ResultSection>
                )}
            </div>

            <ResultSection title={t('consistency.softSkillsAnalysis')} score={result.softSkillsAnalysis.score}>
                <p>{result.softSkillsAnalysis.items}</p>
            </ResultSection>
            
            {result.inconsistencies && result.inconsistencies.items.length > 0 && (
                <ResultSection title={t('consistency.inconsistencies')} score={result.inconsistencies.score}>
                    <ul className="list-disc list-inside space-y-1 text-red-400">
                        {result.inconsistencies.items.map((item, index) => <li key={index}>{item}</li>)}
                    </ul>
                </ResultSection>
            )}

            <ResultSection title={t('consistency.missingFromInterview')} score={result.missingFromInterview.score}>
                {result.missingFromInterview?.items.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1 text-yellow-300">
                        {result.missingFromInterview?.items.map((item, index) => <li key={index}>{item}</li>)}
                    </ul>
                ) : (
                    <p className="text-gray-400">{t('consistency.none')}</p>
                )}
            </ResultSection>

            <ResultSection title={t('consistency.newInInterview')} score={result.newInInterview.score}>
                 {result.newInInterview?.items.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1 text-green-400">
                        {result.newInInterview?.items.map((item, index) => <li key={index}>{item}</li>)}
                    </ul>
                ) : (
                    <p className="text-gray-400">{t('consistency.none')}</p>
                )}
            </ResultSection>
        </div>
    );
};


const ResultSection: React.FC<{title: string; score?: number; children: React.ReactNode}> = ({ title, score, children }) => (
    <div>
        <div className="flex items-center justify-between border-b border-gray-600 pb-2 mb-3">
            <h4 className="text-lg font-semibold text-gray-100">{title}</h4>
            {score !== undefined && <ScoreBadge score={score} />}
        </div>
        {children}
    </div>
);


export default App;