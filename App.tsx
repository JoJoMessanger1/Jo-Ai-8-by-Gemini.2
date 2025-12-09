import React, { useState, useRef, useEffect } from 'react';
import { Send, Settings, Sparkles, Loader2, Eraser } from 'lucide-react';
import { Message, Role } from './types';
import { streamChatResponse } from './services/geminiService';
import { ChatMessage } from './components/ChatMessage';
import { SettingsModal } from './components/SettingsModal';

const App: React.FC = () => {
  // Load name from storage or default
  const [aiName, setAiName] = useState<string>(() => 
    localStorage.getItem('ai_name') || 'Lumi'
  );
  
  const [input, setInput] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: Role.MODEL,
      text: `Hallo! Ich bin ${localStorage.getItem('ai_name') || 'Lumi'}. Wie kann ich dir heute helfen?`,
      timestamp: Date.now()
    }
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Save name to storage when it changes
  useEffect(() => {
    localStorage.setItem('ai_name', aiName);
  }, [aiName]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

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

    setMessages((prev) => [...prev, newMessage]);
    setIsLoading(true);

    try {
      const botMessageId = (Date.now() + 1).toString();
      const botPlaceholder: Message = {
        id: botMessageId,
        role: Role.MODEL,
        text: '',
        timestamp: Date.now() + 1,
      };

      setMessages((prev) => [...prev, botPlaceholder]);

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
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        role: Role.MODEL,
        text: 'Entschuldigung, ich habe gerade Verbindungsprobleme. Bitte versuche es gleich noch einmal.',
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
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900 font-sans selection:bg-primary/20">
      {/* Header */}
      <header className="flex-none bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm transition-all">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-primary to-accent rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20 transform hover:scale-105 transition-transform duration-300">
            <Sparkles size={20} fill="currentColor" className="text-white/90" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight text-gray-800">Dein KI-Begleiter</h1>
            <p className="text-xs text-gray-500 flex items-center gap-1.5 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              {aiName} ist bereit
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
             <button
            onClick={clearChat}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200"
            title="Chat leeren"
          >
            <Eraser size={20} />
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-gray-400 hover:text-primary hover:bg-indigo-50 rounded-full transition-all duration-200"
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
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} aiName={aiName} />
          ))}
          
          {isLoading && messages[messages.length - 1]?.role === Role.USER && (
            <div className="flex items-center gap-2 text-gray-400 text-sm ml-2 animate-pulse pl-12">
              <div className="flex space-x-1">
                 <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                 <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                 <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
              </div>
              <span className="text-xs font-medium text-gray-400">{aiName} schreibt...</span>
            </div>
          )}
          
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </main>

      {/* Input Area */}
      <footer className="flex-none bg-white border-t border-gray-200 p-4 sticky bottom-0 z-10">
        <div className="max-w-3xl mx-auto relative">
          <div className="relative flex items-end gap-2 bg-gray-50 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-primary/50 focus-within:bg-white transition-all duration-300 border border-gray-200 focus-within:border-primary/30 shadow-sm">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Schreibe eine Nachricht an ${aiName}...`}
              className="w-full bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] py-3 px-3 text-gray-800 placeholder-gray-400 leading-relaxed"
              rows={1}
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className="mb-1 p-3 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-primary/20 flex-shrink-0 active:scale-95"
            >
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </div>
          <p className="text-center text-[10px] text-gray-400 mt-3 font-medium">
            KI kann Fehler machen. Bitte überprüfe wichtige Informationen.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;