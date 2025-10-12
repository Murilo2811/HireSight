import mammoth from 'mammoth';
import { Readability } from '@mozilla/readability';
import React from 'react';
import ReactDOM from 'react-dom/client';

// Declare jspdf and html2canvas as they are loaded from a script tag, not imported.
declare const jspdf: any;
declare const html2canvas: any;

const loadedScripts: { [src: string]: Promise<void> } = {};
const loadScript = (src: string): Promise<void> => {
    if (!loadedScripts[src]) {
        loadedScripts[src] = new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => resolve();
            script.onerror = () => {
                delete loadedScripts[src]; // Allow retrying
                reject(new Error(`Failed to load script: ${src}`));
            };
            document.head.appendChild(script);
        });
    }
    return loadedScripts[src];
};


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
    // Using a CORS proxy to fetch content from other origins
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

    // Cleanup logic for the extracted text
    let cleanedText = article.textContent;

    // 1. Normalize whitespace and newlines
    cleanedText = cleanedText
        .replace(/\t/g, ' ') // Replace tabs with spaces
        .replace(/ +/g, ' ') // Collapse multiple spaces into one
        .replace(/\n{3,}/g, '\n\n'); // Collapse 3+ newlines into 2

    // 2. Filter out common boilerplate lines
    const lines = cleanedText.split('\n');
    const cleanedLines: string[] = [];
    const boilerplatePatterns = [
        'share this job', 'apply now', 'report this job', 'similar jobs',
        'privacy policy', 'terms of service', 'cookie settings', 'all rights reserved',
        'back to top', 'view all jobs', 'powered by', 'log in', 'sign up',
        /©\s*\d{4}/i, // Copyright symbol + year
        /^voltar$/, 
        /^compartilhar vaga$/
    ];

    const boilerplateRegex = new RegExp(boilerplatePatterns.map(p => typeof p === 'string' ? p.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') : p.source).join('|'), 'i');

    for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Skip empty lines, very short lines, or lines matching boilerplate patterns
        if (trimmedLine === '' || trimmedLine.length < 5 || boilerplateRegex.test(trimmedLine)) {
            continue;
        }

        cleanedLines.push(trimmedLine);
    }

    // 3. Reassemble the text and return
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

export const downloadComponentAsPdf = async (component: React.ReactElement, filename: string) => {
    await Promise.all([
        loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'),
        loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')
    ]);

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '1024px';
    // Inherit dark/light theme from the main document
    container.className = document.documentElement.className;

    document.body.appendChild(container);
    
    const root = ReactDOM.createRoot(container);
    root.render(component);

    await new Promise(resolve => setTimeout(resolve, 500));

    const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: (container.classList.contains('dark')) ? '#09090b' : '#ffffff',
    });

    root.unmount();
    document.body.removeChild(container);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jspdf.jsPDF({
        orientation: 'p',
        unit: 'px',
        format: 'a4',
        hotfixes: ['px_scaling'],
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const ratio = canvasWidth / pdfWidth;
    const imgHeight = canvasHeight / ratio;
    
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
    }

    pdf.save(filename);
};