// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/login',
    REGISTER: '/api/student',
    REFRESH: '/api/auth/refresh',
    ME: '/api/auth/me'
  },
  USERS: {
    PROFILE: '/api/users/profile',
    UPDATE_PROFILE: '/api/users/profile'
  },
  ADDRESS: {
    CREATE: '/api/address',
    UPDATE: (id) => `/api/address/${id}`
  },
  BUS_STOPS: {
    LIST: '/api/busstop',
    STOP_TIMES: (id) => `/api/busstop/${id}/stop-times`
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
  UNAUTHORIZED: 'Email ou senha incorretos.',
  FORBIDDEN: 'Você não tem permissão para essa ação.',
  NOT_FOUND: 'Recurso não encontrado.',
  SERVER_ERROR: 'Erro interno do servidor. Tente novamente.',
  VALIDATION_ERROR: 'Dados inválidos. Verifique os campos.',
  EMAIL_REQUIRED: 'Email é obrigatório.',
  PASSWORD_REQUIRED: 'Senha é obrigatória.',
  NAME_REQUIRED: 'Nome é obrigatório.',
  EMAIL_INVALID: 'Email inválido.',
  PASSWORD_MIN_LENGTH: 'Senha deve ter pelo menos 6 caracteres.',
  EMAIL_ALREADY_EXISTS: 'Este email já está cadastrado.',
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
