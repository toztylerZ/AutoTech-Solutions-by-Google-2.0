import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  isAuthenticated: boolean;
  user: {
    username: string;
    name: string;
    role: 'администратор' | 'менеджер' | 'работник';
    access: string | null;
    box: string | null;
  } | null;
  login: (username: string, password: string) => Promise<any>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      login: async (username, password) => {
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
          });
          
          if (!res.ok) return false;
          
          const userData = await res.json();
          const userObj = {
            username: userData.username,
            name: userData.name,
            role: userData.role,
            access: userData.access,
            box: userData.box
          };
          set({ 
            isAuthenticated: true, 
            user: userObj
          });
          return userObj;
        } catch (err) {
          console.error("Login failed:", err);
          return null;
        }
      },
      logout: () => set({ isAuthenticated: false, user: null }),
    }),
    {
      name: 'autotech-auth',
    }
  )
);
