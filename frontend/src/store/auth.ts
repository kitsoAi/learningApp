import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, LoginRequest, RegisterRequest } from '@/types/api';
import { authApi, userApi } from '@/lib/api/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  googleLogin: () => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login(credentials);
          localStorage.setItem('access_token', response.access_token);
          localStorage.setItem('refresh_token', response.refresh_token);
          const user = response.user ?? await userApi.getMe();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error: unknown) {
          console.error("Login attempt failed:", error);
          const errorMessage = (error as { response?: { data?: { detail?: string } } } & Error).response?.data?.detail || (error as Error).message || 'Login failed';
          set({ 
            error: errorMessage,
            isLoading: false 
          });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          await authApi.register(data);
          const response = await authApi.login({ username: data.email, password: data.password });
          localStorage.setItem('access_token', response.access_token);
          localStorage.setItem('refresh_token', response.refresh_token);
          const user = response.user ?? await userApi.getMe();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error: unknown) {
          console.error(error);
          set({ 
            error: (error as Error).message || 'Registration failed',
            isLoading: false 
          });
          throw error;
        }
      },

      googleLogin: async () => {
        set({
          error: 'Google login is not configured in the Next.js-only deployment yet.',
          isLoading: false,
        });
        throw new Error('Google login is not configured in the Next.js-only deployment yet.');
      },

      logout: async () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ user: null, isAuthenticated: false });
      },

      fetchUser: async () => {
        set({ isLoading: true });
        try {
          const user = await userApi.getMe();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch {
          set({ isLoading: false, isAuthenticated: false });
        }
      },

      updateUser: (user) => {
        set({ user });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
