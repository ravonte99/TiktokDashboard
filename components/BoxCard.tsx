import React, { useState, useEffect, useRef } from 'react';
import { Box, LinkType, LinkItem } from '@/types';
import { useStore } from '@/store/useStore';
import { Trash2, Plus, Check, ExternalLink, Youtube, Instagram, Video, Link as LinkIcon, RefreshCw, Sparkles, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BoxCardProps {
  box: Box;
}

export const BoxCard: React.FC<BoxCardProps> = ({ box }) => {
  const { deleteBox, toggleBoxSelection, selectedBoxIds, removeLinkFromBox, addLinkToBox, updateLinkInBox, setBoxSummary, _hasHydrated } = useStore();
  const isSelected = selectedBoxIds.includes(box.id);
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkType, setNewLinkType] = useState<LinkType>('youtube');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isFetchingMeta, setIsFetchingMeta] = useState(false);
  const [refreshingLinkIds, setRefreshingLinkIds] = useState<string[]>([]);

  // Effect to trigger auto-summarization when links change
  const linksSignature = box.links.map(l => l.url + l.description).join(','); // Include description in signature so metadata updates trigger it
  const hasMounted = useRef(false);

  useEffect(() => {
    // Strict Check:
    // 1. If store hasn't rehydrated, DO NOTHING.
    // 2. If on first mount and summary exists, DO NOTHING.
    // 3. NEW: If the summary is FRESHER than the last link update, DO NOTHING.
    
    if (!_hasHydrated) return;

    if (!hasMounted.current) {
      hasMounted.current = true;
      if (box.aiSummary) return;
    }

    // Find the latest update time of any link
    const lastLinkUpdate = box.links.reduce((max, link) => {
        const linkTime = new Date(link.updatedAt).getTime();
        return linkTime > max ? linkTime : max;
    }, 0);

    const lastSummaryTime = box.lastSummarized ? new Date(box.lastSummarized).getTime() : 0;

    // If summary is newer than the latest link change, we don't need to re-run.
    if (lastSummaryTime > lastLinkUpdate) {
        return;
    }

    // Only summarize if we actually have links
    if (box.links.length === 0) return;

    const timer = setTimeout(() => {
        handleSummarize(true); 
    }, 2000); 

    return () => clearTimeout(timer);
  }, [box.links.length, linksSignature, _hasHydrated, box.lastSummarized]); 
  // Dependency on length and URLs. Note: deeply nested dependency might be heavy but fine for small lists.

  const handleAddLinkSmart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkUrl) return;

    const url = newLinkUrl;
    setNewLinkUrl('');
    setIsAddingLink(false);
    setIsFetchingMeta(true);

    // Add placeholder immediately
    const placeholderTitle = url;
    addLinkToBox(box.id, {
      url,
      type: newLinkType,
      title: placeholderTitle,
    });

    // Fetch real metadata
    try {
      const res = await fetch('/api/metadata', {
        method: 'POST',
        body: JSON.stringify({ url }),
      });
      const meta = await res.json();
      
      const currentBox = useStore.getState().boxes.find(b => b.id === box.id);
      const link = currentBox?.links.find(l => l.url === url && l.title === placeholderTitle);
      
      if (link && meta.title) {
        updateLinkInBox(box.id, link.id, {
          title: meta.title,
          description: meta.description
        });
      }
    } catch (e) {
      console.error("Failed to fetch metadata", e);
    } finally {
      setIsFetchingMeta(false);
      // Auto-summarize will be triggered by the useEffect observing links
    }
  };

  const handleSummarize = async (isAuto = false) => {
    if (box.links.length === 0) return;
    // If auto, don't show full loading state if already summarized recently? 
    // For now, let's show the spinner on the summary area to indicate "updating".
    setIsSummarizing(true);
    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        body: JSON.stringify({
          links: box.links,
          boxName: box.name,
          boxDescription: box.description
        }),
      });
      const data = await res.json();
      if (data.summary) {
        setBoxSummary(box.id, data.summary);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleRefreshLink = async (link: LinkItem) => {
    if (refreshingLinkIds.includes(link.id)) return;

    // 3-Day Cache Logic: Check if we fetched recently
    if (link.fetchedAt) {
        const fetchedDate = new Date(link.fetchedAt);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - fetchedDate.getTime());
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        if (diffDays < 3) {
            const confirmRefresh = window.confirm(
                `This link was updated ${Math.floor(diffDays)} days ago (less than 3 days). Force refresh?`
            );
            if (!confirmRefresh) return;
        }
    }
    
    setRefreshingLinkIds(prev => [...prev, link.id]);
    try {
      const res = await fetch('/api/metadata', {
        method: 'POST',
        body: JSON.stringify({ url: link.url }),
      });
      const meta = await res.json();
      
      if (meta.title) {
        updateLinkInBox(box.id, link.id, {
          title: meta.title,
          description: meta.description
        });
      }
    } catch (e) {
      console.error("Failed to refresh metadata", e);
    } finally {
      setRefreshingLinkIds(prev => prev.filter(id => id !== link.id));
      // Trigger a summary update to incorporate new metadata
      handleSummarize(true);
    }
  };

  const getIcon = (type: LinkType) => {
    switch (type) {
      case 'youtube': return <Youtube className="w-4 h-4 text-red-500" />;
      case 'instagram': return <Instagram className="w-4 h-4 text-pink-500" />;
      case 'tiktok': return <Video className="w-4 h-4 text-black dark:text-white" />; 
      default: return <LinkIcon className="w-4 h-4" />;
    }
  };

  return (
    <Card className={`flex flex-col h-full transition-all duration-200 ${isSelected ? 'ring-2 ring-primary border-primary/50 shadow-lg' : 'hover:border-primary/30'}`}>
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-3 overflow-hidden flex-1">
            <Button
              variant={isSelected ? "default" : "outline"}
              size="icon"
              className="h-6 w-6 shrink-0 rounded-full"
              onClick={() => toggleBoxSelection(box.id)}
            >
              {isSelected && <Check className="h-3 w-3" />}
            </Button>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg font-semibold leading-none truncate">{box.name}</CardTitle>
              {box.description && <CardDescription className="text-xs mt-1 line-clamp-2 break-words">{box.description}</CardDescription>}
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0" onClick={() => deleteBox(box.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      {/* AI Summary Section */}
      <div className="px-4 py-2 bg-primary/5 border-y border-primary/10 min-h-[60px] flex flex-col justify-center relative">
         <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">AI Context</span>
            {isSummarizing && <RefreshCw className="w-3 h-3 animate-spin text-primary ml-2" />}
            <span className="text-[10px] text-muted-foreground ml-auto">
              {box.lastSummarized ? new Date(box.lastSummarized).toLocaleDateString() : ''}
            </span>
         </div>
         
         {box.aiSummary ? (
            <p className="text-xs text-muted-foreground line-clamp-3 italic">
               "{box.aiSummary}"
            </p>
         ) : (
            <p className="text-xs text-muted-foreground italic opacity-50">
               {box.links.length > 0 ? (isSummarizing ? "Generating summary..." : "Waiting for analysis...") : "Add content to generate summary"}
            </p>
         )}
      </div>
      
      <CardContent className="p-4 pt-2 flex-1 flex flex-col gap-2 min-h-[100px] max-h-[300px] overflow-y-auto scrollbar-thin">
        {box.links.map((link) => (
          <div key={link.id} className="group flex items-center justify-between text-sm bg-muted/30 p-2 rounded-md hover:bg-muted transition-colors border border-transparent hover:border-border">
            <div className="flex items-center gap-2 truncate flex-1">
              {getIcon(link.type)}
              <div className="flex flex-col truncate">
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="truncate font-medium hover:underline text-foreground flex items-center gap-1">
                  {link.title || link.url}
                  {(link.description?.includes('RECENT VIDEOS') || link.description?.includes('stats.playCount')) && (
                    <span className="flex h-2 w-2 rounded-full bg-green-500 shrink-0 animate-pulse" title="Detailed content available" />
                  )}
                </a>
                {link.description && (
                  <span className="text-[10px] text-muted-foreground truncate">{link.description}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6"
                  onClick={() => handleRefreshLink(link)}
                  title="Refresh Metadata"
                >
                  <RefreshCw className={`w-3 h-3 text-muted-foreground hover:text-primary ${refreshingLinkIds.includes(link.id) ? 'animate-spin' : ''}`} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6"
                  onClick={() => removeLinkFromBox(box.id, link.id)}
                  title="Remove Link"
                >
                  <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                </Button>
            </div>
          </div>
        ))}
        {box.links.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-4 opacity-50">
            <FileText className="w-8 h-8 mb-1" />
            <p className="text-xs">No content yet</p>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 mt-auto">
        {isAddingLink ? (
          <form onSubmit={handleAddLinkSmart} className="flex flex-col gap-2 w-full p-2 border rounded-md bg-background shadow-sm">
            <div className="flex gap-2">
              <Select value={newLinkType} onValueChange={(v) => setNewLinkType(v as LinkType)}>
                <SelectTrigger className="w-[100px] h-8 text-xs">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="https://..."
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
                className="h-8 text-xs flex-1"
                autoFocus
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddingLink(false)} className="h-7 text-xs">Cancel</Button>
              <Button type="submit" size="sm" className="h-7 text-xs">Add</Button>
            </div>
          </form>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddingLink(true)}
            className="w-full border-dashed text-muted-foreground hover:text-primary hover:border-primary"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Link
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
