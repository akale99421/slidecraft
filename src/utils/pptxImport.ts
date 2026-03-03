import JSZip from 'jszip';
import type { Deck, Slide, SlideElement, Theme } from '../types/slides';
import {
  DEFAULT_THEME,
  createBlankSlide,
  createTextElement,
  createShapeElement,
} from '../types/slides';

function parseColor(colorStr: string | undefined | null): string {
  if (!colorStr) return '#000000';
  if (colorStr.startsWith('#')) return colorStr;
  if (colorStr.length === 6 || colorStr.length === 8) {
    // AARRGGBB or RRGGBB
    const hex = colorStr.length === 8 ? colorStr.slice(2) : colorStr;
    return `#${hex}`;
  }
  return `#${colorStr}`;
}

function getTextContent(el: Element): string {
  const texts: string[] = [];
  el.querySelectorAll('a\\:t, t').forEach((t) => {
    texts.push(t.textContent || '');
  });
  return texts.join('');
}

function emTransform(value: string | null, total: number): number {
  if (!value) return 0;
  // EMU to percentage: 1 inch = 914400 EMU; slide is 9144000 x 5143500 EMU for 10x5.625in
  const SLIDE_W_EMU = 9144000;
  const SLIDE_H_EMU = 5143500;
  const emu = parseInt(value, 10);
  return (emu / (total === SLIDE_W_EMU ? SLIDE_W_EMU : SLIDE_H_EMU)) * 100;
}

async function parseSlide(xml: string): Promise<Slide> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');
  const slide = createBlankSlide();
  const elements: SlideElement[] = [];

  const SLIDE_W_EMU = 9144000;
  const SLIDE_H_EMU = 5143500;

  // Process shapes
  const spTree = doc.querySelector('spTree, p\\:spTree');
  if (spTree) {
    const shapes = spTree.querySelectorAll('sp, p\\:sp');
    shapes.forEach((sp, index) => {
      const xfrm = sp.querySelector('xfrm, a\\:xfrm');
      const off = xfrm?.querySelector('off, a\\:off');
      const ext = xfrm?.querySelector('ext, a\\:ext');

      const x = off ? emTransform(off.getAttribute('x'), SLIDE_W_EMU) : 10;
      const y = off ? emTransform(off.getAttribute('y'), SLIDE_H_EMU) : 10;
      const w = ext ? emTransform(ext.getAttribute('cx'), SLIDE_W_EMU) : 30;
      const h = ext ? emTransform(ext.getAttribute('cy'), SLIDE_H_EMU) : 20;

      const txBody = sp.querySelector('txBody, p\\:txBody');
      if (txBody) {
        const text = getTextContent(txBody);
        if (text.trim()) {
          const fontSize = parseInt(txBody.querySelector('rPr, a\\:rPr')?.getAttribute('sz') || '1800', 10) / 100;
          const boldEl = txBody.querySelector('rPr[b="1"], a\\:rPr[b="1"]');
          const colorEl = txBody.querySelector('solidFill srgbClr, a\\:solidFill a\\:srgbClr');

          elements.push(createTextElement({
            id: crypto.randomUUID(),
            x: Math.max(0, Math.min(100, x)),
            y: Math.max(0, Math.min(100, y)),
            width: Math.max(1, Math.min(100, w)),
            height: Math.max(1, Math.min(100, h)),
            zIndex: index,
            content: {
              type: 'text',
              text,
              fontSize: Math.max(8, Math.min(120, fontSize)),
              fontWeight: boldEl ? 'bold' : 'normal',
              fontStyle: 'normal',
              textAlign: 'left',
              color: colorEl ? parseColor(colorEl.getAttribute('val')) : '#1e293b',
              padding: 8,
            },
          }));
        }
      } else {
        // It's a shape
        const spPr = sp.querySelector('spPr, p\\:spPr');
        const fillEl = spPr?.querySelector('solidFill srgbClr, a\\:solidFill a\\:srgbClr');
        elements.push(createShapeElement('rectangle', {
          id: crypto.randomUUID(),
          x: Math.max(0, Math.min(100, x)),
          y: Math.max(0, Math.min(100, y)),
          width: Math.max(1, Math.min(100, w)),
          height: Math.max(1, Math.min(100, h)),
          zIndex: index,
          content: {
            type: 'shape',
            shape: 'rectangle',
            fill: fillEl ? parseColor(fillEl.getAttribute('val')) : '#4f46e5',
            stroke: 'transparent',
            strokeWidth: 0,
          },
        }));
      }
    });
  }

  slide.elements = elements;
  return slide;
}

