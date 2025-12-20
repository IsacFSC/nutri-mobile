import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configurar a URL base da API
// Em desenvolvimento, use o IP da sua máquina (não localhost)
// Para Android Emulator: 10.0.2.2
// Para iOS Simulator: localhost
// Para dispositivo físico ou Expo Go: IP da máquina na rede local (192.168.x.x)

// 🔧 CONFIGURE AQUI: Use o IP da sua máquina para testar em dispositivo físico/Expo Go
const LOCAL_IP = '192.168.1.70'; // Seu IP local atual

const API_BASE_URL = __DEV__ 
  ? `http://${LOCAL_IP}:3000/api` // Dispositivo físico / Expo Go
  // ? 'http://10.0.2.2:3000/api' // Descomente para Android Emulator
  // ? 'http://localhost:3000/api' // Descomente para iOS Simulator
  : 'https://nutri-mobile-api.onrender.com/api';

// Export da URL base (sem /api para Socket.IO)
export const API_URL = __DEV__
  ? `http://${LOCAL_IP}:3000`
  : 'https://nutri-mobile-api.onrender.com';

// Criar instância do axios
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 segundos para evitar timeout no cold start do Render
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token JWT em todas as requisições
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('@nutri:token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros e refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Se erro 403 com token inválido - forçar logout imediatamente
    if (error.response?.status === 403 && error.response?.data?.error === 'Token inválido') {
      console.error('[API] Token inválido - forçando logout');
      await AsyncStorage.multiRemove(['@nutri:token', '@nutri:refreshToken', '@nutri:user']);
      
      return Promise.reject({
        ...error,
        isAuthError: true,
        message: 'Sessão expirada. Faça login novamente.',
      });
    }

    // Se erro 401 e não é uma tentativa de refresh ou login
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/login')) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('@nutri:refreshToken');
        
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        // Tentar renovar o token
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        // Salvar novos tokens
        await AsyncStorage.setItem('@nutri:token', accessToken);
        if (newRefreshToken) {
          await AsyncStorage.setItem('@nutri:refreshToken', newRefreshToken);
        }

        // Atualizar header da requisição original
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        // Repetir requisição original
        return api(originalRequest);
      } catch (refreshError) {
        // Se falhar, limpar tudo e forçar logout
        await AsyncStorage.multiRemove(['@nutri:token', '@nutri:refreshToken', '@nutri:user']);
        
        // Rejeitar com erro específico para identificar logout
        return Promise.reject({
          ...error,
          isAuthError: true,
          message: 'Sessão expirada. Faça login novamente.',
        });
      }
    }

    return Promise.reject(error);
  }
);

export default api;
