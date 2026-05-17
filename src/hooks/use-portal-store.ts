"use client";

import { create } from "zustand";

type PortalState = {
  commandOpen: boolean;
  highContrast: boolean;
  fontScale: number;
  setCommandOpen: (open: boolean) => void;
  toggleHighContrast: () => void;
  setFontScale: (scale: number) => void;
};

export const usePortalStore = create<PortalState>((set) => ({
  commandOpen: false,
  highContrast: false,
  fontScale: 1,
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  toggleHighContrast: () => set((state) => ({ highContrast: !state.highContrast })),
  setFontScale: (fontScale) => set({ fontScale }),
}));
