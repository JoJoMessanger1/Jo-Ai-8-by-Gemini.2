import React, { useState, useRef, useEffect } from 'react';
import { Send, Settings, Sparkles, Loader2, Eraser } from 'lucide-react';
import { Message, Role } from './types';
import { streamChatResponse } from './services/geminiService';
import { ChatMessage } from './components/ChatMessage';
import { SettingsModal } from './components/SettingsModal';

const App: React.FC = () => {
  const [aiName, setAiName] = useState<string>('Lumi');
  const [input, setInput] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: Role.MODEL,
      text: `Hallo! Ich bin ${aiName}. Wie kann ich dir heute helfen?`,
      timestamp: Date.now()
    }
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle textarea auto-resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const newMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      text: userText,
      timestamp: Date.now(),
    };

    // Optimistically add user message
    setMessages((prev) => [...prev, newMessage]);
    setIsLoading(true);

    try {
      // Create a placeholder for the bot's response
      const botMessageId = (Date.now() + 1).toString();
      const botPlaceholder: Message = {
        id: botMessageId,
        role: Role.MODEL,
        text: '',
        timestamp: Date.now() + 1,
      };

      setMessages((prev) => [...prev, botPlaceholder]);

      // Stream the response
      const stream = streamChatResponse(userText, messages, aiName);
      
      let fullResponse = '';

      for await (const chunk of stream) {
        fullResponse += chunk;
        setMessages((prev) => 
          prev.map((msg) => 
            msg.id === botMessageId ? { ...msg, text: fullResponse } : msg
          )
        );
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      // Add error message to chat
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        role: Role.MODEL,
        text: 'Entschuldigung, es gab ein Problem bei der Verbindung. Bitte versuche es später noch einmal.',
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNameChange = (newName: string) => {
    setAiName(newName);
    // Optionally add a system event message or just let the next interaction reflect the name
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        role: Role.MODEL,
        text: `Alles klar! Du kannst mich ab jetzt "${newName}" nennen.`,
        timestamp: Date.now()
      }
    ]);
  };

  const clearChat = () => {
    if (window.confirm("Möchtest du den Chatverlauf wirklich löschen?")) {
       setMessages([{
        id: Date.now().toString(),
        role: Role.MODEL,
        text: `Hallo! Ich bin ${aiName}. Wie kann ich dir heute helfen?`,
        timestamp: Date.now()
      }]);
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Header */}
      <header className="flex-none bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white shadow-md">
            <Sparkles size={20} fill="currentColor" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight">Dein KI-Begleiter</h1>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Bereit zu helfen
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
             <button
            onClick={clearChat}
            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
            title="Chat leeren"
          >
            <Eraser size={20} />
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
            title="Einstellungen"
          >
            <Settings size={22} />
          </button>
        </div>
      </header>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        currentName={aiName}
        onSave={handleNameChange}
      />

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 scroll-smooth">
        <div className="max-w-3xl mx-auto">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} aiName={aiName} />
          ))}
          
          {isLoading && messages[messages.length - 1]?.role === Role.USER && (
            <div className="flex items-center gap-2 text-gray-400 text-sm ml-2 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                 <Loader2 size={16} className="animate-spin" />
              </div>
              <span>{aiName} schreibt...</span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="flex-none bg-white border-t border-gray-200 p-4 sticky bottom-0 z-10">
        <div className="max-w-3xl mx-auto relative">
          <div className="relative flex items-end gap-2 bg-gray-100 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:bg-white transition-all border border-transparent focus-within:border-indigo-200">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Schreibe eine Nachricht an ${aiName}...`}
              className="w-full bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] py-3 px-3 text-gray-800 placeholder-gray-400"
              rows={1}
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className="mb-1 p-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-200 flex-shrink-0"
            >
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </div>
          <p className="text-center text-[10px] text-gray-400 mt-2">
            KI kann Fehler machen. Überprüfe wichtige Informationen.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
