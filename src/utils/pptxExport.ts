import PptxGenJS from 'pptxgenjs';
import type { Deck, TextContent, ShapeContent, ImageContent } from '../types/slides';

function pptxColor(hex: string): string {
  // pptxgenjs expects hex without #
  return hex.replace('#', '').toUpperCase();
}

// pptxgenjs uses inches for positioning; 16:9 at 10in wide = 5.625in tall
const SLIDE_W = 10;
const SLIDE_H = 5.625;

function pct(v: number, total: number): number {
  return (v / 100) * total;
}

export async function exportToPptx(deck: Deck): Promise<void> {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'CUSTOM_169', width: SLIDE_W, height: SLIDE_H });
  pptx.layout = 'CUSTOM_169';
  pptx.title = deck.title;

  for (const slide of deck.slides) {
    const pSlide = pptx.addSlide();

    // Background
    if (slide.background) {
      if (slide.background.type === 'solid') {
        pSlide.background = { fill: pptxColor(slide.background.value) };
      } else if (slide.background.type === 'image') {
        pSlide.background = { path: slide.background.value };
      }
    } else {
      pSlide.background = { fill: pptxColor(deck.theme.colors.background) };
    }

    for (const el of slide.elements) {
      if (!el.visible) continue;

      const x = pct(el.x, SLIDE_W);
      const y = pct(el.y, SLIDE_H);
      const w = pct(el.width, SLIDE_W);
      const h = pct(el.height, SLIDE_H);
      const transparencyPct = Math.round((1 - el.opacity) * 100);

      if (el.type === 'text') {
        const content = el.content as TextContent;
        pSlide.addText(content.text, {
          x,
          y,
          w,
          h,
          fontSize: content.fontSize * 0.75,
          bold: content.fontWeight === 'bold',
          italic: content.fontStyle === 'italic',
          align: content.textAlign as 'left' | 'center' | 'right',
          color: pptxColor(content.color),
          fontFace: content.fontFamily || deck.theme.fonts.body,
          // transparency on text goes at the paragraph/run level; skip for simplicity
        });
        void transparencyPct;
      } else if (el.type === 'shape') {
        const content = el.content as ShapeContent;
        let shapeType: Parameters<typeof pSlide.addShape>[0] = pptx.ShapeType.rect;

        switch (content.shape) {
          case 'circle':
            shapeType = pptx.ShapeType.ellipse;
            break;
          case 'rounded-rect':
            shapeType = pptx.ShapeType.roundRect;
            break;
          case 'triangle':
            shapeType = pptx.ShapeType.triangle;
            break;
          case 'arrow':
            shapeType = pptx.ShapeType.rightArrow;
            break;
          default:
            shapeType = pptx.ShapeType.rect;
        }

        pSlide.addShape(shapeType, {
          x,
          y,
          w,
          h,
          fill: { color: pptxColor(content.fill), transparency: transparencyPct },
          line: content.strokeWidth > 0
            ? { color: pptxColor(content.stroke), width: content.strokeWidth }
            : { width: 0 },
        });
      } else if (el.type === 'image') {
        const content = el.content as ImageContent;
        if (content.src) {
          try {
            pSlide.addImage({
              data: content.src.startsWith('data:') ? content.src : undefined,
              path: content.src.startsWith('data:') ? undefined : content.src,
              x,
              y,
              w,
              h,
            });
          } catch {
            // Skip images that can't be added
          }
        }
      }
    }
  }

  await pptx.writeFile({ fileName: `${deck.title || 'presentation'}.pptx` });
}
