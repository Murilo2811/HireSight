import { GoogleGenAI, Type } from "@google/genai";
import { RecruiterAnalysisResult, ConsistencyAnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const recruiterAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        jobTitle: { type: Type.STRING, description: "The title of the job position." },
        summary: { type: Type.STRING, description: "A concise summary of the job, the candidate's profile, and the overall match." },
        keyResponsibilities: { 
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A bulleted list of the key responsibilities for the role mentioned in the job description."
        },
        requiredSkills: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of required skills and qualifications, indicating whether the candidate possesses them based on their resume."
        },
        niceToHaveSkills: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of 'nice-to-have' or preferred skills, indicating if the candidate has them."
        },
        companyCulture: { type: Type.STRING, description: "An analysis of the company culture if mentioned, and how the candidate might fit in." },
        salaryAndBenefits: { type: Type.STRING, description: "Any information about salary, compensation, and benefits mentioned in the job description." },
        redFlags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of potential red flags or concerns from either the job description (e.g., vague language) or the candidate's resume (e.g., gaps in employment)."
        },
        interviewQuestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of suggested interview questions to ask the candidate to further assess their fit for the role, based on their resume and the job requirements."
        },
        overallFitScore: { type: Type.NUMBER, description: "A numerical score from 0 to 100 representing the candidate's overall fit for the job." },
        fitExplanation: { type: Type.STRING, description: "A detailed explanation justifying the overall fit score, highlighting strengths and weaknesses." },
        compatibilityGaps: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A bulleted list of key requirements from the job description that are missing or not adequately covered in the candidate's resume."
        },
    },
    required: [
        'jobTitle', 'summary', 'keyResponsibilities', 'requiredSkills', 
        'niceToHaveSkills', 'companyCulture', 'salaryAndBenefits', 
        'redFlags', 'interviewQuestions', 'overallFitScore', 'fitExplanation', 'compatibilityGaps'
    ]
};

const consistencySchema = {
    type: Type.OBJECT,
    properties: {
        consistencyScore: { type: Type.NUMBER, description: "A percentage score (0-100) representing how consistent the interview was with the resume." },
        missingFromInterview: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A bulleted list of key skills or experiences from the resume that were NOT mentioned or elaborated on during the interview."
        },
        newInInterview: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A bulleted list of new, relevant information or skills the candidate presented in the interview that were NOT on their resume but are relevant to the job."
        },
    },
    required: ['consistencyScore', 'missingFromInterview', 'newInInterview']
};

const buildParts = (content: string | { data: string; mimeType: string }, format: 'text' | 'file') => {
    if (format === 'text') {
        return [{ text: content as string }];
    } else {
        const fileContent = content as { data: string; mimeType: string };
        return [{
            inlineData: {
                data: fileContent.data,
                mimeType: fileContent.mimeType,
            },
        }];
    }
};

const handleGeminiError = (error: unknown, context: string): Error => {
    console.error(`Error during ${context}:`, error);
    if (error instanceof SyntaxError) {
         return new Error("Failed to parse the model's response. The format was invalid.");
    }
    return new Error(`An unexpected error occurred during the ${context}. Please try again.`);
};


export const analyzeForRecruiter = async (
    jobDescription: { content: string | { data: string; mimeType: string }, format: 'text' | 'file' },
    resume: { content: string | { data: string; mimeType: string }, format: 'text' | 'file' },
    language: 'en' | 'pt'
): Promise<RecruiterAnalysisResult> => {
    const parts: any[] = [];
    const langInstruction = language === 'pt' ? 'Toda a análise deve ser em Português do Brasil.' : 'The entire analysis must be in English.';
    const systemInstruction = `You are a senior HR analyst. Analyze the following job description and candidate resume. Provide a detailed analysis based on the provided JSON schema. ${langInstruction}`;

    parts.push({ text: `${systemInstruction}\n\n--- JOB DESCRIPTION ---\n` });
    parts.push(...buildParts(jobDescription.content, jobDescription.format));
    parts.push({ text: '\n\n--- CANDIDATE RESUME ---\n' });
    parts.push(...buildParts(resume.content, resume.format));

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts },
            config: { responseMimeType: 'application/json', responseSchema: recruiterAnalysisSchema }
        });
        return JSON.parse(response.text) as RecruiterAnalysisResult;
    } catch (error) {
        throw handleGeminiError(error, 'recruiter analysis');
    }
};

export const analyzeInterviewConsistency = async (
    jobDescription: { content: string | { data: string; mimeType: string }, format: 'text' | 'file' },
    resume: { content: string | { data: string; mimeType: string }, format: 'text' | 'file' },
    interviewTranscript: string,
    language: 'en' | 'pt'
): Promise<ConsistencyAnalysisResult> => {
    const parts: any[] = [];
    const langInstruction = language === 'pt' ? 'Toda a análise deve ser em Português do Brasil.' : 'The entire analysis must be in English.';
    const systemInstruction = `You are a senior HR analyst. Your task is to analyze the consistency between a candidate's resume, the job description, and the transcript of their interview. Provide the analysis based on the provided JSON schema. ${langInstruction}`;

    parts.push({ text: `${systemInstruction}\n\n--- JOB DESCRIPTION ---\n` });
    parts.push(...buildParts(jobDescription.content, jobDescription.format));
    parts.push({ text: '\n\n--- CANDIDATE RESUME ---\n' });
    parts.push(...buildParts(resume.content, resume.format));
    parts.push({ text: '\n\n--- INTERVIEW TRANSCRIPT ---\n' });
    parts.push({ text: interviewTranscript });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts },
            config: { responseMimeType: 'application/json', responseSchema: consistencySchema }
        });
        return JSON.parse(response.text) as ConsistencyAnalysisResult;
    } catch (error) {
        throw handleGeminiError(error, 'consistency analysis');
    }
};
