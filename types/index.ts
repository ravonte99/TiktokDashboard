export type LinkType = 'youtube' | 'tiktok' | 'instagram';

export interface LinkItem {
  id: string;
  url: string;
  type: LinkType;
  title?: string; // Fetched title
  description?: string; // Fetched meta description
  thumbnailUrl?: string; 
  fetchedAt?: string; // ISO Date string
  createdAt: number | string; // Support both for compatibility during migration
}

export interface Box {
  id: string;
  name: string;
  description?: string; // User defined description
  aiSummary?: string; // LLM generated summary of the content
  lastSummarized?: number | string; // Support ISO string from DB
  links: LinkItem[];
  createdAt: number | string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}
