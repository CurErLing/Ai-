export enum QuestionType {
  MULTIPLE_CHOICE = 'Single Choice',
  TRUE_FALSE = 'True/False',
  SHORT_ANSWER = 'Short Answer',
  ESSAY = 'Essay'
}

export interface Question {
  id: number;
  type: QuestionType;
  content: string;
  diagramSvg?: string; // Optional field for geometry diagrams (SVG code)
  options?: string[]; // For Multiple Choice
  answer: string;
  explanation: string;
  score: number;
}

export interface ExamSection {
  title: string;
  description?: string;
  questions: Question[];
}

export interface ExamData {
  id?: string; // Unique ID for management
  createdAt?: number; // Timestamp
  title: string;
  subject: string;
  totalScore: number;
  durationMinutes: number;
  sections: ExamSection[];
}

export interface UploadedFile {
  id: string;
  name: string;
  type: 'text' | 'image' | 'pdf';
  content: string; // Text content or Base64 string for images/pdfs
  mimeType: string;
}

export interface GenerationConfig {
  // Simplified config - we rely on the model to infer structure from the file
  includeAnswers: boolean; 
}