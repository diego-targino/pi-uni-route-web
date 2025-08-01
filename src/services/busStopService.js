import axios from 'axios';
import { API_ENDPOINTS, ERROR_MESSAGES, STORAGE_KEYS } from '../constants';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5090';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
  async getAllBusStops() {
    try {
      const response = await api.get(API_ENDPOINTS.BUS_STOPS.LIST);
      
      const data = Array.isArray(response.data) ? response.data : [];
      const busStops = data.map(stop => ({
        id: stop.id,
        name: stop.name,
        addressDetails: stop.addressDatails,
        referencePoint: stop.referencePoint,
        latitude: stop.latitude,
        longitude: stop.longitude
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

  async getStopTimes(busStopId) {
    try {
      const response = await api.get(API_ENDPOINTS.BUS_STOPS.STOP_TIMES(busStopId));
      
      const data = Array.isArray(response.data) ? response.data : [];
      const stopTimes = data.map(time => ({
        id: time.Id || time.id,
        busType: time.BusType || time.busType,
        expectedTime: time.ExpectedTime || time.expectedTime
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
