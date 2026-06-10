export interface ProjectFile {
  path: string;
  name: string;
  type: "file" | "directory";
  content?: string;
  language?: string;
  children?: ProjectFile[];
}

export interface SampleInput {
  id: string;
  title: string;
  rawText: string;
  description: string;
  expectedOutput: {
    customer_name: string | null;
    email: string | null;
    phone: string | null;
    product: string | null;
    price: string | null;
    date: string | null;
  };
}

export interface FewShotExample {
  id: string;
  input: string;
  output: string;
}

export interface PresentationSlide {
  id: number;
  title: string;
  subtitle?: string;
  bullets?: string[];
  codeBlock?: string;
  codeLanguage?: string;
  tableData?: {
    headers: string[];
    rows: string[][];
  };
  visualType?: "title" | "grid" | "split" | "table" | "conclusion";
}

export interface ReportSection {
  id: string;
  title: string;
  content: string; // Markdown or rich text
}

export interface ExtractionResult {
  success: boolean;
  mode: "zero_shot" | "few_shot";
  durationMs: number;
  rawOutput: string;
  cleanOutput: string;
  parsedJSON: any;
  isValidJSON: boolean;
  promptSent: string;
  temperature: number;
}
