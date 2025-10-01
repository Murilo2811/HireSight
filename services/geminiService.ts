import { GoogleGenAI, Type } from "@google/genai";
import type { 
    RecruiterAnalysisResult, 
    PreliminaryDecisionResult, 
    ConsistencyAnalysisResult,
    RewrittenResumeResult
} from '../types';

// Per coding guidelines, the API key must be obtained exclusively from `process.env.API_KEY`.
const apiKey = process.env.API_KEY;
if (!apiKey) {
    throw new Error("API_KEY environment variable is not set. Please ensure it is configured.");
}
// Fix: Initialize GoogleGenAI client with a named apiKey parameter.
const ai = new GoogleGenAI({ apiKey });

// Fix: Use the recommended model 'gemini-2.5-flash' for general text tasks.
const MODEL_NAME = 'gemini-2.5-flash';

type Input = { content: string | { data: string; mimeType: string }, format: 'text' | 'file' };

/**
 * Helper function to convert app-specific input format to Gemini API Part format.
 */
const buildContentPart = (input: Input) => {
    if (input.format === 'text' && typeof input.content === 'string') {
        return { text: input.content };
    }
    if (input.format === 'file' && typeof input.content === 'object' && input.content !== null) {
        return {
            inlineData: {
                data: input.content.data,
                mimeType: input.content.mimeType,
            },
        };
    }
    throw new Error('Invalid input format provided to buildContentPart.');
};

// --- JSON Schemas for Gemini API ---

const matchedItemSchema = {
    type: Type.OBJECT,
    properties: {
        item: { type: Type.STRING },
        status: { type: Type.STRING, description: "Can be 'Match', 'Partial', or 'No Match'" },
        explanation: { type: Type.STRING },
    },
    required: ['item', 'status', 'explanation'],
};

const sectionMatchSchema = {
    type: Type.OBJECT,
    properties: {
        items: {
            type: Type.ARRAY,
            items: matchedItemSchema,
        },
        score: { type: Type.NUMBER, description: "Score from 0 to 100." },
    },
    required: ['items', 'score'],
};

const analysisWithScoreSchema = {
    type: Type.OBJECT,
    properties: {
        analysis: { type: Type.STRING },
        score: { type: Type.NUMBER, description: "Score from 0 to 100." },
    },
    required: ['analysis', 'score'],
};

const recruiterAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        jobTitle: { type: Type.STRING },
        summary: { type: Type.STRING },
        keyResponsibilitiesMatch: sectionMatchSchema,
        requiredSkillsMatch: sectionMatchSchema,
        niceToHaveSkillsMatch: sectionMatchSchema,
        companyCultureFit: analysisWithScoreSchema,
        salaryAndBenefits: { type: Type.STRING },
        redFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
        interviewQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
        overallFitScore: { type: Type.NUMBER, description: "Overall score from 0 to 100." },
        fitExplanation: { type: Type.STRING },
        compatibilityGaps: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: [
        'jobTitle', 'summary', 'keyResponsibilitiesMatch', 'requiredSkillsMatch',
        'niceToHaveSkillsMatch', 'companyCultureFit', 'salaryAndBenefits',
        'redFlags', 'interviewQuestions', 'overallFitScore', 'fitExplanation', 'compatibilityGaps'
    ]
};

const preliminaryDecisionSchema = {
    type: Type.OBJECT,
    properties: {
        decision: { type: Type.STRING, description: "Should be 'Recommended for Interview' or 'Not Recommended'" },
        pros: { type: Type.ARRAY, items: { type: Type.STRING } },
        cons: { type: Type.ARRAY, items: { type: Type.STRING } },
        explanation: { type: Type.STRING },
    },
    required: ['decision', 'pros', 'cons', 'explanation'],
};

const rewrittenResumeSchema = {
    type: Type.OBJECT,
    properties: {
        rewrittenResume: { type: Type.STRING, description: "The full rewritten resume text, optimized for the job." },
    },
    required: ['rewrittenResume'],
};

