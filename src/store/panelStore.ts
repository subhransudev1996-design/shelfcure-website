'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PanelUser {
  id: string;           // uuid
  auth_user_id: string;
  full_name: string;
  email: string | null;
  role: string;
  is_active: boolean;
}

export interface PanelState {
  // User & Auth
  user: PanelUser | null;
  pharmacyId: string | null;   // uuid
  pharmacyName: string | null;

  // UI state
  sidebarCollapsed: boolean;

  // Actions
  setUser: (user: PanelUser | null) => void;
  setPharmacy: (id: string | null, name: string | null) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  logout: () => void;
}

export const usePanelStore = create<PanelState>()(
  persist(
    (set) => ({
      user: null,
      pharmacyId: null,
      pharmacyName: null,
      sidebarCollapsed: false,

      setUser: (user) => set({ user }),
      setPharmacy: (id, name) => set({ pharmacyId: id, pharmacyName: name }),
      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) =>
        set({ sidebarCollapsed: collapsed }),
      logout: () =>
        set({
          user: null,
          pharmacyId: null,
          pharmacyName: null,
        }),
    }),
    {
      name: 'shelfcure-panel',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
