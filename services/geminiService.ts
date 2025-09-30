import { GoogleGenAI, Type } from "@google/genai";
import { RecruiterAnalysisResult, ConsistencyAnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const recruiterAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        jobTitle: { type: Type.STRING, description: "The title of the job position." },
        summary: { type: Type.STRING, description: "A concise summary of the job, the candidate's profile, and the overall match." },
        keyResponsibilitiesMatch: {
            type: Type.OBJECT,
            properties: {
                items: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A bulleted list of the key responsibilities for the role mentioned in the job description." },
                score: { type: Type.NUMBER, description: "A numerical score (0-100) on how well the candidate's experience matches the key responsibilities."}
            },
            required: ['items', 'score']
        },
        requiredSkillsMatch: {
            type: Type.OBJECT,
            properties: {
                items: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of required skills and qualifications, indicating whether the candidate possesses them based on their resume." },
                score: { type: Type.NUMBER, description: "A numerical score (0-100) representing the candidate's alignment with the required skills." }
            },
            required: ['items', 'score']
        },
        niceToHaveSkillsMatch: {
            type: Type.OBJECT,
            properties: {
                items: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of 'nice-to-have' or preferred skills, indicating if the candidate has them." },
                score: { type: Type.NUMBER, description: "A numerical score (0-100) for the candidate's possession of nice-to-have skills." }
            },
            required: ['items', 'score']
        },
        companyCultureFit: {
            type: Type.OBJECT,
            properties: {
                analysis: { type: Type.STRING, description: "An analysis of the company culture if mentioned, and how the candidate might fit in." },
                score: { type: Type.NUMBER, description: "A numerical score (0-100) assessing the candidate's potential fit with the company culture." }
            },
            required: ['analysis', 'score']
        },
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
        'jobTitle', 'summary', 'keyResponsibilitiesMatch', 'requiredSkillsMatch', 
        'niceToHaveSkillsMatch', 'companyCultureFit', 'salaryAndBenefits', 
        'redFlags', 'interviewQuestions', 'overallFitScore', 'fitExplanation', 'compatibilityGaps'
    ]
};

