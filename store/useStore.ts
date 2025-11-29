import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Box, LinkItem, ChatMessage } from '@/types';

interface AppState {
  boxes: Box[];
  selectedBoxIds: string[];
  chatHistory: ChatMessage[];
  
  // Box Actions
  addBox: (box: Omit<Box, 'id' | 'createdAt' | 'links'>) => void;
  updateBox: (id: string, updates: Partial<Omit<Box, 'id' | 'createdAt' | 'links'>>) => void;
  deleteBox: (id: string) => void;
  setBoxSummary: (id: string, summary: string) => void;
  
  // Link Actions
  addLinkToBox: (boxId: string, link: Omit<LinkItem, 'id' | 'createdAt'>) => void;
  updateLinkInBox: (boxId: string, linkId: string, updates: Partial<LinkItem>) => void;
  removeLinkFromBox: (boxId: string, linkId: string) => void;
  
  // Selection Actions
  toggleBoxSelection: (id: string) => void;
  clearSelection: () => void;

  // Chat Actions
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearChat: () => void;
  
  // Persistence status
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      boxes: [],
      selectedBoxIds: [],
      chatHistory: [],
      _hasHydrated: false,

      setHasHydrated: (state) => set({ _hasHydrated: state }),

      addBox: (boxData) => set((state) => ({
        boxes: [
          ...state.boxes,
          {
            ...boxData,
            id: crypto.randomUUID(),
            createdAt: Date.now(),
            links: [],
          },
        ],
      })),

      updateBox: (id, updates) => set((state) => ({
        boxes: state.boxes.map((box) =>
          box.id === id ? { ...box, ...updates } : box
        ),
      })),

      setBoxSummary: (id, summary) => set((state) => ({
        boxes: state.boxes.map((box) =>
          box.id === id ? { ...box, aiSummary: summary, lastSummarized: Date.now() } : box
        ),
      })),

      deleteBox: (id) => set((state) => ({
        boxes: state.boxes.filter((box) => box.id !== id),
        selectedBoxIds: state.selectedBoxIds.filter((boxId) => boxId !== id),
      })),

      addLinkToBox: (boxId, linkData) => set((state) => ({
        boxes: state.boxes.map((box) =>
          box.id === boxId
            ? {
                ...box,
                links: [
                  ...box.links,
                  {
                    ...linkData,
                    id: crypto.randomUUID(),
                    createdAt: Date.now(),
                  },
                ],
              }
            : box
        ),
      })),

      updateLinkInBox: (boxId, linkId, updates) => set((state) => ({
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
      })),

      removeLinkFromBox: (boxId, linkId) => set((state) => ({
        boxes: state.boxes.map((box) =>
          box.id === boxId
            ? {
                ...box,
                links: box.links.filter((link) => link.id !== linkId),
              }
            : box
        ),
      })),

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
    }),
    {
      name: 'tiktok-dashboard-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
