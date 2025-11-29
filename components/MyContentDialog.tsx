import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Link as LinkIcon, Check, Loader2, RefreshCw, AlertCircle, Trash2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Box, LinkType } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const MyContentDialog: React.FC = () => {
  const { boxes, addLinkToBox, updateLinkInBox, removeLinkFromBox } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkType, setNewLinkType] = useState<LinkType>('tiktok');
  const [isFetching, setIsFetching] = useState(false);

  const myContentBox = boxes.find(b => b.name === "My Content");
  
  // Safety check: useStore should ensure this exists, but fallback just in case
  if (!myContentBox) return null;

  const hasLink = myContentBox.links.length > 0;
  const currentLink = hasLink ? myContentBox.links[0] : null;
  const isSummarized = !!myContentBox.aiSummary;

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkUrl || !myContentBox) return;

    setIsFetching(true);
    
    // 1. Add Placeholder
    const placeholderTitle = newLinkUrl;
    await addLinkToBox(myContentBox.id, {
      url: newLinkUrl,
      type: newLinkType,
      title: placeholderTitle
    });
    
    setNewLinkUrl('');

    // 2. Fetch Metadata
    try {
       const res = await fetch('/api/metadata', {
        method: 'POST',
        body: JSON.stringify({ url: newLinkUrl }),
      });
      const meta = await res.json();
      
      // Re-fetch the fresh link object from store state to get its ID
      const freshBox = useStore.getState().boxes.find(b => b.id === myContentBox.id);
      const freshLink = freshBox?.links.find(l => l.url === newLinkUrl || l.title === placeholderTitle);

      if (freshLink && meta.title) {
        await updateLinkInBox(myContentBox.id, freshLink.id, {
          title: meta.title,
          description: meta.description
        });
      }
    } catch (error) {
        console.error("Error fetching metadata", error);
    } finally {
        setIsFetching(false);
    }
  };

  const handleRemove = async () => {
      if (currentLink) {
          if (confirm("Are you sure you want to remove your profile link?")) {
            await removeLinkFromBox(myContentBox.id, currentLink.id);
          }
      }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className={`gap-2 relative shadow-md hover:shadow-lg transition-all ${hasLink ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`} variant={hasLink ? "default" : "secondary"}>
           <User className="w-4 h-4" />
           {hasLink ? (
             <>
               User Account Connected
               <span className="absolute -top-1 -right-1 flex h-3 w-3">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
               </span>
             </>
           ) : (
             "Connect User Account"
           )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              My Content Profile
          </DialogTitle>
          <DialogDescription>
            Link your primary social media profile here. This context is always available to the AI.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
            {hasLink && currentLink ? (
                <div className="flex flex-col gap-4">
                    <div className="bg-muted/40 p-4 rounded-lg border border-border">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex gap-3 overflow-hidden">
                                <div className="bg-background p-2 rounded-md h-fit border">
                                    {currentLink.type === 'tiktok' ? <span className="text-lg">🎵</span> : <LinkIcon className="w-5 h-5" />}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="font-medium truncate text-sm">{currentLink.title || currentLink.url}</span>
                                    <a href={currentLink.url} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:underline truncate">{currentLink.url}</a>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={handleRemove}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-border/50">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI Status</span>
                                {isSummarized ? (
                                    <span className="text-[10px] bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <Check className="w-3 h-3" /> Ready
                                    </span>
                                ) : (
                                    <span className="text-[10px] bg-yellow-500/10 text-yellow-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <Loader2 className="w-3 h-3 animate-spin" /> Analyzing...
                                    </span>
                                )}
                            </div>
                            {myContentBox.aiSummary ? (
                                <p className="text-xs text-muted-foreground italic line-clamp-3">"{myContentBox.aiSummary}"</p>
                            ) : (
                                <p className="text-xs text-muted-foreground italic">Analysis pending...</p>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleAddLink} className="flex flex-col gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Add Profile Link</label>
                        <div className="flex gap-2">
                            <Select value={newLinkType} onValueChange={(v) => setNewLinkType(v as LinkType)}>
                                <SelectTrigger className="w-[110px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="tiktok">TikTok</SelectItem>
                                    <SelectItem value="youtube">YouTube</SelectItem>
                                    <SelectItem value="instagram">Instagram</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input 
                                placeholder="https://tiktok.com/@username" 
                                value={newLinkUrl}
                                onChange={(e) => setNewLinkUrl(e.target.value)}
                                className="flex-1"
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 p-3 rounded-md text-xs flex gap-2 items-start">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <p>This link will be treated as your primary identity. The AI will use this to understand your content style across all chats.</p>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={!newLinkUrl || isFetching} className="w-full">
                            {isFetching ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Fetching Profile...</> : 'Link Profile'}
                        </Button>
                    </DialogFooter>
                </form>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

