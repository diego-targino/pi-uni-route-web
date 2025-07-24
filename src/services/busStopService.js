import axios from 'axios';
import { API_ENDPOINTS, ERROR_MESSAGES, STORAGE_KEYS } from '../constants';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5090';

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

export const busStopService = {
  // Get all bus stops
  async getAllBusStops() {
    try {
      const response = await api.get(API_ENDPOINTS.BUS_STOPS.LIST);
      
      // Mapear resposta para camelCase se vier em PascalCase
      const data = Array.isArray(response.data) ? response.data : [];
      const busStops = data.map(stop => ({
        id: stop.Id || stop.id,
        name: stop.Name || stop.name,
        description: stop.Description || stop.description,
        latitude: stop.Latitude || stop.latitude,
        longitude: stop.Longitude || stop.longitude
      }));
      
      return busStops;
    } catch (error) {
      let message = ERROR_MESSAGES.DEFAULT;
      
      if (error.response?.status === 401) {
        message = ERROR_MESSAGES.UNAUTHORIZED;
      } else if (error.response?.status >= 500) {
        message = ERROR_MESSAGES.SERVER_ERROR;
      } else if (!error.response) {
        message = ERROR_MESSAGES.NETWORK_ERROR;
      }
      
      throw new Error(message);
    }
  },

  // Get stop times for a specific bus stop
  async getStopTimes(busStopId) {
    try {
      const response = await api.get(API_ENDPOINTS.BUS_STOPS.STOP_TIMES(busStopId));
      
      // Mapear resposta para camelCase se vier em PascalCase
      const data = Array.isArray(response.data) ? response.data : [];
      const stopTimes = data.map(time => ({
        id: time.Id || time.id,
        routeName: time.RouteName || time.routeName,
        arrivalTime: time.ArrivalTime || time.arrivalTime,
        delay: time.Delay || time.delay
      }));
      
      return stopTimes;
    } catch (error) {
      let message = ERROR_MESSAGES.DEFAULT;
      
      if (error.response?.status === 401) {
        message = ERROR_MESSAGES.UNAUTHORIZED;
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
