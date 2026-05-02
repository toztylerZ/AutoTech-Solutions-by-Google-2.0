import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  isAuthenticated: boolean;
  user: {
    username: string;
    role: 'admin' | 'staff';
  } | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      login: (username, password) => {
        if (username === 'admin' && password === 'admin') {
          set({ isAuthenticated: true, user: { username, role: 'admin' } });
          return true;
        }
        // Staff logic could be added here later
        return false;
      },
      logout: () => set({ isAuthenticated: false, user: null }),
    }),
    {
      name: 'autotech-auth',
    }
  )
);
