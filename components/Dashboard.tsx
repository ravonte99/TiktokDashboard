"use client";

import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { BoxCard } from '@/components/BoxCard';
import { CreateBoxForm } from '@/components/CreateBoxForm';
import { ChatInterface } from '@/components/ChatInterface';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Layout, Menu, Plus } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { boxes, fetchBoxes } = useStore();
  const [mounted, setMounted] = useState(false);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchBoxes(); // Fetch initial data from API
  }, []);

  if (!mounted) {
    return <div className="h-screen flex items-center justify-center bg-background text-foreground">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="h-12 w-12 bg-muted rounded-full"></div>
        <div className="h-4 w-32 bg-muted rounded"></div>
      </div>
    </div>;
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
      {/* Sidebar / Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out">
        {/* Header */}
        <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-card/30 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
              <Layout className="w-5 h-5" />
            </div>
            <h1 className="font-bold text-lg tracking-tight">ContentBrain</h1>
          </div>
          <div className="lg:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsMobileChatOpen(true)}>
              <MessageSquare className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Dashboard Content */}
        <ScrollArea className="flex-1 p-6">
          <div className="max-w-5xl mx-auto space-y-8 pb-10">
            {/* Hero / Welcome */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Your Knowledge Base</h2>
                <p className="text-muted-foreground mt-1">Manage your content sources and feed them into the AI.</p>
              </div>
              <div className="w-full md:w-auto">
                <CreateBoxForm />
              </div>
            </div>

            {/* Stats / Quick View (Optional placeholder) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="bg-muted/20 border border-border rounded-lg p-4">
                 <p className="text-sm text-muted-foreground">Total Contexts</p>
                 <p className="text-2xl font-bold">{boxes.length}</p>
               </div>
               <div className="bg-muted/20 border border-border rounded-lg p-4">
                 <p className="text-sm text-muted-foreground">Total Links</p>
                 <p className="text-2xl font-bold">{boxes.reduce((acc, box) => acc + box.links.length, 0)}</p>
               </div>
               <div className="bg-muted/20 border border-border rounded-lg p-4">
                 <p className="text-sm text-muted-foreground">Contexts Active</p>
                 <p className="text-2xl font-bold text-primary">{useStore.getState().selectedBoxIds.length}</p>
               </div>
            </div>

            {/* Boxes Grid */}
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                 <h3 className="text-lg font-semibold">Categories</h3>
               </div>
               
               {boxes.length === 0 ? (
                 <div className="border-2 border-dashed border-muted rounded-xl p-12 text-center flex flex-col items-center gap-4">
                   <div className="bg-muted/50 p-4 rounded-full">
                     <Plus className="w-8 h-8 text-muted-foreground" />
                   </div>
                   <div className="space-y-1">
                     <h4 className="font-medium">No contexts yet</h4>
                     <p className="text-sm text-muted-foreground">Create a category to start adding links.</p>
                   </div>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                   {boxes.map((box) => (
                     <BoxCard key={box.id} box={box} />
                   ))}
                 </div>
               )}
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Right Sidebar - Chat (Desktop) */}
      <div className="hidden lg:block w-[400px] xl:w-[450px] border-l border-border bg-background shadow-2xl z-10">
        <ChatInterface />
      </div>

      {/* Mobile Chat Sheet */}
      <Sheet open={isMobileChatOpen} onOpenChange={setIsMobileChatOpen}>
        <SheetContent side="right" className="w-full sm:w-[400px] p-0 border-l border-border">
          <ChatInterface />
        </SheetContent>
      </Sheet>
    </div>
  );
};