async function parseTheme(xml: string): Promise<Partial<Theme>> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');

  const dk1 = doc.querySelector('dk1 srgbClr, a\\:dk1 a\\:srgbClr')?.getAttribute('val');
  const lt1 = doc.querySelector('lt1 srgbClr, a\\:lt1 a\\:srgbClr')?.getAttribute('val');
  const accent1 = doc.querySelector('accent1 srgbClr, a\\:accent1 a\\:srgbClr')?.getAttribute('val');

  const majorFont = doc.querySelector('majorFont latin, a\\:majorFont a\\:latin')?.getAttribute('typeface');
  const minorFont = doc.querySelector('minorFont latin, a\\:minorFont a\\:latin')?.getAttribute('typeface');

  return {
    colors: {
      primary: dk1 ? parseColor(dk1) : DEFAULT_THEME.colors.primary,
      secondary: DEFAULT_THEME.colors.secondary,
      accent: accent1 ? parseColor(accent1) : DEFAULT_THEME.colors.accent,
      background: lt1 ? parseColor(lt1) : DEFAULT_THEME.colors.background,
      surface: DEFAULT_THEME.colors.surface,
      text: dk1 ? parseColor(dk1) : DEFAULT_THEME.colors.text,
      textLight: DEFAULT_THEME.colors.textLight,
    },
    fonts: {
      heading: majorFont ? `${majorFont}, sans-serif` : DEFAULT_THEME.fonts.heading,
      body: minorFont ? `${minorFont}, sans-serif` : DEFAULT_THEME.fonts.body,
      mono: DEFAULT_THEME.fonts.mono,
    },
  };
}

export async function importFromPptx(file: File): Promise<Deck> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  // Parse theme
  let theme: Theme = { ...DEFAULT_THEME };
  const themeFile = zip.file('ppt/theme/theme1.xml');
  if (themeFile) {
    const themeXml = await themeFile.async('string');
    const themeOverrides = await parseTheme(themeXml);
    theme = {
      name: 'Imported',
      colors: { ...DEFAULT_THEME.colors, ...themeOverrides.colors },
      fonts: { ...DEFAULT_THEME.fonts, ...themeOverrides.fonts },
    };
  }

  // Find all slides
  const slideFiles: Array<{ index: number; file: JSZip.JSZipObject }> = [];
  zip.forEach((path, file) => {
    const match = path.match(/^ppt\/slides\/slide(\d+)\.xml$/);
    if (match) {
      slideFiles.push({ index: parseInt(match[1], 10), file });
    }
  });

  slideFiles.sort((a, b) => a.index - b.index);

  const slides: Slide[] = [];
  for (const { file } of slideFiles) {
    const xml = await file.async('string');
    const slide = await parseSlide(xml);
    slides.push(slide);
  }

  if (slides.length === 0) {
    slides.push(createBlankSlide());
  }

  return {
    id: crypto.randomUUID(),
    title: file.name.replace(/\.pptx$/i, ''),
    theme,
    slides,
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
}

export async function importTemplate(file: File): Promise<Theme> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const themeFile = zip.file('ppt/theme/theme1.xml');
  if (!themeFile) return { ...DEFAULT_THEME };

  const themeXml = await themeFile.async('string');
  const themeOverrides = await parseTheme(themeXml);

  return {
    name: 'Imported Template',
    colors: { ...DEFAULT_THEME.colors, ...themeOverrides.colors },
    fonts: { ...DEFAULT_THEME.fonts, ...themeOverrides.fonts },
  };
}
