import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import '../styles/modal.css';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';
import 'leaflet-control-geocoder';

const AddressForm = ({ onClose }) => {
  const { user, createAddress, updateAddress, isLoading, error, clearError } = useAuthStore();
  const [formData, setFormData] = useState({
    street: user?.address?.street || '',
    postalCode: user?.address?.postalCode || '',
    latitude: user?.address?.latitude || null,
    longitude: user?.address?.longitude || null
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [search, setSearch] = useState('');
  const searchInputRef = useRef(null);

  const handleLocationSelect = (mapInstance, lat, lng, address) => {
    // Remove todos os marcadores existentes antes de adicionar/atualizar
    if (marker) {
      marker.setLatLng([lat, lng]);
    } else {
      // Remove todos os marcadores do mapa
      mapInstance.eachLayer(layer => {
        if (layer instanceof L.Marker) {
          mapInstance.removeLayer(layer);
        }
      });
      const newMarker = L.marker([lat, lng], { icon: L.icon({
        iconUrl: 'https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4cd.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      }) }).addTo(mapInstance);
      setMarker(newMarker);
    }
    mapInstance.setView([lat, lng], 16);
    setFormData(prev => ({
      ...prev,
      street: address,
      latitude: lat,
      longitude: lng
    }));
  }

  useEffect(() => {
    const mapInstance = L.map('address-map').setView([
      formData.latitude || -3.7319,
      formData.longitude || -38.5267
    ], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstance);

    // Adiciona o geocoder sem o input padrão
    const geocoderControl = L.Control.geocoder({
      defaultMarkGeocode: false,
      position: 'topleft',
      geocoder: L.Control.Geocoder.nominatim({
        geocodingQueryParams: {
          countrycodes: 'br',
          limit: 5,
          language: 'pt-BR'
        }
      })
    }).addTo(mapInstance);

    geocoderControl.on('markgeocode', function(e) {
      const { center, name } = e.geocode;
      handleLocationSelect(mapInstance, center.lat, center.lng, name);
    });

    mapInstance.on('click', function(e) {
      const { lat, lng } = e.latlng;
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=pt-BR`)
        .then(res => res.json())
        .then(data => {
          handleLocationSelect(mapInstance, lat, lng, data.display_name);
        });
    });

    if (formData.latitude && formData.longitude) {
      handleLocationSelect(mapInstance, formData.latitude, formData.longitude, formData.street);
    }

    setMap(mapInstance);
    return () => {
      mapInstance.remove();
    };
  }, []);

  const isEditing = !!user?.address?.id;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear global error
    if (error) {
      clearError();
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.street.trim()) {
      errors.street = 'Rua é obrigatória';
    }
    
    if (!formData.postalCode.trim()) {
      errors.postalCode = 'CEP é obrigatório';
    } else if (!/^\d{5}-?\d{3}$/.test(formData.postalCode)) {
      errors.postalCode = 'CEP deve ter formato XXXXX-XXX';
    }
    
    if (!formData.latitude || !formData.longitude) {
      errors.location = 'Selecione um local no mapa';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const formatPostalCode = (value) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as XXXXX-XXX
    if (digits.length <= 5) {
      return digits;
    } else {
      return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
    }
  };

  const handlePostalCodeChange = (e) => {
    const formatted = formatPostalCode(e.target.value);
    setFormData(prev => ({
      ...prev,
      postalCode: formatted
    }));
    
    if (validationErrors.postalCode) {
      setValidationErrors(prev => ({
        ...prev,
        postalCode: ''
      }));
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!search.trim() || !map) return;
    // Executa busca pelo endereço
    L.Control.Geocoder.nominatim({
      geocodingQueryParams: {
        countrycodes: 'br',
        limit: 5,
        language: 'pt-BR'
      }
    }).geocode(search, (results) => {
      if (results && results.length > 0) {
        const { center, name } = results[0];
        handleLocationSelect(map, center.lat, center.lng, name);
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const addressData = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null
      };

      if (isEditing) {
        await updateAddress(user.address.id, addressData);
      } else {
        await createAddress(addressData);
      }
      
      onClose();
    } catch (error) {
      // Error is already handled by the store
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? 'Editar Endereço' : 'Adicionar Endereço'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && (
          <div className="alert error">
            {error}
          </div>
        )}

        <div className="modal-body">
          <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-group">
              <label htmlFor="street">Rua</label>
              <input
                type="text"
                id="street"
                name="street"
                value={formData.street}
                onChange={handleChange}
                className={validationErrors.street ? 'error' : ''}
                placeholder="Digite o nome da rua"
              />
              {validationErrors.street && (
                <span className="field-error">{validationErrors.street}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="postalCode">CEP</label>
              <input
                type="text"
                id="postalCode"
                name="postalCode"
                value={formData.postalCode}
                onChange={handlePostalCodeChange}
                className={validationErrors.postalCode ? 'error' : ''}
                placeholder="XXXXX-XXX"
                maxLength="9"
              />
              {validationErrors.postalCode && (
                <span className="field-error">{validationErrors.postalCode}</span>
              )}
            </div>

            <div className="form-group map-container">
              <div id="address-map" className="address-map"></div>
              {validationErrors.location && (
                <span className="field-error">{validationErrors.location}</span>
              )}
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={`btn btn-primary ${isLoading ? 'loading' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? '' : (isEditing ? 'Atualizar' : 'Salvar')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddressForm;
