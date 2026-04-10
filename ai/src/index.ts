import { runDeterministicAnalysis, type AnalysisResult } from "./deterministic";
import { summarizeWithLLM } from "./openai";

type AnalyzeInput = {
  primaryText?: string | null;
  headline?: string | null;
  description?: string | null;
  cta?: string | null;
};

export async function analyzeMessaging(input: AnalyzeInput): Promise<AnalysisResult> {
  const deterministic = runDeterministicAnalysis(input);

  const llm = await summarizeWithLLM(
    [input.primaryText, input.headline, input.description].filter(Boolean).join(" "),
  );

  if (llm) {
    deterministic.summary = llm;
  }

  return deterministic;
}

export * from "./deterministic";
