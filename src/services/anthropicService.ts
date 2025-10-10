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

export class AnthropicService implements LLMService {
    private apiKey: string;
    private model: string;

    constructor(model: string, apiKey: string) {
        this.model = model;
        this.apiKey = apiKey;
    }

    private async callApi<T>(systemPrompt: string, userPrompt: string): Promise<T> {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                model: this.model,
                max_tokens: 4096,
                system: systemPrompt,
                messages: [{ role: 'user', content: userPrompt }]
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Anthropic API error: ${response.status} ${response.statusText} - ${errorBody}`);
        }

        const data = await response.json();
        const textContent = data.content?.[0]?.text || '';
        
        // Find the JSON part of the response
        const jsonMatch = textContent.match(/```json\s*([\s\S]*?)\s*```|({[\s\S]*})/);
        if (!jsonMatch) {
            throw new Error('Invalid JSON response from Anthropic API.');
        }

        // Use the first capturing group that matched
        const jsonString = jsonMatch[1] || jsonMatch[2];
        
        try {
            return JSON.parse(jsonString.trim()) as T;
        } catch (e) {
            console.error("Failed to parse JSON from Anthropic:", jsonString);
            throw new Error('Failed to parse JSON response from Anthropic API.');
        }
    }

    async analyzeForRecruiter(jobInput: GeminiInput, resumeInput: GeminiInput, language: string): Promise<RecruiterAnalysisResult> {
        const systemPrompt = `You are an expert HR recruiter analyzing a resume against a job description. Your output must be a single, valid JSON object that conforms to the provided schema. Do not include any text, explanation, or markdown formatting outside of the JSON object. The analysis language should be: ${language}.\n\nSchema:\n${schemaToString(recruiterAnalysisSchema)}`;
        
        const jobContent = buildContentPart(jobInput).text;
        const resumeContent = buildContentPart(resumeInput).text;

        const userPrompt = `Job Description:\n${jobContent}\n\nCandidate's Resume:\n${resumeContent}\n\nAnalyze the resume against the job description based on the schema provided in the system prompt.`;

        return this.callApi<RecruiterAnalysisResult>(systemPrompt, userPrompt);
    }
    
    async generatePreliminaryDecision(analysisResult: RecruiterAnalysisResult, language: string): Promise<PreliminaryDecisionResult> {
        const systemPrompt = `You are an expert HR analyst making a preliminary hiring decision based on a candidate analysis report. Your output must be a single, valid JSON object that conforms to the provided schema. The language should be: ${language}.\n\nSchema:\n${schemaToString(preliminaryDecisionSchema)}`;
        const userPrompt = `Based on the following analysis, make a preliminary decision ("Recommended for Interview" or "Not Recommended"), provide pros, cons, and a final explanation.\n\nAnalysis:\n${JSON.stringify(analysisResult, null, 2)}`;
        
        return this.callApi<PreliminaryDecisionResult>(systemPrompt, userPrompt);
    }

    async analyzeInterviewConsistency(jobInput: GeminiInput, resumeInput: GeminiInput, interviewTranscript: string, compatibilityGaps: string[], language: string): Promise<ConsistencyAnalysisResult> {
        const systemPrompt = `You are an expert HR analyst assessing interview consistency. Your output must be a single, valid JSON object conforming to the provided schema. The analysis language should be: ${language}.\n\nSchema:\n${schemaToString(consistencyAnalysisSchema)}`;
        
        const jobContent = buildContentPart(jobInput).text;
        const resumeContent = buildContentPart(resumeInput).text;

        const userPrompt = `Job Description:\n${jobContent}\n\nResume:\n${resumeContent}\n\nInterview Transcript:\n${interviewTranscript}\n\nPreviously identified compatibility gaps:\n- ${compatibilityGaps.join('\n- ')}\n\nAnalyze the interview transcript in context of the other documents and pre-identified gaps according to the system prompt's schema.`;
        
        return this.callApi<ConsistencyAnalysisResult>(systemPrompt, userPrompt);
    }

    async rewriteResumeForJob(jobInput: GeminiInput, resumeInput: GeminiInput, language: string): Promise<RewrittenResumeResult> {
        const systemPrompt = `You are an expert resume writer rewriting a resume to align with a job description without fabricating information. The output must be a single, valid JSON object conforming to the provided schema. The language should be: ${language}.\n\nSchema:\n${schemaToString(rewrittenResumeSchema)}`;
        
        const jobContent = buildContentPart(jobInput).text;
        const resumeContent = buildContentPart(resumeInput).text;

        const userPrompt = `Original Resume:\n${resumeContent}\n\nTarget Job Description:\n${jobContent}\n\nRewrite the resume using Markdown formatting as per the schema's description. Emphasize relevant skills and experiences. Do not add information not present in the original resume.`;

        return this.callApi<RewrittenResumeResult>(systemPrompt, userPrompt);
    }
}
