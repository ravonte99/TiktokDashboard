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
  
  // Link Actions
  addLinkToBox: (boxId: string, link: Omit<LinkItem, 'id' | 'createdAt'>) => void;
  removeLinkFromBox: (boxId: string, linkId: string) => void;
  
  // Selection Actions
  toggleBoxSelection: (id: string) => void;
  clearSelection: () => void;

  // Chat Actions
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearChat: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      boxes: [],
      selectedBoxIds: [],
      chatHistory: [],

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
    }
  )
);

