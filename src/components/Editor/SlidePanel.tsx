import { useState } from 'react';
import { Plus, Copy, Trash2 } from 'lucide-react';
import { useDeckStore } from '../../store/deckStore';
import type { Slide, SlideElement, TextContent, ShapeContent } from '../../types/slides';

// Tiny inline renderer for thumbnails
function ThumbnailElement({ el }: { el: SlideElement }) {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${el.x}%`,
    top: `${el.y}%`,
    width: `${el.width}%`,
    height: `${el.height}%`,
    opacity: el.opacity,
  };

  if (el.type === 'text') {
    const c = el.content as TextContent;
    return (
      <div style={{ ...style, overflow: 'hidden', fontSize: `${c.fontSize * 0.06}px`, color: c.color, fontWeight: c.fontWeight, textAlign: c.textAlign, padding: '1px' }}>
        {c.text}
      </div>
    );
  }

  if (el.type === 'shape') {
    const c = el.content as ShapeContent;
    let extra: React.CSSProperties = {};
    if (c.shape === 'circle') extra = { borderRadius: '50%' };
    else if (c.shape === 'rounded-rect') extra = { borderRadius: `${(c.borderRadius || 12) * 0.05}px` };
    else if (c.shape === 'triangle') extra = { background: 'none', width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderBottom: `8px solid ${c.fill}` };

    return <div style={{ ...style, background: c.shape === 'triangle' ? 'transparent' : c.fill, border: c.strokeWidth ? `1px solid ${c.stroke}` : 'none', ...extra }} />;
  }

  if (el.type === 'image') {
    return <div style={{ ...style, background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4px', color: '#94a3b8' }}>IMG</div>;
  }

  return null;
}

function SlideThumbnail({ slide, index, isActive, onClick }: {
  slide: Slide;
  index: number;
  isActive: boolean;
  onClick: () => void;
}) {
  const { deleteSlide, duplicateSlide, deck } = useDeckStore();
  const [showActions, setShowActions] = useState(false);

  const bg = slide.background
    ? slide.background.type === 'solid' ? slide.background.value : '#fff'
    : deck.theme.colors.background;

  return (
    <div
      className="relative px-2 py-1 group"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-center gap-1 mb-0.5">
        <span className="text-xs text-gray-400 w-4 text-right">{index + 1}</span>
      </div>
      <div
        className={`slide-thumbnail relative overflow-hidden`}
        style={{
          width: '100%',
          paddingBottom: `${(9 / 16) * 100}%`,
          background: bg,
          borderColor: isActive ? '#4f46e5' : 'transparent',
          borderWidth: '2px',
          borderStyle: 'solid',
          borderRadius: '2px',
          cursor: 'pointer',
          boxShadow: isActive ? '0 0 0 1px #4f46e5' : '0 1px 3px rgba(0,0,0,0.1)',
        }}
        onClick={onClick}
      >
        <div style={{ position: 'absolute', inset: 0 }}>
          {slide.elements.filter((el) => el.visible).map((el) => (
            <ThumbnailElement key={el.id} el={el} />
          ))}
        </div>
      </div>

      {/* Action buttons on hover */}
      {showActions && (
        <div className="absolute right-3 top-6 flex flex-col gap-0.5 z-10">
          <button
            className="p-0.5 bg-white rounded shadow-sm border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-700"
            onClick={(e) => { e.stopPropagation(); duplicateSlide(index); }}
            title="Duplicate"
          >
            <Copy size={11} />
          </button>
          <button
            className="p-0.5 bg-white rounded shadow-sm border border-gray-200 hover:bg-red-50 text-gray-500 hover:text-red-500"
            onClick={(e) => { e.stopPropagation(); deleteSlide(index); }}
            title="Delete"
          >
            <Trash2 size={11} />
          </button>
        </div>
      )}
    </div>
  );
}

export function SlidePanel() {
  const { deck, currentSlideIndex, selectSlide, addSlide } = useDeckStore();

  return (
    <div className="w-52 flex-shrink-0 bg-gray-50 border-r border-gray-200 flex flex-col">
      <div className="flex-1 overflow-y-auto slide-panel-scroll py-2">
        {deck.slides.map((slide, index) => (
          <SlideThumbnail
            key={slide.id}
            slide={slide}
            index={index}
            isActive={index === currentSlideIndex}
            onClick={() => selectSlide(index)}
          />
        ))}
      </div>

      <div className="p-2 border-t border-gray-200">
        <button
          className="w-full flex items-center justify-center gap-1.5 py-1.5 text-sm text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded border border-dashed border-gray-300 hover:border-indigo-300 transition-colors"
          onClick={() => addSlide()}
        >
          <Plus size={14} />
          Add Slide
        </button>
      </div>
    </div>
  );
}
