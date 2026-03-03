import { useRef, useState, useCallback } from 'react';
import { Rnd } from 'react-rnd';
import type {
  SlideElement as SlideElementType,
  TextContent,
  ShapeContent,
  ImageContent,
  ChartContent,
  ChartData,
} from '../../types/slides';
import { useDeckStore } from '../../store/deckStore';

interface Props {
  element: SlideElementType;
  canvasWidth: number;
  canvasHeight: number;
  isSelected: boolean;
}

function pctToPx(pct: number, total: number): number {
  return (pct / 100) * total;
}

function pxToPct(px: number, total: number): number {
  return (px / total) * 100;
}

// Simple SVG bar chart renderer
function BarChart({ data, colors }: { data: ChartData; colors: string[] }) {
  const max = Math.max(...data.datasets.flatMap((d) => d.values));
  const barWidth = 100 / (data.labels.length * (data.datasets.length + 1) + 1);
  let barX = barWidth;

  return (
    <svg width="100%" height="100%" viewBox="0 0 100 80" preserveAspectRatio="none">
      {data.labels.map((label, li) => {
        const bars = data.datasets.map((ds, di) => {
          const value = ds.values[li] ?? 0;
          const barH = (value / max) * 60;
          const x = barX;
          barX += barWidth;
          const color = colors[di] ?? '#4f46e5';
          return (
            <g key={di}>
              <rect x={x} y={70 - barH} width={barWidth * 0.8} height={barH} fill={color} />
            </g>
          );
        });
        barX += barWidth * 0.5;
        return (
          <g key={li}>
            {bars}
            <text x={barX - barWidth * 2} y={78} fontSize="4" textAnchor="middle" fill="#64748b">{label}</text>
          </g>
        );
      })}
      <line x1={0} y1={70} x2={100} y2={70} stroke="#e2e8f0" strokeWidth={0.5} />
    </svg>
  );
}

function ShapeRenderer({ content }: { content: ShapeContent; width?: number; height?: number }) {
  const style: React.CSSProperties = {
    width: '100%',
    height: '100%',
    background: content.fill,
    border: content.strokeWidth > 0 ? `${content.strokeWidth}px solid ${content.stroke}` : 'none',
    boxSizing: 'border-box',
  };

  if (content.shape === 'circle') {
    return <div style={{ ...style, borderRadius: '50%' }} />;
  }
  if (content.shape === 'rounded-rect') {
    return <div style={{ ...style, borderRadius: `${content.borderRadius || 12}px` }} />;
  }
  if (content.shape === 'triangle') {
    return (
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polygon
          points="50,0 100,100 0,100"
          fill={content.fill}
          stroke={content.stroke}
          strokeWidth={content.strokeWidth}
        />
      </svg>
    );
  }
  if (content.shape === 'arrow') {
    return (
      <svg width="100%" height="100%" viewBox="0 0 100 40" preserveAspectRatio="none">
        <polygon
          points="0,10 75,10 75,0 100,20 75,40 75,30 0,30"
          fill={content.fill}
          stroke={content.stroke}
          strokeWidth={content.strokeWidth}
        />
      </svg>
    );
  }
  if (content.shape === 'line') {
    return (
      <svg width="100%" height="100%" viewBox="0 0 100 10" preserveAspectRatio="none">
        <line
          x1={0} y1={5} x2={100} y2={5}
          stroke={content.stroke || content.fill}
          strokeWidth={Math.max(content.strokeWidth, 2)}
        />
      </svg>
    );
  }

  // Default: rectangle
  return <div style={style} />;
}

