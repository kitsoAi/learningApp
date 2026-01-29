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
          const userCredential = await signInWithEmailAndPassword(auth, credentials.username, credentials.password);
          const token = await userCredential.user.getIdToken();
          
          // Sync with backend to get app session
          const response = await authApi.firebaseLogin(token);
          
          localStorage.setItem('access_token', response.access_token);
          localStorage.setItem('refresh_token', response.refresh_token);
          
          // Fetch user data
          const user = await userApi.getMe();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error: any) {
          console.error(error);
          set({ 
            error: error.message || 'Login failed',
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
        } catch (error: any) {
          console.error(error);
          set({ 
            error: error.message || 'Registration failed',
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
        } catch (error: any) {
          console.error(error);
          set({ 
            error: error.message || 'Google login failed',
            isLoading: false 
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          await signOut(auth);
        } catch (error) {
          console.error('Firebase logout error:', error);
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
        } catch (error) {
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
