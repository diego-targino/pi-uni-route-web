import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import '../styles/auth.css';

const AddressForm = ({ onClose }) => {
  const { user, createAddress, updateAddress, isLoading, error, clearError } = useAuthStore();
  const [formData, setFormData] = useState({
    street: user?.address?.street || '',
    postalCode: user?.address?.postalCode || '',
    latitude: user?.address?.latitude || '',
    longitude: user?.address?.longitude || ''
  });
  const [validationErrors, setValidationErrors] = useState({});

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
    
    if (formData.latitude && formData.latitude !== '') {
      const lat = parseFloat(formData.latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        errors.latitude = 'Latitude deve ser um número entre -90 e 90';
      }
    }
    
    if (formData.longitude && formData.longitude !== '') {
      const lng = parseFloat(formData.longitude);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        errors.longitude = 'Longitude deve ser um número entre -180 e 180';
      }
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
        <div className="auth-card">
          <div className="auth-header">
            <h2>{isEditing ? 'Editar Endereço' : 'Adicionar Endereço'}</h2>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>

          {error && (
            <div className="alert error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
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

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="latitude">Latitude (opcional)</label>
                <input
                  type="number"
                  id="latitude"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  className={validationErrors.latitude ? 'error' : ''}
                  placeholder="Ex: -23.5489"
                  step="any"
                />
                {validationErrors.latitude && (
                  <span className="field-error">{validationErrors.latitude}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="longitude">Longitude (opcional)</label>
                <input
                  type="number"
                  id="longitude"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  className={validationErrors.longitude ? 'error' : ''}
                  placeholder="Ex: -46.6388"
                  step="any"
                />
                {validationErrors.longitude && (
                  <span className="field-error">{validationErrors.longitude}</span>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={onClose}
                className="auth-button secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={`auth-button ${isLoading ? 'loading' : ''}`}
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
