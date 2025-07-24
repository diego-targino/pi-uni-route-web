import { useState, useEffect } from 'react';
import { busStopService } from '../services/busStopService';
import '../styles/dashboard.css';

const BusStops = () => {
  const [busStops, setBusStops] = useState([]);
  const [selectedStop, setSelectedStop] = useState(null);
  const [stopTimes, setStopTimes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBusStops();
  }, []);

  const loadBusStops = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await busStopService.getAllBusStops();
      setBusStops(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStopTimes = async (busStopId) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await busStopService.getStopTimes(busStopId);
      setStopTimes(data);
      setSelectedStop(busStopId);
    } catch (error) {
      setError(error.message);
      setStopTimes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const closeStopTimes = () => {
    setSelectedStop(null);
    setStopTimes([]);
    setError(null);
  };

  if (isLoading && busStops.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Carregando paradas...</p>
      </div>
    );
  }

  return (
    <div className="bus-stops-container">
      <div className="card">
        <div className="card-header">
          <h2>Paradas de Ônibus</h2>
          <button 
            onClick={loadBusStops} 
            className="refresh-button"
            disabled={isLoading}
          >
            🔄 Atualizar
          </button>
        </div>
        
        <div className="card-body">
          {error && (
            <div className="alert error">
              {error}
            </div>
          )}

          {busStops.length === 0 && !isLoading ? (
            <div className="empty-state">
              <p>Nenhuma parada de ônibus encontrada.</p>
            </div>
          ) : (
            <div className="bus-stops-grid">
              {busStops.map((stop) => (
                <div key={stop.id} className="bus-stop-card">
                  <h3>{stop.name || `Parada ${stop.id}`}</h3>
                  {stop.description && (
                    <p className="stop-description">{stop.description}</p>
                  )}
                  {stop.latitude && stop.longitude && (
                    <p className="stop-coordinates">
                      📍 {stop.latitude.toFixed(6)}, {stop.longitude.toFixed(6)}
                    </p>
                  )}
                  <button
                    onClick={() => loadStopTimes(stop.id)}
                    className="view-times-button"
                    disabled={isLoading}
                  >
                    Ver Horários
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal for stop times */}
      {selectedStop && (
        <div className="modal-overlay" onClick={closeStopTimes}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Horários - Parada {selectedStop}</h3>
              <button className="modal-close" onClick={closeStopTimes}>×</button>
            </div>
            
            <div className="modal-body">
              {isLoading ? (
                <div className="loading-container">
                  <div className="loading-spinner" />
                  <p>Carregando horários...</p>
                </div>
              ) : error ? (
                <div className="alert error">
                  {error}
                </div>
              ) : stopTimes.length === 0 ? (
                <div className="empty-state">
                  <p>Nenhum horário encontrado para esta parada.</p>
                </div>
              ) : (
                <div className="stop-times-list">
                  {stopTimes.map((time, index) => (
                    <div key={index} className="stop-time-item">
                      <div className="time-info">
                        <span className="route-name">{time.routeName || 'Linha'}</span>
                        <span className="arrival-time">{time.arrivalTime}</span>
                      </div>
                      {time.delay && (
                        <span className="delay-info">Atraso: {time.delay}min</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusStops;
