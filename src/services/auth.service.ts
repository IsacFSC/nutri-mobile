import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/src/config/api';
import { User, UserRole } from '@/src/types';

interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  /**
   * Registra um novo usuário
   */
  static async register(
    email: string,
    password: string,
    name: string,
    role: UserRole = UserRole.PATIENT
  ): Promise<User> {
    try {
      const response = await api.post<LoginResponse>('/auth/register', {
        email,
        password,
        name,
        role,
      });

      const { user, accessToken, refreshToken } = response.data;

      // Salvar tokens e dados do usuário
      await AsyncStorage.multiSet([
        ['@nutri:token', accessToken],
        ['@nutri:refreshToken', refreshToken],
        ['@nutri:user', JSON.stringify(user)],
      ]);

      return user;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao registrar usuário';
      throw new Error(message);
    }
  }

  /**
   * Faz login com email e senha
   */
  static async login(email: string, password: string): Promise<User> {
    try {
      const response = await api.post<LoginResponse>('/auth/login', {
        email,
        password,
      });

      const { user, accessToken, refreshToken } = response.data;

      // Salvar tokens e dados do usuário
      await AsyncStorage.multiSet([
        ['@nutri:token', accessToken],
        ['@nutri:refreshToken', refreshToken],
        ['@nutri:user', JSON.stringify(user)],
      ]);

      return user;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao fazer login';
      throw new Error(message);
    }
  }

  /**
   * Faz logout
   */
  static async logout(): Promise<void> {
    try {
      // Limpar tokens e dados do usuário
      await AsyncStorage.multiRemove([
        '@nutri:token',
        '@nutri:refreshToken',
        '@nutri:user',
      ]);
    } catch (error: any) {
      throw new Error('Erro ao fazer logout');
    }
  }

  /**
   * Recupera senha
   */
  static async resetPassword(email: string): Promise<void> {
    try {
      await api.post('/auth/forgot-password', { email });
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao recuperar senha';
      throw new Error(message);
    }
  }

  /**
   * Busca dados do usuário atual
   */
  static async getUserData(): Promise<User | null> {
    try {
      const userJson = await AsyncStorage.getItem('@nutri:user');
      if (!userJson) return null;
      return JSON.parse(userJson);
    } catch (error: any) {
      throw new Error('Erro ao buscar dados do usuário');
    }
  }

  /**
   * Atualiza dados do usuário
   */
  static async updateUser(data: Partial<User>): Promise<User> {
    try {
      const response = await api.put<User>('/users/profile', data);
      
      // Atualizar dados salvos localmente
      await AsyncStorage.setItem('@nutri:user', JSON.stringify(response.data));
      
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao atualizar usuário';
      throw new Error(message);
    }
  }

  /**
   * Verifica se há um token salvo (usuário logado)
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('@nutri:token');
      return !!token;
    } catch (error) {
      return false;
    }
  }

  /**
   * Renova o access token usando o refresh token
   */
  static async refreshAccessToken(): Promise<string> {
    try {
      const refreshToken = await AsyncStorage.getItem('@nutri:refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      const response = await api.post<{ accessToken: string; refreshToken: string }>(
        '/auth/refresh',
        { refreshToken }
      );

      const { accessToken, refreshToken: newRefreshToken } = response.data;

      await AsyncStorage.multiSet([
        ['@nutri:token', accessToken],
        ['@nutri:refreshToken', newRefreshToken],
      ]);

      return accessToken;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao renovar token';
      throw new Error(message);
    }
  }
}

