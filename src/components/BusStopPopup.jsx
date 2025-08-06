import { useState, useEffect } from 'react';
import { busStopService } from '../services/busStopService';
import '../styles/map.css';

const BusStopPopup = ({ busStop, onCalculateRoute, routeInfo, isCalculatingRoute }) => {
    const [stopTimes, setStopTimes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showTimes, setShowTimes] = useState(false);

    const loadStopTimes = async () => {
        if (showTimes || isLoading) return;

        setIsLoading(true);
        setError(null);
        setShowTimes(true);

        try {
            const data = await busStopService.getStopTimes(busStop.id);
            setStopTimes(data);
        } catch (error) {
            setError(error.message);
            setStopTimes([]);
        } finally {
            setIsLoading(false);
        }
    };

    const getBusType = (type) => {
        if (type === 0) return 'Município'
        else return 'UFC';
    };

    return (
        <div className="bus-stop-popup">
            <h3>{busStop.name || `Parada ${busStop.id}`}</h3>

            <div className="bus-stop-popup-content">
                {busStop.description && (
                    <p className="bus-stop-description">{busStop.description}</p>
                )}

                {busStop.latitude && busStop.longitude && (
                    <>
                        <p className="bus-stop-coordinates">
                            📍 {busStop.addressDetails}
                        </p>
                        <p className="reference-point">
                            {busStop.referencePoint === "N/A" ? '' : `🗺️ ${busStop.referencePoint}`}
                        </p>
                    </>
                )}

                {busStop.distance !== undefined && (
                    <p className="bus-stop-coordinates">
                        📏 Distância: {busStop.distance < 1 ?
                            `${Math.round(busStop.distance * 1000)}m` :
                            `${busStop.distance.toFixed(1)}km`
                        }
                    </p>
                )}

                <button
                    className="view-times-btn"
                    onClick={loadStopTimes}
                    disabled={isLoading}
                >
                    {isLoading ? 'Carregando...' : 'Ver Horários'}
                </button>

                <button
                    className={`calculate-route-btn ${routeInfo && routeInfo.busStopId === busStop.id ? 'calculated' : ''}`}
                    onClick={() => onCalculateRoute && onCalculateRoute(busStop)}
                    disabled={isCalculatingRoute}
                    style={{ marginTop: '0.5rem' }}
                >
                    {isCalculatingRoute && routeInfo?.busStopId !== busStop.id ? 
                        'Calculando...' : 
                        routeInfo && routeInfo.busStopId === busStop.id ? 
                        'Rota Calculada' : 
                        'Calcular Rota'
                    }
                </button>

                {/* Route information */}
                {routeInfo && routeInfo.busStopId === busStop.id && (
                    <div className="route-info">
                        <h4>Informações da Rota</h4>
                        <p className="bus-stop-coordinates">
                            📏 Distância: {routeInfo.routeDistance < 1 ?
                                `${Math.round(routeInfo.routeDistance * 1000)}m` :
                                `${routeInfo.routeDistance.toFixed(1)}km`
                            }
                        </p>
                        <p className="bus-stop-coordinates">
                            🚶 Tempo caminhando: {routeInfo.walkingTime} min
                        </p>
                    </div>
                )}

                {showTimes && (
                    <div className="bus-stop-times">
                        {isLoading ? (
                            <div className="loading-times">
                                <div className="loading-spinner-small" />
                                <span>Carregando horários...</span>
                            </div>
                        ) : error ? (
                            <div className="no-times-message">
                                Erro: {error}
                            </div>
                        ) : stopTimes.length === 0 ? (
                            <div className="no-times-message">
                                Nenhum horário encontrado
                            </div>
                        ) : (
                            <div className="stop-times-list">
                                <h3>Ida para o campus</h3>
                                {stopTimes.sort((a, b) => a.expectedTime.localeCompare(b.expectedTime)).map((stopTime) => (
                                    <div key={stopTime.id} className="stop-time-item">
                                        <div className="time-info">
                                            <span className="route-name">Ônibus {getBusType(stopTime.busType)}</span>
                                            <span className="arrival-time">{stopTime.expectedTime.split(':')[0]}:{stopTime.expectedTime.split(':')[1]}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BusStopPopup;
