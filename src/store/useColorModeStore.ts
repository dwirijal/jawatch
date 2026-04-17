'use client';

import { create } from 'zustand';
import {
  applyColorModePreference,
  getDocumentColorModeState,
  type ColorModePreference,
  type ResolvedColorMode,
} from '@/lib/color-mode';

interface ColorModeState {
  hydrated: boolean;
  preference: ColorModePreference;
  resolved: ResolvedColorMode;
  setPreference: (preference: ColorModePreference) => void;
  syncFromDocument: () => void;
}

export const useColorModeStore = create<ColorModeState>((set) => ({
  hydrated: false,
  preference: 'system',
  resolved: 'light',
  setPreference: (preference) => {
    const resolved = applyColorModePreference(preference);
    set({
      hydrated: true,
      preference,
      resolved,
    });
  },
  syncFromDocument: () => {
    const state = getDocumentColorModeState();
    set({
      hydrated: true,
      preference: state.preference,
      resolved: state.resolved,
    });
  },
}));
