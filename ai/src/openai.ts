import OpenAI from "openai";

import { env } from "@cia/utils/env";

export async function summarizeWithLLM(copy: string): Promise<string | null> {
  if (!env.OPENAI_API_KEY) {
    return null;
  }

  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const prompt = `You analyze ad messaging. Return one concise sentence covering hook, offer, and CTA intent. Copy: ${copy}`;

  try {
    const res = await client.responses.create({
      model: env.OPENAI_MODEL,
      input: prompt,
      max_output_tokens: 120,
    });

    return res.output_text?.trim() || null;
  } catch {
    return null;
  }
}
