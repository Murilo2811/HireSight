import React, { useState } from 'react';
import { useTranslations } from '../../contexts/LanguageContext';
import {
  RecruiterAnalysisResult,
  PreliminaryDecisionResult,
  ConsistencyAnalysisResult,
  RewrittenResumeResult,
  MatchStatus,
  MatchedItem,
} from '../../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { AwardIcon, DownloadIcon, CheckCircle2Icon, XCircleIcon, FileTextIcon, InfoIcon, MicIcon, PdfIcon } from '../icons';
import { downloadFile } from '../../utils/parsers';
import { Textarea } from '../ui/Textarea';
import { Label } from '../ui/Label';
import ConsistencyInfoModal from '../ConsistencyInfoModal';

interface ResultsSectionProps {
  analysisResult: RecruiterAnalysisResult;
  preliminaryDecision: PreliminaryDecisionResult | null;
  consistencyResult: ConsistencyAnalysisResult | null;
  rewrittenResume: RewrittenResumeResult | null;
  onGenerateDecision: () => void;
  onRewriteResume: () => void;
  onAnalyzeConsistency: () => void;
  onDownloadPdf: () => void;
  isDownloadingPdf: boolean;
  interviewTranscript: string;
  setInterviewTranscript: (value: string) => void;
  isLoading: boolean;
  activeAnalysis: string | null;
}

// Helper component for section titles
const ResultSection: React.FC<{ title: string; score?: number; children: React.ReactNode }> = ({ title, score, children }) => (
    <div className="py-4 first:pt-0 last:pb-0">
        <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-semibold">{title}</h4>
            {score !== undefined && <Badge variant="secondary">{score}%</Badge>}
        </div>
        <div className="text-sm">{children}</div>
    </div>
);

// Helper component for matched items
const MatchedItemsList: React.FC<{ items: MatchedItem[] }> = ({ items }) => {
    const { t } = useTranslations();
    
    const MatchStatusBadge: React.FC<{ status: MatchStatus }> = ({ status }) => {
        const variants: {[key in MatchStatus]: 'success' | 'warning' | 'danger'} = {
            'Match': 'success',
            'Partial': 'warning',
            'No Match': 'danger',
        };
        const statusKey = `status.${status.toLowerCase().replace(' ', '')}`;
        return <Badge variant={variants[status]}>{t(statusKey)}</Badge>
    };

    return (
        <ul className="space-y-4">
            {items.map((item, index) => (
                <li key={index} className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                        <MatchStatusBadge status={item.status} />
                        <span className="font-medium text-foreground">{item.item}</span>
                    </div>
                    <p className="pl-4 text-sm text-muted-foreground border-l-2 border-border ml-2">{item.explanation}</p>
                </li>
            ))}
        </ul>
    );
};


