import React, { useState } from 'react';
import { Box, LinkType } from '@/types';
import { useStore } from '@/store/useStore';
import { Trash2, Plus, Check, ExternalLink, Youtube, Instagram, Video } from 'lucide-react';

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
      title: newLinkUrl, // Placeholder
    });
    setNewLinkUrl('');
    setIsAddingLink(false);
  };

  const getIcon = (type: LinkType) => {
    switch (type) {
      case 'youtube': return <Youtube className="w-4 h-4 text-red-500" />;
      case 'instagram': return <Instagram className="w-4 h-4 text-pink-500" />;
      case 'tiktok': return <Video className="w-4 h-4 text-black dark:text-white" />; // Lucide doesn't have tiktok icon yet?
    }
  };

  return (
    <div className={`border rounded-lg p-4 flex flex-col gap-4 transition-colors ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-800'}`}>
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleBoxSelection(box.id)}
            className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300'}`}
          >
            {isSelected && <Check className="w-3 h-3" />}
          </button>
          <div>
            <h3 className="font-semibold text-lg">{box.name}</h3>
            {box.description && <p className="text-sm text-gray-500">{box.description}</p>}
          </div>
        </div>
        <button onClick={() => deleteBox(box.id)} className="text-gray-400 hover:text-red-500">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
        {box.links.map((link) => (
          <div key={link.id} className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded">
            <div className="flex items-center gap-2 truncate">
              {getIcon(link.type)}
              <a href={link.url} target="_blank" rel="noopener noreferrer" className="truncate hover:underline text-blue-600 dark:text-blue-400">
                {link.url}
              </a>
            </div>
            <button onClick={() => removeLinkFromBox(box.id, link.id)} className="text-gray-400 hover:text-red-500">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
        {box.links.length === 0 && (
          <p className="text-xs text-gray-400 italic">No links added yet</p>
        )}
      </div>

      {isAddingLink ? (
        <form onSubmit={handleAddLink} className="flex flex-col gap-2 p-2 border rounded bg-gray-50 dark:bg-gray-800">
          <select
            value={newLinkType}
            onChange={(e) => setNewLinkType(e.target.value as LinkType)}
            className="text-sm border rounded p-1 dark:bg-gray-700"
          >
            <option value="youtube">YouTube</option>
            <option value="tiktok">TikTok</option>
            <option value="instagram">Instagram</option>
          </select>
          <input
            type="url"
            placeholder="Paste URL here..."
            value={newLinkUrl}
            onChange={(e) => setNewLinkUrl(e.target.value)}
            className="text-sm border rounded p-1 dark:bg-gray-700"
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setIsAddingLink(false)} className="text-xs text-gray-500">Cancel</button>
            <button type="submit" className="text-xs bg-blue-500 text-white px-2 py-1 rounded">Add</button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setIsAddingLink(true)}
          className="flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-blue-500 border border-dashed border-gray-300 rounded p-2 hover:border-blue-500 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Link
        </button>
      )}
    </div>
  );
};

