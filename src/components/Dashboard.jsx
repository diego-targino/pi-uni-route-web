import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { busStopService } from '../services/busStopService';
import FloatingMenu from './FloatingMenu';
import BusStopPopup from './BusStopPopup';
import {
  DEFAULT_CITY_CENTER,
  MARKER_ICONS,
  findClosestBusStop,
  getCurrentLocation
} from '../utils/mapUtils';
import '../styles/map.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: MARKER_ICONS.BUS_STOP.iconUrl,
  iconUrl: MARKER_ICONS.BUS_STOP.iconUrl,
  shadowUrl: null,
});

// Custom icons
const busStopIcon = new L.Icon(MARKER_ICONS.BUS_STOP);
const userLocationIcon = new L.Icon(MARKER_ICONS.USER_LOCATION);

// Component to handle routing
const RoutingMachine = ({ userLocation, targetBusStop, onRouteFound }) => {
  const map = useMap();
  const routingControlRef = useRef(null);
  const lastRouteKey = useRef(null);

  useEffect(() => {
    if (!userLocation || !targetBusStop || !map) return;

    // Create a unique key for this route to avoid unnecessary recreations
    const currentRouteKey = `${userLocation.latitude}-${userLocation.longitude}-${targetBusStop.latitude}-${targetBusStop.longitude}`;

    // If the route hasn't changed, don't recreate the control
    if (lastRouteKey.current === currentRouteKey && routingControlRef.current) {
      return;
    }

    if (routingControlRef.current) {
      try {
        map.removeControl(routingControlRef.current);
      } catch (error) {
      }
      routingControlRef.current = null;
    }

    lastRouteKey.current = currentRouteKey;

    // Add a small delay to ensure map is ready
    const timeoutId = setTimeout(() => {
      try {
        // Create new routing control
        routingControlRef.current = L.Routing.control({
          waypoints: [
            L.latLng(userLocation.latitude, userLocation.longitude),
            L.latLng(targetBusStop.latitude, targetBusStop.longitude)
          ],
          routeWhileDragging: false,
          createMarker: () => null,
          lineOptions: {
            styles: [{ color: '#3b82f6', weight: 4, opacity: 0.7 }]
          },
          show: false,
          addWaypoints: false,
          draggableWaypoints: false,
          fitSelectedRoutes: true,
          router: L.Routing.osrmv1({
            profile: 'foot',
            serviceUrl: 'https://router.project-osrm.org/route/v1',
          }),
          createContainer: () => {
            const div = document.createElement('div');
            div.style.display = 'none';
            return div;
          }
        });

        // Listen for route found event to get real distance
        routingControlRef.current.on('routesfound', function (e) {
          const routes = e.routes;
          if (routes && routes.length > 0) {
            const route = routes[0];
            const distanceInMeters = route.summary.totalDistance;
            const distanceInKm = distanceInMeters / 1000;

            // Calculate walking time: average walking speed is 5 km/h = 1.39 m/s
            // More realistic: 4.5 km/h for city walking with stops, traffic lights, etc.
            const walkingSpeedKmh = 4.5;
            const walkingTimeMinutes = (distanceInKm / walkingSpeedKmh) * 60;

            // Update the target bus stop with real route distance
            if (onRouteFound) {
              onRouteFound({
                ...targetBusStop,
                busStopId: targetBusStop.id,
                routeDistance: distanceInKm,
                walkingTime: Math.ceil(walkingTimeMinutes) // Round up to be safe
              });
            }
          }
        });

        routingControlRef.current.on('routingerror', function (e) {
        });

        routingControlRef.current.addTo(map);
      } catch (error) {
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);

      if (routingControlRef.current && map) {
        try {
          map.removeControl(routingControlRef.current);
        } catch (error) {
        }
        routingControlRef.current = null;
      }
    };
  }, [map, userLocation?.latitude, userLocation?.longitude, targetBusStop?.latitude, targetBusStop?.longitude]);

  return null;
};

const MapCenterUpdater = ({ center }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center && center.latitude && center.longitude) {
      map.setView([center.latitude, center.longitude], center.zoom || 15, {
        animate: true,
        duration: 1
      });
    }
  }, [map, center.latitude, center.longitude, center.zoom]);

  return null;
};

