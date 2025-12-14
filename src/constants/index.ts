// Theme Colors
export const Colors = {
  primary: '#4CAF50',
  primaryDark: '#388E3C',
  primaryLight: '#81C784',
  
  secondary: '#FF9800',
  secondaryDark: '#F57C00',
  secondaryLight: '#FFB74D',
  
  accent: '#2196F3',
  
  background: '#F5F5F5',
  surface: '#FFFFFF',
  white: '#FFFFFF',
  black: '#000000',
  
  text: {
    primary: '#212121',
    secondary: '#757575',
    disabled: '#BDBDBD',
    inverse: '#FFFFFF',
  },
  
  error: '#F44336',
  warning: '#FFC107',
  success: '#4CAF50',
  successLight: '#E8F5E9',
  info: '#2196F3',
  infoLight: '#E3F2FD',
  
  border: '#E0E0E0',
  divider: '#EEEEEE',
  
  // Status colors
  status: {
    scheduled: '#2196F3',
    confirmed: '#4CAF50',
    inProgress: '#FF9800',
    completed: '#9E9E9E',
    cancelled: '#F44336',
  },
};

// Typography
export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  body1: {
    fontSize: 16,
    fontWeight: 'normal' as const,
    lineHeight: 24,
  },
  body2: {
    fontSize: 14,
    fontWeight: 'normal' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: 'normal' as const,
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
};

// Spacing
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border Radius
export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 9999,
};

// Shadows (iOS/Android compatible)
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
};

// App Constants
export const AppConstants = {
  APP_NAME: 'Nutri Mobile',
  DEFAULT_AVATAR: 'https://via.placeholder.com/150',
  
  // Pagination
  ITEMS_PER_PAGE: 20,
  
  // Time
  APPOINTMENT_DURATION: 60, // minutos
  REMINDER_TIME_BEFORE: 60, // minutos
  
  // Limits
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_PHOTOS_PER_ENTRY: 5,
  
  // Feature Keys
  FEATURES: {
    ONLINE_CONSULTATIONS: 'Consultas Online',
    DAILY_MEAL_PLAN: 'Plano Alimentar',
    EXERCISE_LIBRARY: 'Biblioteca de Exercícios',
    DIRECT_CHAT: 'Chat Direto',
    PROGRESS_TRACKING: 'Acompanhamento de Progresso',
    RECIPES: 'Receitas',
    SHOPPING_LIST: 'Lista de Compras',
    WATER_REMINDER: 'Lembrete de Água',
    MEAL_PHOTOS: 'Fotos das Refeições',
  },
  
  // Plans
  PLANS: {
    FREE: {
      name: 'Gratuito',
      price: 0,
      duration: 30,
    },
    BASIC: {
      name: 'Básico',
      price: 49.90,
      duration: 30,
    },
    PREMIUM: {
      name: 'Premium',
      price: 99.90,
      duration: 30,
    },
  },
};

// Error Messages
export const ErrorMessages = {
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet.',
  UNAUTHORIZED: 'Você não tem permissão para acessar este recurso.',
  NOT_FOUND: 'Recurso não encontrado.',
  VALIDATION_ERROR: 'Dados inválidos. Verifique os campos.',
  UNKNOWN_ERROR: 'Ocorreu um erro inesperado.',
  
  // Auth
  INVALID_CREDENTIALS: 'Email ou senha incorretos.',
  EMAIL_ALREADY_EXISTS: 'Este email já está cadastrado.',
  WEAK_PASSWORD: 'A senha deve ter no mínimo 6 caracteres.',
  
  // Features
  FEATURE_DISABLED: 'Este recurso não está disponível no seu plano.',
};

// Success Messages
export const SuccessMessages = {
  SAVE_SUCCESS: 'Salvo com sucesso!',
  UPDATE_SUCCESS: 'Atualizado com sucesso!',
  DELETE_SUCCESS: 'Excluído com sucesso!',
  SEND_SUCCESS: 'Enviado com sucesso!',
  
  // Auth
  LOGIN_SUCCESS: 'Login realizado com sucesso!',
  REGISTER_SUCCESS: 'Cadastro realizado com sucesso!',
  LOGOUT_SUCCESS: 'Logout realizado com sucesso!',
  
  // Appointments
  APPOINTMENT_CREATED: 'Consulta agendada com sucesso!',
  APPOINTMENT_CANCELLED: 'Consulta cancelada com sucesso!',
  
  // Features
  FEATURE_ENABLED: 'Recurso ativado com sucesso!',
  FEATURE_DISABLED_SUCCESS: 'Recurso desativado com sucesso!',
};

// Regex Patterns
export const Patterns = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\(?([0-9]{2})\)?[-. ]?([0-9]{4,5})[-. ]?([0-9]{4})$/,
  CRN: /^[0-9]{5,6}\/[A-Z]{2}$/,
  TIME: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
};
