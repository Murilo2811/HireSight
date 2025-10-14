import { Type } from "@google/genai";

export const matchedItemSchema = {
    type: Type.OBJECT,
    properties: {
        item: { type: Type.STRING, description: "The specific responsibility or skill from the job description." },
        status: { type: Type.STRING, enum: ['Match', 'Partial', 'No Match'], description: "The match status. 'Match' requires direct evidence. 'Partial' indicates related but not direct experience. 'No Match' means the skill is absent." },
        explanation: { type: Type.STRING, description: "A brief, factual explanation of why this status was given, referencing specific parts of the resume." },
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
        score: { type: Type.NUMBER, description: "A score from 0 to 100 representing the match for this section, heavily weighted by 'Match' statuses on required items." },
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
        summary: { type: Type.STRING, description: "A concise summary of the candidate's fit for the role, based only on the provided documents." },
        keyResponsibilitiesMatch: sectionMatchSchema,
        requiredSkillsMatch: sectionMatchSchema,
        niceToHaveSkillsMatch: sectionMatchSchema,
        companyCultureFit: analysisWithScoreSchema,
        salaryAndBenefits: { type: Type.STRING, description: "Analysis of salary expectations and benefits, only if explicitly mentioned in the resume." },
        redFlags: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING }, 
            description: "A list of potential red flags or serious concerns. IMPORTANT: Do not flag a job with an end date of 'Present', 'Atual', or the current month as a typo; this indicates the current job. Only flag dates if the start date is in the future or there are unexplained long employment gaps." 
        },
        interviewQuestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of suggested interview questions based on the identified compatibility gaps and resume details." },
        overallFitScore: { type: Type.NUMBER, description: "An overall fit score from 0 to 100, weighting required skills and key responsibilities most heavily." },
        fitExplanation: { type: Type.STRING, description: "A detailed explanation for the overall fit score, justifying the number with concrete evidence from the analysis." },
        compatibilityGaps: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of specific, crucial gaps between the resume and the job description's core requirements." },
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
        pros: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of the strongest points in favor of interviewing the candidate." },
        cons: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of the most significant drawbacks against interviewing." },
        explanation: { type: Type.STRING, description: "A concise justification for the decision based on the pros and cons." }
    },
    required: ['decision', 'pros', 'cons', 'explanation']
};


export const consistencySectionStringSchema = {
    type: Type.OBJECT,
    properties: {
        items: { type: Type.STRING },
        score: { type: Type.NUMBER, description: "Score from 0 to 100 based on the analysis." },
    },
    required: ['items', 'score']
};

export const consistencySectionStringArraySchema = {
    type: Type.OBJECT,
    properties: {
        items: { type: Type.ARRAY, items: { type: Type.STRING } },
        score: { type: Type.NUMBER, description: "Score from 0 to 100. For inconsistencies, a lower score is better." },
    },
    required: ['items', 'score']
};

export const gapResolutionItemSchema = {
    type: Type.OBJECT,
    properties: {
        gap: { type: Type.STRING, description: "The specific compatibility gap identified before the interview." },
        resolution: { type: Type.STRING, description: "The candidate's response or clarification from the interview transcript that addresses this gap. If the gap was not addressed, explain why." },
        isResolved: { type: Type.BOOLEAN, description: "Set to true only if the candidate's response fully and satisfactorily resolves the gap. Set to false if the response is insufficient, evasive, or if the gap was not addressed at all." }
    },
    required: ['gap', 'resolution', 'isResolved']
};

export const gapResolutionSectionSchema = {
    type: Type.OBJECT,
    properties: {
        items: { type: Type.ARRAY, items: gapResolutionItemSchema },
        score: { type: Type.NUMBER, description: "A score from 0-100 representing the percentage of gaps successfully resolved." },
    },
    required: ['items', 'score']
};

export const consistencyAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        consistencyScore: { type: Type.NUMBER, description: "A percentage (0-100) measuring how aligned interview answers were with the resume. High score = consistent and reliable." },
        summary: { type: Type.STRING, description: "A concise narrative summary of the entire consistency analysis." },
        recommendation: { type: Type.STRING, enum: ['Strong Fit', 'Partial Fit', 'Weak Fit'] },
        softSkillsAnalysis: {
            ...consistencySectionStringSchema,
            properties: {
                ...consistencySectionStringSchema.properties,
                items: { type: Type.STRING, description: "Based on language and responses, an analysis of soft skills demonstrated (communication, problem-solving, etc.)." }
            }
        },
        inconsistencies: {
            ...consistencySectionStringArraySchema,
            properties: {
                ...consistencySectionStringArraySchema.properties,
                items: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of discrepancies between resume and interview (e.g., resume says 'led project', interview says 'assisted'). Empty if none." }
            }
        },
        missingFromInterview: {
            ...consistencySectionStringArraySchema,
            properties: {
                ...consistencySectionStringArraySchema.properties,
                items: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of important points from the resume that were not discussed in the interview." }
            }
        },
        newInInterview: {
            ...consistencySectionStringArraySchema,
            properties: {
                ...consistencySectionStringArraySchema.properties,
                items: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of new, positive skills or experiences revealed in the interview that were not on the resume." }
            }
        },
        gapResolutions: {
            ...gapResolutionSectionSchema,
            description: "An analysis of the pre-identified compatibility gaps. For each gap, determine if the candidate's interview responses resolved it satisfactorily."
        },
        prosForHiring: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A final, balanced list of reasons why the candidate SHOULD be hired, based on resume + interview." },
        consForHiring: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A final, balanced list of reasons why the candidate should NOT be hired, based on resume + interview." },
        updatedOverallFitScore: { type: Type.NUMBER, description: "The initial overall fit score, recalculated (0-100) to include interview performance." },
        hiringDecision: { type: Type.STRING, enum: ['Recommended for Hire', 'Not Recommended'], description: "The final, clear hiring recommendation based on all data." },
        preliminaryHiringDecision: { type: Type.STRING, enum: ['Likely Hire', 'Unlikely Hire', 'More Information Needed']},
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
        rewrittenResume: { type: Type.STRING, description: "The full text of the rewritten resume in Markdown format." }
    },
    required: ['rewrittenResume']
};