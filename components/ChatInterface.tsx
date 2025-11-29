import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Send, Bot, User, Sparkles, ArrowRight, Loader2, Box, Trash2, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea"; // Assuming you have or can make a Textarea component, or use standard
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const ChatInterface: React.FC = () => {
  const { chatHistory, addMessage, selectedBoxIds, boxes, clearChat } = useStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedBoxes = boxes.filter((box) => selectedBoxIds.includes(box.id));

  useEffect(() => {
    if (scrollRef.current) {
      const scrollViewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  }, [chatHistory, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    addMessage({
      role: 'user',
      content: userMessage,
    });

    setIsLoading(true);

    try {
      const messagesPayload = chatHistory.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      messagesPayload.push({ role: 'user', content: userMessage });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messagesPayload,
          context: selectedBoxes.map(b => ({ 
            id: b.id,
            name: b.name, 
            description: b.description,
            aiSummary: b.aiSummary,
            links: b.links.map(l => ({ title: l.title, url: l.url, type: l.type }))
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch response');
      }

      const data = await response.json();
      
      addMessage({
        role: 'assistant',
        content: data.reply,
      });
    } catch (error) {
      console.error("Chat error:", error);
      addMessage({
        role: 'assistant',
        content: "I'm sorry, I encountered an error while connecting to the AI. Please check your API key and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background border-l border-border shadow-xl relative">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-full">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">AI Assistant</h2>
            <p className="text-xs text-muted-foreground">Ask questions based on your selected content</p>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 gap-1.5 text-xs"
          onClick={() => {
            if (window.confirm('Start a new chat? This will clear the current history.')) {
              clearChat();
            }
          }}
          title="Start New Chat"
        >
          <Plus className="w-3.5 h-3.5" />
          New Chat
        </Button>
      </div>
      
      <div className="px-4 py-2 bg-card/30 border-b border-border">
        {/* Context Indicator */}
        <div className="flex items-center gap-2 text-xs overflow-x-auto pb-1 scrollbar-none">
          <span className="text-muted-foreground shrink-0">Context:</span>
          {selectedBoxes.length > 0 ? (
            selectedBoxes.map(box => (
              <Badge key={box.id} variant={box.aiSummary ? "default" : "secondary"} className="shrink-0 gap-1 text-[10px] px-2 py-0.5 h-5">
                {box.aiSummary ? <Sparkles className="w-2 h-2" /> : <Box className="w-2 h-2" />}
                {box.name}
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground italic">None selected</span>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 min-h-0 flex flex-col">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="flex flex-col gap-6 max-w-2xl mx-auto pb-4">
            {chatHistory.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center mt-20 gap-4">
                <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center animate-pulse">
                  <Sparkles className="w-8 h-8 text-primary/50" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium text-lg">Ready to help</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    Select categories from the left to provide context.
                    {selectedBoxes.some(b => b.aiSummary) ? 
                      " Great! I have analyzed summaries for some contexts." : 
                      " Tip: Click 'Generate Context Summary' on a card for smarter answers."}
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
                    {msg.role === 'user' ? (
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                    ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>p:last-child]:mb-0">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {msg.content}
                            </ReactMarkdown>
                        </div>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground px-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
               <div className="flex gap-4">
                  <Avatar className="h-8 w-8 shrink-0 mt-1">
                    <AvatarFallback className="bg-primary/10 text-primary"><Bot className="w-4 h-4" /></AvatarFallback>
                  </Avatar>
                  <div className="bg-muted/50 border border-border rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Thinking...</span>
                  </div>
               </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-background z-30 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
        <form onSubmit={handleSend} className="relative max-w-2xl mx-auto flex items-end gap-2">
          <div className="relative flex-1">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              placeholder={selectedBoxes.length > 0 ? "Ask about the selected content..." : "Ask a general question..."}
              className="min-h-[48px] max-h-[150px] pr-12 bg-muted/30 border-input/50 focus:bg-background transition-colors rounded-xl resize-none py-3"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              size="icon"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 bottom-2 h-8 w-8 rounded-lg transition-all"
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
