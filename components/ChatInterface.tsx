import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Send, Bot, User, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const ChatInterface: React.FC = () => {
  const { chatHistory, addMessage, selectedBoxIds, boxes } = useStore();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedBoxes = boxes.filter((box) => selectedBoxIds.includes(box.id));

  useEffect(() => {
    if (scrollRef.current) {
      // Hack to scroll to bottom of ScrollArea viewport
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [chatHistory]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    addMessage({
      role: 'user',
      content: input,
    });

    setTimeout(() => {
      const contextNames = selectedBoxes.map((b) => b.name).join(', ');
      const responseContent = contextNames 
        ? `I'm analyzing your request about "${input}" using the context from: **${contextNames}**. \n\nBased on the linked content, here are some insights...`
        : `I see you're asking about "${input}". Since no boxes are selected, I'm answering from general knowledge. Select some boxes to give me context!`;

      addMessage({
        role: 'assistant',
        content: responseContent,
      });
    }, 1000);

    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-background border-l border-border shadow-xl">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-full">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">AI Assistant</h2>
            <p className="text-xs text-muted-foreground">Ask questions based on your selected content</p>
          </div>
        </div>
        
        {/* Context Indicator */}
        <div className="mt-3 flex items-center gap-2 text-xs overflow-x-auto pb-1 scrollbar-none">
          <span className="text-muted-foreground shrink-0">Context:</span>
          {selectedBoxes.length > 0 ? (
            selectedBoxes.map(box => (
              <Badge key={box.id} variant="secondary" className="shrink-0 gap-1 text-[10px] px-2 py-0.5 h-5">
                {box.name}
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground italic">None selected</span>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="flex flex-col gap-6 max-w-2xl mx-auto">
          {chatHistory.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center mt-20 gap-4">
              <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center animate-pulse">
                <Sparkles className="w-8 h-8 text-primary/50" />
              </div>
              <div className="space-y-2">
                <h3 className="font-medium text-lg">Ready to help</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Select categories from the left to provide context, then ask any question about your content.
                </p>
              </div>
            </div>
          )}
          
          {chatHistory.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <Avatar className="h-8 w-8 shrink-0 mt-1">
                {msg.role === 'user' ? (
                  <AvatarFallback className="bg-primary text-primary-foreground"><User className="w-4 h-4" /></AvatarFallback>
                ) : (
                  <AvatarFallback className="bg-primary/10 text-primary"><Bot className="w-4 h-4" /></AvatarFallback>
                )}
              </Avatar>
              
              <div className={`flex flex-col gap-1 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-primary text-primary-foreground rounded-br-none' 
                    : 'bg-muted/50 border border-border rounded-bl-none'
                }`}>
                  {msg.content.split('\n').map((line, i) => (
                    <p key={i} className="mb-1 last:mb-0">{line}</p>
                  ))}
                </div>
                <span className="text-[10px] text-muted-foreground px-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-background">
        <form onSubmit={handleSend} className="relative max-w-2xl mx-auto flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your videos..."
              className="pr-10 h-12 bg-muted/30 border-input/50 focus:bg-background transition-colors rounded-xl"
            />
            <Button 
              type="submit" 
              size="icon"
              disabled={!input.trim()}
              className="absolute right-1.5 top-1.5 h-9 w-9 rounded-lg transition-all"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </form>
        <div className="text-center mt-2">
          <p className="text-[10px] text-muted-foreground">AI can make mistakes. Review generated content.</p>
        </div>
      </div>
    </div>
  );
};
