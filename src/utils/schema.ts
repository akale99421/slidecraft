import type { Deck } from '../types/slides';

export const DECK_SCHEMA_DESCRIPTION = `
# SlideCraft Deck JSON Schema

A Deck has this structure:
{
  "id": "string (uuid)",
  "title": "string",
  "theme": {
    "name": "string",
    "colors": {
      "primary": "#hex",
      "secondary": "#hex",
      "accent": "#hex",
      "background": "#hex",
      "surface": "#hex",
      "text": "#hex",
      "textLight": "#hex"
    },
    "fonts": { "heading": "string", "body": "string", "mono": "string" }
  },
  "slides": [
    {
      "id": "string (uuid)",
      "notes": "string",
      "layout": "title | content | two-column | blank",
      "background": { "type": "solid | gradient | image", "value": "string" },
      "elements": [ /* SlideElement[] */ ]
    }
  ]
}

# SlideElement
{
  "id": "string (uuid)",
  "type": "text | image | shape | chart",
  "x": 0-100,   // percentage of slide width
  "y": 0-100,   // percentage of slide height
  "width": 0-100,
  "height": 0-100,
  "rotation": 0,
  "locked": false,
  "visible": true,
  "opacity": 0-1,
  "zIndex": number,
  "content": { /* type-specific, see below */ }
}

# TextContent (type: "text")
{ "type": "text", "text": "string", "fontSize": 24, "fontFamily": "string",
  "fontWeight": "normal|bold", "fontStyle": "normal|italic",
  "textAlign": "left|center|right", "color": "#hex",
  "backgroundColor": "#hex", "padding": 8, "lineHeight": 1.5 }

# ShapeContent (type: "shape")
{ "type": "shape", "shape": "rectangle|circle|rounded-rect|triangle|arrow|line",
  "fill": "#hex", "stroke": "#hex", "strokeWidth": 0, "borderRadius": 0 }

# ImageContent (type: "image")
{ "type": "image", "src": "url or data:uri", "alt": "string",
  "fit": "cover|contain|fill", "borderRadius": 0 }

# ChartContent (type: "chart")
{ "type": "chart", "chartType": "bar|line|pie|donut",
  "title": "string",
  "data": { "labels": ["A","B"], "datasets": [{ "label": "Series 1", "values": [10, 20] }] },
  "colors": ["#hex"] }
`;

export function generateSchemaPrompt(deck: Deck): string {
  return `${DECK_SCHEMA_DESCRIPTION}

# Current Deck State
\`\`\`json
${JSON.stringify(deck, null, 2)}
\`\`\`
`;
}

export function validateDeck(obj: unknown): obj is Deck {
  if (typeof obj !== 'object' || obj === null) return false;
  const d = obj as Record<string, unknown>;
  if (typeof d.id !== 'string') return false;
  if (typeof d.title !== 'string') return false;
  if (!Array.isArray(d.slides)) return false;
  return true;
}

export function extractJsonFromText(text: string): unknown | null {
  // Try to find a JSON block in markdown code fences
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch {
      // ignore
    }
  }

  // Try to find raw JSON object
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      // ignore
    }
  }

  return null;
}
