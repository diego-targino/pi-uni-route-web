import axios from 'axios';
import { API_ENDPOINTS, ERROR_MESSAGES, STORAGE_KEYS } from '../constants';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5090';

// Verificar se localStorage está disponível
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

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  // Validação de email
  _validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validação básica de campos obrigatórios
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

  // Login user
  async login(credentials) {
    try {
      // Validação dos campos
      const validationErrors = this._validateLoginFields(credentials);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors[0]);
      }

      // Mapeia os campos para o formato esperado pela API
      const loginData = {
        Mail: credentials.email || credentials.mail,
        Password: credentials.password
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
          id: userData.Id || userData.id,
          name: userData.Name || userData.name,
          email: userData.Mail || userData.mail,
          address: userData.Address || userData.address ? {
            id: (userData.Address || userData.address).Id || (userData.Address || userData.address).id,
            street: (userData.Address || userData.address).Street || (userData.Address || userData.address).street,
            postalCode: (userData.Address || userData.address).PostalCode || (userData.Address || userData.address).postalCode,
            latitude: (userData.Address || userData.address).Latitude || (userData.Address || userData.address).latitude,
            longitude: (userData.Address || userData.address).Longitude || (userData.Address || userData.address).longitude
          } : null
        };
        
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        
        return { user, token: tempToken };
      } else {
        throw new Error('Dados de usuário não encontrados na resposta');
      }
    } catch (error) {
      
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
        Name: userData.name,
        Mail: userData.email || userData.mail,
        Password: userData.password
      };
      
      const response = await api.post(API_ENDPOINTS.AUTH.REGISTER, registerData);
      
      // O registro retorna apenas status 201, sem dados do usuário
      // Após o registro, fazer login automaticamente
      if (response.status === 201) {
        const loginCredentials = {
          email: registerData.Mail,
          password: registerData.Password
        };
        
        return await this.login(loginCredentials);
      }
      
      return response.data;
    } catch (error) {
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
        id: userData.Id || userData.id,
        name: userData.Name || userData.name,
        email: userData.Mail || userData.mail,
        address: userData.Address || userData.address ? {
          id: (userData.Address || userData.address).Id || (userData.Address || userData.address).id,
          street: (userData.Address || userData.address).Street || (userData.Address || userData.address).street,
          postalCode: (userData.Address || userData.address).PostalCode || (userData.Address || userData.address).postalCode,
          latitude: (userData.Address || userData.address).Latitude || (userData.Address || userData.address).latitude,
          longitude: (userData.Address || userData.address).Longitude || (userData.Address || userData.address).longitude
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
        StudentId: user.id,
        Street: addressData.street,
        PostalCode: addressData.postalCode,
        Latitude: addressData.latitude,
        Longitude: addressData.longitude
      };

      const response = await api.post(API_ENDPOINTS.ADDRESS.CREATE, createAddressData);
      
      // Atualiza o usuário no localStorage com o novo endereço
      const updatedUser = {
        ...user,
        address: {
          id: response.data.Id || response.data.id,
          street: response.data.Street || response.data.street,
          postalCode: response.data.PostalCode || response.data.postalCode,
          latitude: response.data.Latitude || response.data.latitude,
          longitude: response.data.Longitude || response.data.longitude
        }
      };
      
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      
      // Retorna dados em camelCase
      return {
        id: response.data.Id || response.data.id,
        street: response.data.Street || response.data.street,
        postalCode: response.data.PostalCode || response.data.postalCode,
        latitude: response.data.Latitude || response.data.latitude,
        longitude: response.data.Longitude || response.data.longitude
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
        Street: addressData.street,
        PostalCode: addressData.postalCode,
        Latitude: addressData.latitude,
        Longitude: addressData.longitude
      };

      const response = await api.put(API_ENDPOINTS.ADDRESS.UPDATE(addressId), updateAddressData);
      
      // Atualiza o usuário no localStorage com o endereço atualizado
      const user = this.getCurrentUser();
      if (user) {
        const updatedUser = {
          ...user,
          address: {
            id: response.data.Id || response.data.id,
            street: response.data.Street || response.data.street,
            postalCode: response.data.PostalCode || response.data.postalCode,
            latitude: response.data.Latitude || response.data.latitude,
            longitude: response.data.Longitude || response.data.longitude
          }
        };
        
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      }
      
      // Retorna dados em camelCase
      return {
        id: response.data.Id || response.data.id,
        street: response.data.Street || response.data.street,
        postalCode: response.data.PostalCode || response.data.postalCode,
        latitude: response.data.Latitude || response.data.latitude,
        longitude: response.data.Longitude || response.data.longitude
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