const gapResolutionItemSchema = {
    type: Type.OBJECT,
    properties: {
        gap: { type: Type.STRING },
        resolution: { type: Type.STRING },
    },
    required: ['gap', 'resolution'],
};

const consistencySectionStringSchema = {
    type: Type.OBJECT,
    properties: {
        items: { type: Type.STRING },
        score: { type: Type.NUMBER, description: "Score from 0 to 100." },
    },
    required: ['items', 'score'],
};

const consistencySectionStringArraySchema = {
    type: Type.OBJECT,
    properties: {
        items: { type: Type.ARRAY, items: { type: Type.STRING } },
        score: { type: Type.NUMBER, description: "Score from 0 to 100." },
    },
    required: ['items', 'score'],
};

const consistencySectionGapResolutionSchema = {
    type: Type.OBJECT,
    properties: {
        items: { type: Type.ARRAY, items: gapResolutionItemSchema },
        score: { type: Type.NUMBER, description: "Score from 0 to 100." },
    },
    required: ['items', 'score'],
};

const consistencyAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        consistencyScore: { type: Type.NUMBER, description: "Score from 0 to 100." },
        summary: { type: Type.STRING },
        recommendation: { type: Type.STRING, description: "Should be 'Strong Fit', 'Partial Fit', or 'Weak Fit'" },
        softSkillsAnalysis: consistencySectionStringSchema,
        inconsistencies: consistencySectionStringArraySchema,
        missingFromInterview: consistencySectionStringArraySchema,
        newInInterview: consistencySectionStringArraySchema,
        gapResolutions: consistencySectionGapResolutionSchema,
        prosForHiring: { type: Type.ARRAY, items: { type: Type.STRING } },
        consForHiring: { type: Type.ARRAY, items: { type: Type.STRING } },
        updatedOverallFitScore: { type: Type.NUMBER, description: "Score from 0 to 100." },
        hiringDecision: { type: Type.STRING, description: "Should be 'Recommended for Hire' or 'Not Recommended'" },
    },
    required: [
        'consistencyScore', 'summary', 'recommendation', 'softSkillsAnalysis',
        'inconsistencies', 'missingFromInterview', 'newInInterview',
        'gapResolutions', 'prosForHiring', 'consForHiring',
        'updatedOverallFitScore', 'hiringDecision'
    ],
};

// --- API Service Functions ---

/**
 * Analyzes a resume against a job description for a recruiter.
 */
export const analyzeForRecruiter = async (
    jobInput: Input,
    resumeInput: Input,
    language: 'en' | 'pt'
): Promise<RecruiterAnalysisResult> => {

    const currentDate = new Date().toISOString().split('T')[0]; // Get YYYY-MM-DD

    const prompt = `
        As a senior talent acquisition specialist, your task is to conduct a thorough analysis of a candidate's resume against a job description. 
        Provide a detailed, unbiased report in JSON format. The response must adhere strictly to the provided JSON schema.
        
        **Crucial Rule: The current date for this analysis is ${currentDate}. Use this date as the 'present day' for all temporal evaluations. Any employment date in the resume that starts after this date is a 'future date'. Dates before this are in the past.**

        The response should be in ${language === 'pt' ? 'Portuguese' : 'English'}.

        Analyze the provided job description and candidate's resume to generate the report with the following sections:
        - jobTitle: The title of the job.
        - summary: A brief professional summary of the candidate's fit for the role.
        - keyResponsibilitiesMatch: Compare the candidate's experience with the key responsibilities. For each, state 'Match', 'Partial', or 'No Match', with a brief explanation and an overall score (0-100).
        - requiredSkillsMatch: Same analysis for required skills.
        - niceToHaveSkillsMatch: Same analysis for "nice-to-have" skills.
        - companyCultureFit: Analyze potential culture fit based on resume language. Provide a score (0-100).
        - salaryAndBenefits: Note any mention of salary or benefits.
        - redFlags: Identify potential red flags (e.g., employment gaps, job hopping, **future dates**).
        - interviewQuestions: Suggest 3-5 insightful interview questions.
        - overallFitScore: An overall suitability score (0-100).
        - fitExplanation: A brief explanation for the overall score.
        - compatibilityGaps: List critical gaps between the candidate's profile and job requirements.
    `;

    const jobPart = buildContentPart(jobInput);
    const resumePart = buildContentPart(resumeInput);

    const contents = {
        parts: [
            { text: "Job Description:" },
            jobPart,
            { text: "Candidate Resume:" },
            resumePart,
            { text: "Instructions:" },
            { text: prompt }
        ]
    };

    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: contents,
        config: {
            responseMimeType: "application/json",
            responseSchema: recruiterAnalysisSchema,
        },
    });

    // Fix: Per guidelines, access text output via response.text
    const jsonText = response.text.trim();
    try {
        return JSON.parse(jsonText) as RecruiterAnalysisResult;
    } catch (e) {
        console.error("Failed to parse JSON from Gemini response for recruiter analysis:", jsonText, e);
        throw new Error("The analysis returned an invalid format. Please try again.");
    }
};