const Dashboard = () => {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [busStops, setBusStops] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [closestBusStop, setClosestBusStop] = useState(null);
  const [selectedBusStop, setSelectedBusStop] = useState(null); // For custom route
  const [routeInfo, setRouteInfo] = useState(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CITY_CENTER);
  const [addressUpdatedMessage, setAddressUpdatedMessage] = useState(null);

  // Handle route found callback
  const handleRouteFound = (routeData) => {
    setRouteInfo(routeData);
    setIsCalculatingRoute(false);
  };

  // Calculate route to specific bus stop
  const handleCalculateRoute = (busStop) => {
    if (!userLocation) {
      setError('Localização do usuário não disponível');
      return;
    }
    
    setIsCalculatingRoute(true);
    setSelectedBusStop(busStop);
    setRouteInfo(null);
  };

  // Load bus stops
  const loadBusStops = async () => {
    try {
      setError(null);
      const data = await busStopService.getAllBusStops();
      setBusStops(data);
    } catch (error) {
      setError(`Erro ao carregar paradas: ${error.message}`);
      setBusStops([]);
    }
  };

  // Get user location and calculate closest bus stop
  const updateUserLocation = async () => {
    try {
      // First try to get user's saved address
      if (user?.address?.latitude && user?.address?.longitude) {
        const savedLocation = {
          latitude: user.address.latitude,
          longitude: user.address.longitude
        };
        setUserLocation(savedLocation);
        setMapCenter({
          latitude: savedLocation.latitude,
          longitude: savedLocation.longitude,
          zoom: 15
        });
        return savedLocation;
      }

      // If no saved address, try to get current location
      try {
        const currentLocation = await getCurrentLocation();
        setUserLocation(currentLocation);
        setMapCenter({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          zoom: 15
        });
        return currentLocation;
      } catch (locationError) {
        return null;
      }
    } catch (error) {
      return null;
    }
  };

  // Calculate closest bus stop when data changes
  useEffect(() => {
    if (userLocation && busStops.length > 0) {
      const closest = findClosestBusStop(userLocation, busStops);
      setClosestBusStop(closest);
    } else {
      setClosestBusStop(null);
    }
  }, [userLocation, busStops]);

  // Listen for address changes in user object
  useEffect(() => {
    const updateLocationFromUser = async () => {
      if (user?.address?.latitude && user?.address?.longitude) {
        const newLocation = {
          latitude: user.address.latitude,
          longitude: user.address.longitude
        };
        
        // Only update if location actually changed
        if (!userLocation || 
            userLocation.latitude !== newLocation.latitude || 
            userLocation.longitude !== newLocation.longitude) {
          setUserLocation(newLocation);
          setMapCenter({
            latitude: newLocation.latitude,
            longitude: newLocation.longitude,
            zoom: 15
          });
          setRouteInfo(null);
          setSelectedBusStop(null);
          
          if (userLocation) {
            setAddressUpdatedMessage('📍 Endereço atualizado! Mapa recentrado na nova localização.');
            setTimeout(() => setAddressUpdatedMessage(null), 4000);
          }
        }
      }
    };

    updateLocationFromUser();
  }, [user?.address?.latitude, user?.address?.longitude]);

  useEffect(() => {
    const initializeDashboard = async () => {
      setIsLoading(true);
      await Promise.all([
        loadBusStops(),
        updateUserLocation()
      ]);
      setIsLoading(false);
    };

    initializeDashboard();
  }, []);

  const handleAddressUpdate = async (wasUpdated = false) => {
    if (wasUpdated) {
      await updateUserLocation();
    }
  };

  // Verifica se está autenticado mas não tem usuário
  if (isAuthenticated && !user) {
    return (
      <div className="map-loading">
        <div className="map-loading-spinner" />
        <p className="map-loading-text">Erro: Autenticado mas sem dados do usuário. Redirecionando...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="map-loading">
        <div className="map-loading-spinner" />
        <p className="map-loading-text">Carregando usuário...</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="map-loading">
        <div className="map-loading-spinner" />
        <p className="map-loading-text">Carregando mapa e paradas...</p>
      </div>
    );
  }

  return (
    <div className="map-dashboard-container">
      <div className="map-container">
        <MapContainer
          center={[mapCenter.latitude, mapCenter.longitude]}
          zoom={mapCenter.zoom}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          <MapCenterUpdater center={mapCenter} />

          {userLocation && (
            <Marker
              position={[userLocation.latitude, userLocation.longitude]}
              icon={userLocationIcon}
            >
              <Popup>
                <div style={{ textAlign: 'center' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0' }}>Meu endereço</h4>
                  {user?.address?.street && (
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
                      📍 {user.address.street}
                      {user.address.postalCode && ` - CEP: ${user.address.postalCode.length >= 6 ?
                        user.address.postalCode.slice(0, 5) + '-' + user.address.postalCode.slice(5) :
                        user.address.postalCode}`}
                    </p>
                  )}
                  {(closestBusStop || routeInfo || selectedBusStop) && (
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#3b82f6', fontWeight: '500' }}>
                      🚌 {selectedBusStop ? 'Rota para:' : 'Parada mais próxima:'} {
                        (routeInfo || selectedBusStop || closestBusStop).name || 
                        `Parada ${(routeInfo || selectedBusStop || closestBusStop).id}`
                      }
                      <br />
                      📏 Distância: {routeInfo?.routeDistance ?
                        (routeInfo.routeDistance < 1 ?
                          `${Math.round(routeInfo.routeDistance * 1000)}m (rota)` :
                          `${routeInfo.routeDistance.toFixed(1)}km (rota)`
                        ) : selectedBusStop ? 
                        'Calculando...' :
                        (closestBusStop?.distance < 1 ?
                          `${Math.round(closestBusStop.distance * 1000)}m (linha reta)` :
                          `${closestBusStop.distance.toFixed(1)}km (linha reta)`
                        )
                      }
                      {routeInfo?.walkingTime && (
                        <>
                          <br />
                          🚶 Tempo caminhando: {routeInfo.walkingTime} min
                        </>
                      )}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          )}

          {/* Bus stop markers */}
          {busStops.map((stop) => (
            <Marker
              key={stop.id}
              position={[stop.latitude, stop.longitude]}
              icon={busStopIcon}
            >
              <Popup>
                <BusStopPopup 
                  busStop={stop} 
                  onCalculateRoute={handleCalculateRoute}
                  routeInfo={routeInfo}
                  isCalculatingRoute={isCalculatingRoute}
                />
              </Popup>
            </Marker>
          ))}

          {/* Routing to selected bus stop or closest bus stop */}
          {userLocation && (selectedBusStop || closestBusStop) && (
            <RoutingMachine
              userLocation={userLocation}
              targetBusStop={selectedBusStop || closestBusStop}
              onRouteFound={handleRouteFound}
            />
          )}
        </MapContainer>

        {/* Floating menu */}
        <FloatingMenu onAddressUpdate={handleAddressUpdate} />

        {/* Error display */}
        {error && (
          <div style={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            right: '20px',
            background: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '0.5rem',
            padding: '1rem',
            color: '#991b1b',
            fontSize: '0.875rem',
            textAlign: 'center',
            zIndex: 1000
          }}>
            {error}
          </div>
        )}

        {/* Success message for address update */}
        {addressUpdatedMessage && (
          <div style={{
            position: 'fixed',
            bottom: error ? '80px' : '20px', // Position above error if both are shown
            left: '20px',
            right: '20px',
            background: '#d1fae5',
            border: '1px solid #a7f3d0',
            borderRadius: '0.5rem',
            padding: '1rem',
            color: '#065f46',
            fontSize: '0.875rem',
            textAlign: 'center',
            zIndex: 1000,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            {addressUpdatedMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
