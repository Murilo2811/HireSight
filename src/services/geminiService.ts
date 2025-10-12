import { GoogleGenAI } from "@google/genai";
import {
    RecruiterAnalysisResult,
    PreliminaryDecisionResult,
    ConsistencyAnalysisResult,
    RewrittenResumeResult,
} from '../types';
import { LLMService, GeminiInput, buildContentPart } from './llmService';
import { 
    recruiterAnalysisSchema, 
    preliminaryDecisionSchema, 
    consistencyAnalysisSchema, 
    rewrittenResumeSchema 
} from './schemas';

// Gemini API client setup
const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

export class GeminiService implements LLMService {
    private model: string;

    constructor(model: string) {
        this.model = model;
    }

    async analyzeForRecruiter(
        jobInput: GeminiInput,
        resumeInput: GeminiInput,
        language: string
    ): Promise<RecruiterAnalysisResult> {

        const systemInstruction = `You are a meticulous and skeptical expert HR recruiter. Your task is to provide an unbiased, strictly factual analysis of a candidate's resume against a job description. Your output must be in JSON and conform to the provided schema. The analysis language should be: ${language}.`;

        const jobPart = buildContentPart(jobInput);
        const resumePart = buildContentPart(resumeInput);

        const promptParts = [
            { text: `
**Analysis Task & Guidelines:**
- **Strict Adherence:** Base your analysis *only* on the information present in the resume and job description. Do not infer or invent information.
- **Scoring:** Scores must be calculated based on the degree of explicit matching for each required item. A 'Match' requires clear evidence. 'Partial' means some related experience is present. 'No Match' means the skill/responsibility is absent.
- **Date Interpretation:** A job end date of "Present", "Atual", the current month/year, or similar terms indicates the candidate is currently employed there. This is **NOT** a red flag or a typo. Only flag dates as a concern if the *start date* is clearly in the future or if there are unexplained, prolonged employment gaps (over 6 months).
- **Red Flags:** A red flag must be a significant, objective concern (e.g., major skill gaps for a core requirement, frequent short-term employment, unexplained long gaps, or a future start date). Do not list minor discrepancies as red flags.
` },
            { text: "Job Description:" },
            jobPart,
            { text: "Candidate's Resume:" },
            resumePart,
        ];

        const response = await ai.models.generateContent({
            model: this.model,
            contents: { parts: promptParts },
            config: {
                systemInstruction,
                temperature: 0.2,
                responseMimeType: "application/json",
                responseSchema: recruiterAnalysisSchema,
            },
        });

        const result = JSON.parse(response.text.trim());
        return result as RecruiterAnalysisResult;
    }

    async generatePreliminaryDecision(
        analysisResult: RecruiterAnalysisResult,
        language: string
    ): Promise<PreliminaryDecisionResult> {
        const systemInstruction = `You are a decisive HR manager. Your task is to make a clear "Recommended for Interview" or "Not Recommended" decision based *only* on the provided analysis report. Your output must be in JSON and conform to the provided schema. The response language must be ${language}.`;
        
        const prompt = `
Based on the following recruitment analysis, make a preliminary decision. Provide a balanced list of pros and cons that directly support your final decision, and a concise explanation.

**Analysis Report:**
${JSON.stringify(analysisResult, null, 2)}
`;

        const response = await ai.models.generateContent({
            model: this.model,
            contents: prompt,
            config: {
                systemInstruction,
                temperature: 0.2,
                responseMimeType: "application/json",
                responseSchema: preliminaryDecisionSchema,
            },
        });

        const result = JSON.parse(response.text.trim());
        return result as PreliminaryDecisionResult;
    }

    async analyzeInterviewConsistency(
        jobInput: GeminiInput,
        resumeInput: GeminiInput,
        interviewTranscript: string,
        compatibilityGaps: string[],
        language: string
    ): Promise<ConsistencyAnalysisResult> {
        const systemInstruction = `You are an expert HR analyst assessing the consistency between a candidate's resume, their interview, and the job description. You must be objective and critical. Your output must be in JSON and conform to the provided schema. The analysis language should be: ${language}.`;

        const jobPart = buildContentPart(jobInput);
        const resumePart = buildContentPart(resumeInput);

        const promptParts = [
            { text: `
**Analysis Task & Guidelines:**
- Analyze the interview transcript in the context of the resume, job description, and pre-identified compatibility gaps.
- **Gap Resolution:** For each gap, determine if the candidate's interview responses *fully and satisfactorily* resolved it. The 'resolution' text should quote or summarize the relevant part of the interview. The 'isResolved' flag must be \`true\` only if the gap is convincingly closed. If the answer is evasive, insufficient, or the gap wasn't addressed, set it to \`false\` and explain why.
- **Consistency:** Identify direct contradictions between the resume and the interview. A difference in emphasis is not a contradiction, but a factual discrepancy is (e.g., claiming to lead a project on the resume vs. being a minor contributor in the interview).
- **Final Decision:** The final hiring decision should be a logical conclusion based *only* on the combined evidence from all three sources (JD, resume, interview).
` },
            { text: "Job Description:" },
            jobPart,
            { text: "Candidate's Resume:" },
            resumePart,
            { text: `Interview Transcript:\n${interviewTranscript}` },
            { text: `Previously identified compatibility gaps:\n- ${compatibilityGaps.join('\n- ')}` },
        ];

        const response = await ai.models.generateContent({
            model: this.model,
            contents: { parts: promptParts },
            config: {
                systemInstruction,
                temperature: 0.2,
                responseMimeType: "application/json",
                responseSchema: consistencyAnalysisSchema,
            },
        });

        const result = JSON.parse(response.text.trim());
        return result as ConsistencyAnalysisResult;
    }

    async rewriteResumeForJob(
        jobInput: GeminiInput,
        resumeInput: GeminiInput,
        language: string
    ): Promise<RewrittenResumeResult> {
        const systemInstruction = `You are an expert resume writer. Your task is to rewrite a resume to better align with a specific job description, without fabricating information. Maintain a professional tone. The output language should be: ${language}. Your output must be in JSON and conform to the provided schema.`;

        const jobPart = buildContentPart(jobInput);
        const resumePart = buildContentPart(resumeInput);

        const promptParts = [
            { text: "Original Resume:" },
            resumePart,
            { text: "Target Job Description:" },
            jobPart,
            { text: `
Rewrite the provided resume using **Markdown formatting**.
The goal is to emphasize skills and experiences from the original resume that are most relevant to the job description.

**Formatting Rules:**
- Use Markdown headings for sections (e.g., '## Professional Experience', '## Skills').
- Use bold for job titles (e.g., '**Senior Project Manager**').
- Use italics for company names and dates (e.g., '*Some Company | Jan 2020 - Present*').
- Use bullet points ('-') for responsibilities and achievements under each role.

**Content Rules:**
- Use keywords from the job description where appropriate and accurate.
- Rephrase bullet points to highlight achievements and impact.
- **CRITICAL: Do NOT add any new skills or experiences that are not present in the original resume. You must only use information provided in the original resume.**
- The output should be the complete, rewritten resume text in a single Markdown string.`}
        ];

        const response = await ai.models.generateContent({
            model: this.model,
            contents: { parts: promptParts },
            config: {
                systemInstruction,
                temperature: 0.2,
                responseMimeType: "application/json",
                responseSchema: rewrittenResumeSchema,
            },
        });

        const result = JSON.parse(response.text.trim());
        return result as RewrittenResumeResult;
    }
}