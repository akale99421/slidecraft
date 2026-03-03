import { useEffect } from 'react';
import { useDeckStore } from '../store/deckStore';

export function useKeyboard() {
  const {
    selectedElementId,
    deleteElement,
    duplicateElement,
    selectElement,
    updateElement,
    undo,
    redo,
    deck,
    currentSlideIndex,
  } = useDeckStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Don't intercept if user is typing in an input, textarea, or contenteditable
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const isCtrl = e.ctrlKey || e.metaKey;

      // Undo
      if (isCtrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo
      if ((isCtrl && e.shiftKey && e.key === 'Z') || (isCtrl && e.key === 'y')) {
        e.preventDefault();
        redo();
        return;
      }

      if (!selectedElementId) return;

      // Delete element
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteElement(selectedElementId);
        return;
      }

      // Duplicate element
      if (isCtrl && e.key === 'd') {
        e.preventDefault();
        duplicateElement(selectedElementId);
        return;
      }

      // Escape to deselect
      if (e.key === 'Escape') {
        selectElement(null);
        return;
      }

      // Arrow keys to nudge
      const slide = deck.slides[currentSlideIndex];
      if (!slide) return;
      const el = slide.elements.find((e) => e.id === selectedElementId);
      if (!el || el.locked) return;

      const nudge = e.shiftKey ? 1 : 0.2;
      let dx = 0;
      let dy = 0;

      switch (e.key) {
        case 'ArrowLeft':
          dx = -nudge;
          break;
        case 'ArrowRight':
          dx = nudge;
          break;
        case 'ArrowUp':
          dy = -nudge;
          break;
        case 'ArrowDown':
          dy = nudge;
          break;
        default:
          return;
      }

      e.preventDefault();
      updateElement(selectedElementId, {
        x: Math.max(0, Math.min(100 - el.width, el.x + dx)),
        y: Math.max(0, Math.min(100 - el.height, el.y + dy)),
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, deleteElement, duplicateElement, selectElement, updateElement, undo, redo, deck, currentSlideIndex]);
}
