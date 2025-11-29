import React, { useState } from 'react';
import { Box, LinkType } from '@/types';
import { useStore } from '@/store/useStore';
import { Trash2, Plus, Check, ExternalLink, Youtube, Instagram, Video, Link as LinkIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BoxCardProps {
  box: Box;
}

export const BoxCard: React.FC<BoxCardProps> = ({ box }) => {
  const { deleteBox, toggleBoxSelection, selectedBoxIds, removeLinkFromBox, addLinkToBox } = useStore();
  const isSelected = selectedBoxIds.includes(box.id);
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkType, setNewLinkType] = useState<LinkType>('youtube');

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkUrl) return;
    
    addLinkToBox(box.id, {
      url: newLinkUrl,
      type: newLinkType,
      title: newLinkUrl, 
    });
    setNewLinkUrl('');
    setIsAddingLink(false);
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
    <Card className={`transition-all duration-200 ${isSelected ? 'ring-2 ring-primary border-primary/50 shadow-lg' : 'hover:border-primary/30'}`}>
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <Button
              variant={isSelected ? "default" : "outline"}
              size="icon"
              className="h-6 w-6 shrink-0 rounded-full"
              onClick={() => toggleBoxSelection(box.id)}
            >
              {isSelected && <Check className="h-3 w-3" />}
            </Button>
            <div>
              <CardTitle className="text-lg font-semibold leading-none">{box.name}</CardTitle>
              {box.description && <CardDescription className="text-xs mt-1">{box.description}</CardDescription>}
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => deleteBox(box.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-2 flex flex-col gap-2 max-h-60 overflow-y-auto scrollbar-thin">
        {box.links.map((link) => (
          <div key={link.id} className="group flex items-center justify-between text-sm bg-muted/50 p-2 rounded-md hover:bg-muted transition-colors">
            <div className="flex items-center gap-2 truncate flex-1">
              {getIcon(link.type)}
              <span className="truncate text-xs font-medium text-muted-foreground">{link.type}</span>
              <a href={link.url} target="_blank" rel="noopener noreferrer" className="truncate flex-1 hover:underline text-primary">
                {link.title || link.url}
              </a>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => removeLinkFromBox(box.id, link.id)}
            >
              <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
            </Button>
          </div>
        ))}
        {box.links.length === 0 && (
          <p className="text-xs text-muted-foreground italic text-center py-2">No items added yet</p>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0">
        {isAddingLink ? (
          <form onSubmit={handleAddLink} className="flex flex-col gap-2 w-full p-2 border rounded-md bg-muted/30">
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
                placeholder="URL..."
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
            className="w-full border-dashed text-muted-foreground hover:text-primary"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Content
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
