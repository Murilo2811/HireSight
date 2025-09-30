// types.ts

export type RecruiterAnalysisResult = {
  jobTitle: string;
  summary: string;
  keyResponsibilities: string[];
  requiredSkills: string[];
  niceToHaveSkills: string[];
  companyCulture: string;
  salaryAndBenefits: string;
  redFlags: string[];
  interviewQuestions: string[];
  overallFitScore: number;
  fitExplanation: string;
  compatibilityGaps: string[];
};

export type ConsistencyAnalysisResult = {
  consistencyScore: number;
  missingFromInterview: string[];
  newInInterview: string[];
};
