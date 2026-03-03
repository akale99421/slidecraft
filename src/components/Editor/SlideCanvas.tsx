import { useRef, useEffect, useState } from 'react';
import { useDeckStore } from '../../store/deckStore';
import { SlideElementComponent } from './SlideElement';

export function SlideCanvas() {
  const { deck, currentSlideIndex, selectedElementId, selectElement } = useDeckStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 450 });

  const slide = deck.slides[currentSlideIndex];

  useEffect(() => {
    function updateSize() {
      if (!containerRef.current) return;
      const container = containerRef.current;
      const cw = container.clientWidth - 48; // padding
      const ch = container.clientHeight - 48;

      // 16:9 ratio
      let w = cw;
      let h = w * (9 / 16);

      if (h > ch) {
        h = ch;
        w = h * (16 / 9);
      }

      setCanvasSize({ width: Math.floor(w), height: Math.floor(h) });
    }

    updateSize();
    const ro = new ResizeObserver(updateSize);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  if (!slide) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <p className="text-gray-400 text-sm">No slide selected</p>
      </div>
    );
  }

  const bg = slide.background
    ? slide.background.type === 'solid'
      ? slide.background.value
      : slide.background.type === 'gradient'
      ? slide.background.value
      : `url(${slide.background.value}) center/cover no-repeat`
    : deck.theme.colors.background;

  const bgStyle: React.CSSProperties =
    slide.background?.type === 'image'
      ? { backgroundImage: `url(${slide.background.value})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : { background: bg };

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-gray-100 flex items-center justify-center overflow-hidden"
      onClick={() => selectElement(null)}
    >
      <div
        className="slide-canvas"
        style={{
          width: canvasSize.width,
          height: canvasSize.height,
          position: 'relative',
          ...bgStyle,
        }}
      >
        {slide.elements.map((element) => (
          <SlideElementComponent
            key={element.id}
            element={element}
            canvasWidth={canvasSize.width}
            canvasHeight={canvasSize.height}
            isSelected={element.id === selectedElementId}
          />
        ))}
      </div>
    </div>
  );
}