/**
 * Generates a preliminary interview decision based on a prior analysis.
 */
export const generatePreliminaryDecision = async (
    analysisResult: RecruiterAnalysisResult,
    language: 'en' | 'pt'
): Promise<PreliminaryDecisionResult> => {

    const prompt = `
        Based on the following detailed candidate analysis, make a preliminary decision on whether to recommend them for an interview.
        The decision must be either 'Recommended for Interview' or 'Not Recommended'.
        Provide a concise list of pros and cons, and a final explanation for your decision.
        The entire response must be in JSON format, adhering to the provided schema.
        
        The response should be in ${language === 'pt' ? 'Portuguese' : 'English'}.

        **Candidate Analysis:**
        ${JSON.stringify(analysisResult, null, 2)}
    `;

    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: preliminaryDecisionSchema,
        },
    });

    // Fix: Per guidelines, access text output via response.text
    const jsonText = response.text.trim();
    try {
        return JSON.parse(jsonText) as PreliminaryDecisionResult;
    } catch (e) {
        console.error("Failed to parse JSON from Gemini response for preliminary decision:", jsonText, e);
        throw new Error("The decision generation returned an invalid format. Please try again.");
    }
};

/**
 * Rewrites a resume to be tailored for a specific job description.
 */
export const rewriteResumeForJob = async (
    jobInput: Input,
    resumeInput: Input,
    language: 'en' | 'pt'
): Promise<RewrittenResumeResult> => {

    const prompt = `
        You are an expert career coach and professional resume writer. Your task is to rewrite the provided candidate's resume to better align with the specific job description provided.

        **ABSOLUTE CRITICAL RULE: You MUST NOT invent, add, or fabricate any information, skills, or experiences that are not explicitly present in the original resume. Your task is to rephrase, reorder, and highlight existing information, not to create new content.**

        Follow these steps:
        1.  Start with a professional summary (3-4 lines) that is directly tailored to the target job description, using keywords from it while reflecting the candidate's actual experience.
        2.  Review the candidate's work experience. For each role, reorder the bullet points to prioritize achievements and responsibilities that are most relevant to the job description.
        3.  Refine the language of the bullet points to be more action-oriented and results-focused (e.g., "Led a team that increased sales by 20%" instead of "Was responsible for sales").
        4.  Ensure the skills section highlights the technologies and abilities mentioned in the job description, but only those the candidate actually possesses.
        5.  The final output should be the full text of the rewritten resume, formatted cleanly.

        The response must be in JSON format, adhering to the provided schema.
        The response should be in ${language === 'pt' ? 'Portuguese' : 'English'}.
    `;
    
    const jobPart = buildContentPart(jobInput);
    const resumePart = buildContentPart(resumeInput);
    
    const contents = {
        parts: [
            { text: "Job Description:" },
            jobPart,
            { text: "Original Candidate Resume:" },
            resumePart,
            { text: "Instructions:" },
            { text: prompt }
        ]
    };

    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: contents,
        config: {
            responseMimeType: "application/json",
            responseSchema: rewrittenResumeSchema,
        },
    });
    
    // Fix: Per guidelines, access text output via response.text
    const jsonText = response.text.trim();
    try {
        return JSON.parse(jsonText) as RewrittenResumeResult;
    } catch (e) {
        console.error("Failed to parse JSON from Gemini response for resume rewrite:", jsonText, e);
        throw new Error("The resume rewrite returned an invalid format. Please try again.");
    }
};


