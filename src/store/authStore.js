import { create } from 'zustand';
import { authService } from '../services/authService';
import { STORAGE_KEYS } from '../constants';

export const useAuthStore = create((set, get) => {
  const initialUser = authService.getCurrentUser();
  const initialIsAuthenticated = authService.isAuthenticated();
  
  return {
    user: initialUser,
    isAuthenticated: initialIsAuthenticated,
    isLoading: false,
    error: null,

    // Login action
    login: async (credentials) => {
      const currentState = get();
      
      // Prevent multiple simultaneous login attempts
      if (currentState.isLoading) {
        return;
      }
      
      set({ isLoading: true, error: null });
      try {
        const data = await authService.login(credentials);
        set({ 
          user: data.user, 
          isAuthenticated: true, 
          isLoading: false 
        });
        return data;
      } catch (error) {
        set({ 
          error: error.message, 
          isLoading: false 
        });
        throw error;
      }
    },

    // Register action
    register: async (userData) => {
      const currentState = get();
      
      // Prevent multiple simultaneous register attempts
      if (currentState.isLoading) {
        return;
      }
      
      set({ isLoading: true, error: null });
      try {
        const data = await authService.register(userData);
        set({ 
          isLoading: false 
        });
        return data;
      } catch (error) {
        set({ 
          error: error.message, 
          isLoading: false 
        });
        throw error;
      }
    },

    // Logout action
    logout: () => {
      authService.logout();
      set({ 
        user: null, 
        isAuthenticated: false, 
        error: null 
      });
    },

    // Clear error action
    clearError: () => {
      set({ error: null });
    },

    // Update user action
    updateUser: (userData) => {
      set({ user: userData });
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
    },

    // Create address action
    createAddress: async (addressData) => {
      set({ isLoading: true, error: null });
      try {
        const address = await authService.createAddress(addressData);
        const currentUser = get().user;
        const updatedUser = {
          ...currentUser,
          address: {
            id: address.id,
            street: address.street,
            postalCode: address.postalCode,
            latitude: address.latitude,
            longitude: address.longitude
          }
        };
        
        set({ 
          user: updatedUser, 
          isLoading: false 
        });
        
        return address;
      } catch (error) {
        set({ 
          error: error.message, 
          isLoading: false 
        });
        throw error;
      }
    },

    // Update address action
    updateAddress: async (addressId, addressData) => {
      set({ isLoading: true, error: null });
      try {
        const address = await authService.updateAddress(addressId, addressData);
        const currentUser = get().user;
        const updatedUser = {
          ...currentUser,
          address: {
            id: address.id,
            street: address.street,
            postalCode: address.postalCode,
            latitude: address.latitude,
            longitude: address.longitude
          }
        };
        
        set({ 
          user: updatedUser, 
          isLoading: false 
        });
        
        return address;
      } catch (error) {
        set({ 
          error: error.message, 
          isLoading: false 
        });
        throw error;
      }
    }
  }
});