export function SlideElementComponent({ element, canvasWidth, canvasHeight, isSelected }: Props) {
  const { updateElement, selectElement } = useDeckStore();
  const [isEditing, setIsEditing] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  const x = pctToPx(element.x, canvasWidth);
  const y = pctToPx(element.y, canvasHeight);
  const w = pctToPx(element.width, canvasWidth);
  const h = pctToPx(element.height, canvasHeight);

  const handleDragStop = useCallback(
    (_e: unknown, d: { x: number; y: number }) => {
      updateElement(element.id, {
        x: Math.max(0, pxToPct(d.x, canvasWidth)),
        y: Math.max(0, pxToPct(d.y, canvasHeight)),
      });
    },
    [element.id, canvasWidth, canvasHeight, updateElement]
  );

  const handleResizeStop = useCallback(
    (
      _e: unknown,
      _dir: unknown,
      ref: HTMLElement,
      _delta: unknown,
      pos: { x: number; y: number }
    ) => {
      updateElement(element.id, {
        x: Math.max(0, pxToPct(pos.x, canvasWidth)),
        y: Math.max(0, pxToPct(pos.y, canvasHeight)),
        width: Math.max(1, pxToPct(ref.offsetWidth, canvasWidth)),
        height: Math.max(1, pxToPct(ref.offsetHeight, canvasHeight)),
      });
    },
    [element.id, canvasWidth, canvasHeight, updateElement]
  );

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectElement(element.id);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (element.type === 'text' && !element.locked) {
      setIsEditing(true);
      setTimeout(() => {
        textRef.current?.focus();
        // Place cursor at end
        const range = document.createRange();
        const sel = window.getSelection();
        if (textRef.current && sel) {
          range.selectNodeContents(textRef.current);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }, 0);
    }
  };

  const handleTextBlur = () => {
    setIsEditing(false);
    if (textRef.current && element.type === 'text') {
      const text = textRef.current.innerText;
      const currentContent = element.content as TextContent;
      updateElement(element.id, {
        content: { ...currentContent, text },
      });
    }
  };

  const content = element.content;

  const renderContent = () => {
    if (content.type === 'text') {
      const tc = content as TextContent;
      return (
        <div
          ref={textRef}
          contentEditable={isEditing}
          suppressContentEditableWarning
          onBlur={handleTextBlur}
          className={isEditing ? 'element-text-editing' : ''}
          style={{
            width: '100%',
            height: '100%',
            fontSize: `${tc.fontSize}px`,
            fontWeight: tc.fontWeight,
            fontStyle: tc.fontStyle,
            textAlign: tc.textAlign,
            color: tc.color,
            backgroundColor: tc.backgroundColor || 'transparent',
            padding: `${tc.padding || 8}px`,
            lineHeight: tc.lineHeight || 1.4,
            overflow: 'hidden',
            boxSizing: 'border-box',
            cursor: isEditing ? 'text' : 'move',
            userSelect: isEditing ? 'text' : 'none',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            display: 'flex',
            alignItems: tc.verticalAlign === 'middle' ? 'center' : tc.verticalAlign === 'bottom' ? 'flex-end' : 'flex-start',
            justifyContent: tc.textAlign === 'center' ? 'center' : tc.textAlign === 'right' ? 'flex-end' : 'flex-start',
          }}
        >
          {tc.text}
        </div>
      );
    }

    if (content.type === 'shape') {
      return <ShapeRenderer content={content as ShapeContent} />;
    }

    if (content.type === 'image') {
      const ic = content as ImageContent;
      return (
        <img
          src={ic.src || 'https://via.placeholder.com/400x300?text=Image'}
          alt={ic.alt}
          style={{
            width: '100%',
            height: '100%',
            objectFit: ic.fit,
            borderRadius: `${ic.borderRadius || 0}px`,
            display: 'block',
          }}
          draggable={false}
        />
      );
    }

    if (content.type === 'chart') {
      const cc = content as ChartContent;
      return (
        <div style={{ width: '100%', height: '100%', background: '#fff', padding: '8px', boxSizing: 'border-box' }}>
          {cc.title && <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#1e293b' }}>{cc.title}</div>}
          <BarChart data={cc.data} colors={cc.colors || ['#4f46e5', '#06b6d4', '#10b981']} />
        </div>
      );
    }

    return null;
  };

  if (!element.visible) return null;

  return (
    <Rnd
      position={{ x, y }}
      size={{ width: w, height: h }}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      bounds="parent"
      disableDragging={element.locked || isEditing}
      enableResizing={isSelected && !element.locked}
      style={{
        opacity: element.opacity,
        zIndex: element.zIndex ?? 1,
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      <div
        className={`slide-element ${isSelected ? 'selected' : ''}`}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          cursor: element.locked ? 'default' : isEditing ? 'text' : 'move',
        }}
      >
        {renderContent()}
      </div>
    </Rnd>
  );
}
