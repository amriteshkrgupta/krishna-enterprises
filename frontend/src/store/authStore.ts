import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
  initAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: true,

      setAuth: (user, token) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('ke_token', token);
          // Also set a cookie for middleware auth checks
          document.cookie = `ke_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        }
        set({ user, token, isLoading: false });
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('ke_token');
          localStorage.removeItem('ke_auth');
          localStorage.removeItem('ke_cart');
          // Clear cookie
          document.cookie = 'ke_token=; path=/; max-age=0';
        }
        set({ user: null, token: null, isLoading: false });
      },

      setUser: (user) => set({ user }),

      initAuth: () => {
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('ke_token');
          if (!token) {
            set({ isLoading: false });
          }
          // The persist middleware will rehydrate user from ke_auth automatically
        }
        set((state) => ({ ...state, isLoading: false }));
      },
    }),
    {
      name: 'ke_auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    },
  ),
);
