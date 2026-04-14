import { create } from 'zustand';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

interface UIState {
  device: DeviceType;
  isSidebarOpen: boolean;
  isSearchOpen: boolean;
  isTheaterMode: boolean;
  isLightsDimmed: boolean;
  isNavbarHidden: boolean;
  isFooterHidden: boolean;
  isCommandBarOpen: boolean;
  readerWidth: number; // 0 to 100 percentage
  setDevice: (device: DeviceType) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  setSearchOpen: (isOpen: boolean) => void;
  setTheaterMode: (isTheater: boolean) => void;
  setLightsDimmed: (isDimmed: boolean) => void;
  setNavbarHidden: (isHidden: boolean) => void;
  setFooterHidden: (isHidden: boolean) => void;
  setCommandBarOpen: (isOpen: boolean) => void;
  setReaderWidth: (width: number) => void;
}

export const useUIStore = create<UIState>((set) => ({
  device: 'desktop',
  isSidebarOpen: false,
  isSearchOpen: false,
  isTheaterMode: false,
  isLightsDimmed: false,
  isNavbarHidden: false,
  isFooterHidden: false,
  isCommandBarOpen: false,
  readerWidth: 100, // Default to full width
  setDevice: (device) => set({ device }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  setSearchOpen: (isOpen) => set({ isSearchOpen: isOpen }),
  setTheaterMode: (isTheater) => set({ isTheaterMode: isTheater }),
  setLightsDimmed: (isDimmed) => set({ isLightsDimmed: isDimmed }),
  setNavbarHidden: (isHidden) => set({ isNavbarHidden: isHidden }),
  setFooterHidden: (isHidden) => set({ isFooterHidden: isHidden }),
  setCommandBarOpen: (isOpen) => set({ isCommandBarOpen: isOpen }),
  setReaderWidth: (width) => set({ readerWidth: width }),
}));
