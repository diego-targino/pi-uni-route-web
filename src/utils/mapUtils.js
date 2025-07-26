// Utility functions for map operations

/**
 * Calculate the distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Convert degrees to radians
 * @param {number} deg - Degrees
 * @returns {number} Radians
 */
const toRad = (deg) => {
  return deg * (Math.PI / 180);
};

/**
 * Find the closest bus stop to a given location
 * @param {Object} userLocation - User's location {latitude, longitude}
 * @param {Array} busStops - Array of bus stops with latitude and longitude
 * @returns {Object|null} Closest bus stop or null if none found
 */
export const findClosestBusStop = (userLocation, busStops) => {
  if (!userLocation || !userLocation.latitude || !userLocation.longitude || !busStops.length) {
    return null;
  }

  let closestStop = null;
  let minDistance = Infinity;

  busStops.forEach((stop) => {
    if (stop.latitude && stop.longitude) {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        stop.latitude,
        stop.longitude
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestStop = { ...stop, distance };
      }
    }
  });

  return closestStop;
};

/**
 * Default city center coordinates (you can change this to your desired city)
 * Using João Pessoa, PB as default
 */
export const DEFAULT_CITY_CENTER = {
  latitude: -7.1195,
  longitude: -34.8450,
  zoom: 13
};

/**
 * Custom marker icons for different types of locations
 */
export const MARKER_ICONS = {
  BUS_STOP: {
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="8" width="24" height="16" rx="4" fill="#3b82f6" stroke="white" stroke-width="2"/>
        <rect x="6" y="10" width="20" height="8" rx="2" fill="white"/>
        <circle cx="10" cy="22" r="2" fill="#374151"/>
        <circle cx="22" cy="22" r="2" fill="#374151"/>
        <rect x="2" y="14" width="4" height="2" rx="1" fill="#3b82f6"/>
        <rect x="26" y="14" width="4" height="2" rx="1" fill="#3b82f6"/>
      </svg>
    `),
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  },
  USER_LOCATION: {
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 2L19 10H22C23.1 10 24 10.9 24 12V22C24 23.1 23.1 24 22 24H6C4.9 24 4 23.1 4 22V12C4 10.9 4.9 10 6 10H9L14 2Z" fill="#10b981" stroke="white" stroke-width="2"/>
        <circle cx="14" cy="16" r="3" fill="white"/>
        <rect x="11" y="20" width="6" height="2" fill="white" rx="1"/>
      </svg>
    `),
    iconSize: [28, 28],
    iconAnchor: [14, 24],
    popupAnchor: [0, -24]
  }
};

/**
 * Format distance for display
 * @param {number} distance - Distance in kilometers
 * @returns {string} Formatted distance string
 */
export const formatDistance = (distance) => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)}km`;
};

/**
 * Get user's current location
 * @returns {Promise<Object>} Promise that resolves to {latitude, longitude}
 */
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalização não é suportada pelo navegador'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        let message = 'Erro ao obter localização';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Permissão para acessar localização foi negada';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Localização não disponível';
            break;
          case error.TIMEOUT:
            message = 'Tempo limite para obter localização excedido';
            break;
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
};
