
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { ChatIcon, CloseIcon, SendIcon } from './icons';

interface ChatbotWidgetProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  onOpen: () => void;
}

const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({ messages, onSendMessage, isLoading, onOpen }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };
  
  const toggleOpen = () => {
      if (!isOpen) {
          onOpen();
      }
      setIsOpen(!isOpen);
  }

  if (!isOpen) {
    return (
      <button
        onClick={toggleOpen}
        className="fixed bottom-6 right-6 bg-neon-cyan text-black p-4 rounded-full shadow-lg shadow-neon-cyan hover:scale-110 transition-transform z-40 print:hidden animate-in fade-in"
        aria-label="Abrir assistente de projeto"
      >
        <ChatIcon />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-full max-w-sm h-[60vh] bg-dark-surface border-2 border-neon-cyan/50 shadow-[0_0_30px_rgba(0,243,255,0.2)] z-50 flex flex-col animate-in fade-in slide-in-from-bottom-5 print:hidden">
        <div className="corner-marker corner-tl"></div>
        <div className="corner-marker corner-tr"></div>
        <div className="corner-marker corner-bl"></div>
        <div className="corner-marker corner-br"></div>
      
        <header className="flex justify-between items-center p-3 border-b border-dark-border bg-dark-surface">
            <h2 className="text-sm font-black text-white uppercase tracking-[2px]">
                Assistente <span className="text-neon-cyan">IA</span>
            </h2>
            <button onClick={toggleOpen} className="text-white/30 hover:text-neon-magenta transition-colors p-1">
                <CloseIcon />
            </button>
        </header>

        <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
                <div
                  className={`max-w-[85%] p-3 rounded-lg text-sm font-mono whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'bg-neon-cyan/80 text-black rounded-br-none'
                      : msg.sender === 'ai'
                      ? 'bg-dark-bg border border-dark-border text-white rounded-bl-none'
                      : 'bg-neon-red/20 border border-neon-red text-white rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="max-w-[80%] p-3 rounded-lg bg-dark-bg border border-dark-border text-white rounded-bl-none">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        <div className="p-3 border-t border-dark-border flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Sua pergunta..."
              className="flex-grow bg-dark-bg border border-dark-border p-2.5 text-white font-mono text-sm focus:outline-none focus:border-neon-cyan"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-neon-cyan text-black p-3 hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Enviar mensagem"
            >
              <SendIcon className="h-4 w-4" />
            </button>
        </div>
    </div>
  );
};

export default ChatbotWidget;
