export type LinkType = 'youtube' | 'tiktok' | 'instagram';

export interface LinkItem {
  id: string;
  url: string;
  type: LinkType;
  title?: string; // Optional title fetched from metadata
  thumbnailUrl?: string; // Optional thumbnail
  description?: string;
  createdAt: number;
}

export interface Box {
  id: string;
  name: string;
  description?: string;
  links: LinkItem[];
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

