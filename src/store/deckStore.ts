import { create } from 'zustand';
import type {
  Deck,
  Slide,
  SlideElement,
  Theme,
  ChatMessage,
} from '../types/slides';
import {
  DEFAULT_THEME,
  createTitleSlide,
  createBlankSlide,
} from '../types/slides';

interface HistoryEntry {
  slides: Slide[];
  title: string;
}

interface DeckStore {
  deck: Deck;
  currentSlideIndex: number;
  selectedElementId: string | null;
  chatMessages: ChatMessage[];
  showChat: boolean;
  showJsonView: boolean;
  history: HistoryEntry[];
  historyIndex: number;

  // Slide actions
  addSlide: (slide?: Slide) => void;
  deleteSlide: (index: number) => void;
  duplicateSlide: (index: number) => void;
  reorderSlides: (fromIndex: number, toIndex: number) => void;
  selectSlide: (index: number) => void;
  updateSlide: (index: number, updates: Partial<Slide>) => void;

  // Element actions
  addElement: (element: SlideElement) => void;
  updateElement: (elementId: string, updates: Partial<SlideElement>) => void;
  deleteElement: (elementId: string) => void;
  selectElement: (elementId: string | null) => void;
  duplicateElement: (elementId: string) => void;

  // Theme and deck actions
  updateTheme: (theme: Partial<Theme>) => void;
  updateDeckTitle: (title: string) => void;
  setDeck: (deck: Deck) => void;

  // Undo/redo
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;

  // Chat
  addChatMessage: (message: ChatMessage) => void;
  clearChat: () => void;

  // UI state
  setShowChat: (show: boolean) => void;
  setShowJsonView: (show: boolean) => void;
}

