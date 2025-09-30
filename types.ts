// types.ts

export type SectionMatch<T> = {
  items: T[];
  score: number;
};

export type AnalysisWithScore = {
  analysis: string;
  score: number;
};

export type RecruiterAnalysisResult = {
  jobTitle: string;
  summary: string;
  keyResponsibilitiesMatch: SectionMatch<string>;
  requiredSkillsMatch: SectionMatch<string>;
  niceToHaveSkillsMatch: SectionMatch<string>;
  companyCultureFit: AnalysisWithScore;
  salaryAndBenefits: string;
  redFlags: string[];
  interviewQuestions: string[];
  overallFitScore: number;
  fitExplanation: string;
  compatibilityGaps: string[];
};

export type ConsistencySection<T> = {
  items: T;
  score: number;
};

export type ConsistencyAnalysisResult = {
  consistencyScore: number;
  summary: string;
  recommendation: 'Strong Fit' | 'Partial Fit' | 'Weak Fit';
  softSkillsAnalysis: ConsistencySection<string>;
  inconsistencies: ConsistencySection<string[]>;
  missingFromInterview: ConsistencySection<string[]>;
  newInInterview: ConsistencySection<string[]>;
  prosForHiring: string[];
  consForHiring: string[];
  updatedOverallFitScore: number;
  hiringDecision: 'Recommended for Hire' | 'Not Recommended';
};