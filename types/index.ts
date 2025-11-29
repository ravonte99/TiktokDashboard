export type LinkType = 'youtube' | 'tiktok' | 'instagram';

export interface LinkItem {
  id: string;
  url: string;
  type: LinkType;
  title?: string; // Fetched title
  description?: string; // Fetched meta description
  thumbnailUrl?: string; 
  createdAt: number;
}

export interface Box {
  id: string;
  name: string;
  description?: string; // User defined description
  aiSummary?: string; // LLM generated summary of the content
  lastSummarized?: number;
  links: LinkItem[];
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}
