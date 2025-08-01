export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
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
      <svg fill="#000000" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
	 width="800px" height="800px" viewBox="0 0 495.398 495.398"
	 xml:space="preserve">
<g>
	<g>
		<g>
			<path d="M487.083,225.514l-75.08-75.08V63.704c0-15.682-12.708-28.391-28.413-28.391c-15.669,0-28.377,12.709-28.377,28.391
				v29.941L299.31,37.74c-27.639-27.624-75.694-27.575-103.27,0.05L8.312,225.514c-11.082,11.104-11.082,29.071,0,40.158
				c11.087,11.101,29.089,11.101,40.172,0l187.71-187.729c6.115-6.083,16.893-6.083,22.976-0.018l187.742,187.747
				c5.567,5.551,12.825,8.312,20.081,8.312c7.271,0,14.541-2.764,20.091-8.312C498.17,254.586,498.17,236.619,487.083,225.514z" fill="#10b981" stroke="white" stroke-width="2"/>
			<path d="M257.561,131.836c-5.454-5.451-14.285-5.451-19.723,0L72.712,296.913c-2.607,2.606-4.085,6.164-4.085,9.877v120.401
				c0,28.253,22.908,51.16,51.16,51.16h81.754v-126.61h92.299v126.61h81.755c28.251,0,51.159-22.907,51.159-51.159V306.79
				c0-3.713-1.465-7.271-4.085-9.877L257.561,131.836z" fill="#10b981" stroke="white" stroke-width="2"/>
		</g>
	</g>
</g>
</svg>
    `),
    iconSize: [28, 28],
    iconAnchor: [14, 24],
    popupAnchor: [0, -24]
  }
};

export const formatDistance = (distance) => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)}km`;
};

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
        maximumAge: 300000
      }
    );
  });
};