const ResultsSection: React.FC<ResultsSectionProps> = ({
  analysisResult,
  preliminaryDecision,
  consistencyResult,
  rewrittenResume,
  onGenerateDecision,
  onRewriteResume,
  onAnalyzeConsistency,
  onDownloadPdf,
  isDownloadingPdf,
  interviewTranscript,
  setInterviewTranscript,
  isLoading,
  activeAnalysis,
}) => {
  const { t } = useTranslations();
  const [isConsistencyInfoModalOpen, setIsConsistencyInfoModalOpen] = useState(false);

  const getScoreColorClass = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-destructive';
  };
  
  const getCompatibilityLabel = (score: number) => {
    if (score >= 80) return t('results.score.high');
    if (score >= 60) return t('results.score.medium');
    return t('results.score.low');
  }
  
  const handleDownloadResume = () => {
    if(rewrittenResume) {
        downloadFile(rewrittenResume.rewrittenResume, 'Rewritten-Resume.txt', 'text/plain;charset=utf-8');
    }
  }

  const getPreliminaryDecisionStyle = (decision: string): 'success' | 'danger' | 'warning' => {
    if (decision === 'Likely Hire') return 'success';
    if (decision === 'Unlikely Hire') return 'danger';
    return 'warning'; // For 'More Information Needed'
  };

  const getRecommendationStyle = (recommendation: string) => {
    switch (recommendation) {
        case 'Strong Fit': return 'success';
        case 'Partial Fit': return 'warning';
        case 'Weak Fit': return 'danger';
        default: return 'secondary';
    }
  };

  return (
    <section className="py-20 sm:py-32 animate-fade-in">
      <div className="container mx-auto px-4 max-w-5xl space-y-8">
        {/* Overall Score Card */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>{t('results.overallScore.title')}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="relative flex items-center justify-center h-32 w-32 mx-auto">
              <svg className="absolute inset-0" viewBox="0 0 36 36">
                <path className="text-secondary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2" />
                <path className={`${getScoreColorClass(analysisResult.overallFitScore)} transition-all duration-500`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray={`${analysisResult.overallFitScore}, 100`} />
              </svg>
              <div className={`text-4xl font-bold ${getScoreColorClass(analysisResult.overallFitScore)}`}>
                {analysisResult.overallFitScore}
              </div>
            </div>
            <div className="md:col-span-2">
              <p className={`font-semibold text-lg ${getScoreColorClass(analysisResult.overallFitScore)}`}>
                  {getCompatibilityLabel(analysisResult.overallFitScore)}
              </p>
              <p className="text-muted-foreground mt-2">{analysisResult.summary}</p>
              <Progress value={analysisResult.overallFitScore} className="mt-4" />
            </div>
          </CardContent>
        </Card>
        
        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button size="lg" variant="outline" onClick={onGenerateDecision} disabled={isLoading || !!preliminaryDecision}>
                 {isLoading && activeAnalysis === 'generateDecision' ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2"></div> : <AwardIcon className="mr-2 h-5 w-5" />}
                {t('results.actions.decision')}
            </Button>
            <Button size="lg" variant="outline" onClick={onRewriteResume} disabled={isLoading || !!rewrittenResume}>
                {isLoading && activeAnalysis === 'rewriteResume' ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2"></div> : <FileTextIcon className="mr-2 h-5 w-5" />}
                {t('results.actions.rewrite')}
            </Button>
        </div>

        {/* Dynamic Result Cards */}
        {preliminaryDecision && (
             <Card className="animate-fade-in">
                <CardHeader><CardTitle>{t('decision.title')}</CardTitle></CardHeader>
                <CardContent>
                    <Badge variant={preliminaryDecision.decision === 'Recommended for Interview' ? 'success' : 'danger'}>{preliminaryDecision.decision === 'Recommended for Interview' ? t('decision.recommended') : t('decision.notRecommended')}</Badge>
                    <p className="mt-4 text-muted-foreground">{preliminaryDecision.explanation}</p>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">{t('decision.pros')}</h4>
                            <ul className="space-y-2">
                                {preliminaryDecision.pros.map((pro, i) => <li key={i} className="flex items-start gap-2"><CheckCircle2Icon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" /><span>{pro}</span></li>)}
                            </ul>
                        </div>
                         <div>
                            <h4 className="font-semibold text-red-600 dark:text-red-400 mb-2">{t('decision.cons')}</h4>
                            <ul className="space-y-2">
                                {preliminaryDecision.cons.map((con, i) => <li key={i} className="flex items-start gap-2"><XCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" /><span>{con}</span></li>)}
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )}
        
        {rewrittenResume && (
            <Card className="animate-fade-in">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>{t('rewrite.title')}</CardTitle>
                        <Button variant="outline" size="sm" onClick={handleDownloadResume}>
                            <DownloadIcon className="mr-2 h-4 w-4" />
                            {t('buttons.downloadResume')}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <pre className="whitespace-pre-wrap font-sans text-sm bg-muted/50 p-4 rounded-md border max-h-96 overflow-y-auto">
                        {rewrittenResume.rewrittenResume}
                    </pre>
                </CardContent>
            </Card>
        )}

        {/* Consistency Analysis Section */}
        <Card className="animate-fade-in">
            <CardHeader>
                <CardTitle>{t('consistency.title')}</CardTitle>
                <CardDescription>{t('consistency.subtitle')}</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="space-y-2">
                    <div className="flex items-center gap-1">
                        <Label htmlFor="interview-transcript">{t('consistency.transcriptLabel')}</Label>
                        <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-foreground" onClick={() => setIsConsistencyInfoModalOpen(true)}>
                            <InfoIcon className="h-4 w-4" />
                        </Button>
                    </div>
                    <Textarea 
                        id="interview-transcript"
                        value={interviewTranscript}
                        onChange={(e) => setInterviewTranscript(e.target.value)}
                        placeholder={t('consistency.transcriptPlaceholder')}
                        className="h-40"
                        disabled={isLoading}
                    />
                 </div>
                 <Button 
                    onClick={onAnalyzeConsistency}
                    disabled={isLoading || !interviewTranscript}
                    className="mt-4 w-full sm:w-auto"
                >
                    {isLoading && activeAnalysis === 'analyzeConsistency' 
                        ? <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2"></div>{t('consistency.buttonLoading')}</>
                        : <><MicIcon className="mr-2 h-4 w-4" />{t('consistency.button')}</>
                    }
                 </Button>

                 {consistencyResult && (
                    <div className="mt-6 border-t pt-6 space-y-4">
                        <ResultSection title={t('consistency.summary')}>
                            <p className="text-muted-foreground">{consistencyResult.summary}</p>
                        </ResultSection>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                            <div className="bg-muted/50 p-3 rounded-lg">
                                <p className="text-xs font-semibold text-muted-foreground">{t('consistency.updatedOverallFit')}</p>
                                <p className={`text-2xl font-bold ${getScoreColorClass(consistencyResult.updatedOverallFitScore)}`}>{consistencyResult.updatedOverallFitScore}%</p>
                            </div>
                            <div className="bg-muted/50 p-3 rounded-lg">
                                <p className="text-xs font-semibold text-muted-foreground">{t('consistency.consistencyScore')}</p>
                                <p className={`text-2xl font-bold ${getScoreColorClass(consistencyResult.consistencyScore)}`}>{consistencyResult.consistencyScore}%</p>
                            </div>
                            <div className="bg-muted/50 p-3 rounded-lg flex flex-col justify-center">
                                <p className="text-xs font-semibold text-muted-foreground mb-1">{t('consistency.preliminaryHiringDecision')}</p>
                                <Badge variant={getPreliminaryDecisionStyle(consistencyResult.preliminaryHiringDecision)} className="self-center">
                                    {consistencyResult.preliminaryHiringDecision}
                                </Badge>
                            </div>
                            <div className="bg-muted/50 p-3 rounded-lg flex flex-col justify-center">
                                <p className="text-xs font-semibold text-muted-foreground mb-1">{t('consistency.hiringDecision')}</p>
                                <Badge variant={consistencyResult.hiringDecision === 'Recommended for Hire' ? 'success' : 'danger'} className="self-center">
                                    {t(consistencyResult.hiringDecision === 'Recommended for Hire' ? 'consistency.recommended' : 'consistency.notRecommended')}
                                </Badge>
                            </div>
                        </div>

                         <ResultSection title={t('consistency.prosForHiring')}>
                            {consistencyResult.prosForHiring.length > 0 ? (
                                <ul className="space-y-2">
                                    {consistencyResult.prosForHiring.map((pro, i) => <li key={i} className="flex items-start gap-2"><CheckCircle2Icon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" /><span>{pro}</span></li>)}
                                </ul>
                            ) : <p className="text-muted-foreground">{t('consistency.none')}</p>}
                        </ResultSection>

                        <ResultSection title={t('consistency.consForHiring')}>
                            {consistencyResult.consForHiring.length > 0 ? (
                                <ul className="space-y-2">
                                    {consistencyResult.consForHiring.map((con, i) => <li key={i} className="flex items-start gap-2"><XCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" /><span>{con}</span></li>)}
                                </ul>
                            ) : <p className="text-muted-foreground">{t('consistency.none')}</p>}
                        </ResultSection>
                        
                         <ResultSection title={t('consistency.recommendation')}>
                             <Badge variant={getRecommendationStyle(consistencyResult.recommendation)}>{consistencyResult.recommendation}</Badge>
                        </ResultSection>
                    </div>
                 )}
            </CardContent>
        </Card>
        <ConsistencyInfoModal isOpen={isConsistencyInfoModalOpen} onClose={() => setIsConsistencyInfoModalOpen(false)} />

        {/* DETAILED ANALYSIS REPORT */}
        <Card>
          <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{t('analysis.title')}</CardTitle>
                <Button variant="outline" size="sm" onClick={onDownloadPdf} disabled={isDownloadingPdf}>
                    {isDownloadingPdf ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    ) : (
                        <PdfIcon className="mr-2 h-4 w-4" />
                    )}
                    {t('buttons.downloadPdf')}
                </Button>
              </div>
          </CardHeader>
          <CardContent className="divide-y divide-border">
              <ResultSection title={t('analysis.fitExplanation')}>
                  <p className="text-muted-foreground">{analysisResult.fitExplanation}</p>
              </ResultSection>

              <ResultSection title={t('analysis.compatibilityGaps')}>
                  {analysisResult.compatibilityGaps.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          {analysisResult.compatibilityGaps.map((gap, i) => <li key={i}>{gap}</li>)}
                      </ul>
                  ) : <p className="text-muted-foreground">{t('consistency.none')}</p>}
              </ResultSection>

              <ResultSection title={t('analysis.keyResponsibilities')} score={analysisResult.keyResponsibilitiesMatch.score}>
                  <MatchedItemsList items={analysisResult.keyResponsibilitiesMatch.items} />
              </ResultSection>

              <ResultSection title={t('analysis.requiredSkills')} score={analysisResult.requiredSkillsMatch.score}>
                  <MatchedItemsList items={analysisResult.requiredSkillsMatch.items} />
              </ResultSection>

              {analysisResult.niceToHaveSkillsMatch?.items?.length > 0 && (
                  <ResultSection title={t('analysis.niceToHaveSkills')} score={analysisResult.niceToHaveSkillsMatch.score}>
                      <MatchedItemsList items={analysisResult.niceToHaveSkillsMatch.items} />
                  </ResultSection>
              )}

              {analysisResult.companyCultureFit?.analysis && (
                  <ResultSection title={t('analysis.companyCulture')} score={analysisResult.companyCultureFit.score}>
                      <p className="text-muted-foreground">{analysisResult.companyCultureFit.analysis}</p>
                  </ResultSection>
              )}

              {analysisResult.salaryAndBenefits && (
                   <ResultSection title={t('analysis.salaryAndBenefits')}>
                      <p className="text-muted-foreground">{analysisResult.salaryAndBenefits}</p>
                  </ResultSection>
              )}

              <ResultSection title={t('analysis.redFlags')}>
                  {analysisResult.redFlags.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          {analysisResult.redFlags.map((flag, i) => <li key={i}>{flag}</li>)}
                      </ul>
                  ) : <p className="text-muted-foreground">{t('consistency.none')}</p>}
              </ResultSection>

              <ResultSection title={t('analysis.interviewQuestions')}>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                      {analysisResult.interviewQuestions.map((q, i) => <li key={i}>{q}</li>)}
                  </ol>
              </ResultSection>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default ResultsSection;