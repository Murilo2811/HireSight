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


export class GeminiService implements LLMService {
    private ai: GoogleGenAI;
    private model: string;

    constructor(model: string) {
        this.ai = new GoogleGenAI({apiKey: process.env.API_KEY});
        this.model = model;
    }

    async analyzeForRecruiter(
        jobInput: GeminiInput,
        resumeInput: GeminiInput,
        language: string
    ): Promise<RecruiterAnalysisResult> {

        const jobPart = buildContentPart(jobInput);
        const resumePart = buildContentPart(resumeInput);

        const promptParts = [
            { text: `You are an expert HR recruiter analyzing a resume against a job description. Your output must be in JSON and conform to the provided schema. The analysis language should be: ${language}.` },
            { text: "Job Description:" },
            jobPart,
            { text: "Candidate's Resume:" },
            resumePart,
            { text: `
Analyze the resume against the job description and provide a detailed analysis.
- For each section (responsibilities, required skills, nice-to-have skills), list each item from the job description and evaluate how well the candidate's resume matches it.
- Provide an overall fit score and a detailed explanation.
- Identify specific compatibility gaps.
- Suggest relevant interview questions.
- Identify any red flags.` }
        ];

        const response = await this.ai.models.generateContent({
            model: this.model,
            contents: { parts: promptParts },
            config: {
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
        const prompt = `
Based on the following recruitment analysis, make a preliminary decision.
The decision should be either "Recommended for Interview" or "Not Recommended".
Provide a list of pros and cons, and a final explanation for your decision.
The response language must be ${language}.
Your output must be in JSON and conform to the provided schema.

Analysis:
${JSON.stringify(analysisResult, null, 2)}
`;

        const response = await this.ai.models.generateContent({
            model: this.model,
            contents: prompt,
            config: {
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
        const jobPart = buildContentPart(jobInput);
        const resumePart = buildContentPart(resumeInput);

        const promptParts = [
            { text: `You are an expert HR analyst assessing the consistency between a candidate's resume, their interview, and the job description. Your output must be in JSON and conform to the provided schema. The analysis language should be: ${language}.` },
            { text: "Job Description:" },
            jobPart,
            { text: "Candidate's Resume:" },
            resumePart,
            { text: `Interview Transcript:\n${interviewTranscript}` },
            { text: `Previously identified compatibility gaps:\n- ${compatibilityGaps.join('\n- ')}` },
            { text: `
Analyze the interview transcript in the context of the resume, job description, and pre-identified gaps.
- For each compatibility gap, determine if the candidate's interview responses resolved it. The 'resolution' should quote or summarize the relevant part of the interview. The 'isResolved' flag must be set to 'true' only if the gap is fully and satisfactorily addressed. If not, set it to 'false' and explain why in the 'resolution' text.
- Assess overall consistency between their resume and interview answers.
- Identify any new information or skills that emerged during the interview.
- Identify key information from the resume that was not discussed.
- Analyze soft skills demonstrated.
- Provide a final hiring decision and an updated overall fit score.` }
        ];

        const response = await this.ai.models.generateContent({
            model: this.model,
            contents: { parts: promptParts },
            config: {
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
        const jobPart = buildContentPart(jobInput);
        const resumePart = buildContentPart(resumeInput);

        const promptParts = [
            { text: `You are an expert resume writer. Your task is to rewrite a resume to better align with a specific job description, without fabricating information. Maintain a professional tone. The output language should be: ${language}. Your output must be in JSON and conform to the provided schema.` },
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

        const response = await this.ai.models.generateContent({
            model: this.model,
            contents: { parts: promptParts },
            config: {
                responseMimeType: "application/json",
                responseSchema: rewrittenResumeSchema,
            },
        });

        const result = JSON.parse(response.text.trim());
        return result as RewrittenResumeResult;
    }
}
