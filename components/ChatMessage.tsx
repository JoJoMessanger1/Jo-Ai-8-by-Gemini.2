import React from 'react';
import { Message, Role } from '../types';
import { User, Bot } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  aiName: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, aiName }) => {
  const isUser = message.role === Role.USER;

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] md:max-w-[70%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
        
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
          isUser 
            ? 'bg-indigo-600 text-white' 
            : 'bg-emerald-500 text-white'
        }`}>
          {isUser ? <User size={18} /> : <Bot size={18} />}
        </div>

        {/* Bubble */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
            <span className="text-xs text-gray-400 mb-1 px-1">
                {isUser ? 'Du' : aiName}
            </span>
            <div
            className={`px-4 py-3 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed whitespace-pre-wrap ${
                isUser
                ? 'bg-indigo-600 text-white rounded-br-none'
                : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
            }`}
            >
            {message.text}
            </div>
        </div>
      </div>
    </div>
  );
};
