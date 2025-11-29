import { create } from 'zustand';
import { Box, LinkItem, ChatMessage } from '@/types';

interface AppState {
  boxes: Box[];
  selectedBoxIds: string[];
  chatHistory: ChatMessage[];
  
  // Async Actions (API)
  fetchBoxes: () => Promise<void>;
  addBox: (box: Omit<Box, 'id' | 'createdAt' | 'links'>) => Promise<void>;
  updateBox: (id: string, updates: Partial<Omit<Box, 'id' | 'createdAt' | 'links'>>) => Promise<void>;
  deleteBox: (id: string) => Promise<void>;
  
  // Link Actions
  addLinkToBox: (boxId: string, link: Omit<LinkItem, 'id' | 'createdAt'>) => Promise<void>;
  updateLinkInBox: (boxId: string, linkId: string, updates: Partial<LinkItem>) => Promise<void>;
  removeLinkFromBox: (boxId: string, linkId: string) => Promise<void>;
  
  setBoxSummary: (id: string, summary: string) => Promise<void>;

  // Selection Actions (Client only)
  toggleBoxSelection: (id: string) => void;
  clearSelection: () => void;

  // Chat Actions (Client only for now, can be persisted later)
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearChat: () => void;
  
  // Persistence status (Legacy/Migration support)
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useStore = create<AppState>((set, get) => ({
  boxes: [],
  selectedBoxIds: [],
  chatHistory: [],
  _hasHydrated: true, // DB mode is always "hydrated" once data loads

  setHasHydrated: (state) => set({ _hasHydrated: state }),

  fetchBoxes: async () => {
    try {
      const res = await fetch('/api/boxes');
      const data = await res.json();
      if (Array.isArray(data)) {
        set({ boxes: data });
        
        // Ensure "My Content" box exists
        const myContentBox = data.find((b: Box) => b.name === "My Content");
        if (!myContentBox) {
            try {
                const createRes = await fetch('/api/boxes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        name: "My Content", 
                        description: "Your personal content profile" 
                    })
                });
                if (createRes.ok) {
                    const newBox = await createRes.json();
                    set(state => ({ boxes: [newBox, ...state.boxes] }));
                }
            } catch (e) {
                console.error("Error creating default My Content box", e);
            }
        }
      }
    } catch (error) {
      console.error('Failed to fetch boxes:', error);
    }
  },

  addBox: async (boxData) => {
    try {
      const res = await fetch('/api/boxes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(boxData),
      });
      const newBox = await res.json();
      set((state) => ({ boxes: [newBox, ...state.boxes] }));
    } catch (error) {
      console.error('Failed to add box:', error);
    }
  },

  updateBox: async (id, updates) => {
    // Optimistic update
    set((state) => ({
      boxes: state.boxes.map((box) =>
        box.id === id ? { ...box, ...updates } : box
      ),
    }));

    try {
      await fetch(`/api/boxes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (error) {
      console.error('Failed to update box:', error);
      // Revert? For now, just log.
    }
  },

  deleteBox: async (id) => {
    set((state) => ({
      boxes: state.boxes.filter((box) => box.id !== id),
      selectedBoxIds: state.selectedBoxIds.filter((boxId) => boxId !== id),
    }));

    try {
      await fetch(`/api/boxes/${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Failed to delete box:', error);
    }
  },

  setBoxSummary: async (id, summary) => {
    const lastSummarized = new Date().toISOString();
    // Optimistic
    set((state) => ({
        boxes: state.boxes.map((box) =>
          box.id === id ? { ...box, aiSummary: summary, lastSummarized } : box
        ),
    }));

    try {
        await fetch(`/api/boxes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ aiSummary: summary, lastSummarized }),
        });
    } catch (error) {
        console.error('Failed to save summary', error);
    }
  },

  addLinkToBox: async (boxId, linkData) => {
    // Optimistic UI: Add a placeholder immediately?
    // Or wait for server. Let's wait for server to get the real ID.
    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boxId, ...linkData }),
      });
      const newLink = await res.json();
      
      set((state) => ({
        boxes: state.boxes.map((box) =>
          box.id === boxId
            ? { ...box, links: [...box.links, newLink] }
            : box
        ),
      }));
    } catch (error) {
      console.error('Failed to add link:', error);
    }
  },

  updateLinkInBox: async (boxId, linkId, updates) => {
    // Optimistic
    set((state) => ({
      boxes: state.boxes.map((box) =>
        box.id === boxId
          ? {
              ...box,
              links: box.links.map((link) =>
                link.id === linkId ? { ...link, ...updates } : link
              ),
            }
          : box
      ),
    }));

    try {
      await fetch(`/api/links/${linkId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (error) {
      console.error('Failed to update link:', error);
    }
  },

  removeLinkFromBox: async (boxId, linkId) => {
    set((state) => ({
      boxes: state.boxes.map((box) =>
        box.id === boxId
          ? {
              ...box,
              links: box.links.filter((link) => link.id !== linkId),
            }
          : box
      ),
    }));

    try {
      await fetch(`/api/links/${linkId}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Failed to remove link:', error);
    }
  },

  toggleBoxSelection: (id) => set((state) => ({
    selectedBoxIds: state.selectedBoxIds.includes(id)
      ? state.selectedBoxIds.filter((boxId) => boxId !== id)
      : [...state.selectedBoxIds, id],
  })),

  clearSelection: () => set({ selectedBoxIds: [] }),

  addMessage: (message) => set((state) => ({
    chatHistory: [
      ...state.chatHistory,
      {
        ...message,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
      },
    ],
  })),

  clearChat: () => set({ chatHistory: [] }),
}));
