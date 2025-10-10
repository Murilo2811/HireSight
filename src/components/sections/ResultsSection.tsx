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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { Textarea } from '../ui/Textarea';
import { AwardIcon, TrendingUpIcon, DownloadIcon, CheckCircle2Icon, XCircleIcon, AlertCircleIcon, FileTextIcon } from '../icons';
import { parseDocumentFile, parseUrlContent, downloadFile } from '../../utils/parsers'; // Assumindo que o parser está em utils

interface ResultsSectionProps {
  analysisResult: RecruiterAnalysisResult;
  preliminaryDecision: PreliminaryDecisionResult | null;
  consistencyResult: ConsistencyAnalysisResult | null;
  rewrittenResume: RewrittenResumeResult | null;
  onGenerateDecision: () => void;
  onAnalyzeConsistency: (inputs: { jobInput: any; resumeInput: any; interviewTranscript: string; }) => void;
  onRewriteResume: (inputs: { jobInput: any; resumeInput: any; }) => void;
  isLoading: boolean;
  activeAnalysis: string | null;
}

const ResultsSection: React.FC<ResultsSectionProps> = ({
  analysisResult,
  preliminaryDecision,
  consistencyResult,
  rewrittenResume,
  onGenerateDecision,
  onAnalyzeConsistency,
  onRewriteResume,
  isLoading,
  activeAnalysis,
}) => {
  const { t } = useTranslations();
  
  // Apenas para a UI, os dados reais viriam do InputSection original
  // Esta é uma simplificação para passar os dados para as funções de re-análise
  const dummyInputs = {
      jobInput: { content: 'dummy job', format: 'text' as const },
      resumeInput: { content: 'dummy resume', format: 'text' as const },
      interviewTranscript: 'dummy transcript'
  }

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

  const MatchStatusBadge: React.FC<{ status: MatchStatus }> = ({ status }) => {
    const variants: {[key in MatchStatus]: 'success' | 'warning' | 'danger'} = {
        'Match': 'success',
        'Partial': 'warning',
        'No Match': 'danger',
    };
    const statusKey = `status.${status.toLowerCase().replace(' ', '')}`;
    return <Badge variant={variants[status]}>{t(statusKey)}</Badge>
  };
  
  const handleDownloadResume = () => {
    if(rewrittenResume) {
        downloadFile(rewrittenResume.rewrittenResume, 'Rewritten-Resume.txt', 'text/plain;charset=utf-8');
    }
  }

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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button size="lg" variant="outline" onClick={onGenerateDecision} disabled={isLoading}>
                 {isLoading && activeAnalysis === 'generateDecision' ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2"></div> : <AwardIcon className="mr-2 h-5 w-5" />}
                {t('results.actions.decision')}
            </Button>
            <Button size="lg" variant="outline" onClick={() => onAnalyzeConsistency(dummyInputs)} disabled={isLoading || !analysisResult.compatibilityGaps}>
                {isLoading && activeAnalysis === 'analyzeConsistency' ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2"></div> : <TrendingUpIcon className="mr-2 h-5 w-5" />}
                {t('results.actions.consistency')}
            </Button>
            <Button size="lg" variant="outline" onClick={() => onRewriteResume(dummyInputs)} disabled={isLoading}>
                {isLoading && activeAnalysis === 'rewriteResume' ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2"></div> : <FileTextIcon className="mr-2 h-5 w-5" />}
                {t('results.actions.rewrite')}
            </Button>
        </div>

        {/* Dynamic Result Cards */}
        {preliminaryDecision && (
             <Card>
                <CardHeader><CardTitle>{t('decision.title')}</CardTitle></CardHeader>
                <CardContent>
                    <Badge variant={preliminaryDecision.decision === 'Recommended for Interview' ? 'success' : 'danger'}>{preliminaryDecision.decision}</Badge>
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
        
        {consistencyResult && (
             <Card>
                <CardHeader><CardTitle>{t('consistency.title')}</CardTitle></CardHeader>
                <CardContent>
                     <Badge>{consistencyResult.recommendation}</Badge>
                     <p className="mt-4 text-muted-foreground">{consistencyResult.summary}</p>
                </CardContent>
            </Card>
        )}
        
        {rewrittenResume && (
            <Card>
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


        {/* Skills & Red Flags */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        {t('analysis.requiredSkills')}
                        <Badge variant="success">{analysisResult.requiredSkillsMatch.score}%</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2">
                        {analysisResult.requiredSkillsMatch.items.slice(0, 5).map((item, i) => 
                        <li key={i} className="flex items-start gap-2"><CheckCircle2Icon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" /><span>{item.item}</span></li>)}
                    </ul>
                </CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle className="flex items-center text-destructive"><AlertCircleIcon className="mr-2 h-6 w-6"/>{t('analysis.redFlags')}</CardTitle></CardHeader>
                <CardContent>
                    {analysisResult.redFlags.length > 0 ? (
                        <ul className="space-y-2">
                            {analysisResult.redFlags.slice(0, 5).map((flag, i) => 
                            <li key={i} className="flex items-start gap-2"><XCircleIcon className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" /><span>{flag}</span></li>)}
                        </ul>
                    ) : (
                        <p className="text-muted-foreground">{t('consistency.none')}</p>
                    )}
                </CardContent>
            </Card>
        </div>
        
        {/* Compatibility Gaps */}
        {analysisResult.compatibilityGaps.length > 0 && (
            <Card>
                <CardHeader><CardTitle>{t('analysis.compatibilityGaps')}</CardTitle></CardHeader>
                <CardContent>
                    <ul className="space-y-2 list-decimal list-inside">
                        {analysisResult.compatibilityGaps.map((gap, i) => <li key={i}>{gap}</li>)}
                    </ul>
                </CardContent>
            </Card>
        )}
        
         {/* Interview Questions */}
        {analysisResult.interviewQuestions.length > 0 && (
            <Card>
                <CardHeader><CardTitle>{t('analysis.interviewQuestions')}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    {analysisResult.interviewQuestions.map((q, i) => 
                        <div key={i} className="bg-muted/50 p-3 rounded-md text-sm">
                            <span className="font-semibold mr-2">{i + 1}.</span>{q}
                        </div>
                    )}
                </CardContent>
            </Card>
        )}

      </div>
    </section>
  );
};

export default ResultsSection;
