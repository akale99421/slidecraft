import { useDeckStore } from './store/deckStore';
import { Toolbar } from './components/Toolbar/Toolbar';
import { SlidePanel } from './components/Editor/SlidePanel';
import { SlideCanvas } from './components/Editor/SlideCanvas';
import { ChatPanel } from './components/Chat/ChatPanel';
import { useKeyboard } from './hooks/useKeyboard';

export default function App() {
  const { showChat } = useDeckStore();
  useKeyboard();

  return (
    <div id="root" style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Toolbar />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        <SlidePanel />
        <SlideCanvas />
        {showChat && <ChatPanel />}
      </div>
    </div>
  );
}
