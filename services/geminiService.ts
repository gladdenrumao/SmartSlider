
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult } from "../types";

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    technicalCorrectness: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          issue: { type: Type.STRING },
          explanation: { type: Type.STRING },
          slideNumber: { type: Type.STRING, description: "e.g., 'Slide 5' or 'General'" },
        },
        required: ["issue", "explanation"],
      },
    },
    areasForImprovement: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          suggestion: { type: Type.STRING },
          details: { type: Type.STRING },
        },
        required: ["suggestion", "details"],
      },
    },
    strengths: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          point: { type: Type.STRING },
          details: { type: Type.STRING },
        },
        required: ["point", "details"],
      },
    },
  },
  required: ["technicalCorrectness", "areasForImprovement", "strengths"],
};

export const analyzePresentation = async (base64Data: string, mimeType: string, courseName: string): Promise<AnalysisResult> => {
  // Support both local dev (VITE_API_KEY) and production (API_KEY)
  const apiKey = (import.meta as any).env?.VITE_API_KEY || process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("API Key is missing. Please set VITE_API_KEY in .env");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Use provided course name or default to a general technical context
  const subjectContext = courseName && courseName.trim() ? courseName : "General Technical Topic";

  const prompt = `
    You are an expert technical course reviewer and educator specializing in **${subjectContext}**.
    Analyze the attached presentation document which is a slide deck for the course "${subjectContext}".
    
    Note: If the document appears to be a plain text PDF, it may have been auto-converted from a slide deck (PPTX). Treat each page or section as a slide.
    
    Your Goal:
    1. **Find Errors (Technical Correctness)**: 
       - Identify factual mistakes, logical flaws, or technical errors in the text specifically related to **${subjectContext}**. 
       - Ignore minor typos unless they affect meaning.
       - If no major errors are found, return an empty list or a single "No critical errors found" item.

    2. **Enhance Quality (Areas for Improvement)**: 
       - **CRITICAL**: Suggest ONLY enhancements related to the SPECIFIC topics covered in the slides. Do NOT suggest advanced topics that are completely out of scope for the current lecture level.
       - **Context**: Ensure all suggestions are pedagogical and suitable for a course on **${subjectContext}**.
       - **Actionable & Concise**: Provide specific, actionable advice (e.g., "Add a flowchart for the process on Slide 4", "Clarify the definition of X with a real-world example", "Break down the dense text on Slide 10").
       - **Quantity**: Provide **5 to 8** distinct, high-quality suggestions. This should be the most detailed section.

    3. **Know Your Strengths**: 
       - Highlight what is done well (pedagogy, topic coverage, clarity) in the context of teaching **${subjectContext}**.
       - Keep this section positive but honest.

    Constraints:
    - Focus ONLY on the textual content and logical flow.
    - Do NOT critique the visual design (colors, fonts, layout) unless it severely impedes understanding (or if using a native PDF upload).
    - Output strictly in JSON format matching the schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.2,
      },
    });

    let text = response.text;
    if (!text) {
      throw new Error("No response received from AI.");
    }
    
    // Strip Markdown code blocks if present (Gemini sometimes adds them despite MIME type)
    text = text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');

    const result = JSON.parse(text) as AnalysisResult;
    return result;

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // Propagate a user-friendly error message if possible
    if (error.message && error.message.includes('400')) {
        throw new Error("The file format or content is not supported. Please try a different PDF.");
    }
    throw error;
  }
};
