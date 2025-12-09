import React from 'react';
import { Message, Role } from '../types';
import { User, Sparkles } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  aiName: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, aiName }) => {
  const isUser = message.role === Role.USER;

  return (
    <div className={`flex w-full group ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-3`}>
        
        {/* Avatar */}
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-105 ${
          isUser 
            ? 'bg-primary text-white rounded-br-none' 
            : 'bg-white border border-gray-200 text-primary rounded-bl-none'
        }`}>
          {isUser ? <User size={18} strokeWidth={2.5} /> : <Sparkles size={18} fill="currentColor" className="text-accent" />}
        </div>

        {/* Bubble */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
            <span className={`text-[10px] font-semibold mb-1 px-1 uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity ${isUser ? 'text-primary' : 'text-gray-400'}`}>
                {isUser ? 'Du' : aiName}
            </span>
            <div
            className={`px-5 py-3.5 rounded-2xl shadow-sm text-[15px] leading-relaxed whitespace-pre-wrap ${
                isUser
                ? 'bg-primary text-white rounded-br-none shadow-primary/20'
                : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none shadow-gray-100'
            }`}
            >
            {message.text}
            </div>
        </div>
      </div>
    </div>
  );
};