function createInitialDeck(): Deck {
  return {
    id: crypto.randomUUID(),
    title: 'Untitled Presentation',
    theme: DEFAULT_THEME,
    slides: [createTitleSlide('My Presentation', 'Add your subtitle here')],
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
}

const initialDeck = createInitialDeck();

export const useDeckStore = create<DeckStore>((set, get) => ({
  deck: initialDeck,
  currentSlideIndex: 0,
  selectedElementId: null,
  chatMessages: [],
  showChat: true,
  showJsonView: false,
  history: [{ slides: initialDeck.slides, title: initialDeck.title }],
  historyIndex: 0,

  pushHistory: () => {
    const { deck, history, historyIndex } = get();
    const newEntry: HistoryEntry = {
      slides: JSON.parse(JSON.stringify(deck.slides)),
      title: deck.title,
    };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newEntry);
    // Keep max 50 history entries
    if (newHistory.length > 50) newHistory.shift();
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },

  addSlide: (slide) => {
    get().pushHistory();
    const newSlide = slide || createBlankSlide();
    set((state) => ({
      deck: {
        ...state.deck,
        slides: [...state.deck.slides, newSlide],
      },
      currentSlideIndex: state.deck.slides.length,
      selectedElementId: null,
    }));
  },

  deleteSlide: (index) => {
    const { deck } = get();
    if (deck.slides.length <= 1) return;
    get().pushHistory();
    set((state) => {
      const newSlides = state.deck.slides.filter((_, i) => i !== index);
      const newIndex = Math.min(state.currentSlideIndex, newSlides.length - 1);
      return {
        deck: { ...state.deck, slides: newSlides },
        currentSlideIndex: newIndex,
        selectedElementId: null,
      };
    });
  },

  duplicateSlide: (index) => {
    get().pushHistory();
    set((state) => {
      const slide = state.deck.slides[index];
      const duplicate: Slide = {
        ...JSON.parse(JSON.stringify(slide)),
        id: crypto.randomUUID(),
        elements: slide.elements.map((el) => ({ ...JSON.parse(JSON.stringify(el)), id: crypto.randomUUID() })),
      };
      const newSlides = [...state.deck.slides];
      newSlides.splice(index + 1, 0, duplicate);
      return {
        deck: { ...state.deck, slides: newSlides },
        currentSlideIndex: index + 1,
      };
    });
  },

  reorderSlides: (fromIndex, toIndex) => {
    get().pushHistory();
    set((state) => {
      const newSlides = [...state.deck.slides];
      const [moved] = newSlides.splice(fromIndex, 1);
      newSlides.splice(toIndex, 0, moved);
      return {
        deck: { ...state.deck, slides: newSlides },
        currentSlideIndex: toIndex,
      };
    });
  },

  selectSlide: (index) => {
    set({ currentSlideIndex: index, selectedElementId: null });
  },

  updateSlide: (index, updates) => {
    set((state) => {
      const newSlides = [...state.deck.slides];
      newSlides[index] = { ...newSlides[index], ...updates };
      return { deck: { ...state.deck, slides: newSlides } };
    });
  },

  addElement: (element) => {
    get().pushHistory();
    set((state) => {
      const newSlides = [...state.deck.slides];
      const slide = newSlides[state.currentSlideIndex];
      if (!slide) return state;
      newSlides[state.currentSlideIndex] = {
        ...slide,
        elements: [...slide.elements, element],
      };
      return {
        deck: { ...state.deck, slides: newSlides },
        selectedElementId: element.id,
      };
    });
  },

  updateElement: (elementId, updates) => {
    set((state) => {
      const newSlides = state.deck.slides.map((slide) => ({
        ...slide,
        elements: slide.elements.map((el) =>
          el.id === elementId ? { ...el, ...updates } : el
        ),
      }));
      return { deck: { ...state.deck, slides: newSlides } };
    });
  },

  deleteElement: (elementId) => {
    get().pushHistory();
    set((state) => {
      const newSlides = state.deck.slides.map((slide) => ({
        ...slide,
        elements: slide.elements.filter((el) => el.id !== elementId),
      }));
      return {
        deck: { ...state.deck, slides: newSlides },
        selectedElementId: null,
      };
    });
  },

  selectElement: (elementId) => {
    set({ selectedElementId: elementId });
  },

  duplicateElement: (elementId) => {
    get().pushHistory();
    set((state) => {
      const slide = state.deck.slides[state.currentSlideIndex];
      if (!slide) return state;
      const el = slide.elements.find((e) => e.id === elementId);
      if (!el) return state;
      const duplicate: SlideElement = {
        ...JSON.parse(JSON.stringify(el)),
        id: crypto.randomUUID(),
        x: el.x + 2,
        y: el.y + 2,
      };
      const newSlides = [...state.deck.slides];
      newSlides[state.currentSlideIndex] = {
        ...slide,
        elements: [...slide.elements, duplicate],
      };
      return {
        deck: { ...state.deck, slides: newSlides },
        selectedElementId: duplicate.id,
      };
    });
  },

  updateTheme: (themeUpdates) => {
    set((state) => ({
      deck: {
        ...state.deck,
        theme: {
          ...state.deck.theme,
          ...themeUpdates,
          colors: { ...state.deck.theme.colors, ...themeUpdates.colors },
          fonts: { ...state.deck.theme.fonts, ...themeUpdates.fonts },
        },
      },
    }));
  },

  updateDeckTitle: (title) => {
    set((state) => ({ deck: { ...state.deck, title } }));
  },

  setDeck: (deck) => {
    get().pushHistory();
    set({ deck, currentSlideIndex: 0, selectedElementId: null });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    const entry = history[newIndex];
    set((state) => ({
      deck: { ...state.deck, slides: JSON.parse(JSON.stringify(entry.slides)), title: entry.title },
      historyIndex: newIndex,
      selectedElementId: null,
    }));
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    const entry = history[newIndex];
    set((state) => ({
      deck: { ...state.deck, slides: JSON.parse(JSON.stringify(entry.slides)), title: entry.title },
      historyIndex: newIndex,
      selectedElementId: null,
    }));
  },

  addChatMessage: (message) => {
    set((state) => ({ chatMessages: [...state.chatMessages, message] }));
  },

  clearChat: () => {
    set({ chatMessages: [] });
  },

  setShowChat: (show) => {
    set({ showChat: show });
  },

  setShowJsonView: (show) => {
    set({ showJsonView: show });
  },
}));
