import { useRef, useState } from 'react';
import {
  Type,
  Image,
  Square,
  Circle,
  Triangle,
  ArrowRight,
  RectangleHorizontal,
  Download,
  Upload,
  FileJson,
  Undo2,
  Redo2,
  MessageSquare,
  ChevronDown,
} from 'lucide-react';
import { useDeckStore } from '../../store/deckStore';
import type { ShapeContent } from '../../types/slides';
import { createTextElement, createShapeElement, createImageElement } from '../../types/slides';
import { exportToPptx } from '../../utils/pptxExport';
import { importFromPptx, importTemplate } from '../../utils/pptxImport';

export function Toolbar() {
  const {
    deck,
    updateDeckTitle,
    addElement,
    undo,
    redo,
    setDeck,
    updateTheme,
    showChat,
    setShowChat,
    setShowJsonView,
    showJsonView,
    historyIndex,
    history,
  } = useDeckStore();

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(deck.title);
  const [showShapeMenu, setShowShapeMenu] = useState(false);
  const [exporting, setExporting] = useState(false);
  const pptxImportRef = useRef<HTMLInputElement>(null);
  const templateImportRef = useRef<HTMLInputElement>(null);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleTitleBlur = () => {
    setEditingTitle(false);
    updateDeckTitle(titleValue.trim() || 'Untitled Presentation');
  };

  const handleAddText = () => {
    addElement(createTextElement());
  };

  const handleAddShape = (shape: ShapeContent['shape']) => {
    addElement(createShapeElement(shape));
    setShowShapeMenu(false);
  };

  const handleAddImage = () => {
    const src = prompt('Enter image URL:');
    if (src) {
      addElement(createImageElement(src));
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportToPptx(deck);
    } catch (err) {
      alert(`Export failed: ${err}`);
    } finally {
      setExporting(false);
    }
  };

  const handlePptxImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importFromPptx(file);
      setDeck(imported);
    } catch (err) {
      alert(`Import failed: ${err}`);
    }
    e.target.value = '';
  };

  const handleTemplateImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const theme = await importTemplate(file);
      updateTheme(theme);
    } catch (err) {
      alert(`Template import failed: ${err}`);
    }
    e.target.value = '';
  };

  const shapes: Array<{ shape: ShapeContent['shape']; icon: React.ReactNode; label: string }> = [
    { shape: 'rectangle', icon: <RectangleHorizontal size={14} />, label: 'Rectangle' },
    { shape: 'circle', icon: <Circle size={14} />, label: 'Circle' },
    { shape: 'rounded-rect', icon: <Square size={14} />, label: 'Rounded Rect' },
    { shape: 'triangle', icon: <Triangle size={14} />, label: 'Triangle' },
    { shape: 'arrow', icon: <ArrowRight size={14} />, label: 'Arrow' },
  ];

  return (
    <div className="h-12 bg-white border-b border-gray-200 flex items-center px-3 gap-1 flex-shrink-0 z-10">
      {/* Title */}
      <div className="flex items-center mr-3">
        {editingTitle ? (
          <input
            className="text-sm font-medium text-gray-800 border border-indigo-400 rounded px-2 py-0.5 outline-none w-48"
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTitleBlur();
              if (e.key === 'Escape') { setEditingTitle(false); setTitleValue(deck.title); }
            }}
            autoFocus
          />
        ) : (
          <button
            className="text-sm font-medium text-gray-800 hover:text-indigo-600 px-2 py-1 rounded hover:bg-gray-50 max-w-[200px] truncate"
            onClick={() => { setEditingTitle(true); setTitleValue(deck.title); }}
            title="Click to rename"
          >
            {deck.title}
          </button>
        )}
      </div>

      <div className="w-px h-6 bg-gray-200 mx-1" />

      {/* Undo/Redo */}
      <button
        className="toolbar-btn"
        onClick={undo}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
      >
        <Undo2 size={16} />
      </button>
      <button
        className="toolbar-btn"
        onClick={redo}
        disabled={!canRedo}
        title="Redo (Ctrl+Shift+Z)"
      >
        <Redo2 size={16} />
      </button>

      <div className="w-px h-6 bg-gray-200 mx-1" />

      {/* Insert elements */}
      <button
        className="toolbar-btn"
        onClick={handleAddText}
        title="Add Text"
      >
        <Type size={16} />
      </button>

      {/* Shape dropdown */}
      <div className="relative">
        <button
          className="toolbar-btn flex items-center gap-0.5"
          onClick={() => setShowShapeMenu((v) => !v)}
          title="Add Shape"
        >
          <Square size={16} />
          <ChevronDown size={10} />
        </button>
        {showShapeMenu && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg py-1 z-50 w-40">
            {shapes.map(({ shape, icon, label }) => (
              <button
                key={shape}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => handleAddShape(shape)}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        className="toolbar-btn"
        onClick={handleAddImage}
        title="Add Image"
      >
        <Image size={16} />
      </button>

      <div className="flex-1" />

      {/* Actions */}
      <button
        className="toolbar-btn"
        onClick={() => { setShowJsonView(!showJsonView); setShowChat(true); }}
        title="Toggle JSON View"
      >
        <FileJson size={16} />
      </button>

      <button
        className="toolbar-btn"
        onClick={() => templateImportRef.current?.click()}
        title="Import Template (.pptx theme)"
      >
        <Upload size={14} />
        <span className="text-xs ml-1 hidden sm:inline">Theme</span>
      </button>

      <button
        className="toolbar-btn"
        onClick={() => pptxImportRef.current?.click()}
        title="Import PPTX"
      >
        <Upload size={16} />
        <span className="text-xs ml-1 hidden sm:inline">Import</span>
      </button>

      <button
        className="toolbar-btn"
        onClick={handleExport}
        disabled={exporting}
        title="Export PPTX"
      >
        <Download size={16} />
        <span className="text-xs ml-1 hidden sm:inline">{exporting ? 'Exporting…' : 'Export'}</span>
      </button>

      <div className="w-px h-6 bg-gray-200 mx-1" />

      <button
        className={`toolbar-btn ${showChat ? 'text-indigo-600 bg-indigo-50' : ''}`}
        onClick={() => setShowChat(!showChat)}
        title="Toggle Chat Panel"
      >
        <MessageSquare size={16} />
      </button>

      {/* Hidden file inputs */}
      <input
        ref={pptxImportRef}
        type="file"
        accept=".pptx"
        className="hidden"
        onChange={handlePptxImport}
      />
      <input
        ref={templateImportRef}
        type="file"
        accept=".pptx"
        className="hidden"
        onChange={handleTemplateImport}
      />
    </div>
  );
}
