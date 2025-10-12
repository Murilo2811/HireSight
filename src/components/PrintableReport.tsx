import React from 'react';
import { RecruiterAnalysisResult, PreliminaryDecisionResult, ConsistencyAnalysisResult, RewrittenResumeResult, MatchStatus } from '../types';

interface PrintableReportProps {
    t: (key: string) => string;
    analysisResult: RecruiterAnalysisResult;
    preliminaryDecision: PreliminaryDecisionResult | null;
    consistencyResult: ConsistencyAnalysisResult | null;
    rewrittenResume: RewrittenResumeResult | null;
}

// Internal components simplified for static rendering
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-6 break-inside-avoid">
        <h2 className="text-xl font-bold border-b-2 border-primary/50 pb-2 mb-3">{title}</h2>
        <div className="text-sm">{children}</div>
    </div>
);

const CheckIcon = () => <span className="text-green-600 mr-2">✓</span>;
const XIcon = () => <span className="text-red-600 mr-2">✗</span>;

const PrintableReport: React.FC<PrintableReportProps> = ({ t, analysisResult, preliminaryDecision, consistencyResult, rewrittenResume }) => {
    
    const MatchStatusBadge: React.FC<{ status: MatchStatus }> = ({ status }) => {
        const styles = {
            'Match': 'border border-green-500 text-green-700 bg-green-100',
            'Partial': 'border border-yellow-500 text-yellow-700 bg-yellow-100',
            'No Match': 'border border-red-500 text-red-700 bg-red-100',
        };
         const style = styles[status];
         const statusKey = `status.${status.toLowerCase().replace(' ', '')}`;
        return <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${style}`}>{t(statusKey)}</span>;
    };

    return (
        <div className="p-8 bg-background text-foreground font-sans w-[1024px]">
            <header className="flex justify-between items-center border-b-4 border-primary pb-4 mb-8">
                <h1 className="text-4xl font-bold text-primary">{t('appTitle')}</h1>
                <div className="text-right">
                    <p className="text-xl font-semibold">{t('analysis.title')}</p>
                    <p className="text-muted-foreground">{analysisResult.jobTitle}</p>
                </div>
            </header>

            <main>
                <Section title={t('analysis.overallFit') + `: ${analysisResult.overallFitScore}%`}>
                    <p className="font-semibold text-base mb-2">{t('analysis.summary')}</p>
                    <p className="text-muted-foreground mb-4">{analysisResult.summary}</p>
                    <p className="font-semibold text-base mb-2">{t('analysis.fitExplanation')}</p>
                    <p className="text-muted-foreground">{analysisResult.fitExplanation}</p>
                </Section>
                
                {preliminaryDecision && (
                    <Section title={t('decision.title')}>
                        <p className="text-lg font-bold mb-4">{t(preliminaryDecision.decision === 'Recommended for Interview' ? 'decision.recommended' : 'decision.notRecommended')}</p>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-semibold mb-2">{t('decision.pros')}</h3>
                                <ul className="list-none space-y-1">
                                    {preliminaryDecision.pros.map((pro, i) => <li key={i} className="flex"><CheckIcon />{pro}</li>)}
                                </ul>
                            </div>
                             <div>
                                <h3 className="font-semibold mb-2">{t('decision.cons')}</h3>
                                <ul className="list-none space-y-1">
                                    {preliminaryDecision.cons.map((con, i) => <li key={i} className="flex"><XIcon />{con}</li>)}
                                </ul>
                            </div>
                        </div>
                        <p className="mt-4 text-muted-foreground">{preliminaryDecision.explanation}</p>
                    </Section>
                )}

                {consistencyResult && (
                    <Section title={t('consistency.title')}>
                        <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                            <div className="bg-muted/50 p-2 rounded">
                                <p className="text-xs font-bold">{t('consistency.updatedOverallFit')}</p>
                                <p className="text-2xl font-bold">{consistencyResult.updatedOverallFitScore}%</p>
                            </div>
                             <div className="bg-muted/50 p-2 rounded">
                                <p className="text-xs font-bold">{t('consistency.consistencyScore')}</p>
                                <p className="text-2xl font-bold">{consistencyResult.consistencyScore}%</p>
                            </div>
                             <div className="bg-muted/50 p-2 rounded">
                                <p className="text-xs font-bold">{t('consistency.hiringDecision')}</p>
                                <p className="text-lg font-bold">{t(consistencyResult.hiringDecision === 'Recommended for Hire' ? 'consistency.recommended' : 'consistency.notRecommended')}</p>
                            </div>
                        </div>
                         <p className="font-semibold mb-2">{t('consistency.summary')}</p>
                         <p className="text-muted-foreground mb-4">{consistencyResult.summary}</p>
                         <div className="grid grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-semibold mb-2">{t('consistency.prosForHiring')}</h3>
                                <ul className="list-none space-y-1">
                                    {consistencyResult.prosForHiring.map((pro, i) => <li key={i} className="flex"><CheckIcon />{pro}</li>)}
                                </ul>
                            </div>
                             <div>
                                <h3 className="font-semibold mb-2">{t('consistency.consForHiring')}</h3>
                                <ul className="list-none space-y-1">
                                    {consistencyResult.consForHiring.map((con, i) => <li key={i} className="flex"><XIcon />{con}</li>)}
                                </ul>
                            </div>
                        </div>
                    </Section>
                )}

                <Section title={`${t('analysis.keyResponsibilities')} - Score: ${analysisResult.keyResponsibilitiesMatch.score}%`}>
                    <ul className="space-y-3">
                        {analysisResult.keyResponsibilitiesMatch.items.map((item, i) => (
                            <li key={i}>
                                <div className="flex items-center gap-2">
                                    <MatchStatusBadge status={item.status} />
                                    <span className="font-semibold">{item.item}</span>
                                </div>
                                <p className="text-xs text-muted-foreground pl-2 mt-1 border-l-2 ml-1">{item.explanation}</p>
                            </li>
                        ))}
                    </ul>
                </Section>
                
                 <Section title={`${t('analysis.requiredSkills')} - Score: ${analysisResult.requiredSkillsMatch.score}%`}>
                    <ul className="space-y-3">
                        {analysisResult.requiredSkillsMatch.items.map((item, i) => (
                            <li key={i}>
                                <div className="flex items-center gap-2">
                                    <MatchStatusBadge status={item.status} />
                                    <span className="font-semibold">{item.item}</span>
                                </div>
                                <p className="text-xs text-muted-foreground pl-2 mt-1 border-l-2 ml-1">{item.explanation}</p>
                            </li>
                        ))}
                    </ul>
                </Section>
                
                {rewrittenResume && (
                    <Section title={t('rewrite.title')}>
                        <pre className="whitespace-pre-wrap font-sans text-sm bg-muted/50 p-4 rounded-md border">
                            {rewrittenResume.rewrittenResume}
                        </pre>
                    </Section>
                )}

            </main>
        </div>
    );
};

export default PrintableReport;