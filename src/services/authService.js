import axios from 'axios';
import { API_ENDPOINTS, ERROR_MESSAGES, STORAGE_KEYS } from '../constants';
    
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5090';

const isLocalStorageAvailable = () => {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

const requestCache = new Map();

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    const requestKey = `${config.method}-${config.url}-${JSON.stringify(config.data || {})}`;
    
    if (config.method === 'post' && requestCache.has(requestKey)) {
      const cachedTime = requestCache.get(requestKey);
      const timeDiff = Date.now() - cachedTime;
      
      if (timeDiff < 1000) {
        const error = new Error('Duplicate request prevented');
        error.name = 'DuplicateRequestError';
        return Promise.reject(error);
      }
    }
    
    if (config.method === 'post') {
      requestCache.set(requestKey, Date.now());
      
      setTimeout(() => {
        requestCache.delete(requestKey);
      }, 3000);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    if (response.config && response.config.method === 'post') {
      const requestKey = `${response.config.method}-${response.config.url}-${JSON.stringify(response.config.data || {})}`;
      requestCache.delete(requestKey);
    }
    return response;
  },
  (error) => {
    if (error.config && error.config.method === 'post' && error.name !== 'DuplicateRequestError') {
      const requestKey = `${error.config.method}-${error.config.url}-${JSON.stringify(error.config.data || {})}`;
      requestCache.delete(requestKey);
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  _validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  _validateLoginFields(credentials) {
    const errors = [];
    
    if (!credentials.email && !credentials.mail) {
      errors.push(ERROR_MESSAGES.EMAIL_REQUIRED);
    } else if (!this._validateEmail(credentials.email || credentials.mail)) {
      errors.push(ERROR_MESSAGES.EMAIL_INVALID);
    }
    
    if (!credentials.password) {
      errors.push(ERROR_MESSAGES.PASSWORD_REQUIRED);
    }
    
    return errors;
  },

  _validateRegisterFields(userData) {
    const errors = [];
    
    if (!userData.name) {
      errors.push(ERROR_MESSAGES.NAME_REQUIRED);
    }
    
    if (!userData.email && !userData.mail) {
      errors.push(ERROR_MESSAGES.EMAIL_REQUIRED);
    } else if (!this._validateEmail(userData.email || userData.mail)) {
      errors.push(ERROR_MESSAGES.EMAIL_INVALID);
    }
    
    if (!userData.password) {
      errors.push(ERROR_MESSAGES.PASSWORD_REQUIRED);
    } else if (userData.password.length < 6) {
      errors.push(ERROR_MESSAGES.PASSWORD_MIN_LENGTH);
    }
    
    return errors;
  },

  async login(credentials) {
    try {
      const validationErrors = this._validateLoginFields(credentials);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors[0]);
      }

      const loginData = {
        mail: credentials.email || credentials.mail,
        password: credentials.password
      };
      
      const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, loginData);
      const userData = response.data;
      
      // Como o backend não está retornando token, vamos gerar um token temporário
      // ou trabalhar sem token por enquanto
      if (userData && userData.id) {
        if (!isLocalStorageAvailable()) {
          throw new Error('localStorage não está disponível');
        }
        
        // Gerar um token temporário até o backend ser corrigido
        const tempToken = `temp_token_${userData.id}_${Date.now()}`;
        localStorage.setItem(STORAGE_KEYS.TOKEN, tempToken);
        
        // Mapeia a resposta para o formato usado no frontend (agora usando camelCase)
        const user = {
          id: userData.id,
          name: userData.name,
          email: userData.mail,
          address: userData.address ? {
            id: userData.address.id,
            street: userData.address.street,
            postalCode: userData.address.postalCode,
            latitude: userData.address.latitude,
            longitude: userData.address.longitude
          } : null
        };
        
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        
        return { user, token: tempToken };
      } else {
        throw new Error('Dados de usuário não encontrados na resposta');
      }
    } catch (error) {
      // Se é um erro de requisição duplicada, ignorar silenciosamente
      if (error.name === 'DuplicateRequestError') {
        throw new Error('Aguarde um momento antes de tentar novamente.');
      }
      
      if (error.message.includes('EMAIL_') || error.message.includes('PASSWORD_')) {
        throw error;
      }
      
      let message = ERROR_MESSAGES.DEFAULT;
      
      if (error.response?.status === 401) {
        message = ERROR_MESSAGES.UNAUTHORIZED;
      } else if (error.response?.status === 400) {
        message = error.response?.data?.message || ERROR_MESSAGES.VALIDATION_ERROR;
      } else if (error.response?.status >= 500) {
        message = ERROR_MESSAGES.SERVER_ERROR;
      } else if (!error.response) {
        message = ERROR_MESSAGES.NETWORK_ERROR;
      }
      
      throw new Error(message);
    }
  },

  // Register new user
  async register(userData) {
    try {
      // Validação dos campos
      const validationErrors = this._validateRegisterFields(userData);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors[0]);
      }

      // Mapeia os campos para o formato esperado pela API
      const registerData = {
        name: userData.name,
        mail: userData.email || userData.mail,
        password: userData.password
      };
      
      const response = await api.post(API_ENDPOINTS.AUTH.REGISTER, registerData);
      
      // O registro retorna apenas status 201, sem dados do usuário
      // Não fazemos login automático, apenas confirmamos o registro
      if (response.status === 201) {
        return { success: true, message: 'Conta criada com sucesso!' };
      }
      
      return response.data;
    } catch (error) {
      // Se é um erro de requisição duplicada, ignorar silenciosamente
      if (error.name === 'DuplicateRequestError') {
        throw new Error('Aguarde um momento antes de tentar novamente.');
      }
      
      // Se é um erro de validação nosso, propagar
      if (error.message.includes('NAME_') || error.message.includes('EMAIL_') || error.message.includes('PASSWORD_')) {
        throw error;
      }
      
      let message = ERROR_MESSAGES.DEFAULT;
      
      if (error.response?.status === 400) {
        message = error.response?.data?.message || ERROR_MESSAGES.VALIDATION_ERROR;
      } else if (error.response?.status === 409) {
        message = ERROR_MESSAGES.EMAIL_ALREADY_EXISTS;
      } else if (error.response?.status >= 500) {
        message = ERROR_MESSAGES.SERVER_ERROR;
      } else if (!error.response) {
        message = ERROR_MESSAGES.NETWORK_ERROR;
      }
      
      throw new Error(message);
    }
  },

  // Logout user
  logout() {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  // Get current user
  getCurrentUser() {
    try {
      const user = localStorage.getItem(STORAGE_KEYS.USER);
      const parsedUser = user ? JSON.parse(user) : null;
      return parsedUser;
    } catch (error) {
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated() {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const hasToken = !!token;
    return hasToken;
  },

  // Get auth token
  getToken() {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  },

  // Refresh token
  async refreshToken() {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.REFRESH);
      const { token } = response.data;
      
      if (token) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      }
      
      return token;
    } catch (error) {
      throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
    }
  },

  // Get user profile
  async getProfile() {
    try {
      const response = await api.get(API_ENDPOINTS.AUTH.ME);
      const userData = response.data;
      
      // Mapeia a resposta para o formato usado no frontend (camelCase)
      const user = {
        id: userData.id,
        name: userData.name,
        email: userData.mail,
        address: userData.address ? {
          id: userData.address.id,
          street: userData.address.street,
          postalCode: userData.address.postalCode,
          latitude: userData.address.latitude,
          longitude: userData.address.longitude
        } : null
      };
      
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      return user;
    } catch (error) {
      throw new Error(error.response?.data?.message || ERROR_MESSAGES.DEFAULT);
    }
  },

  // Create user address
  async createAddress(addressData) {
    try {
      const user = this.getCurrentUser();
      if (!user) {
        throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
      }

      const createAddressData = {
        studentId: user.id,
        street: addressData.street,
        postalCode: addressData.postalCode,
        latitude: addressData.latitude,
        longitude: addressData.longitude
      };

      const response = await api.post(API_ENDPOINTS.ADDRESS.CREATE, createAddressData);
      
      // Atualiza o usuário no localStorage com o novo endereço
      const updatedUser = {
        ...user,
        address: {
          id: response.data.id,
          street: response.data.street,
          postalCode: response.data.postalCode,
          latitude: response.data.latitude,
          longitude: response.data.longitude
        }
      };
      
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      
      // Retorna dados em camelCase
      return {
        id: response.data.id,
        street: response.data.street,
        postalCode: response.data.postalCode,
        latitude: response.data.latitude,
        longitude: response.data.longitude
      };
    } catch (error) {
      let message = ERROR_MESSAGES.DEFAULT;
      
      if (error.response?.status === 400) {
        message = error.response?.data?.message || ERROR_MESSAGES.VALIDATION_ERROR;
      } else if (error.response?.status >= 500) {
        message = ERROR_MESSAGES.SERVER_ERROR;
      } else if (!error.response) {
        message = ERROR_MESSAGES.NETWORK_ERROR;
      }
      
      throw new Error(message);
    }
  },

  // Update user address
  async updateAddress(addressId, addressData) {
    try {
      const updateAddressData = {
        street: addressData.street,
        postalCode: addressData.postalCode.replace('-', ''),
        latitude: addressData.latitude,
        longitude: addressData.longitude
      };

      const response = await api.put(API_ENDPOINTS.ADDRESS.UPDATE(addressId), updateAddressData);
      
      // Atualiza o usuário no localStorage com o endereço atualizado
      const user = this.getCurrentUser();
      if (user) {
        const updatedUser = {
          ...user,
          address: {
            id: response.data.id,
            street: response.data.street,
            postalCode: response.data.postalCode,
            latitude: response.data.latitude,
            longitude: response.data.longitude
          }
        };
        
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      }
      
      // Retorna dados em camelCase
      return {
        id: response.data.id,
        street: response.data.street,
        postalCode: response.data.postalCode,
        latitude: response.data.latitude,
        longitude: response.data.longitude
      };
    } catch (error) {
      let message = ERROR_MESSAGES.DEFAULT;
      
      if (error.response?.status === 400) {
        message = error.response?.data?.message || ERROR_MESSAGES.VALIDATION_ERROR;
      } else if (error.response?.status === 404) {
        message = ERROR_MESSAGES.NOT_FOUND;
      } else if (error.response?.status >= 500) {
        message = ERROR_MESSAGES.SERVER_ERROR;
      } else if (!error.response) {
        message = ERROR_MESSAGES.NETWORK_ERROR;
      }
      
      throw new Error(message);
    }
  }
};
