import type { Deck, ChatMessage } from '../types/slides';
import { generateSchemaPrompt, extractJsonFromText, validateDeck } from './schema';

export interface LLMSettings {
  provider: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}

const DEFAULT_SETTINGS: LLMSettings = {
  provider: 'openai',
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4o',
};

const SETTINGS_KEY = 'slidecraft-llm-settings';

export function loadLLMSettings(): LLMSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveLLMSettings(settings: LLMSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function buildSystemPrompt(deck: Deck): string {
  return `You are SlideCraft AI, an expert presentation assistant. You help users create, edit, and improve slide presentations.

You can modify the current deck by returning a JSON block with the updated deck. Always return the COMPLETE deck JSON when making changes, not just the modified parts.

When you modify the deck, wrap the JSON in a markdown code block:
\`\`\`json
{ /* complete deck JSON */ }
\`\`\`

After the JSON block, briefly explain what you changed in plain English.

If the user asks a question without requesting changes, just answer in plain text.

${generateSchemaPrompt(deck)}`;
}

export interface LLMResponse {
  text: string;
  deck: Deck | null;
}

export async function sendMessage(
  userMessage: string,
  history: ChatMessage[],
  deck: Deck,
  settings: LLMSettings
): Promise<LLMResponse> {
  const systemPrompt = buildSystemPrompt(deck);

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history
      .filter((m) => m.role !== 'system')
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const response = await fetch(`${settings.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model: settings.model,
      messages,
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content ?? '';

  // Try to extract a deck JSON from the response
  const parsed = extractJsonFromText(text);
  let updatedDeck: Deck | null = null;

  if (parsed && validateDeck(parsed)) {
    updatedDeck = parsed as Deck;
  }

  return { text, deck: updatedDeck };
}
