import { normalizeText, sha256 } from "@cia/utils/hash";

const HOOK_PATTERNS: Array<{ type: string; pattern: RegExp }> = [
  { type: "QUESTION", pattern: /\?/ },
  { type: "FOMO", pattern: /(limited|before it.?s gone|last chance|today only|hurry)/i },
  { type: "SOCIAL_PROOF", pattern: /(trusted by|customers|reviews|rated|testimonial)/i },
  { type: "STATISTIC", pattern: /(\d+%|\d+x|\d+\+|million|thousand)/i },
  { type: "PROBLEM", pattern: /(struggling|tired of|problem|pain|frustrated)/i },
];

const CTA_PATTERNS: Array<{ type: string; pattern: RegExp }> = [
  { type: "BUY_NOW", pattern: /(buy now|shop now|get yours)/i },
  { type: "LEARN_MORE", pattern: /(learn more|discover|find out)/i },
  { type: "SIGN_UP", pattern: /(sign up|join now|create account)/i },
  { type: "BOOK_DEMO", pattern: /(book demo|request demo|see it in action)/i },
  { type: "DOWNLOAD", pattern: /(download|get the guide|free template)/i },
  { type: "CONTACT_US", pattern: /(contact us|talk to sales|speak with)/i },
];

const OFFER_PATTERNS: Array<{ type: string; pattern: RegExp }> = [
  { type: "DISCOUNT", pattern: /(\d+% off|discount|sale|coupon|deal)/i },
  { type: "FREE_TRIAL", pattern: /(free trial|try free|7-day trial|14-day trial|30-day trial)/i },
  { type: "BUNDLE", pattern: /(bundle|2 for 1|buy one get one|bogo)/i },
  { type: "DEMO", pattern: /(demo|walkthrough|live demo)/i },
  { type: "TESTIMONIAL", pattern: /(case study|customer story|testimonial)/i },
];

const TONE_PATTERNS: Array<{ type: string; pattern: RegExp }> = [
  { type: "URGENT", pattern: /(now|today|urgent|limited|deadline)/i },
  { type: "PLAYFUL", pattern: /(fun|easy|wow|amazing|love)/i },
  { type: "AUTHORITATIVE", pattern: /(proven|research|expert|scientifically)/i },
  { type: "EDUCATIONAL", pattern: /(learn|guide|step-by-step|how to)/i },
  { type: "ASPIRATIONAL", pattern: /(achieve|transform|become|unlock)/i },
];

type DeterministicInput = {
  primaryText?: string | null;
  headline?: string | null;
  description?: string | null;
  cta?: string | null;
};

export type AnalysisResult = {
  hook: string;
  hookType: string;
  angle: string;
  tone: string;
  audienceIntent: string;
  offerType: string;
  urgencySignals: string[];
  socialProofSignals: string[];
  ctaType: string;
  painPoints: string[];
  benefits: string[];
  emotionalTriggers: string[];
  summary: string;
  keywords: string[];
  confidenceScoresJson: Record<string, number>;
  copyHash: string;
};

function pickPattern(text: string, patterns: Array<{ type: string; pattern: RegExp }>, fallback: string): string {
  const hit = patterns.find((p) => p.pattern.test(text));
  return hit?.type ?? fallback;
}

function extractKeywords(text: string): string[] {
  const stopWords = new Set(["the", "and", "for", "with", "this", "that", "your", "you", "are", "our"]);
  const words = normalizeText(text)
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 3 && !stopWords.has(w));
  return [...new Set(words)].slice(0, 12);
}

function extractSignals(text: string, dictionary: string[]): string[] {
  return dictionary.filter((d) => new RegExp(`\\b${d}\\b`, "i").test(text));
}

export function runDeterministicAnalysis(input: DeterministicInput): AnalysisResult {
  const text = [input.primaryText, input.headline, input.description].filter(Boolean).join(" ");
  const normalized = normalizeText(text);
  const hook = input.headline || input.primaryText?.split(".")[0] || "No explicit hook";

  const hookType = pickPattern(normalized, HOOK_PATTERNS, "DIRECT_BENEFIT");
  const ctaType = pickPattern([input.cta, normalized].filter(Boolean).join(" "), CTA_PATTERNS, "OTHER");
  const offerType = pickPattern(normalized, OFFER_PATTERNS, "NONE");
  const tone = pickPattern(normalized, TONE_PATTERNS, "NEUTRAL");

  const urgencySignals = extractSignals(normalized, ["today", "limited", "hurry", "now", "deadline"]);
  const socialProofSignals = extractSignals(normalized, ["reviews", "trusted", "customers", "rated"]);
  const painPoints = extractSignals(normalized, ["struggling", "slow", "expensive", "manual", "waste"]);
  const benefits = extractSignals(normalized, ["faster", "save", "grow", "increase", "improve", "automate"]);
  const emotionalTriggers = extractSignals(normalized, ["fear", "confidence", "security", "status", "peace"]);

  const angle = offerType === "DISCOUNT" ? "Price-driven offer" : hookType === "SOCIAL_PROOF" ? "Social proof" : "Benefit-led";
  const audienceIntent = /b2b|team|agency|saas/.test(normalized) ? "Business buyer" : "Consumer buyer";

  return {
    hook,
    hookType,
    angle,
    tone,
    audienceIntent,
    offerType,
    urgencySignals,
    socialProofSignals,
    ctaType,
    painPoints,
    benefits,
    emotionalTriggers,
    summary: `Ad uses a ${tone.toLowerCase()} tone with ${hookType.toLowerCase().replace("_", " ")} hook and ${ctaType.toLowerCase().replace("_", " ")} CTA.`,
    keywords: extractKeywords(normalized),
    confidenceScoresJson: {
      hookType: hookType === "DIRECT_BENEFIT" ? 0.62 : 0.78,
      ctaType: ctaType === "OTHER" ? 0.51 : 0.82,
      offerType: offerType === "NONE" ? 0.55 : 0.76,
      tone: tone === "NEUTRAL" ? 0.58 : 0.8,
    },
    copyHash: sha256(normalized),
  };
}
