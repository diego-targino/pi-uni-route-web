// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    ME: '/api/auth/me'
  },
  USERS: {
    PROFILE: '/api/users/profile',
    UPDATE_PROFILE: '/api/users/profile'
  },
  ROUTES: {
    LIST: '/api/routes',
    CREATE: '/api/routes',
    GET: (id) => `/api/routes/${id}`,
    UPDATE: (id) => `/api/routes/${id}`,
    DELETE: (id) => `/api/routes/${id}`
  }
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet.',
  UNAUTHORIZED: 'Sessão expirada. Faça login novamente.',
  FORBIDDEN: 'Você não tem permissão para essa ação.',
  NOT_FOUND: 'Recurso não encontrado.',
  SERVER_ERROR: 'Erro interno do servidor. Tente novamente.',
  VALIDATION_ERROR: 'Dados inválidos. Verifique os campos.',
  DEFAULT: 'Algo deu errado. Tente novamente.'
};

// Success messages
export const SUCCESS_MESSAGES = {
  LOGIN: 'Login realizado com sucesso!',
  REGISTER: 'Conta criada com sucesso!',
  PROFILE_UPDATED: 'Perfil atualizado com sucesso!',
  ROUTE_CREATED: 'Rota criada com sucesso!',
  ROUTE_UPDATED: 'Rota atualizada com sucesso!',
  ROUTE_DELETED: 'Rota excluída com sucesso!'
};

// Storage keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  REMEMBER_EMAIL: 'rememberEmail'
};
