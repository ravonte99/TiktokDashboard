import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Send, Bot, User } from 'lucide-react';

export const ChatInterface: React.FC = () => {
  const { chatHistory, addMessage, selectedBoxIds, boxes } = useStore();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedBoxes = boxes.filter((box) => selectedBoxIds.includes(box.id));

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    addMessage({
      role: 'user',
      content: input,
    });

    // Simulate response (mock)
    setTimeout(() => {
      const contextNames = selectedBoxes.map((b) => b.name).join(', ');
      const responseContent = contextNames 
        ? `I see you're asking about "${input}" with context from: ${contextNames}. (This is a mock response)`
        : `I see you're asking about "${input}" without any specific context. (This is a mock response)`;

      addMessage({
        role: 'assistant',
        content: responseContent,
      });
    }, 1000);

    setInput('');
  };

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
      <div className="bg-gray-50 dark:bg-gray-800 p-3 border-b flex justify-between items-center">
        <h2 className="font-semibold flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-500" /> Chat Assistant
        </h2>
        <div className="text-xs text-gray-500">
          {selectedBoxes.length > 0 ? (
            <span>Context: <span className="font-medium text-blue-600">{selectedBoxes.length} boxes selected</span></span>
          ) : (
            <span>No context selected</span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {chatHistory.length === 0 ? (
          <div className="text-center text-gray-400 mt-10">
            <p>Select boxes on the left to provide context.</p>
            <p>Ask me anything!</p>
          </div>
        ) : (
          chatHistory.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              <div className={`p-3 rounded-lg max-w-[80%] ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}>
                {msg.content}
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSend} className="p-3 border-t bg-gray-50 dark:bg-gray-800 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

