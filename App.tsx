import React, { useState, useMemo } from 'react';
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
              <h2 className="text-2xl font-semibold mb-4 text-gray-200">{t('jobDescription.title')}</h2>
              <div className="border-b border-gray-600 mb-4">
                  <div className="flex -mb-px">
                      <TabButton active={jobInputType === 'text'} onClick={() => setJobInputType('text')}><FileTextIcon className="w-4 h-4" /> {t('jobDescription.pasteText')}</TabButton>
                      <TabButton active={jobInputType === 'url'} onClick={() => setJobInputType('url')}><GlobeIcon className="w-4 h-4" /> {t('jobDescription.fromUrl')}</TabButton>
                      <TabButton active={jobInputType === 'file'} onClick={() => setJobInputType('file')}><UploadIcon className="w-4 h-4" /> {t('jobDescription.uploadFile')}</TabButton>
                  </div>
              </div>
              {jobInputType === 'text' && <textarea value={jobDescriptionText} onChange={e => setJobDescriptionText(e.target.value)} placeholder={t('jobDescription.textPlaceholder')} className="w-full h-40 p-3 bg-gray-700 rounded border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition" />}
              {jobInputType === 'url' && <input type="url" value={jobDescriptionUrl} onChange={e => setJobDescriptionUrl(e.target.value)} placeholder={t('jobDescription.urlPlaceholder')} className="w-full p-3 bg-gray-700 rounded border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition" />}
              {jobInputType === 'file' && <input type="file" onChange={e => setJobDescriptionFile(e.target.files ? e.target.files[0] : null)} accept=".pdf,.docx" className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-700" />}
            </div>

            {/* Resume Input */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <h2 className="text-2xl font-semibold mb-4 text-gray-200">{t('resume.title')}</h2>
              <div className="border-b border-gray-600 mb-4">
                  <div className="flex -mb-px">
                      <TabButton active={resumeInputType === 'text'} onClick={() => setResumeInputType('text')}><FileTextIcon className="w-4 h-4" /> {t('resume.pasteText')}</TabButton>
                      <TabButton active={resumeInputType === 'file'} onClick={() => setResumeInputType('file')}><UploadIcon className="w-4 h-4" /> {t('resume.uploadFile')}</TabButton>
                  </div>
              </div>
              {resumeInputType === 'text' && <textarea value={resumeText} onChange={e => setResumeText(e.target.value)} placeholder={t('resume.textPlaceholder')} className="w-full h-40 p-3 bg-gray-700 rounded border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition" />}
              {resumeInputType === 'file' && <input type="file" onChange={e => setResumeFile(e.target.files ? e.target.files[0] : null)} accept=".pdf,.docx" className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-700" />}
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

const RecruiterAnalysisResultDisplay: React.FC<{ result: RecruiterAnalysisResult }> = ({ result }) => {
  const { t } = useTranslations();
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6 text-gray-300">
      <div className="p-4 bg-gray-700/50 rounded-lg">
        <h3 className="text-xl font-bold text-cyan-400">{result.jobTitle}</h3>
        <div className="flex items-baseline gap-4 mt-2">
            <p className={`text-4xl font-bold ${getScoreColor(result.overallFitScore)}`}>{result.overallFitScore}<span className="text-2xl">%</span></p>
            <p className="text-lg font-semibold text-gray-200">{t('analysis.overallFit')}</p>
        </div>
      </div>
      
      <ResultSection title={t('analysis.summary')}>
        <p>{result.summary}</p>
      </ResultSection>

      <ResultSection title={t('analysis.fitExplanation')}>
        <p>{result.fitExplanation}</p>
      </ResultSection>

      {result.compatibilityGaps && result.compatibilityGaps.length > 0 && (
        <ResultSection title={t('analysis.compatibilityGaps')}>
            <ul className="list-disc list-inside space-y-1 text-yellow-300">
                {result.compatibilityGaps?.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
        </ResultSection>
      )}

      <ResultSection title={t('analysis.keyResponsibilities')}>
        <ul className="list-disc list-inside space-y-1">
          {result.keyResponsibilities?.map((item, index) => <li key={index}>{item}</li>)}
        </ul>
      </ResultSection>

      <ResultSection title={t('analysis.requiredSkills')}>
        <ul className="list-disc list-inside space-y-1">
          {result.requiredSkills?.map((item, index) => <li key={index}>{item}</li>)}
        </ul>
      </ResultSection>

      {result.niceToHaveSkills && result.niceToHaveSkills.length > 0 && (
        <ResultSection title={t('analysis.niceToHaveSkills')}>
            <ul className="list-disc list-inside space-y-1">
            {result.niceToHaveSkills?.map((item, index) => <li key={index}>{item}</li>)}
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
      
      {result.companyCulture && (
          <ResultSection title={t('analysis.companyCulture')}>
            <p>{result.companyCulture}</p>
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
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-400';
        if (score >= 60) return 'text-yellow-400';
        return 'text-red-400';
    };

    return (
        <div className="space-y-6 text-gray-300 mt-4">
            <div className="p-4 bg-gray-700/50 rounded-lg">
                <div className="flex items-baseline gap-4">
                    <p className={`text-3xl font-bold ${getScoreColor(result.consistencyScore)}`}>{result.consistencyScore}<span className="text-xl">%</span></p>
                    <p className="text-lg font-semibold text-gray-200">{t('consistency.consistencyScore')}</p>
                </div>
            </div>

            <ResultSection title={t('consistency.missingFromInterview')}>
                {result.missingFromInterview?.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1 text-yellow-300">
                        {result.missingFromInterview?.map((item, index) => <li key={index}>{item}</li>)}
                    </ul>
                ) : (
                    <p className="text-gray-400">{t('consistency.none')}</p>
                )}
            </ResultSection>

            <ResultSection title={t('consistency.newInInterview')}>
                 {result.newInInterview?.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1 text-green-400">
                        {result.newInInterview?.map((item, index) => <li key={index}>{item}</li>)}
                    </ul>
                ) : (
                    <p className="text-gray-400">{t('consistency.none')}</p>
                )}
            </ResultSection>
        </div>
    );
};


const ResultSection: React.FC<{title: string; children: React.ReactNode}> = ({ title, children }) => (
    <div>
        <h4 className="text-lg font-semibold text-gray-100 border-b border-gray-600 pb-2 mb-3">{title}</h4>
        {children}
    </div>
);


export default App;
