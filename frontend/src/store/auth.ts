import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, LoginRequest, RegisterRequest } from '@/types/api';
import { authApi, userApi } from '@/lib/api/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut,
  updateProfile
} from 'firebase/auth';

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
          // 1. Try Firebase login first (for standard users)
          try {
            const userCredential = await signInWithEmailAndPassword(auth, credentials.username, credentials.password);
            const token = await userCredential.user.getIdToken();
            
            // Sync with backend to get app session
            const response = await authApi.firebaseLogin(token);
            
            localStorage.setItem('access_token', response.access_token);
            localStorage.setItem('refresh_token', response.refresh_token);
          } catch (firebaseError: unknown) {
            console.warn("Firebase login failed, trying local backend login:", firebaseError);
            
            // 2. Fallback to local backend login (for manually created Admin users)
            const response = await authApi.login(credentials);
            
            localStorage.setItem('access_token', response.access_token);
            localStorage.setItem('refresh_token', response.refresh_token);
          }
          
          // Fetch user data from our backend
          const user = await userApi.getMe();
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
          const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
          
          if (data.full_name) {
            await updateProfile(userCredential.user, {
              displayName: data.full_name
            });
          }

          const token = await userCredential.user.getIdToken(true);

          // Sync with backend (handles user creation if not exists)
          const response = await authApi.firebaseLogin(token);

          localStorage.setItem('access_token', response.access_token);
          localStorage.setItem('refresh_token', response.refresh_token);

          const user = await userApi.getMe();
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
        set({ isLoading: true, error: null });
        try {
          const userCredential = await signInWithPopup(auth, googleProvider);
          const token = await userCredential.user.getIdToken();

          // Sync with backend
          const response = await authApi.firebaseLogin(token);

          localStorage.setItem('access_token', response.access_token);
          localStorage.setItem('refresh_token', response.refresh_token);

          const user = await userApi.getMe();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error: unknown) {
          console.error(error);
          set({ 
            error: (error as Error).message || 'Google login failed',
            isLoading: false 
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          await signOut(auth);
        } catch {
          // Ignore logout errors
        }
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
