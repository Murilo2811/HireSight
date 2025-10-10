import {
    RecruiterAnalysisResult,
    PreliminaryDecisionResult,
    ConsistencyAnalysisResult,
    RewrittenResumeResult,
} from '../types';
import { LLMService, GeminiInput, buildContentPart } from './llmService';
import { recruiterAnalysisSchema, preliminaryDecisionSchema, consistencyAnalysisSchema, rewrittenResumeSchema } from './schemas';

// Helper to safely stringify a schema for the prompt
const schemaToString = (schema: object): string => {
    try {
        return JSON.stringify(schema, null, 2);
    } catch {
        return "{}";
    }
}

export class OpenAIService implements LLMService {
    private apiKey: string;
    private model: string;
    private baseURL = 'https://api.openai.com/v1/chat/completions';

    constructor(model: string, apiKey: string) {
        this.model = model;
        this.apiKey = apiKey;
    }

    private async callApi<T>(systemPrompt: string, userPrompt: string): Promise<T> {
        const response = await fetch(this.baseURL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: this.model,
                response_format: { type: "json_object" },
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ]
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorBody}`);
        }

        const data = await response.json();
        const jsonString = data.choices?.[0]?.message?.content;
        
        if (!jsonString) {
            throw new Error('Invalid response structure from OpenAI API.');
        }

        try {
            return JSON.parse(jsonString) as T;
        } catch (e) {
            console.error("Failed to parse JSON from OpenAI:", jsonString);
            throw new Error('Failed to parse JSON response from OpenAI API.');
        }
    }

    async analyzeForRecruiter(jobInput: GeminiInput, resumeInput: GeminiInput, language: string): Promise<RecruiterAnalysisResult> {
        const systemPrompt = `You are an expert HR recruiter analyzing a resume against a job description. Your output must be a single, valid JSON object that conforms to the provided schema. Do not output anything other than the JSON object. The analysis language should be: ${language}.\n\nSchema:\n${schemaToString(recruiterAnalysisSchema)}`;
        
        // For non-Gemini services, we assume file content has been parsed to text upstream.
        const jobContent = buildContentPart(jobInput).text;
        const resumeContent = buildContentPart(resumeInput).text;

        const userPrompt = `Job Description:\n${jobContent}\n\nCandidate's Resume:\n${resumeContent}\n\nAnalyze the resume against the job description based on the provided schema.`;

        return this.callApi<RecruiterAnalysisResult>(systemPrompt, userPrompt);
    }

    async generatePreliminaryDecision(analysisResult: RecruiterAnalysisResult, language: string): Promise<PreliminaryDecisionResult> {
        const systemPrompt = `You are an expert HR analyst. Based on the provided analysis, make a preliminary hiring decision. Your output must be a single, valid JSON object conforming to the schema. The language should be: ${language}.\n\nSchema:\n${schemaToString(preliminaryDecisionSchema)}`;
        const userPrompt = `Based on the following analysis, make a preliminary decision ("Recommended for Interview" or "Not Recommended"), provide pros, cons, and a final explanation.\n\nAnalysis:\n${JSON.stringify(analysisResult, null, 2)}`;
        
        return this.callApi<PreliminaryDecisionResult>(systemPrompt, userPrompt);
    }

    async analyzeInterviewConsistency(jobInput: GeminiInput, resumeInput: GeminiInput, interviewTranscript: string, compatibilityGaps: string[], language: string): Promise<ConsistencyAnalysisResult> {
        const systemPrompt = `You are an expert HR analyst assessing interview consistency. Your output must be a single, valid JSON object conforming to the provided schema. The analysis language should be: ${language}.\n\nSchema:\n${schemaToString(consistencyAnalysisSchema)}`;
        
        const jobContent = buildContentPart(jobInput).text;
        const resumeContent = buildContentPart(resumeInput).text;

        const userPrompt = `Job Description:\n${jobContent}\n\nResume:\n${resumeContent}\n\nInterview Transcript:\n${interviewTranscript}\n\nPreviously identified compatibility gaps:\n- ${compatibilityGaps.join('\n- ')}\n\nAnalyze the interview transcript in context of the other documents and pre-identified gaps according to the schema.`;
        
        return this.callApi<ConsistencyAnalysisResult>(systemPrompt, userPrompt);
    }

    async rewriteResumeForJob(jobInput: GeminiInput, resumeInput: GeminiInput, language: string): Promise<RewrittenResumeResult> {
        const systemPrompt = `You are an expert resume writer. Rewrite a resume to align with a job description without fabricating information. The output must be a single, valid JSON object conforming to the provided schema. The language should be: ${language}.\n\nSchema:\n${schemaToString(rewrittenResumeSchema)}`;
        
        const jobContent = buildContentPart(jobInput).text;
        const resumeContent = buildContentPart(resumeInput).text;

        const userPrompt = `Original Resume:\n${resumeContent}\n\nTarget Job Description:\n${jobContent}\n\nRewrite the resume using Markdown formatting as per the schema's description. Emphasize relevant skills and experiences. Do not add information not present in the original resume.`;

        return this.callApi<RewrittenResumeResult>(systemPrompt, userPrompt);
    }
}
