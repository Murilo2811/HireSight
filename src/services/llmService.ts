import {
    RecruiterAnalysisResult,
    PreliminaryDecisionResult,
    ConsistencyAnalysisResult,
    RewrittenResumeResult,
    LlmConfig,
} from '../types';
import { GeminiService } from './geminiService';
import { OpenAIService } from './openaiService';
import { AnthropicService } from './anthropicService';
import { GroqService } from './groqService';

/**
 * Defines the structure for inputs passed to the services.
 */
export type GeminiInput = {
    content: string | { data: string; mimeType: string };
    format: 'text' | 'file';
};

/**
 * Helper to build a content part for the Gemini API, handling both text and file data.
 */
export const buildContentPart = (input: GeminiInput) => {
    if (input.format === 'file' && typeof input.content !== 'string') {
        return { inlineData: input.content };
    }
    return { text: input.content as string };
};

export interface LLMService {
    analyzeForRecruiter(jobInput: GeminiInput, resumeInput: GeminiInput, language: string): Promise<RecruiterAnalysisResult>;
    generatePreliminaryDecision(analysisResult: RecruiterAnalysisResult, language: string): Promise<PreliminaryDecisionResult>;
    analyzeInterviewConsistency(jobInput: GeminiInput, resumeInput: GeminiInput, interviewTranscript: string, compatibilityGaps: string[], language: string): Promise<ConsistencyAnalysisResult>;
    rewriteResumeForJob(jobInput: GeminiInput, resumeInput: GeminiInput, language: string): Promise<RewrittenResumeResult>;
}

export const getLlmService = (config: LlmConfig): LLMService => {
    switch (config.provider) {
        case 'gemini':
            if (!process.env.API_KEY) throw new Error('error.geminiKeyMissing');
            return new GeminiService(config.model);
        case 'openai':
            if (!config.apiKeys.openai) throw new Error('error.openaiKeyMissing');
            return new OpenAIService(config.model, config.apiKeys.openai);
        case 'anthropic':
            if (!config.apiKeys.anthropic) throw new Error('error.anthropicKeyMissing');
            return new AnthropicService(config.model, config.apiKeys.anthropic);
        case 'groq':
             if (!config.apiKeys.groq) throw new Error('error.groqKeyMissing');
            return new GroqService(config.model, config.apiKeys.groq);
        default:
            if (!process.env.API_KEY) throw new Error('error.geminiKeyMissing');
            return new GeminiService(config.model);
    }
};
