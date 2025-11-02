"use client";

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Loader2 } from 'lucide-react';
import { useChatbot } from '../../../context/ChatbotContext';
import axiosInstance from '../../../utils/axiosInstance';

const ChatbotModal = () => {
  const { isOpen, setIsOpen, messages, addMessage, isLoading, setIsLoading } = useChatbot();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    addMessage(userMessage, false);

    setIsLoading(true);

    try {
      // Send message to chatbot API (n8n-service)
      const response = await axiosInstance.post('/chatbot/api/chat', {
        message: userMessage,
      });

      // Get response from n8n webhook
      const botResponse = response.data?.response || response.data?.message || 
                         "I'm here to help! Try asking me about products, prices, or categories.";

      addMessage(botResponse, true);
      setIsLoading(false);

    } catch (error: any) {
      console.error('Chatbot error:', error);
      const errorMessage = error?.response?.data?.error || 
                          error?.response?.data?.message ||
                          "Sorry, I'm having trouble connecting right now. Please try again later or browse our products directly!";
      
      addMessage(errorMessage, true);
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end pointer-events-none p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-30 pointer-events-auto"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Chat Modal */}
      <div className="relative w-full max-w-md h-[600px] bg-white rounded-lg shadow-2xl pointer-events-auto flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-amber-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold flex items-center gap-1.5">
                LocalGoods Mitra
                <span className="text-sm">💬</span>
              </h3>
              <p className="text-xs text-amber-100">Your friend is online</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.isBot ? 'justify-start' : 'justify-end'
              }`}
            >
              {message.isBot && (
                <div className="flex-shrink-0 w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 shadow-sm ${
                  message.isBot
                    ? 'bg-white text-gray-900 border border-gray-200'
                    : 'bg-amber-600 text-white'
                }`}
              >
                <p className="text-sm whitespace-pre-line">{message.text}</p>
              </div>

              {!message.isBot && (
                <div className="flex-shrink-0 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-700" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0 w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white text-gray-900 border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
                <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your LocalGoods Mitra anything..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Try: "Products less than 500"
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatbotModal;

