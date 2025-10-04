import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      role: null,
      loading: true,
      setUser: (user) => set({ user, loading: false }),
      setRole: (role) => set({ role }),
      logout: () => set({ user: null, role: null }),
      setLoading: (loading) => set({ loading }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