const consistencySchema = {
    type: Type.OBJECT,
    properties: {
        consistencyScore: { type: Type.NUMBER, description: "A percentage score (0-100) representing how consistent the interview was with the resume and job description." },
        summary: { type: Type.STRING, description: "A narrative summary (1-2 paragraphs) explaining the reasoning for the overall evaluation, citing specific examples from the provided documents." },
        recommendation: { 
            type: Type.STRING, 
            enum: ['Strong Fit', 'Partial Fit', 'Weak Fit'],
            description: "The final recommendation for the candidate based on the holistic analysis."
        },
        softSkillsAnalysis: { 
            type: Type.OBJECT,
            properties: {
                items: { type: Type.STRING, description: "An evaluation of the candidate's communication style, motivation, leadership, teamwork, and problem-solving skills based on the interview transcript compared to job description expectations." },
                score: { type: Type.NUMBER, description: "A numerical score (0-100) assessing the quality of the candidate's soft skills demonstrated in the interview."}
            },
            required: ['items', 'score']
        },
        inconsistencies: {
            type: Type.OBJECT,
            properties: {
                items: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A bulleted list of any inconsistencies or contradictions found when cross-validating claims in the resume with what was said in the interview." },
                score: { type: Type.NUMBER, description: "A numerical score (0-100) where 100 means no inconsistencies and 0 means critical inconsistencies were found."}
            },
            required: ['items', 'score']
        },
        missingFromInterview: {
            type: Type.OBJECT,
            properties: {
                items: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A bulleted list of key skills or experiences from the resume that were NOT mentioned or elaborated on during the interview." },
                score: { type: Type.NUMBER, description: "A numerical score (0-100) assessing the importance of the items missing from the interview. 100 means nothing important was missing."}
            },
            required: ['items', 'score']
        },
        newInInterview: {
            type: Type.OBJECT,
            properties: {
                items: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A bulleted list of new, relevant information or skills the candidate presented in the interview that were NOT on their resume but are relevant to the job." },
                score: { type: Type.NUMBER, description: "A numerical score (0-100) assessing the positive impact of the new information revealed."}
            },
            required: ['items', 'score']
        },
        prosForHiring: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A bulleted list of the main reasons TO HIRE the candidate, based on the complete analysis."
        },
        consForHiring: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A bulleted list of the main CONCERNS or reasons NOT TO HIRE the candidate, based on the complete analysis."
        },
        updatedOverallFitScore: { type: Type.NUMBER, description: "A new, updated numerical score from 0 to 100 representing the candidate's overall fit, recalculated after considering the interview transcript." },
        hiringDecision: { 
            type: Type.STRING, 
            enum: ['Recommended for Hire', 'Not Recommended'],
            description: "A final, clear verdict on whether the candidate is suitable for the role and should be hired."
        },
    },
    required: ['consistencyScore', 'summary', 'recommendation', 'softSkillsAnalysis', 'inconsistencies', 'missingFromInterview', 'newInInterview', 'prosForHiring', 'consForHiring', 'updatedOverallFitScore', 'hiringDecision']
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
    
    const systemInstruction = `
Act like a senior HR analyst with over 20 years of experience in talent acquisition, competency mapping, and organizational fit assessment. You have deep expertise in recruitment processes, resume evaluation, and job description analysis.

Your task is to conduct a deep and comprehensive analysis of a candidate’s resume (CV) against a provided job description (JD).

Your objective is to:
1. Provide a detailed report for a recruiter, highlighting the candidate's strengths, weaknesses, and overall fit for the role.
2. Assess both technical competencies and behavioral/soft skills alignment based on the provided documents.
3. For each key section of the analysis (Responsibilities, Required Skills, Nice-to-Have Skills, Company Culture), assign a numerical score from 0 to 100 representing the candidate's alignment.
4. Identify key alignments, potential gaps, or red flags in the candidate's profile.
5. Generate actionable insights, such as targeted interview questions, to help the recruiter make an informed decision.

Work step-by-step: First, deeply understand the requirements from the job description. Second, thoroughly evaluate the candidate's skills and experience from their resume. Third, critically compare the two, noting every area of match and mismatch and assigning a score for each section. Finally, synthesize your findings into a comprehensive, structured report.

Use clear, professional HR language and be as detailed and evidence-based as possible. Your output must be long, structured, and formatted strictly following the provided JSON schema.

Take a deep breath and work on this problem step-by-step.
${langInstruction}
`;

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
    
    const systemInstruction = `
Act like a senior HR analyst with over 20 years of experience in talent acquisition, competency mapping, and organizational fit assessment. You have deep expertise in recruitment processes, resume evaluation, behavioral interviews, and job description analysis.

Your task is to analyze the consistency and alignment between three sources of information:
1. The candidate’s resume (CV)
2. The job description (JD) for the role they are applying for
3. The transcript of their interview

Objective:
- Identify where the candidate’s profile matches, partially matches, or does not match the role requirements.
- Assess both technical competencies and behavioral/soft skills alignment.
- Highlight any gaps, risks, or red flags in the candidate’s profile.
- Suggest a final recommendation: Strong fit / Partial fit / Weak fit.

Step-by-Step Instructions:
1.  Parse the Input: Review the three sources of information provided (resume, job description, and interview transcript).
2.  Compare Competencies: Match hard skills, certifications, and experience against job requirements. Identify missing or underrepresented skills.
3.  Analyze Soft Skills: Evaluate communication style, motivation, leadership, teamwork, and problem-solving from the interview transcript. Compare behavioral evidence with JD expectations.
4.  Check for Consistency: Cross-validate claims in the resume with what was said in the interview. Flag inconsistencies or contradictions.
5.  Assign Scores: For each key analysis section (Soft Skills, Inconsistencies, Missing Info, New Info), assign a numerical score from 0 to 100 reflecting its significance, severity, or impact.
6.  Provide Structured Output: Format your analysis strictly following the JSON schema provided. Ensure completeness and accuracy of each required field.
7.  Final Evaluation: Give a narrative summary (1–2 paragraphs) explaining your reasoning. Provide a recommendation (Strong fit / Partial fit / Weak fit).
8.  List Pros and Cons: Based on your complete analysis, provide a bulleted list of the main 'Pros' (reasons to hire) and 'Cons' (reasons not to hire or areas of concern).
9.  Re-evaluate Overall Fit: Based on the combined information from all three documents, provide an updated overall fit score (0-100). This score should reflect your final assessment after the interview.
10. Final Verdict: Conclude with a clear hiring recommendation ('Recommended for Hire' or 'Not Recommended'), indicating if the candidate is suitable for the role.

Additional Requirements:
- Use clear, professional HR language.
- Be as detailed and evidence-based as possible, citing specific excerpts from the candidate’s documents.
- Output must be long, structured, and comprehensive.

Take a deep breath and work on this problem step-by-step.
${langInstruction}
`;

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