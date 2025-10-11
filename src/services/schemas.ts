import { Type } from "@google/genai";

export const matchedItemSchema = {
    type: Type.OBJECT,
    properties: {
        item: { type: Type.STRING, description: "The specific responsibility or skill from the job description." },
        status: { type: Type.STRING, enum: ['Match', 'Partial', 'No Match'], description: "The match status." },
        explanation: { type: Type.STRING, description: "A brief explanation of why this status was given, referencing the resume." },
    },
    required: ['item', 'status', 'explanation']
};

export const sectionMatchSchema = {
    type: Type.OBJECT,
    properties: {
        items: {
            type: Type.ARRAY,
            items: matchedItemSchema
        },
        score: { type: Type.NUMBER, description: "A score from 0 to 100 representing the match for this section." },
    },
    required: ['items', 'score']
};

export const analysisWithScoreSchema = {
    type: Type.OBJECT,
    properties: {
        analysis: { type: Type.STRING, description: "The detailed analysis text." },
        score: { type: Type.NUMBER, description: "A score from 0 to 100 for this analysis." },
    },
    required: ['analysis', 'score']
};

export const recruiterAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        jobTitle: { type: Type.STRING, description: "The job title from the job description." },
        summary: { type: Type.STRING, description: "A concise summary of the candidate's fit for the role." },
        keyResponsibilitiesMatch: sectionMatchSchema,
        requiredSkillsMatch: sectionMatchSchema,
        niceToHaveSkillsMatch: sectionMatchSchema,
        companyCultureFit: analysisWithScoreSchema,
        salaryAndBenefits: { type: Type.STRING, description: "Analysis of salary expectations and benefits, if mentioned." },
        redFlags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Any potential red flags or concerns." },
        interviewQuestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of suggested interview questions for this candidate." },
        overallFitScore: { type: Type.NUMBER, description: "An overall fit score from 0 to 100." },
        fitExplanation: { type: Type.STRING, description: "An explanation for the overall fit score." },
        compatibilityGaps: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of specific gaps between the resume and job description." },
    },
    required: [
        'jobTitle', 'summary', 'keyResponsibilitiesMatch', 'requiredSkillsMatch',
        'niceToHaveSkillsMatch', 'companyCultureFit', 'salaryAndBenefits', 'redFlags',
        'interviewQuestions', 'overallFitScore', 'fitExplanation', 'compatibilityGaps'
    ]
};

export const preliminaryDecisionSchema = {
    type: Type.OBJECT,
    properties: {
        decision: { type: Type.STRING, enum: ['Recommended for Interview', 'Not Recommended'] },
        pros: { type: Type.ARRAY, items: { type: Type.STRING } },
        cons: { type: Type.ARRAY, items: { type: Type.STRING } },
        explanation: { type: Type.STRING }
    },
    required: ['decision', 'pros', 'cons', 'explanation']
};


export const consistencySectionStringSchema = {
    type: Type.OBJECT,
    properties: {
        items: { type: Type.STRING },
        score: { type: Type.NUMBER },
    },
    required: ['items', 'score']
};

export const consistencySectionStringArraySchema = {
    type: Type.OBJECT,
    properties: {
        items: { type: Type.ARRAY, items: { type: Type.STRING } },
        score: { type: Type.NUMBER },
    },
    required: ['items', 'score']
};

export const gapResolutionItemSchema = {
    type: Type.OBJECT,
    properties: {
        gap: { type: Type.STRING, description: "The specific compatibility gap identified before the interview." },
        resolution: { type: Type.STRING, description: "The candidate's response or clarification from the interview transcript that addresses this gap. If the gap was not addressed, explain why." },
        isResolved: { type: Type.BOOLEAN, description: "Set to true if the candidate's response satisfactorily resolves the gap. Set to false if the response is insufficient, evasive, or if the gap was not addressed at all." }
    },
    required: ['gap', 'resolution', 'isResolved']
};

export const gapResolutionSectionSchema = {
    type: Type.OBJECT,
    properties: {
        items: { type: Type.ARRAY, items: gapResolutionItemSchema },
        score: { type: Type.NUMBER },
    },
    required: ['items', 'score']
};

export const consistencyAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        consistencyScore: { type: Type.NUMBER },
        summary: { type: Type.STRING },
        recommendation: { type: Type.STRING, enum: ['Strong Fit', 'Partial Fit', 'Weak Fit'] },
        softSkillsAnalysis: consistencySectionStringSchema,
        inconsistencies: consistencySectionStringArraySchema,
        missingFromInterview: consistencySectionStringArraySchema,
        newInInterview: consistencySectionStringArraySchema,
        gapResolutions: gapResolutionSectionSchema,
        prosForHiring: { type: Type.ARRAY, items: { type: Type.STRING } },
        consForHiring: { type: Type.ARRAY, items: { type: Type.STRING } },
        updatedOverallFitScore: { type: Type.NUMBER },
        hiringDecision: { type: Type.STRING, enum: ['Recommended for Hire', 'Not Recommended'] },
        preliminaryHiringDecision: { 
            type: Type.STRING, 
            description: "A preliminary hiring verdict based on the interview analysis, before making a final conclusion. This helps gauge the immediate impression from the interview.",
            enum: ['Likely Hire', 'Unlikely Hire', 'More Information Needed'] 
        },
    },
    required: [
        'consistencyScore', 'summary', 'recommendation', 'softSkillsAnalysis', 'inconsistencies',
        'missingFromInterview', 'newInInterview', 'gapResolutions', 'prosForHiring', 'consForHiring',
        'updatedOverallFitScore', 'hiringDecision', 'preliminaryHiringDecision'
    ]
};

export const rewrittenResumeSchema = {
    type: Type.OBJECT,
    properties: {
        rewrittenResume: { type: Type.STRING, description: "The full text of the rewritten resume." }
    },
    required: ['rewrittenResume']
};
