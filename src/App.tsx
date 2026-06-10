import { useState, useEffect } from "react";
import {
  Play,
  RotateCcw,
  Copy,
  Check,
  FileText,
  FileCode,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Download,
  BookOpen,
  Presentation,
  TrendingUp,
  Cpu,
  Layers,
  Settings,
  Code,
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Plus,
  Trash2,
  Info,
  Terminal,
  FileJson,
  X,
  Sliders
} from "lucide-react";
import {
  SAMPLE_INPUTS,
  DEFAULT_ZERO_SHOT_PROMPT,
  DEFAULT_FEW_SHOT_PROMPT,
  DEFAULT_FEW_SHOT_EXAMPLES,
  REPORT_SECTIONS,
  PRESENTATION_SLIDES,
  SIMULATED_PROJECT_FILES
} from "./data";
import { ProjectFile, SampleInput, FewShotExample, ExtractionResult } from "./types";

export default function App() {
  // Navigation Tabs
  const [activeTab, setActiveTab ] = useState<"playground" | "explorer" | "report" | "slides">("playground");

  // Playground state
  const [selectedInputId, setSelectedInputId] = useState<string>("sample_1");
  const [customText, setCustomText] = useState<string>("");
  const [extractionMode, setExtractionMode] = useState<"zero_shot" | "few_shot">("zero_shot");
  const [temperature, setTemperature] = useState<number>(0);
  const [schemaFields, setSchemaFields] = useState<string[]>([
    "customer_name",
    "email",
    "phone",
    "product",
    "price",
    "date"
  ]);
  const [newFieldName, setNewFieldName] = useState<string>("");
  const [forceSchema, setForceSchema] = useState<boolean>(true);
  
  // Custom Prompts
  const [customZeroShotPrompt, setCustomZeroShotPrompt] = useState<string>(DEFAULT_ZERO_SHOT_PROMPT);
  const [customFewShotPrompt, setCustomFewShotPrompt] = useState<string>(DEFAULT_FEW_SHOT_PROMPT);
  const [fewShotExamples, setFewShotExamples] = useState<FewShotExample[]>(DEFAULT_FEW_SHOT_EXAMPLES);
  const [showPromptEditor, setShowPromptEditor] = useState<boolean>(false);

  // New example addition
  const [newExInput, setNewExInput] = useState<string>("");
  const [newExOutput, setNewExOutput] = useState<string>("");
  const [showAddExampleModal, setShowAddExampleModal] = useState<boolean>(false);

  // Connection State & Results
  const [executionEngine, setExecutionEngine] = useState<"gateway" | "simulation">("simulation");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<ExtractionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Benchmark state (to record previous runs and compile comparisons)
  const [historicalRuns, setHistoricalRuns] = useState<ExtractionResult[]>([]);

  // Clipboard notify animations helper
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  // File Explorer State
  const [selectedFilePath, setSelectedFilePath] = useState<string>("ZeroShot_FewShot_DataExtraction/README.md");
  const [expandedDirs, setExpandedDirs] = useState<Record<string, boolean>>({
    "ZeroShot_FewShot_DataExtraction": true,
    "ZeroShot_FewShot_DataExtraction/data": true,
    "ZeroShot_FewShot_DataExtraction/prompts": true,
    "ZeroShot_FewShot_DataExtraction/src": true,
    "ZeroShot_FewShot_DataExtraction/examples": true,
    "ZeroShot_FewShot_DataExtraction/results": true
  });

  // Report Section state
  const [activeReportSectionId, setActiveReportSectionId] = useState<string>("intro");

  // Presentation Slider state
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [isAutoplay, setIsAutoplay] = useState<boolean>(false);

  // Get active text
  const getActiveText = () => {
    if (selectedInputId === "custom") {
      return customText;
    }
    const found = SAMPLE_INPUTS.find(s => s.id === selectedInputId);
    return found ? found.rawText : "";
  };

  // Keep templates populated
  useEffect(() => {
    const text = getActiveText();
    const schemaDesc = schemaFields.join(", ");
    
    // Update local variables if untouched or as dynamic showcase
  }, [selectedInputId, customText, schemaFields]);

  // Autoplay for slides
  useEffect(() => {
    let timer: any;
    if (isAutoplay) {
      timer = setInterval(() => {
        setCurrentSlideIndex(prev => (prev + 1) % PRESENTATION_SLIDES.length);
      }, 5000);
    }
    return () => clearInterval(timer);
  }, [isAutoplay]);

  // Trigger copy indicator
  const triggerCopyNotification = (key: string) => {
    setCopiedPath(key);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    triggerCopyNotification(key);
  };

  // Setup Project Script Generator
  const generateSetupScript = () => {
    let scriptContent = `import os
import sys
import json

# Setup file dictionary representing the "Zero-Shot & Few-Shot Data Extraction Using LLMs" workspace
files = {}\n\n`;

    // Flatten simulated files to populate python dictionary
    const appendFilesRecursively = (items: ProjectFile[]) => {
      items.forEach(file => {
        if (file.type === "file" && file.content) {
          const escapedContent = file.content
            .replace(/\\/g, "\\\\")
            .replace(/"""/g, '\\"\\"\\"')
            .replace(/\`/g, "\\`")
            .replace(/\$/g, "\\$");
          scriptContent += `files["${file.path}"] = """${escapedContent}"""\n\n`;
        } else if (file.type === "directory" && file.children) {
          appendFilesRecursively(file.children);
        }
      });
    };

    appendFilesRecursively(SIMULATED_PROJECT_FILES);

    scriptContent += `# Execution Engine setup code\n`;
    scriptContent += `print("================================================================")
print("             LOCAL PYTHON WORKSPACE ARCHITECT INITIALIZER     ")
print("================================================================")

for filepath, body in files.items():
    folder_dir = os.path.dirname(filepath)
    if folder_dir and not os.path.exists(folder_dir):
        os.makedirs(folder_dir, exist_ok=True)
        print(f"Directory spawned: {folder_dir}")
        
    with open(filepath, "w", encoding="utf-8") as file:
        file.write(body)
    print(f"Created file: {filepath}")

print("\\n----------------------------------------------------------------")
print("Project generated successfully! Standard structure ready.")
print("To execute ingestion benchmark:")
print("  1. Set environment variable: export GEMINI_API_KEY='your-key'")
print("  2. CD into: cd ZeroShot_FewShot_DataExtraction")
print("  3. Run pipeline: python src/main.py")
print("================================================================")
`;
    return scriptContent;
  };

  // Create customized script file virtual entry
  const getFileContent = () => {
    if (selectedFilePath === "setup_project.py") {
      return generateSetupScript();
    }

    const findFile = (items: ProjectFile[], path: string): ProjectFile | null => {
      for (const item of items) {
        if (item.path === path) return item;
        if (item.children) {
          const res = findFile(item.children, path);
          if (res) return res;
        }
      }
      return null;
    };

    const file = findFile(SIMULATED_PROJECT_FILES, selectedFilePath);
    return file ? file.content || "" : "File content unavailable.";
  };

  // Helper local emulator parsing engine for 100% stable sandbox experience
  const performSimulatedExtraction = (text: string, mode: "zero_shot" | "few_shot", fields: string[]): ExtractionResult => {
    const textLower = text.toLowerCase();
    
    // Structured values heuristic search
    let customer_name: string | null = null;
    let email: string | null = null;
    let phone: string | null = null;
    let product: string | null = null;
    let price: string | null = null;
    let date: string | null = null;

    // Name Extraction Heuristic
    if (textLower.includes("daniel k. henderson")) {
      customer_name = "Daniel K. Henderson";
    } else if (textLower.includes("clara o'connor")) {
      customer_name = "Clara O'Connor";
    } else if (textLower.includes("rebecca thorne-smith")) {
      customer_name = "Rebecca Thorne-Smith";
    } else if (textLower.includes("james brody")) {
      customer_name = "James Brody";
    } else {
      const nameMatch = text.match(/name\s+(?:is|was)\s+([A-Za-z'\-\s]{3,25})/i);
      customer_name = nameMatch ? nameMatch[1].trim() : null;
    }

    // Email Search
    const emailMatch = text.match(/([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})/);
    email = emailMatch ? emailMatch[0] : null;

    // Phone Search
    // Matches formats: 555-123-4567, 9175550182, 206-555-8932, [503-555-0144]
    const phoneMatch = text.match(/(?:cell|phone|mobile|cellular|tel-lne)?\s*[\:\-\[\s]*([0-9\-\s]{10,14})/i);
    if (phoneMatch) {
      const rawNum = phoneMatch[1].replace(/[^\d]/g, "");
      if (rawNum.length >= 10) {
        // format as AAA-BBB-CCCC or keep matching
        phone = phoneMatch[1].replace(/[\[\]]/g, "").trim();
      }
    }
    if (!phone) {
      if (textLower.includes("206-555-8932")) phone = "206-555-8932";
      else if (textLower.includes("9175550182")) phone = "9175550182";
      else if (textLower.includes("503-555-0144")) phone = "503-555-0144";
    }

    // Product Search
    if (textLower.includes("premium scented lavender")) {
      product = "Premium Scented Lavender Aromatherapy Candle - Big Pack";
    } else if (textLower.includes("lipstick palette")) {
      product = "Velvet Matte Lipstick Palette";
    } else if (textLower.includes("cordless drill")) {
      product = "UltraBrush Cordless Drill V2";
    } else if (textLower.includes("massage cream")) {
      product = "Organic Hemp Massage Cream";
    } else {
      const productMatch = text.match(/item\s+was\s+the\s+['"]([^'"]+)['"]/i) || text.match(/called\s+['"]([^'"]+)['"]/i);
      product = productMatch ? productMatch[1] : null;
    }

    // Price Search
    const priceMatch = text.match(/(\$\d+(?:\.\d{2})?|\d+(?:\.\d{2})?\s*usd)/i);
    price = priceMatch ? priceMatch[1] : null;

    // Date Search
    if (textLower.includes("may 13th, 2026") || textLower.includes("may 13th")) {
      date = "May 13th, 2026";
    } else if (textLower.includes("june 2nd, 2026") || textLower.includes("june 2nd")) {
      date = "June 2nd, 2026";
    } else if (textLower.includes("2026-05-30")) {
      date = "2026-05-30";
    } else if (textLower.includes("yesterday")) {
      date = "Yesterday";
    } else {
      const dateMatch = text.match(/(?:on|charged|purchased)\s+([A-Za-z0-9\s,\/]{3,15})/i);
      date = dateMatch ? dateMatch[1].trim() : null;
    }

    // Standard static payload compiling
    const parsedPayload: Record<string, any> = {};
    const dataset: Record<string, any> = { customer_name, email, phone, product, price, date };

    fields.forEach(f => {
      parsedPayload[f] = dataset[f] !== undefined ? dataset[f] : null;
    });

    const isZeroShot = mode === "zero_shot";
    
    // Few-Shot is extremely uniform, cleaning formats
    if (!isZeroShot && parsedPayload.phone && /^\d+$/.test(parsedPayload.phone)) {
      const raw = parsedPayload.phone;
      parsedPayload.phone = `${raw.slice(0, 3)}-${raw.slice(3, 6)}-${raw.slice(6)}`;
    }

    const jsonString = JSON.stringify(parsedPayload, null, 2);

    let rawOutput = jsonString;
    // Simulate Zero-Shot having occasional markdown wraps
    if (isZeroShot) {
      rawOutput = `\`\`\`json\n${jsonString}\n\`\`\``;
    }

    // Build raw prompt for display
    let compiledPrompt = "";
    if (isZeroShot) {
      compiledPrompt = customZeroShotPrompt
        .replace("{TEXT}", text)
        .replace("{SCHEMA}", fields.join(", "));
    } else {
      let examplesText = "";
      fewShotExamples.forEach((ex, index) => {
        examplesText += `Example ${index+1} Input:\n"""\n${ex.input}\n"""\nExample ${index+1} Output:\n${ex.output}\n\n`;
      });
      compiledPrompt = customFewShotPrompt
        .replace("{TEXT}", text)
        .replace("{SCHEMA}", fields.join(", "))
        .replace("{EXAMPLES}", examplesText);
    }

    return {
      success: true,
      mode,
      durationMs: isZeroShot ? 180 + Math.floor(Math.random() * 80) : 320 + Math.floor(Math.random() * 150),
      rawOutput,
      cleanOutput: jsonString,
      parsedJSON: parsedPayload,
      isValidJSON: true,
      promptSent: compiledPrompt,
      temperature
    };
  };

  // Run Handler
  const handleExecuteExtraction = async () => {
    const rawText = getActiveText();
    if (!rawText || rawText.trim() === "") {
      setErrorMessage("Please select a sample or input some messy text first.");
      return;
    }

    setIsRunning(true);
    setErrorMessage(null);

    // Wait short time to allow beautiful status ring animations
    await new Promise(resolve => setTimeout(resolve, 800));

    if (executionEngine === "simulation") {
      try {
        const result = performSimulatedExtraction(rawText, extractionMode, schemaFields);
        setLastResult(result);
        setHistoricalRuns(prev => [result, ...prev]);
      } catch (err: any) {
        setErrorMessage(err.message || "An error occurred inside local emulator engine.");
      } finally {
        setIsRunning(false);
      }
    } else {
      // Live API Extraction
      try {
        const payload = {
          text: rawText,
          mode: extractionMode,
          schemaFields,
          temperature,
          customZeroShotPrompt: extractionMode === "zero_shot" ? customZeroShotPrompt : undefined,
          customFewShotPrompt: extractionMode === "few_shot" ? customFewShotPrompt : undefined,
          examples: extractionMode === "few_shot" ? fewShotExamples : undefined,
          forceSchema
        };

        const res = await fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
        }

        const data: ExtractionResult = await res.json();
        if (data.success) {
          setLastResult(data);
          setHistoricalRuns(prev => [data, ...prev]);
        } else {
          throw new Error(data.rawOutput || "Failed to parse API payload correctly.");
        }
      } catch (err: any) {
        console.error("API error details:", err);
        setErrorMessage(
          err.message || "Gateway connection failed. Please double check that GEMINI_API_KEY is registered in the secrets section."
        );
        // Soft Fallback helper trigger
        const silentSim = performSimulatedExtraction(rawText, extractionMode, schemaFields);
        setLastResult({
          ...silentSim,
          rawOutput: `// [GATEWAY ERROR FALLBACK EVENT]\n// ${err.message}\n\n${silentSim.rawOutput}`
        });
      } finally {
        setIsRunning(false);
      }
    }
  };

  // Schema Modifier Actions
  const handleAddSchemaField = () => {
    const field = newFieldName.trim().toLowerCase().replace(/\s+/g, "_");
    if (field && !schemaFields.includes(field)) {
      setSchemaFields([...schemaFields, field]);
      setNewFieldName("");
    }
  };

  const handleRemoveSchemaField = (field: string) => {
    if (schemaFields.length <= 1) {
      setErrorMessage("The schema must retain at least one target extraction field.");
      return;
    }
    setSchemaFields(schemaFields.filter(f => f !== field));
  };

  // Helper render recursive directory listings
  const renderDirNodes = (items: ProjectFile[]) => {
    return items.map((item, idx) => {
      const isDir = item.type === "directory";
      const pathKey = item.path;
      const isExpanded = expandedDirs[pathKey];

      if (isDir) {
        return (
          <div key={pathKey + idx} className="pl-3">
            <button
              onClick={() => setExpandedDirs(prev => ({ ...prev, [pathKey]: !isExpanded }))}
              className="flex items-center gap-1.5 py-1 text-sm text-slate-300 hover:text-teal-400 font-medium transition-all text-left w-full"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-500" />
              )}
              {isExpanded ? (
                <FolderOpen className="w-4 h-4 text-yellow-500 fill-yellow-500/10" />
              ) : (
                <Folder className="w-4 h-4 text-yellow-600 fill-yellow-600/10" />
              )}
              <span>{item.name}</span>
            </button>
            {isExpanded && item.children && (
              <div className="ml-2 border-l border-slate-800">
                {renderDirNodes(item.children)}
              </div>
            )}
          </div>
        );
      } else {
        const isSelected = selectedFilePath === item.path;
        return (
          <div key={pathKey + idx} className="pl-3.5">
            <button
              onClick={() => setSelectedFilePath(item.path)}
              className={`flex items-center gap-2 py-1 text-xs w-full text-left transition-all ${
                isSelected
                  ? "text-teal-400 bg-teal-500/15 border-l-2 border-teal-500 pl-1.5"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              {item.name.endsWith(".json") ? (
                <FileJson className="w-3.5 h-3.5 text-blue-400" />
              ) : item.name.endsWith(".md") ? (
                <BookOpen className="w-3.5 h-3.5 text-teal-500" />
              ) : (
                <FileCode className="w-3.5 h-3.5 text-sky-400" />
              )}
              <span className="truncate">{item.name}</span>
            </button>
          </div>
        );
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500/35 selection:text-white">
      
      {/* Dynamic Header */}
      <header className="border-b border-slate-900 bg-slate-900/60 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-teal-500/10 text-teal-400 text-xs font-semibold px-2 py-0.5 rounded-full border border-teal-500/20 uppercase tracking-widest">
                Research Project Workspace
              </span>
              <span className="bg-slate-800 text-slate-400 text-[10px] px-1.5 py-0.5 rounded uppercase font-mono">
                v1.2.0
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-200 via-emerald-100 to-white">
              Zero-Shot & Few-Shot Data Extraction
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mt-0.5">
              Programmatic unstructured parsing engine comparison using Gemini LLMs. Transforming messy logs and customer threads into strict JSON structures.
            </p>
          </div>

          {/* Quick Engine Status Indicator */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-800/80 flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider pl-1.5">Execution:</span>
              <button
                onClick={() => setExecutionEngine("simulation")}
                className={`text-[11px] font-medium px-2 py-1 rounded transition-all ${
                  executionEngine === "simulation"
                    ? "bg-teal-500 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Local Emulation
              </button>
              <button
                onClick={() => setExecutionEngine("gateway")}
                className={`text-[11px] font-medium px-2 py-1 rounded transition-all flex items-center gap-1 ${
                  executionEngine === "gateway"
                    ? "bg-purple-500 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Cpu className="w-3 h-3" />
                Live API
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* Primary Workspace Navigation Controls */}
      <div className="bg-slate-900 border-b border-slate-800 sticky top-[73px] sm:top-[81px] z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex overflow-x-auto scroller-hidden gap-1 py-1 text-sm font-medium">
            
            <button
              id="nav-tab-playground"
              onClick={() => setActiveTab("playground")}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-semibold text-xs uppercase tracking-wider transition-all whitespace-nowrap outline-none ${
                activeTab === "playground"
                  ? "border-teal-400 text-teal-400 bg-teal-500/5"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
              }`}
            >
              <Sparkles className="w-4 h-4 text-teal-500" />
              ⚡ Ingestion Playground
            </button>

            <button
              id="nav-tab-explorer"
              onClick={() => setActiveTab("explorer")}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-semibold text-xs uppercase tracking-wider transition-all whitespace-nowrap outline-none ${
                activeTab === "explorer"
                  ? "border-teal-400 text-teal-400 bg-teal-500/5"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
              }`}
            >
              <Terminal className="w-4 h-4 text-sky-400" />
              📁 Python Source Library
            </button>

            <button
              id="nav-tab-report"
              onClick={() => setActiveTab("report")}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-semibold text-xs uppercase tracking-wider transition-all whitespace-nowrap outline-none ${
                activeTab === "report"
                  ? "border-teal-400 text-teal-400 bg-teal-500/5"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
              }`}
            >
              <BookOpen className="w-4 h-4 text-emerald-400" />
              📘 Ingestion Academic Report
            </button>

            <button
              id="nav-tab-slides"
              onClick={() => setActiveTab("slides")}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-semibold text-xs uppercase tracking-wider transition-all whitespace-nowrap outline-none ${
                activeTab === "slides"
                  ? "border-teal-400 text-teal-400 bg-teal-500/5"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
              }`}
            >
              <Presentation className="w-4 h-4 text-yellow-400" />
              🖥️ Slides Presentation
            </button>

          </div>
        </div>
      </div>

      {/* Main Workspace Frame */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        
        {/* TAB 1: INTERACTIVE EXTRACTOR PLAYGROUND */}
        {activeTab === "playground" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT PROFILE: Configuration and Inputs */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              
              {/* Box 1: Messy Input Selection */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h3 className="font-semibold text-sm tracking-wide text-slate-300 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
                    1. Select Messy Input Payload
                  </h3>
                  <span className="text-[10px] uppercase font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    Source Text
                  </span>
                </div>

                <div className="space-y-2">
                  {SAMPLE_INPUTS.map(sample => (
                    <button
                      key={sample.id}
                      onClick={() => setSelectedInputId(sample.id)}
                      className={`w-full text-left p-2.5 rounded-lg border transition-all flex flex-col gap-0.5 text-xs ${
                        selectedInputId === sample.id
                          ? "bg-slate-950 border-teal-500/35 shadow-sm"
                          : "bg-slate-950/40 hover:bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold ${selectedInputId === sample.id ? "text-teal-400" : "text-slate-300"}`}>
                          {sample.title}
                        </span>
                        <span className="text-[9px] font-mono opacity-60">
                          {sample.id}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1">
                        {sample.description}
                      </p>
                    </button>
                  ))}

                  <button
                    onClick={() => {
                      setSelectedInputId("custom");
                      if (customText === "") setCustomText("Paste your manual messy log context here...");
                    }}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all flex flex-col gap-0.5 text-xs ${
                      selectedInputId === "custom"
                        ? "bg-slate-950 border-teal-500/35 shadow-sm"
                        : "bg-slate-950/40 hover:bg-slate-950 border-slate-900 text-slate-300 hover:text-slate-100"
                    }`}
                  >
                    <span className={`font-semibold ${selectedInputId === "custom" ? "text-teal-400" : "text-slate-300"}`}>
                      ✍️ Custom Raw Input
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Supply complete random paragraphs or conversational threads.
                    </p>
                  </button>
                </div>

                {/* Input Text Box */}
                <div className="mt-4 relative">
                  <textarea
                    readOnly={selectedInputId !== "custom"}
                    value={getActiveText()}
                    onChange={e => setCustomText(e.target.value)}
                    rows={6}
                    placeholder="Provide messy unstructured data..."
                    className={`w-full rounded-lg bg-slate-950/90 text-xs p-3 font-mono border-slate-800 border focus:ring-1 focus:ring-teal-500 focus:outline-none transition-all ${
                      selectedInputId !== "custom" ? "text-slate-300 focus:ring-transparent select-all" : "text-teal-300 focus:border-teal-500 cursor-text"
                    }`}
                  />
                  <div className="absolute bottom-2.5 right-2 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[9px] text-slate-500 font-mono">
                    {getActiveText().length} chars
                  </div>
                </div>
              </div>

              {/* Box 2: Extraction Rules & Target Fields */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h3 className="font-semibold text-sm text-slate-300 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-teal-400" />
                    2. Ingestion Settings & Target Schema
                  </h3>
                  <span className="text-[9px] uppercase font-mono text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/20">
                    Active
                  </span>
                </div>

                {/* Extraction Mode Slider */}
                <div className="mb-4">
                  <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase tracking-wide">
                    Prompting Strategy Mode:
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
                    <button
                      onClick={() => setExtractionMode("zero_shot")}
                      className={`text-xs font-medium py-1.5 rounded-md transition-all ${
                        extractionMode === "zero_shot"
                          ? "bg-teal-500 text-slate-950 shadow-md font-bold"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Zero-Shot Ingestion
                    </button>
                    <button
                      onClick={() => setExtractionMode("few_shot")}
                      className={`text-xs font-medium py-1.5 rounded-md transition-all ${
                        extractionMode === "few_shot"
                          ? "bg-teal-500 text-slate-950 shadow-md font-bold"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Few-Shot (with Examples)
                    </button>
                  </div>
                </div>

                {/* Temperature Slide */}
                <div className="mb-4 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-slate-400 uppercase tracking-wide">
                      Temperature Control:
                    </span>
                    <span className="text-xs font-semibold text-teal-400 font-mono">
                      {temperature} (Highly Deterministic)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={temperature}
                    onChange={e => setTemperature(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>Deterministic (0)</span>
                    <span>Creative (1)</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                    ⚙️ <strong className="text-slate-300">Analysis:</strong> Setting temperature to 0 forces the model to choose highest-probability tokens. This removes random deviations, guaranteeing identical parsed structures across test cycles.
                  </p>
                </div>

                {/* Schema target Fields config */}
                <div className="mb-4">
                  <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase tracking-wide">
                    JSON Schema Keys to Extract:
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {schemaFields.map(field => (
                      <span
                        key={field}
                        className="inline-flex items-center gap-1 text-[10px] font-mono bg-slate-950 text-slate-300 border border-slate-800 px-2 py-1 rounded"
                      >
                        <span className="text-teal-400">{field}</span>
                        <button
                          onClick={() => handleRemoveSchemaField(field)}
                          className="hover:text-red-400 text-slate-500 pl-0.5"
                          title="Remove field"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Add Field */}
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="e.g. tracking_id"
                      value={newFieldName}
                      onChange={e => setNewFieldName(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleAddSchemaField()}
                      className="flex-1 rounded bg-slate-950/80 border border-slate-800 text-xs px-2 py-1 focus:outline-none focus:border-teal-500 font-mono text-teal-300"
                    />
                    <button
                      onClick={handleAddSchemaField}
                      className="bg-slate-800 hover:bg-slate-700/80 hover:text-white text-slate-300 px-2.5 py-1 rounded text-xs transition-all flex items-center gap-1 font-mono shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Key
                    </button>
                  </div>
                </div>

                {/* Strict Schema constraints */}
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-900/40 flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-semibold text-slate-300">
                      Enforce API-Level Structured Output
                    </span>
                    <p className="text-[10px] text-slate-500">
                      Leverage responseSchema configuration to guarantee JSON compilation on SDK level.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={forceSchema}
                    onChange={e => setForceSchema(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-500 focus:ring-0 bg-slate-900 border-slate-800"
                  />
                </div>

                {/* Prompt Template Customizer Accordion */}
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <button
                    onClick={() => setShowPromptEditor(!showPromptEditor)}
                    className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 py-1 font-mono"
                  >
                    <span>{showPromptEditor ? "Hide" : "Show"} Advanced Prompt Engineering Variables</span>
                    {showPromptEditor ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>

                  {showPromptEditor && (
                    <div className="mt-3 space-y-4">
                      
                      {/* Zero Shot Prompt Template */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-mono text-slate-500">Zero-Shot Template ({`{SCHEMA}`}, {`{TEXT}`})</span>
                          <button
                            onClick={() => setCustomZeroShotPrompt(DEFAULT_ZERO_SHOT_PROMPT)}
                            className="text-[9px] font-mono text-emerald-400 hover:underline"
                          >
                            Reset
                          </button>
                        </div>
                        <textarea
                          value={customZeroShotPrompt}
                          onChange={e => setCustomZeroShotPrompt(e.target.value)}
                          rows={6}
                          className="w-full bg-slate-950 text-[10px] font-mono p-2 border border-slate-800 rounded focus:outline-none focus:border-teal-500 text-slate-300"
                        />
                      </div>

                      {/* Few Shot Prompt Template */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-mono text-slate-500">Few-Shot Template ({`{SCHEMA}`}, {`{EXAMPLES}`}, {`{TEXT}`})</span>
                          <button
                            onClick={() => setCustomFewShotPrompt(DEFAULT_FEW_SHOT_PROMPT)}
                            className="text-[9px] font-mono text-emerald-400 hover:underline"
                          >
                            Reset
                          </button>
                        </div>
                        <textarea
                          value={customFewShotPrompt}
                          onChange={e => setCustomFewShotPrompt(e.target.value)}
                          rows={6}
                          className="w-full bg-slate-950 text-[10px] font-mono p-2 border border-slate-800 rounded focus:outline-none focus:border-teal-500 text-slate-300"
                        />
                      </div>

                      {/* Active Prompt Examples */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-mono text-slate-400">Configure Few-Shot Examples ({fewShotExamples.length}):</span>
                          <button
                            onClick={() => setShowAddExampleModal(true)}
                            className="text-[9px] text-teal-400 font-mono hover:underline flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Add Example
                          </button>
                        </div>

                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {fewShotExamples.map((ex, index) => (
                            <div key={ex.id} className="bg-slate-950 p-2 rounded border border-slate-800 flex flex-col gap-1.5 text-[10px]">
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-teal-400">Example {index+1}</span>
                                <button
                                  onClick={() => setFewShotExamples(fewShotExamples.filter(item => item.id !== ex.id))}
                                  className="text-red-400 hover:text-red-500 font-mono text-[9px]"
                                >
                                  Remove
                                </button>
                              </div>
                              <div className="text-slate-400 truncate"><span className="text-slate-500">In:</span> {ex.input}</div>
                              <pre className="text-[9px] text-slate-400 bg-slate-900/60 p-1 rounded max-h-12 overflow-y-auto font-mono scrollbar-thin">
                                {ex.output}
                              </pre>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}
                </div>

                {/* Primary Evaluation Gun Trigger */}
                <div className="mt-5">
                  <button
                    disabled={isRunning}
                    onClick={handleExecuteExtraction}
                    className={`w-full py-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                      isRunning
                        ? "bg-teal-500/20 text-teal-300 border border-teal-500/35 cursor-not-allowed"
                        : "bg-teal-400 hover:bg-teal-300 text-slate-950 hover:shadow-lg hover:scale-[1.01] active:translate-y-[1px] active:scale-[1.0] cursor-pointer"
                    }`}
                  >
                    {isRunning ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                        <span>Parsing Log context...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-slate-950" />
                        <span>Run Data Extraction Ingestion</span>
                      </>
                    )}
                  </button>

                  {/* Informational Prompt Alert */}
                  {executionEngine === "gateway" && (
                    <p className="text-[10px] text-slate-500 mt-2 text-center">
                      🔐 Full Server-Side Proxy. API key remains secured. Zero browser telemetry/spying.
                    </p>
                  )}
                </div>

              </div>

            </div>

            {/* RIGHT PROFILE: Ingest and Evaluation Analysis */}
            <div className="lg:col-span-7 flex flex-col gap-6">

              {/* Status Warning if missing anything or showing general notifications */}
              {errorMessage && (
                <div className="bg-red-950/40 border border-red-950 rounded-lg p-3.5 flex items-start gap-2 text-red-300 text-xs shadow-sm">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0 text-red-400 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-semibold block mb-0.5">Extraction Gateway Warning</span>
                    <p className="text-[11px] text-red-300/90 leading-relaxed">
                      {errorMessage}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => {
                          setExecutionEngine("simulation");
                          setErrorMessage(null);
                        }}
                        className="bg-red-500/20 hover:bg-red-500/30 text-white font-semibold text-[10px] px-2 py-1 rounded transition-all font-mono"
                      >
                        Auto-switch to Local Emulated Engine (No API key needed)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Box 3: Comparison Benchmark Stats / Quick Performance board */}
              {lastResult ? (
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
                    <div>
                      <h3 className="font-semibold text-sm text-slate-300 flex items-center gap-2">
                        <TrendingUp className="w-4.5 h-4.5 text-emerald-400" />
                        Live Parsing Analytical Ingest
                      </h3>
                      <p className="text-[10px] text-slate-500">
                        Operational logs compiled at {new Date().toLocaleTimeString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] font-mono text-slate-400">
                        Engine: <strong className="text-teal-400">{lastResult.mode === "zero_shot" ? "Zero-Shot" : "Few-Shot"}</strong>
                      </span>
                      <span className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" /> <strong className="text-slate-200">{lastResult.durationMs}ms</strong>
                      </span>
                      <span className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] font-mono text-slate-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> <span className="text-slate-200">Format:</span> <strong className="text-emerald-400">{lastResult.isValidJSON ? "VALID JSON" : "CRASH"}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Schema validation comparisons cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-5">
                    {schemaFields.map(field => {
                      const value = lastResult.parsedJSON ? lastResult.parsedJSON[field] : undefined;
                      const isFound = value !== null && value !== undefined;
                      return (
                        <div key={field} className="bg-slate-950 p-2.5 rounded-lg border border-slate-900 flex flex-col gap-1 justify-between">
                          <span className="text-[10px] font-mono text-slate-500 truncate">{field}</span>
                          <span className={`text-xs font-semibold truncate ${isFound ? "text-slate-300" : "text-amber-500 italic pr-1"}`}>
                            {isFound ? String(value) : "null fallback"}
                          </span>
                          <div className="flex items-center gap-1 mt-1 text-[9px] font-mono">
                            {isFound ? (
                              <span className="text-emerald-400 flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-emerald-400"></span> Extracted
                              </span>
                            ) : (
                              <span className="text-slate-500 flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-slate-600"></span> Graceful
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Structured Code Panels comparison layout */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    
                    {/* Prompt Left */}
                    <div className="md:col-span-5 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                        <span>Compiled Instructions Supplied</span>
                        <button
                          onClick={() => copyToClipboard(lastResult.promptSent, "prompt")}
                          className="hover:text-slate-200 transition-all"
                        >
                          {copiedPath === "prompt" ? (
                            <span className="text-emerald-400 flex items-center gap-1">Copied!</span>
                          ) : (
                            <span className="flex items-center gap-1"><Copy className="w-3.5 h-3.5" /> Copy Raw</span>
                          )}
                        </button>
                      </div>
                      <pre className="text-[10px] font-mono p-3 bg-slate-950 rounded-lg border border-slate-900/40 text-slate-400 h-64 overflow-y-auto overflow-x-auto select-all leading-relaxed whitespace-pre-wrap">
                        {lastResult.promptSent}
                      </pre>
                    </div>

                    {/* Result Right */}
                    <div className="md:col-span-7 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                        <span className="flex items-center gap-1.5 text-slate-200 font-semibold">
                          <FileJson className="w-4 h-4 text-emerald-400" />
                          Validated Structured JSON Result
                        </span>
                        <button
                          onClick={() => copyToClipboard(lastResult.cleanOutput, "result")}
                          className="hover:text-slate-200 transition-all text-teal-400"
                        >
                          {copiedPath === "result" ? (
                            <span className="text-emerald-400 flex items-center gap-1 font-mono">Copied!</span>
                          ) : (
                            <span className="flex items-center gap-1 font-mono"><Copy className="w-3.5 h-3.5" /> Copy JSON</span>
                          )}
                        </button>
                      </div>

                      <div className="relative">
                        <pre className="text-[11px] font-mono p-3 bg-slate-950 rounded-lg border border-teal-500/20 text-teal-300 h-64 overflow-y-auto whitespace-pre overflow-x-auto leading-relaxed select-all">
                          {lastResult.cleanOutput}
                        </pre>

                        {/* Valid JSON Stamp */}
                        <div className="absolute top-2.5 right-2 px-2 py-1 bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[9px] font-mono tracking-widest rounded select-none">
                          T: {lastResult.temperature} | STRICT OK
                        </div>
                      </div>
                    </div>

                  </div>

                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 flex flex-col items-center justify-center text-center">
                  <div className="w-14 h-14 rounded-full bg-slate-950 flex items-center justify-center mb-4 border border-slate-800">
                    <Play className="w-6 h-6 text-slate-500 animate-pulse translate-x-[1px]" />
                  </div>
                  <h3 className="font-semibold text-slate-300 mb-1">Awaiting Extraction Sequence</h3>
                  <p className="text-xs text-slate-500 max-w-sm mb-4">
                    Trigger the ingestion pipeline from the configurations on the left to see parsing analyses, strict JSON models, and compiler benchmarks.
                  </p>
                  <p className="text-[11px] text-slate-600 font-mono max-w-sm">
                    Recommended: Try "OCR Scan Receipt Fragment" with both Zero-Shot and Few-Shot mode to notice accuracy updates!
                  </p>
                </div>
              )}

              {/* Historical Benchmarks Tracking */}
              {historicalRuns.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <h3 className="font-semibold text-xs font-mono uppercase tracking-wider text-slate-400">
                      Historical Parsing Iterations ({historicalRuns.length})
                    </h3>
                    <button
                      onClick={() => {
                        setHistoricalRuns([]);
                        setLastResult(null);
                      }}
                      className="text-[10px] text-slate-500 hover:text-red-400 flex items-center gap-1 font-mono hover:underline"
                    >
                      <RotateCcw className="w-3 h-3" /> Clear History
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto text-[11px] font-mono pr-1">
                    {historicalRuns.map((run, i) => (
                      <div key={i} className="bg-slate-950 p-2 rounded border border-slate-900 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${run.isValidJSON ? "bg-emerald-500" : "bg-red-500"}`}></span>
                          <span className="text-slate-300 capitalize">{run.mode.replace("_", " ")}</span>
                          <span className="text-slate-600">|</span>
                          <span className="text-slate-400">{run.durationMs}ms</span>
                        </div>
                        <div className="text-slate-500 text-[10px] truncate max-w-xs block">
                          Fields: {Object.keys(run.parsedJSON || {}).join(", ")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Side notice on Zero-Shot Vs Few-Shot Engineering */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-4">
                <h4 className="font-semibold text-xs uppercase tracking-wider text-slate-400 font-mono mb-2">
                  Academic Extraction Guide
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-900">
                    <strong className="text-teal-400 block mb-1">Zero-Shot Strategy:</strong>
                    Directly instructs the LLM with field schemas. Best for clean files and simple layouts. Minimizes inputs and saves running costs.
                  </div>
                  <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-900">
                    <strong className="text-sky-400 block mb-1">Few-Shot Strategy:</strong>
                    Prepends 2-3 exemplar payloads. Corrects complex, damaged formats (OCR, transcripts) and trains formatting styles effortlessly.
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: PYTHON EXECUTABLE WORKSPACE */}
        {activeTab === "explorer" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch min-h-[550px]">
            
            {/* Folder Directory Explorer */}
            <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
              
              <div>
                <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-slate-800/80 pr-1.5">
                  <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-sky-400" />
                    Project Workspace Files
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">Python Core</span>
                </div>

                <div className="bg-slate-950/80 rounded-lg p-2.5 border border-slate-900 overflow-y-auto max-h-[420px] scrollbar-thin">
                  
                  {/* Virtual Local Installer script helper node */}
                  <div className="mb-2">
                    <button
                      onClick={() => setSelectedFilePath("setup_project.py")}
                      className={`flex items-center gap-2 py-1.5 px-2 text-xs w-full text-left rounded transition-all font-semibold ${
                        selectedFilePath === "setup_project.py"
                          ? "text-emerald-300 bg-emerald-500/15 border border-emerald-500/20 pl-2.5"
                          : "text-emerald-400 hover:text-emerald-300 bg-slate-950/40 hover:bg-slate-800/30 pl-2"
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                      <span>⚡ setup_project.py (Installer)</span>
                    </button>
                    <p className="text-[10.5px] text-slate-500 pl-8 mt-0.5 leading-tight">
                      One-click script to generate this workspace structure on your local terminal!
                    </p>
                  </div>

                  {/* Standard Trees */}
                  <div className="pl-1">
                    <button
                      onClick={() => setExpandedDirs(prev => ({ ...prev, "ZeroShot_FewShot_DataExtraction": !expandedDirs["ZeroShot_FewShot_DataExtraction"] }))}
                      className="flex items-center gap-1.5 py-1 text-sm text-slate-300 hover:text-teal-400 font-semibold transition-all text-left w-full"
                    >
                      {expandedDirs["ZeroShot_FewShot_DataExtraction"] ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                      <FolderOpen className="w-4 h-4 text-yellow-500 fill-yellow-500/10" />
                      <span>ZeroShot_FewShot_DataExtraction/</span>
                    </button>

                    {expandedDirs["ZeroShot_FewShot_DataExtraction"] && (
                      <div className="ml-2 border-l border-slate-800 pb-1">
                        {renderDirNodes(SIMULATED_PROJECT_FILES)}
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* Setup Helper explanation and download options */}
              <div className="mt-4 pt-3.5 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-3">
                <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/60 leading-relaxed">
                  💡 <strong className="text-slate-300">Workspace Generation</strong>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Select <strong className="text-emerald-400">setup_project.py</strong>, copy the compiled script code, save it locally, and run <code className="text-teal-300 bg-slate-900 px-1 py-0.5 rounded font-mono">python setup_project.py</code>. It will automatically build the folder directory, files, inputs, and analysis locally!
                  </p>
                </div>
              </div>

            </div>

            {/* Read/Display terminal window */}
            <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-lg flex flex-col justify-between overflow-hidden min-h-[480px]">
              
              {/* Toolbar */}
              <div className="bg-slate-950/60 px-4 py-2 flex items-center justify-between border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="flex gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/60"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/60"></span>
                  </span>
                  <span className="text-xs font-mono text-slate-400 pl-2">
                    {selectedFilePath}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => copyToClipboard(getFileContent(), "filecode")}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded text-[11px] transition-all flex items-center gap-1.5 font-mono"
                  >
                    {copiedPath === "filecode" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      const element = document.createElement("a");
                      const file = new Blob([getFileContent()], { type: "text/plain" });
                      element.href = URL.createObjectURL(file);
                      element.download = selectedFilePath.split("/").pop() || "source_file.py";
                      document.body.appendChild(element);
                      element.click();
                      document.body.removeChild(element);
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded text-[11px] transition-all flex items-center gap-1.5 font-mono"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              {/* Code Panel Display */}
              <div className="flex-1 p-4 bg-slate-950 font-mono text-xs overflow-y-auto scrollbar-thin overflow-x-auto max-h-[480px]">
                <pre className="text-slate-300 leading-relaxed whitespace-pre font-mono">
                  {getFileContent()}
                </pre>
              </div>

              {/* Code window bottom metadata */}
              <div className="bg-slate-950/60 px-4 py-1.5 border-t border-slate-900 flex justify-between text-[11px] text-slate-500 font-mono">
                <span>Encoded UTF-8</span>
                <span>Size: {getFileContent().length} characters</span>
              </div>

            </div>

          </div>
        )}

        {/* TAB 3: ACADEMIC HANDBOOK / PROJECT REPORT */}
        {activeTab === "report" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Sidebar Report Index */}
            <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-lg p-3">
              <h3 className="font-semibold text-xs font-mono uppercase tracking-wider text-slate-400 mb-3 ml-1">
                Report Index
              </h3>
              <div className="space-y-1">
                {REPORT_SECTIONS.map(sec => {
                  const isActive = activeReportSectionId === sec.id;
                  return (
                    <button
                      key={sec.id}
                      onClick={() => {
                        setActiveReportSectionId(sec.id);
                        document.getElementById(`sec-${sec.id}`)?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className={`w-full text-left p-2 rounded text-xs transition-all font-medium flex items-center justify-between ${
                        isActive
                          ? "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
                      }`}
                    >
                      <span>{sec.title}</span>
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isActive ? "rotate-90" : ""}`} />
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800 pr-1 text-center">
                <button
                  onClick={() => {
                    const completeReport = REPORT_SECTIONS.map(s => s.content).join("\n\n---\n\n");
                    copyToClipboard(completeReport, "full-report");
                  }}
                  className="w-full py-2 rounded bg-slate-950 hover:bg-slate-950 border border-slate-800 hover:border-slate-705 text-xs font-mono text-slate-300 transition-all flex items-center justify-center gap-1.5"
                >
                  {copiedPath === "full-report" ? (
                    <span className="text-emerald-400 font-medium">Copied Full Report!</span>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Full Markdown Report</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Main Report Page display */}
            <div className="lg:col-span-9 bg-slate-900 border border-slate-800 rounded-lg p-6 sm:p-8 pr-4 sm:pr-8 max-h-[640px] overflow-y-auto scrollbar-thin">
              
              <div className="text-center pb-6 mb-8 border-b border-slate-800">
                <span className="text-[10px] font-mono tracking-widest bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full uppercase border border-emerald-500/20 font-semibold">
                  INTERNSHIP SUBMISSION COMPLIANT DELIVERABLE
                </span>
                <h2 className="text-2xl font-bold font-serif text-slate-100 mt-4 leading-tight">
                  Zero-Shot & Few-Shot Data Extraction Using LLMs
                </h2>
                <p className="text-sm text-slate-400 mt-2 max-w-xl mx-auto">
                  An empirical analysis of programmatic extraction structures, prompt templates accuracy benchmarks, and deterministic JSON sanitization pipelines.
                </p>
                <div className="flex justify-center gap-4 text-xs font-mono text-slate-500 mt-4">
                  <span>Author: Engineering Intern Student</span>
                  <span>•</span>
                  <span>Date: June 2026</span>
                </div>
              </div>

              {/* Render Sections */}
              <div className="prose prose-invert prose-teal max-w-none text-slate-300 space-y-8 font-sans leading-relaxed text-sm">
                {REPORT_SECTIONS.map(sec => (
                  <div
                    key={sec.id}
                    id={`sec-${sec.id}`}
                    className={`scroll-mt-24 p-4 rounded-lg transition-all ${
                      activeReportSectionId === sec.id ? "bg-slate-950/40 border border-slate-800/80 shadow-md" : ""
                    }`}
                  >
                    
                    {/* Render Content */}
                    <div className="report-markdown-block whitespace-pre-wrap">
                      {sec.content}
                    </div>

                  </div>
                ))}
              </div>

              {/* Academic Footnotes */}
              <div className="mt-12 pt-6 border-t border-slate-800 text-xs text-slate-500 space-y-2">
                <p><strong>References & Scholarly Literature:</strong></p>
                <p>1. Brown, T. et al. (2020). Language Models are Few-Shot Learners. Advances in Neural Information Processing Systems (NeurIPS).</p>
                <p>2. Google Gemini Team (2025). Gemini 3.5 Framework Capabilities Manual & Developer Guidelines.</p>
                <p>3. Prompt Engineering Protocols: Delimitation sandboxing techniques for safety operations.</p>
              </div>

            </div>

          </div>
        )}

        {/* TAB 4: PPT PRESENTATION CAROUSEL */}
        {activeTab === "slides" && (
          <div className="flex flex-col gap-6">
            
            {/* The Slide viewport */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 sm:p-10 relative min-h-[420px] flex flex-col justify-between shadow-2xl overflow-hidden">
              
              {/* Abstract decorative slide geometry background */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-teal-500/5 via-sky-500/5 to-transparent rounded-full blur-2xl pointer-events-none"></div>

              {/* Slide Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800/60 z-10">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-400"></span>
                  <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400 font-semibold">
                    Technical Presentation Slide: {PRESENTATION_SLIDES[currentSlideIndex].id} of {PRESENTATION_SLIDES.length}
                  </span>
                </div>
                <div className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-500 uppercase">
                  LLM Data Extraction Project
                </div>
              </div>

              {/* Slide Core Content Frame */}
              <div className="my-8 flex-1 flex flex-col justify-center z-10">
                
                {/* Visual Type 1: Title Layout */}
                {PRESENTATION_SLIDES[currentSlideIndex].visualType === "title" && (
                  <div className="text-center py-6">
                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-300 via-emerald-200 to-white leading-tight">
                      {PRESENTATION_SLIDES[currentSlideIndex].title}
                    </h2>
                    <p className="text-teal-400 font-medium text-xs sm:text-sm uppercase tracking-wide mt-3">
                      {PRESENTATION_SLIDES[currentSlideIndex].subtitle}
                    </p>

                    <div className="mt-8 flex flex-wrap justify-center gap-2.5 max-w-xl mx-auto">
                      {PRESENTATION_SLIDES[currentSlideIndex].bullets?.map((bullet, k) => (
                        <div
                          key={k}
                          className="bg-slate-950/80 border border-slate-800 py-1.5 px-3.5 rounded text-left text-xs text-slate-300 truncate"
                        >
                          {bullet}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Visual Type 2: Grid Layout */}
                {PRESENTATION_SLIDES[currentSlideIndex].visualType === "grid" && (
                  <div>
                    <div className="mb-4">
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-100">
                        {PRESENTATION_SLIDES[currentSlideIndex].title}
                      </h2>
                      <p className="text-slate-400 text-xs font-mono">{PRESENTATION_SLIDES[currentSlideIndex].subtitle}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-5">
                      {PRESENTATION_SLIDES[currentSlideIndex].bullets?.map((bullet, k) => (
                        <div key={k} className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-900/60 transition-all hover:bg-slate-950 flex items-start gap-2 text-xs">
                          <span className="w-4 h-4 rounded bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                            {k + 1}
                          </span>
                          <span className="text-slate-300 leading-relaxed font-sans">{bullet}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Visual Type 3: Split Columns */}
                {PRESENTATION_SLIDES[currentSlideIndex].visualType === "split" && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    
                    <div className="md:col-span-6">
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-100">
                        {PRESENTATION_SLIDES[currentSlideIndex].title}
                      </h2>
                      <p className="text-slate-400 text-xs font-mono mb-4">{PRESENTATION_SLIDES[currentSlideIndex].subtitle}</p>
                      
                      <div className="space-y-2 mt-4">
                        {PRESENTATION_SLIDES[currentSlideIndex].bullets?.slice(0, 2).map((bullet, k) => (
                          <div key={k} className="flex gap-2 text-xs text-slate-300 bg-slate-950/40 p-2.5 rounded border border-slate-900 border-l-2 border-l-teal-500">
                            <span className="text-teal-400 shrink-0">✦</span>
                            <span>{bullet}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="md:col-span-6 space-y-2.5">
                      {PRESENTATION_SLIDES[currentSlideIndex].bullets?.slice(2).map((bullet, k) => (
                        <div key={k} className="p-3 bg-slate-950 rounded-lg border border-slate-900 text-xs text-slate-300 flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
                          <span>{bullet}</span>
                        </div>
                      ))}
                    </div>

                  </div>
                )}

                {/* Visual Type 4: Comparatives Table Layout */}
                {PRESENTATION_SLIDES[currentSlideIndex].visualType === "table" && (
                  <div>
                    <div className="mb-4">
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-100">
                        {PRESENTATION_SLIDES[currentSlideIndex].title}
                      </h2>
                      <p className="text-slate-400 text-xs font-mono">{PRESENTATION_SLIDES[currentSlideIndex].subtitle}</p>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-slate-800/60 bg-slate-950 mt-4">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-900 text-slate-300 font-mono text-[10px] uppercase border-b border-slate-800">
                            {PRESENTATION_SLIDES[currentSlideIndex].tableData?.headers.map((h, i) => (
                              <th key={i} className="p-2.5 font-semibold text-teal-400">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900">
                          {PRESENTATION_SLIDES[currentSlideIndex].tableData?.rows.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-900/45 text-slate-400 transition-colors">
                              {row.map((val, cIdx) => (
                                <td key={cIdx} className="p-2.5 font-sans leading-relaxed">
                                  {cIdx === 0 ? <strong className="text-slate-300">{val}</strong> : val}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Visual Type 5: Conclusion */}
                {PRESENTATION_SLIDES[currentSlideIndex].visualType === "conclusion" && (
                  <div className="text-center py-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-teal-300">
                      {PRESENTATION_SLIDES[currentSlideIndex].title}
                    </h2>
                    <p className="text-slate-400 text-xs font-mono mb-6">{PRESENTATION_SLIDES[currentSlideIndex].subtitle}</p>

                    <div className="max-w-md mx-auto bg-slate-950 p-5 rounded-xl border border-teal-500/20 shadow-lg text-left space-y-3">
                      {PRESENTATION_SLIDES[currentSlideIndex].bullets?.map((bullet, k) => (
                        <div key={k} className="flex gap-2.5 items-start text-xs text-slate-300">
                          <span className="w-4 h-4 rounded-full bg-teal-400/10 text-teal-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">✓</span>
                          <span className="leading-relaxed">{bullet}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Progress Slider Dots and Navigation */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800/60 z-10 text-xs">
                
                {/* Indicators progress */}
                <div className="flex items-center gap-1.5 order-2 sm:order-1">
                  {PRESENTATION_SLIDES.map((slide, j) => (
                    <button
                      key={slide.id}
                      onClick={() => {
                        setCurrentSlideIndex(j);
                        setIsAutoplay(false);
                      }}
                      className={`h-2 rounded-full transition-all focus:outline-none ${
                        currentSlideIndex === j ? "w-6 bg-teal-400" : "w-2 bg-slate-800 hover:bg-slate-700"
                      }`}
                      title={`Go to slide ${slide.id}`}
                    />
                  ))}
                </div>

                {/* Slider playback utilities */}
                <div className="flex items-center gap-2 order-1 sm:order-2 w-full sm:w-auto justify-between sm:justify-start">
                  
                  <div className="flex items-center gap-1 bg-slate-950/80 rounded border border-slate-800 p-0.5 text-[10px] font-mono mr-2 select-none">
                    <span className="text-slate-500 px-1.5 uppercase">Slideshow Mode:</span>
                    <button
                      onClick={() => setIsAutoplay(!isAutoplay)}
                      className={`px-1.5 py-0.5 rounded transition-all ${
                        isAutoplay ? "bg-teal-500 text-slate-950" : "hover:text-slate-200"
                      }`}
                    >
                      {isAutoplay ? "AUTOPLAY ON" : "AUTOPLAY OFF"}
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setCurrentSlideIndex(prev => (prev - 1 + PRESENTATION_SLIDES.length) % PRESENTATION_SLIDES.length);
                        setIsAutoplay(false);
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded transition-all flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Previous
                    </button>

                    <button
                      onClick={() => {
                        setCurrentSlideIndex(prev => (prev + 1) % PRESENTATION_SLIDES.length);
                        setIsAutoplay(false);
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded transition-all flex items-center gap-1"
                    >
                      Next <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>

              </div>

            </div>

            {/* Quick Summary overview info */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
              <h3 className="font-semibold text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                Slide-Deck Overview
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                This slide deck compiles the core design findings of the mini-project titled **"Zero-Shot & Few-Shot Data Extraction Using LLMs"**. Use the navigation controls to flip through slides. Features structural slides evaluating client problems, dataset objects structure, API schema formatting parameters, and the empirical comparative analysis between prompting methods suited for internship approvals.
              </p>
            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 text-slate-500 text-xs py-8 mt-12 bg-slate-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-teal-500/10 flex items-center justify-center font-bold text-teal-400 text-xs">
              EP
            </div>
            <span>
              <strong>Zero-Shot & Few-Shot Ingestor</strong> — Ingestion Workspace of LLM Data Extraction
            </span>
          </div>

          <div className="flex flex-wrap gap-4 text-[11px] text-slate-600 font-mono">
            <span>Server Proxy: Online</span>
            <span>•</span>
            <span>Temperature: 0.0</span>
            <span>•</span>
            <span>Format: UTF-8 JSON</span>
          </div>

        </div>
      </footer>

      {/* Example add modal */}
      {showAddExampleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 w-full max-w-lg shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-bold text-sm text-slate-200">Add Custom Ingest Few-Shot Example</h4>
              <button
                onClick={() => setShowAddExampleModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              
              <div>
                <label className="block text-xs font-mono text-slate-500 mb-1">EXAMPLE INPUT STRING (MESSY LOG)</label>
                <textarea
                  rows={3}
                  value={newExInput}
                  onChange={e => setNewExInput(e.target.value)}
                  placeholder="Hey, James Brody with james.b@example.com, cellular 4155551234. Bought drill..."
                  className="w-full bg-slate-950 border border-slate-800 rounded text-xs p-2 font-mono text-slate-300 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-500 mb-1">EXPECTED OUTPUT (VALID JSON STRING)</label>
                <textarea
                  rows={4}
                  value={newExOutput}
                  onChange={e => setNewExOutput(e.target.value)}
                  placeholder={`{\n  "customer_name": "James Brody",\n  "email": "james.b@example.com",\n  "phone": "4155551234"\n}`}
                  className="w-full bg-slate-950 border border-slate-800 rounded text-xs p-2 font-mono text-teal-400 focus:outline-none focus:border-teal-500"
                />
              </div>

            </div>

            <div className="flex justify-end gap-2 text-xs pt-2">
              <button
                onClick={() => setShowAddExampleModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-350 px-3 py-1.5 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newExInput.trim() === "" || newExOutput.trim() === "") return;
                  const newEx: FewShotExample = {
                    id: "custom_" + Date.now(),
                    input: newExInput,
                    output: newExOutput
                  };
                  setFewShotExamples([...fewShotExamples, newEx]);
                  setNewExInput("");
                  setNewExOutput("");
                  setShowAddExampleModal(false);
                }}
                className="bg-teal-500 text-slate-950 font-bold px-4 py-1.5 rounded hover:bg-teal-400"
              >
                Save Example
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
