import mammoth from 'mammoth';
import { Readability } from '@mozilla/readability';

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64String = (reader.result as string).split(',')[1];
            resolve(base64String);
        };
        reader.onerror = error => reject(error);
    });
}

export const parseDocumentFile = async (file: File): Promise<{ content: string | { data: string; mimeType: string }, format: 'text' | 'file' }> => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'pdf') {
        const base64Data = await fileToBase64(file);
        return {
            content: {
                data: base64Data,
                mimeType: file.type || 'application/pdf',
            },
            format: 'file',
        };
    } else if (fileExtension === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return {
            content: result.value,
            format: 'text',
        };
    } else {
        throw new Error('Unsupported file format. Please use PDF or DOCX.');
    }
};

export const parseUrlContent = async (url: string): Promise<string> => {
    // Usando um proxy CORS para buscar conteúdo de outras origens
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(proxyUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch from URL with status: ${response.status}`);
    }

    const data = await response.json();
    const htmlContent = data.contents;
    
    if (!htmlContent) {
        throw new Error('Could not retrieve content from the URL.');
    }

    const doc = new DOMParser().parseFromString(htmlContent, 'text/html');
    const article = new Readability(doc).parse();

    if (!article || !article.textContent) {
        throw new Error('Could not extract main content using Readability.');
    }

    // Lógica de limpeza do texto extraído
    let cleanedText = article.textContent;

    // 1. Normaliza espaços em branco e quebras de linha
    cleanedText = cleanedText
        .replace(/\t/g, ' ') // Substitui tabs por espaços
        .replace(/ +/g, ' ') // Reduz múltiplos espaços a um só
        .replace(/\n{3,}/g, '\n\n'); // Reduz 3+ quebras de linha para 2

    // 2. Filtra linhas comuns de rodapés e cabeçalhos (boilerplate)
    const lines = cleanedText.split('\n');
    const cleanedLines: string[] = [];
    const boilerplatePatterns = [
        'share this job', 'apply now', 'report this job', 'similar jobs',
        'privacy policy', 'terms of service', 'cookie settings', 'all rights reserved',
        'back to top', 'view all jobs', 'powered by', 'log in', 'sign up',
        /©\s*\d{4}/i, // Símbolo de Copyright + ano
        /^voltar$/, 
        /^compartilhar vaga$/
    ];

    const boilerplateRegex = new RegExp(boilerplatePatterns.map(p => typeof p === 'string' ? p.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') : p.source).join('|'), 'i');

    for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Pula linhas vazias, muito curtas ou que correspondem a padrões de boilerplate
        if (trimmedLine === '' || trimmedLine.length < 5 || boilerplateRegex.test(trimmedLine)) {
            continue;
        }

        cleanedLines.push(trimmedLine);
    }

    // 3. Remonta o texto e retorna
    return cleanedLines.join('\n').trim();
};

export const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};