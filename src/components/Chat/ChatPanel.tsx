import { useState, useRef, useEffect } from 'react';
import { Send, Settings, Copy, Check, X, RefreshCw } from 'lucide-react';
import { useDeckStore } from '../../store/deckStore';
import type { ChatMessage } from '../../types/slides';
import type { LLMSettings } from '../../utils/llm';
import { sendMessage, loadLLMSettings, saveLLMSettings } from '../../utils/llm';
import { PropertyPanel } from '../Properties/PropertyPanel';

const SYSTEM_GREETING = `Hi! I'm SlideCraft AI. I can help you:
- Create and modify slides
- Change themes and colors
- Add or edit elements
- Restructure your presentation

Just describe what you want and I'll update your deck. I return the complete updated deck JSON, so all your changes are preserved.`;

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="px-3 py-2 bg-indigo-50 rounded border border-indigo-100 text-xs text-indigo-700 whitespace-pre-wrap mb-3">
        {message.content}
      </div>
    );
  }

  return (
    <div className={`flex mb-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] px-3 py-2 rounded text-sm whitespace-pre-wrap ${
          isUser
            ? 'bg-indigo-600 text-white'
            : 'bg-white border border-gray-200 text-gray-700'
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}

function JsonView({ json }: { json: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
        <span className="text-xs font-medium text-gray-600">Deck JSON</span>
        <button
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
          onClick={handleCopy}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="flex-1 overflow-auto text-xs text-gray-700 p-3 bg-gray-50 font-mono">
        {json}
      </pre>
    </div>
  );
}

function SettingsModal({ onClose }: { onClose: () => void }) {
  const [settings, setSettings] = useState<LLMSettings>(loadLLMSettings());

  const handleSave = () => {
    saveLLMSettings(settings);
    onClose();
  };

  return (
    <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-80 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-800">LLM Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Base URL</label>
            <input
              type="text"
              value={settings.baseUrl}
              onChange={(e) => setSettings({ ...settings, baseUrl: e.target.value })}
              className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-indigo-400"
              placeholder="https://api.openai.com/v1"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">API Key</label>
            <input
              type="password"
              value={settings.apiKey}
              onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
              className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-indigo-400"
              placeholder="sk-..."
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Model</label>
            <input
              type="text"
              value={settings.model}
              onChange={(e) => setSettings({ ...settings, model: e.target.value })}
              className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-indigo-400"
              placeholder="gpt-4o"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSave}
            className="flex-1 bg-indigo-600 text-white text-sm py-1.5 rounded hover:bg-indigo-700"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 text-sm py-1.5 rounded hover:bg-gray-50 text-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export function ChatPanel() {
  const { deck, chatMessages, addChatMessage, clearChat, setDeck, selectedElementId, showJsonView } = useDeckStore();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'properties'>('chat');
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize greeting
  useEffect(() => {
    if (chatMessages.length === 0) {
      addChatMessage({
        id: crypto.randomUUID(),
        role: 'system',
        content: SYSTEM_GREETING,
        timestamp: Date.now(),
      });
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Switch to properties tab when element is selected
  useEffect(() => {
    if (selectedElementId) {
      setActiveTab('properties');
    }
  }, [selectedElementId]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    addChatMessage(userMsg);
    setInput('');
    setLoading(true);

    const settings = loadLLMSettings();

    if (!settings.apiKey) {
      addChatMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Please configure your API key in settings (gear icon) to use AI features.',
        timestamp: Date.now(),
      });
      setLoading(false);
      return;
    }

    try {
      const result = await sendMessage(text, chatMessages, deck, settings);

      if (result.deck) {
        setDeck(result.deck);
      }

      // Strip the JSON block from the displayed message
      const displayText = result.text
        .replace(/```json[\s\S]*?```/g, '[Deck updated]')
        .trim();

      addChatMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: displayText,
        timestamp: Date.now(),
      });
    } catch (err) {
      addChatMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Error: ${err instanceof Error ? err.message : String(err)}`,
        timestamp: Date.now(),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const deckJson = JSON.stringify(deck, null, 2);

  return (
    <div className="w-[360px] flex-shrink-0 bg-gray-50 border-l border-gray-200 flex flex-col relative">
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white flex-shrink-0">
        <button
          className={`flex-1 py-2.5 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'chat' && !showJsonView
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('chat')}
        >
          Chat
        </button>
        <button
          className={`flex-1 py-2.5 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'properties'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('properties')}
        >
          Properties
        </button>
      </div>

      {/* JSON View overlay */}
      {showJsonView && <JsonView json={deckJson} />}

      {/* Chat tab */}
      {!showJsonView && activeTab === 'chat' && (
        <>
          {/* Message header */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-white border-b border-gray-100 flex-shrink-0">
            <span className="text-xs text-gray-400">{chatMessages.filter((m) => m.role !== 'system').length} messages</span>
            <div className="flex gap-1">
              <button
                className="p-1 text-gray-400 hover:text-gray-600"
                onClick={clearChat}
                title="Clear chat"
              >
                <RefreshCw size={12} />
              </button>
              <button
                className="p-1 text-gray-400 hover:text-gray-600"
                onClick={() => setShowSettings(true)}
                title="LLM Settings"
              >
                <Settings size={12} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto chat-messages p-3">
            {chatMessages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {loading && (
              <div className="flex justify-start mb-3">
                <div className="bg-white border border-gray-200 rounded px-3 py-2 text-sm text-gray-400">
                  Thinking…
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-3 bg-white flex-shrink-0">
            <div className="flex gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me to modify your slides…"
                rows={2}
                className="flex-1 text-sm border border-gray-200 rounded px-3 py-2 outline-none focus:border-indigo-400 resize-none"
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="self-end px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={14} />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Enter to send · Shift+Enter for newline</p>
          </div>
        </>
      )}

      {/* Properties tab */}
      {!showJsonView && activeTab === 'properties' && (
        <PropertyPanel />
      )}
    </div>
  );
}
