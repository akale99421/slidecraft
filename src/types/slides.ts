/**
 * SlideCraft Core Types
 *
 * LLM-friendly JSON schema for slide decks.
 * All positions/sizes are in percentages (0-100) relative to the slide canvas.
 * This makes the format resolution-independent and easy for LLMs to reason about.
 */

export interface Deck {
  id: string;
  title: string;
  theme: Theme;
  slides: Slide[];
  metadata?: DeckMetadata;
}

export interface DeckMetadata {
  author?: string;
  createdAt?: string;
  updatedAt?: string;
  description?: string;
  tags?: string[];
}

export interface Theme {
  name: string;
  colors: ThemeColors;
  fonts: ThemeFonts;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textLight: string;
}

export interface ThemeFonts {
  heading: string;
  body: string;
  mono: string;
}

export interface Slide {
  id: string;
  elements: SlideElement[];
  notes: string;
  background?: SlideBackground;
  layout?: string; // e.g., 'title', 'content', 'two-column', 'blank'
}

export interface SlideBackground {
  type: 'solid' | 'gradient' | 'image';
  value: string; // CSS color, gradient, or image URL
}

export type ElementType = 'text' | 'image' | 'shape' | 'chart';

export interface SlideElement {
  id: string;
  type: ElementType;
  // Position and size as percentages (0-100)
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  locked: boolean;
  visible: boolean;
  opacity: number;
  // Type-specific content
  content: TextContent | ImageContent | ShapeContent | ChartContent;
  // Optional z-index for layering
  zIndex?: number;
}

export interface TextContent {
  type: 'text';
  text: string;
  fontSize: number; // in pt
  fontFamily?: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textAlign: 'left' | 'center' | 'right';
  color: string;
  backgroundColor?: string;
  padding?: number; // in px
  lineHeight?: number;
  verticalAlign?: 'top' | 'middle' | 'bottom';
}

export interface ImageContent {
  type: 'image';
  src: string; // URL or data URI
  alt: string;
  fit: 'cover' | 'contain' | 'fill';
  borderRadius?: number;
}

export interface ShapeContent {
  type: 'shape';
  shape: 'rectangle' | 'circle' | 'rounded-rect' | 'triangle' | 'arrow' | 'line';
  fill: string;
  stroke: string;
  strokeWidth: number;
  borderRadius?: number;
}

export interface ChartContent {
  type: 'chart';
  chartType: 'bar' | 'line' | 'pie' | 'donut';
  data: ChartData;
  title?: string;
  colors?: string[];
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  values: number[];
}

// Chat message types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

// LLM instruction format
export interface SlideInstruction {
  action: 'add_element' | 'modify_element' | 'delete_element' |
          'add_slide' | 'delete_slide' | 'reorder_slides' |
          'modify_theme' | 'modify_slide' | 'replace_deck';
  target?: {
    slideIndex?: number;
    elementId?: string;
  };
  data?: Partial<SlideElement> | Partial<Slide> | Partial<Theme> | Partial<Deck>;
}

// Default theme
export const DEFAULT_THEME: Theme = {
  name: 'Default',
  colors: {
    primary: '#1e293b',
    secondary: '#475569',
    accent: '#4f46e5',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#1e293b',
    textLight: '#64748b',
  },
  fonts: {
    heading: 'Inter, sans-serif',
    body: 'Inter, sans-serif',
    mono: 'JetBrains Mono, monospace',
  },
};

// Helper to create a new element with defaults
export function createTextElement(overrides?: Partial<SlideElement>): SlideElement {
  return {
    id: crypto.randomUUID(),
    type: 'text',
    x: 10,
    y: 10,
    width: 80,
    height: 15,
    rotation: 0,
    locked: false,
    visible: true,
    opacity: 1,
    content: {
      type: 'text',
      text: 'Double-click to edit',
      fontSize: 24,
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'left',
      color: '#1e293b',
      padding: 8,
    },
    ...overrides,
  };
}

export function createShapeElement(shape: ShapeContent['shape'] = 'rectangle', overrides?: Partial<SlideElement>): SlideElement {
  return {
    id: crypto.randomUUID(),
    type: 'shape',
    x: 20,
    y: 20,
    width: 30,
    height: 30,
    rotation: 0,
    locked: false,
    visible: true,
    opacity: 1,
    content: {
      type: 'shape',
      shape,
      fill: '#4f46e5',
      stroke: 'transparent',
      strokeWidth: 0,
      borderRadius: shape === 'rounded-rect' ? 12 : 0,
    },
    ...overrides,
  };
}

export function createImageElement(src: string = '', overrides?: Partial<SlideElement>): SlideElement {
  return {
    id: crypto.randomUUID(),
    type: 'image',
    x: 20,
    y: 20,
    width: 40,
    height: 40,
    rotation: 0,
    locked: false,
    visible: true,
    opacity: 1,
    content: {
      type: 'image',
      src,
      alt: 'Image',
      fit: 'contain',
    },
    ...overrides,
  };
}

export function createBlankSlide(): Slide {
  return {
    id: crypto.randomUUID(),
    elements: [],
    notes: '',
    layout: 'blank',
  };
}

export function createTitleSlide(title: string = 'Untitled Presentation', subtitle: string = ''): Slide {
  const elements: SlideElement[] = [
    createTextElement({
      x: 10,
      y: 30,
      width: 80,
      height: 20,
      content: {
        type: 'text',
        text: title,
        fontSize: 44,
        fontWeight: 'bold',
        fontStyle: 'normal',
        textAlign: 'center',
        color: '#1e293b',
        padding: 8,
      },
    }),
  ];

  if (subtitle) {
    elements.push(
      createTextElement({
        x: 15,
        y: 55,
        width: 70,
        height: 10,
        content: {
          type: 'text',
          text: subtitle,
          fontSize: 24,
          fontWeight: 'normal',
          fontStyle: 'normal',
          textAlign: 'center',
          color: '#64748b',
          padding: 8,
        },
      })
    );
  }

  return {
    id: crypto.randomUUID(),
    elements,
    notes: '',
    layout: 'title',
  };
}