/**
 * Analyzes interview transcript for consistency against resume and job description.
 */
export const analyzeInterviewConsistency = async (
    jobInput: Input,
    resumeInput: Input,
    interviewTranscript: string,
    compatibilityGaps: string[],
    language: 'en' | 'pt'
): Promise<ConsistencyAnalysisResult> => {
    
    const currentDate = new Date().toISOString().split('T')[0]; // Get YYYY-MM-DD

    const prompt = `
        You are a senior hiring manager performing a final consistency check after a candidate's interview.
        You have the original job description, the candidate's resume, a list of previously identified compatibility gaps, and the interview transcript.

        **Crucial Rule: The current date for this analysis is ${currentDate}. Use this date as the 'present day' for all temporal evaluations.**

        **Your analysis must cover the following points and be returned in a single JSON object conforming to the schema:**
        - consistencyScore: (0-100) rating consistency between the resume and interview.
        - summary: A summary of the interview's outcome and final assessment.
        - recommendation: A fit recommendation: 'Strong Fit', 'Partial Fit', or 'Weak Fit'.
        - softSkillsAnalysis: Analyze soft skills demonstrated in the interview, with a score (0-100).
        - inconsistencies: List contradictions between the resume and interview. Score based on severity (higher score = better).
        - missingFromInterview: List key skills from the resume NOT validated in the interview. Score based on what's missing (higher score = better).
        - newInInterview: List new relevant skills that appeared only in the interview. Score this (higher score = better).
        - gapResolutions: For each initial 'compatibilityGap', describe how the interview addressed it. Score how well gaps were resolved.
        - prosForHiring: Final top pros for hiring.
        - consForHiring: Final top cons or risks.
        - updatedOverallFitScore: A final, updated fit score (0-100) after the interview.
        - hiringDecision: Your final decision: 'Recommended for Hire' or 'Not Recommended'.

        The response should be in ${language === 'pt' ? 'Portuguese' : 'English'}.

        **Previously identified compatibility gaps to verify:**
        - ${compatibilityGaps.length > 0 ? compatibilityGaps.join('\n- ') : 'None'}

        **Interview Transcript to analyze:**
        ${interviewTranscript}
    `;

    const jobPart = buildContentPart(jobInput);
    const resumePart = buildContentPart(resumeInput);

    const contents = {
        parts: [
            { text: "Job Description:" },
            jobPart,
            { text: "Candidate Resume:" },
            resumePart,
            { text: "Analysis Instructions and Context:" },
            { text: prompt }
        ]
    };

    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: contents,
        config: {
            responseMimeType: "application/json",
            responseSchema: consistencyAnalysisSchema,
        },
    });
    
    // Fix: Per guidelines, access text output via response.text
    const jsonText = response.text.trim();
    try {
        return JSON.parse(jsonText) as ConsistencyAnalysisResult;
    } catch (e) {
        console.error("Failed to parse JSON from Gemini response for consistency analysis:", jsonText, e);
        throw new Error("The consistency analysis returned an invalid format. Please try again.");
    }
};