import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-load Gemini client to prevent crash if key is missing on startup
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not defined. Please add it in the Secrets panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// REST API for LLM Extraction
app.post("/api/extract", async (req, res) => {
  try {
    const {
      text,
      mode = "zero_shot", // "zero_shot" | "few_shot"
      schemaFields = ["customer_name", "email", "phone", "product", "price", "date"],
      temperature = 0,
      customZeroShotPrompt,
      customFewShotPrompt,
      examples,
      forceSchema = false, // if true, uses responseSchema parameter of Gemini
    } = req.body; // handle potential variations

    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "Input text is required" });
    }

    const ai = getGeminiClient();

    // Prepare Schema description
    const schemaDesc = schemaFields.join(", ");

    // Build the Prompt
    let prompt = "";
    let systemInstruction = "You are a deterministic, high-accuracy data extraction machine. Your goal is to convert messy unstructured text into valid JSON with absolute fidelity without any summary, conversational fillers, preamble, or markdown code block markers. If a value is missing or cannot be inferred with certainty from the text, return null (never make up data).";

    if (mode === "zero_shot") {
      if (customZeroShotPrompt) {
        prompt = customZeroShotPrompt
          .replace("{TEXT}", text)
          .replace("{SCHEMA}", schemaDesc);
      } else {
        prompt = `Extract structured information from the following messy, unstructured text and convert it into a valid JSON object.

Extraction Guidelines:
1. Return a single JSON object.
2. The JSON object must strictly include the following fields: ${schemaDesc}.
3. If an input text does NOT contain information for a field, set its value to null.
4. Do NOT include any explanations, introductory remarks, markdown formatting (do not wrap in \`\`\`json), or trailing text. Return ONLY the JSON.

Use strict triple quotes (""") as delimiters to separate the instructions from the raw messy data below.

"""
${text}
"""`;
      }
    } else {
      // Few shot
      if (customFewShotPrompt) {
        prompt = customFewShotPrompt
          .replace("{TEXT}", text)
          .replace("{SCHEMA}", schemaDesc);
      } else {
        // Construct standard few-shot prompt with 2-3 examples
        const defaultExamples = [
          {
            input: "Hey team, this is Mark Vance (mark.v@vancetech.co, cell 555-123-4567). Just ordered the Pro Elite Hybrid Laptop. Charged me $1499.00 on May 12th.",
            output: JSON.stringify({
              customer_name: "Mark Vance",
              email: "mark.v@vancetech.co",
              phone: "555-123-4567",
              product: "Pro Elite Hybrid Laptop",
              price: "$1499.00",
              date: "May 12th"
            }, null, 2)
          },
          {
            input: "Customer support inquiry received: 'My name is Sarah Miller, purchased on 6/1/26. Item was the Silk Comfort Pillow for $59. No email address provided but you can ring my home phone on 415-987-6543.'",
            output: JSON.stringify({
              customer_name: "Sarah Miller",
              email: null,
              phone: "415-987-6543",
              product: "Silk Comfort Pillow",
              price: "$59",
              date: "6/1/26"
            }, null, 2)
          }
        ];

        const activeExamples = examples && examples.length > 0 ? examples : defaultExamples;
        
        let examplesText = "";
        activeExamples.forEach((ex: any, idx: number) => {
          examplesText += `Example ${idx + 1} Input:
"""
${ex.input}
"""
Example ${idx + 1} Output:
${ex.output}

`;
        });

        prompt = `Extract structured information from the following messy, unstructured text and convert it into a valid JSON object.

The JSON object must strictly include these fields: ${schemaDesc}.
If a field is missing, set its value to null.
Do NOT write explanations or use markdown formatting blocks. Just return the JSON object representing the extracted fields.

Here are high-quality examples demonstrating correct data extraction:

${examplesText}Now perform data extraction for the following input:

"""
${text}
"""`;
      }
    }

    const startTime = Date.now();

    // Prepare config
    const config: any = {
      temperature,
      systemInstruction,
    };

    // If forceSchema is active, we utilize Gemini's responseMimeType and responseSchema to guarantee output structure!
    if (forceSchema) {
      config.responseMimeType = "application/json";
      
      // Build properties for responseSchema based on fields
      const properties: any = {};
      schemaFields.forEach(field => {
        properties[field] = {
          type: Type.STRING,
          description: `The extracted value for ${field}, or null if not found.`,
          nullable: true,
        };
      });

      config.responseSchema = {
        type: Type.OBJECT,
        properties,
        required: schemaFields,
      };
    }

    // Call Gemini API
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config,
    });

    const endTime = Date.now();
    const duration = endTime - startTime;
    const rawResult = response.text || "";

    // Parse to verify JSON
    let parsedJSON = null;
    let isValidJSON = false;
    let cleanJSONText = rawResult.trim();

    // Clean markdown code blocks if the model ignored instructions
    if (cleanJSONText.startsWith("```")) {
      cleanJSONText = cleanJSONText.replace(/^```(json)?/, "").replace(/```$/, "").trim();
    }

    try {
      parsedJSON = JSON.parse(cleanJSONText);
      isValidJSON = true;
    } catch (parseErr) {
      console.warn("JSON parsing failed, returning raw string", parseErr);
    }

    res.json({
      success: true,
      mode,
      durationMs: duration,
      rawOutput: rawResult,
      cleanOutput: cleanJSONText,
      parsedJSON,
      isValidJSON,
      promptSent: prompt,
      temperature,
    });
  } catch (error: any) {
    console.error("Extraction endpoint error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "An unexpected error occurred during extraction",
    });
  }
});

// Configure Vite or Static files depending on environment
async function startServer() {
  const isProduction = process.env.NODE_ENV === "production" || process.env.RENDER === "true";

  if (!isProduction) {
    // Development Mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server running at http://0.0.0.0:${PORT} [ENV: ${process.env.NODE_ENV || "development"}]`);
  });
}

startServer();
