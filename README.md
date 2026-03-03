# SlideCraft

AI-powered HTML slide editor with drag-and-drop, chat interface, and PPTX export/import. Think Google Slides meets AI — designed to be LLM-friendly and usable with Codex or any OpenAI-compatible API.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173 and start building slides.

## Features

- **Drag & drop editor** — Add text, shapes, and images. Drag to move, resize handles to scale. Double-click text to edit inline.
- **Chat interface** — Side panel chat that sends your deck JSON + instructions to any OpenAI-compatible LLM. Ask it to create slides, modify layouts, change themes.
- **PPTX export** — Export your deck to PowerPoint format. Preserves positions, colors, fonts, and shapes.
- **PPTX import** — Import existing .pptx files to extract slides, or import just the theme/template.
- **LLM-friendly JSON** — The entire deck is a clean JSON structure that any LLM can read and write. Toggle the JSON view to see/copy it.
- **Keyboard shortcuts** — Delete, Ctrl+Z/Y undo/redo, Ctrl+D duplicate, arrow keys to nudge, Escape to deselect.
- **Properties panel** — Edit element properties: position, size, colors, fonts, opacity, alignment.
- **Slide management** — Add, duplicate, delete, reorder slides from the thumbnail panel.

## Architecture

```
src/
├── types/slides.ts          # Core data model (Deck, Slide, SlideElement)
├── store/deckStore.ts       # Zustand store with undo/redo history
├── components/
│   ├── Editor/
│   │   ├── SlideCanvas.tsx  # 16:9 canvas with responsive scaling
│   │   ├── SlideElement.tsx # Draggable/resizable elements (react-rnd)
│   │   └── SlidePanel.tsx   # Slide thumbnails sidebar
│   ├── Chat/
│   │   └── ChatPanel.tsx    # AI chat + JSON view + LLM settings
│   ├── Toolbar/
│   │   └── Toolbar.tsx      # Top toolbar with tools and actions
│   └── Properties/
│       └── PropertyPanel.tsx # Element property editor
├── utils/
│   ├── pptxExport.ts        # Export deck → PPTX (pptxgenjs)
│   ├── pptxImport.ts        # Import PPTX → deck (jszip)
│   ├── llm.ts               # OpenAI-compatible LLM client
│   └── schema.ts            # JSON schema for LLM prompts
└── hooks/
    └── useKeyboard.ts       # Keyboard shortcut handler
```

## LLM Integration

Click the gear icon in the chat panel to configure:

- **API Key** — Your OpenAI (or compatible) API key
- **Base URL** — Default `https://api.openai.com/v1`, change for other providers
- **Model** — Default `gpt-4o`

The chat sends the full deck JSON as context, so the LLM can see and modify any part of your presentation. It returns a modified deck JSON that gets applied instantly.

### Using with Codex

The JSON data model is designed to be easy for code-generation tools to work with:

```json
{
  "slides": [{
    "elements": [{
      "type": "text",
      "x": 10, "y": 30, "width": 80, "height": 20,
      "content": {
        "type": "text",
        "text": "Hello World",
        "fontSize": 44,
        "fontWeight": "bold",
        "textAlign": "center",
        "color": "#1e293b"
      }
    }]
  }]
}
```

All positions and sizes are percentages (0-100), making the format resolution-independent.

## Element Types

| Type | Description |
|------|-------------|
| `text` | Rich text with font size, weight, style, alignment, color |
| `shape` | Rectangle, circle, rounded-rect, triangle, arrow, line |
| `image` | Images with cover/contain/fill modes |
| `chart` | Bar charts with labels and datasets (SVG rendered) |

## PPTX Template Import

Import a .pptx file to extract its theme (colors, fonts) and apply it to your deck. The importer reads:

- Theme colors from `ppt/theme/theme1.xml`
- Slide content (text boxes, shapes, positions)
- Layout information

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS v4
- Zustand (state management)
- react-rnd (drag and resize)
- pptxgenjs (PPTX export)
- JSZip (PPTX import/parsing)
- Lucide React (icons)

## Build

```bash
npm run build    # Production build → dist/
npm run preview  # Preview production build
```

## License

MIT
