import { useDeckStore } from '../../store/deckStore';
import type { TextContent, ShapeContent, ImageContent } from '../../types/slides';
import { Trash2, Lock, Unlock } from 'lucide-react';

function LabeledInput({ label, type = 'text', value, onChange, min, max, step }: {
  label: string;
  type?: string;
  value: string | number;
  onChange: (v: string) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <label className="text-xs text-gray-500 w-20 flex-shrink-0">{label}</label>
      <input
        type={type}
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 outline-none focus:border-indigo-400"
      />
    </div>
  );
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <label className="text-xs text-gray-500 w-20 flex-shrink-0">{label}</label>
      <div className="flex items-center gap-1 flex-1">
        <input
          type="color"
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="w-7 h-6 rounded border border-gray-200 cursor-pointer p-0"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 outline-none focus:border-indigo-400"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

function SelectInput({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <label className="text-xs text-gray-500 w-20 flex-shrink-0">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 outline-none focus:border-indigo-400 bg-white"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

export function PropertyPanel() {
  const { deck, currentSlideIndex, selectedElementId, updateElement, deleteElement } = useDeckStore();
  const slide = deck.slides[currentSlideIndex];
  const element = slide?.elements.find((el) => el.id === selectedElementId);

  if (!element) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-xs text-gray-400 text-center">Select an element to edit its properties</p>
      </div>
    );
  }

  const update = (updates: object) => updateElement(element.id, updates as Parameters<typeof updateElement>[1]);

  const updateContent = (contentUpdates: object) => {
    update({ content: { ...element.content, ...contentUpdates } });
  };

  return (
    <div className="flex-1 overflow-y-auto p-3">
      {/* Position and size */}
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Position & Size</h3>
        <div className="grid grid-cols-2 gap-x-2">
          <div className="flex items-center gap-1 mb-2">
            <label className="text-xs text-gray-500 w-4">X</label>
            <input
              type="number"
              value={Math.round(element.x * 10) / 10}
              onChange={(e) => update({ x: parseFloat(e.target.value) || 0 })}
              className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 outline-none focus:border-indigo-400"
              step={0.1}
              min={0}
              max={100}
            />
            <span className="text-xs text-gray-400">%</span>
          </div>
          <div className="flex items-center gap-1 mb-2">
            <label className="text-xs text-gray-500 w-4">Y</label>
            <input
              type="number"
              value={Math.round(element.y * 10) / 10}
              onChange={(e) => update({ y: parseFloat(e.target.value) || 0 })}
              className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 outline-none focus:border-indigo-400"
              step={0.1}
              min={0}
              max={100}
            />
            <span className="text-xs text-gray-400">%</span>
          </div>
          <div className="flex items-center gap-1 mb-2">
            <label className="text-xs text-gray-500 w-4">W</label>
            <input
              type="number"
              value={Math.round(element.width * 10) / 10}
              onChange={(e) => update({ width: parseFloat(e.target.value) || 1 })}
              className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 outline-none focus:border-indigo-400"
              step={0.1}
              min={1}
              max={100}
            />
            <span className="text-xs text-gray-400">%</span>
          </div>
          <div className="flex items-center gap-1 mb-2">
            <label className="text-xs text-gray-500 w-4">H</label>
            <input
              type="number"
              value={Math.round(element.height * 10) / 10}
              onChange={(e) => update({ height: parseFloat(e.target.value) || 1 })}
              className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 outline-none focus:border-indigo-400"
              step={0.1}
              min={1}
              max={100}
            />
            <span className="text-xs text-gray-400">%</span>
          </div>
        </div>

        {/* Opacity */}
        <div className="flex items-center gap-2 mb-2">
          <label className="text-xs text-gray-500 w-20 flex-shrink-0">Opacity</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={element.opacity}
            onChange={(e) => update({ opacity: parseFloat(e.target.value) })}
            className="flex-1"
          />
          <span className="text-xs text-gray-500 w-8 text-right">{Math.round(element.opacity * 100)}%</span>
        </div>
      </div>

      {/* Text properties */}
      {element.type === 'text' && (() => {
        const tc = element.content as TextContent;
        return (
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Text</h3>
            <LabeledInput
              label="Font Size"
              type="number"
              value={tc.fontSize}
              onChange={(v) => updateContent({ fontSize: parseInt(v, 10) || 16 })}
              min={8}
              max={200}
            />
            <SelectInput
              label="Weight"
              value={tc.fontWeight}
              options={[{ value: 'normal', label: 'Normal' }, { value: 'bold', label: 'Bold' }]}
              onChange={(v) => updateContent({ fontWeight: v })}
            />
            <SelectInput
              label="Style"
              value={tc.fontStyle}
              options={[{ value: 'normal', label: 'Normal' }, { value: 'italic', label: 'Italic' }]}
              onChange={(v) => updateContent({ fontStyle: v })}
            />
            <SelectInput
              label="Align"
              value={tc.textAlign}
              options={[
                { value: 'left', label: 'Left' },
                { value: 'center', label: 'Center' },
                { value: 'right', label: 'Right' },
              ]}
              onChange={(v) => updateContent({ textAlign: v })}
            />
            <ColorInput label="Color" value={tc.color} onChange={(v) => updateContent({ color: v })} />
            <ColorInput
              label="Background"
              value={tc.backgroundColor || ''}
              onChange={(v) => updateContent({ backgroundColor: v || undefined })}
            />
          </div>
        );
      })()}

      {/* Shape properties */}
      {element.type === 'shape' && (() => {
        const sc = element.content as ShapeContent;
        return (
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Shape</h3>
            <ColorInput label="Fill" value={sc.fill} onChange={(v) => updateContent({ fill: v })} />
            <ColorInput label="Stroke" value={sc.stroke} onChange={(v) => updateContent({ stroke: v })} />
            <LabeledInput
              label="Stroke Width"
              type="number"
              value={sc.strokeWidth}
              onChange={(v) => updateContent({ strokeWidth: parseInt(v, 10) || 0 })}
              min={0}
              max={20}
            />
            {(sc.shape === 'rounded-rect') && (
              <LabeledInput
                label="Radius"
                type="number"
                value={sc.borderRadius || 0}
                onChange={(v) => updateContent({ borderRadius: parseInt(v, 10) || 0 })}
                min={0}
                max={100}
              />
            )}
          </div>
        );
      })()}

      {/* Image properties */}
      {element.type === 'image' && (() => {
        const ic = element.content as ImageContent;
        return (
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Image</h3>
            <div className="mb-2">
              <label className="text-xs text-gray-500 block mb-1">Source URL</label>
              <input
                type="text"
                value={ic.src}
                onChange={(e) => updateContent({ src: e.target.value })}
                className="w-full text-xs border border-gray-200 rounded px-2 py-1 outline-none focus:border-indigo-400"
                placeholder="https://..."
              />
            </div>
            <SelectInput
              label="Fit"
              value={ic.fit}
              options={[
                { value: 'contain', label: 'Contain' },
                { value: 'cover', label: 'Cover' },
                { value: 'fill', label: 'Fill' },
              ]}
              onChange={(v) => updateContent({ fit: v })}
            />
            <LabeledInput
              label="Border Radius"
              type="number"
              value={ic.borderRadius || 0}
              onChange={(v) => updateContent({ borderRadius: parseInt(v, 10) || 0 })}
              min={0}
              max={200}
            />
          </div>
        );
      })()}

      {/* Actions */}
      <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
        <button
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 px-2 py-1 rounded hover:bg-indigo-50"
          onClick={() => update({ locked: !element.locked })}
          title={element.locked ? 'Unlock' : 'Lock'}
        >
          {element.locked ? <Lock size={12} /> : <Unlock size={12} />}
          {element.locked ? 'Locked' : 'Lock'}
        </button>
        <button
          className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50"
          onClick={() => deleteElement(element.id)}
        >
          <Trash2 size={12} />
          Delete
        </button>
      </div>
    </div>
  );
}
