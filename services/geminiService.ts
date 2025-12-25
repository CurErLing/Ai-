import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ExamData, GenerationConfig, UploadedFile, QuestionType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const EXAM_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "The title of the exam paper" },
    subject: { type: Type.STRING, description: "The subject of the exam" },
    totalScore: { type: Type.NUMBER, description: "Total score for the exam" },
    durationMinutes: { type: Type.NUMBER, description: "Recommended duration in minutes" },
    sections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Section title (e.g., 'Part I: Multiple Choice')" },
          description: { type: Type.STRING, description: "Instructions for this section" },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.INTEGER },
                type: { type: Type.STRING, enum: Object.values(QuestionType) },
                content: { type: Type.STRING, description: "The question text. Use LaTeX for math." },
                diagramSvg: { type: Type.STRING, description: "Optional. A complete SVG string (<svg>...</svg>) for geometry diagrams. Use black strokes, white/transparent fill, suitable for exam printing." },
                options: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                  description: "Options for multiple choice questions. Empty for others."
                },
                answer: { type: Type.STRING, description: "The correct answer" },
                explanation: { type: Type.STRING, description: "Detailed explanation of the answer" },
                score: { type: Type.NUMBER, description: "Points for this question" }
              },
              required: ["id", "type", "content", "answer", "score", "explanation"]
            }
          }
        },
        required: ["title", "questions"]
      }
    }
  },
  required: ["title", "subject", "sections", "totalScore"]
};

export const generateExamPaper = async (
  files: UploadedFile[],
  config: GenerationConfig
): Promise<ExamData> => {
  
  // Using gemini-3-pro-preview for complex tasks (math, exam generation)
  const modelId = "gemini-3-pro-preview"; 

  // 1. Prepare Content Parts
  const contentParts: any[] = [];
  
  // System Instruction Part
  const promptText = `
    Role: You are an expert educational assessment creator.
    Task: Create a NEW exam paper that mirrors the uploaded reference material.
    
    Instructions:
    1. Analyze the uploaded reference materials (PDF, images, or text) deeply. 
    2. Identify the **subject**, **difficulty level**, **question types**, **structure** (sections), and **approximate length** of the original exam.
    3. Generate a COMPLETELY NEW exam that follows the SAME structure and style as the reference.
       - If the reference has 10 multiple choice and 2 essay questions, the new exam should have roughly the same.
       - If the reference is about Calculus, the new exam must be about Calculus at the same difficulty.
    4. Do NOT copy questions. Create novel questions that test the same concepts.
    5. **IMPORTANT: Mathematical Formatting**:
       - YOU MUST use LaTeX formatting for ALL mathematical expressions, formulas, variables (e.g. $x$, $y$), and numbers with units (e.g. $30^\\circ$, $5 \\text{ cm}$).
       - ENCLOSE ALL LATEX IN SINGLE DOLLAR SIGNS ONLY ($...$). DO NOT use double dollar signs ($$...$$) or brackets (\[...\]).
       - Examples: 
         - Correct: $x^2 + y^2 = 10$, $\\frac{1}{2}$, $\\sqrt{x+1}$, $30^\\circ$, $f(x)$
         - Incorrect: x^2, 1/2, sqrt(x), 30 degrees, $$x^2$$
    6. **Geometry Diagrams (SVG)**:
       - If a question involves geometry (e.g., triangles, circles, coordinate systems) and usually requires a diagram, you MUST generate a standard SVG XML string in the 'diagramSvg' field.
       - The SVG should be simple, using black lines (stroke="black", stroke-width="1.5") and white or transparent fill.
       - Ensure the SVG has a valid 'viewBox' and appropriate dimensions (e.g., width="200px").
       - Label points (A, B, C) clearly in the SVG using <text> elements.
    7. Ensure the language matches the reference material (likely Chinese).
    8. Output the result strictly in the defined JSON schema.
  `;

  contentParts.push({ text: promptText });

  // Add User Uploads
  files.forEach(file => {
    if (file.type === 'image' || file.type === 'pdf') {
      // Remove data url prefix for API (works for both image/png and application/pdf)
      const base64Data = file.content.split(',')[1]; 
      contentParts.push({
        inlineData: {
          mimeType: file.mimeType,
          data: base64Data
        }
      });
    } else {
      contentParts.push({
        text: `Reference Document (${file.name}):\n${file.content}`
      });
    }
  });

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts: contentParts },
      config: {
        responseMimeType: "application/json",
        responseSchema: EXAM_SCHEMA,
        temperature: 0.5,
      }
    });

    const responseText = response.text;
    if (!responseText) throw new Error("No response generated");

    return JSON.parse(responseText) as ExamData;

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};