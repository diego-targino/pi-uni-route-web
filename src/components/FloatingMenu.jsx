import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import AddressForm from './AddressForm';
import '../styles/map.css';

const FloatingMenu = ({ onAddressUpdate }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAddressClose = () => {
    setShowAddressForm(false);
    // Notify parent component that address might have been updated
    if (onAddressUpdate) {
      onAddressUpdate();
    }
  };

  return (
    <>
      <div className={`floating-menu ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="floating-menu-header">
          <h3 className="floating-menu-title">
            {isCollapsed ? '☰' : 'UniRoute'}
          </h3>
          <button
            className="menu-toggle-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {isCollapsed ? '▼' : '▲'}
          </button>
        </div>

        <div className="floating-menu-content">
          <div className="user-info-compact">
            <div className="user-info-item">
              <span className="user-info-icon">👤</span>
              <span className="user-info-label">Usuário:</span>
              <span className="user-info-value">{user?.name}</span>
            </div>

            <div className="user-info-item">
              <span className="user-info-icon">📧</span>
              <span className="user-info-label">Email:</span>
              <span className="user-info-value">{user?.email}</span>
            </div>

            {user?.address && (
              <div className="user-info-item">
                <span className="user-info-icon">📍</span>
                <span className="user-info-label">Endereço:</span>
                <span className="user-info-value">
                  {user.address.street}
                  {user.address.postalCode && ` - ${user.address.postalCode}`}
                </span>
              </div>
            )}
          </div>

          <div className="floating-menu-actions">
            <button
              className="floating-menu-btn"
              onClick={() => setShowAddressForm(true)}
            >
              {user?.address ? '✏️ Editar Endereço' : '➕ Adicionar Endereço'}
            </button>

            <button
              className="floating-menu-btn secondary"
              onClick={() => window.location.reload()}
            >
              🔄 Atualizar Mapa
            </button>

            <button
              className="floating-menu-btn danger"
              onClick={handleLogout}
            >
              🚪 Sair
            </button>
          </div>
        </div>
      </div>

      {/* Address Form Modal */}
      {showAddressForm && (
        <AddressForm onClose={handleAddressClose} />
      )}
    </>
  );
};

export default FloatingMenu;
