import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserRole } from '@/src/types';
import { AuthService } from '@/src/services/auth.service';

interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
  phone?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  loadUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = await AuthService.login(email, password);
      const token = await AsyncStorage.getItem('@nutri:token');
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  register: async (data: RegisterData) => {
    set({ isLoading: true, error: null });
    try {
      const user = await AuthService.register(
        data.email,
        data.password,
        data.name,
        data.role || UserRole.PATIENT
      );
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await AuthService.logout();
      // Limpar completamente o estado
      set({ 
        user: null,
        token: null, 
        isAuthenticated: false, 
        isLoading: false,
        error: null 
      });
    } catch (error: any) {
      // Mesmo com erro, fazer logout local
      set({ 
        user: null,
        token: null, 
        isAuthenticated: false, 
        isLoading: false,
        error: null 
      });
    }
  },

  resetPassword: async (email: string) => {
    set({ isLoading: true, error: null });
    try {
      await AuthService.resetPassword(email);
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateUser: async (data: Partial<User>) => {
    set({ isLoading: true, error: null });
    try {
      const updatedUser = await AuthService.updateUser(data);
      set({ user: updatedUser, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  loadUser: async () => {
    set({ isLoading: true });
    try {
      const isAuth = await AuthService.isAuthenticated();
      if (isAuth) {
        const user = await AuthService.getUserData();
        const token = await AsyncStorage.getItem('@nutri:token');
        set({ user, token, isAuthenticated: true, isLoading: false });
      } else {
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      }
    } catch (error: any) {
      console.log('Error loading user:', error);
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  setUser: (user: User | null) => {
    set({ user, isAuthenticated: !!user });
  },

  clearError: () => {
    set({ error: null });
  },
}));

