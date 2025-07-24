import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import AddressForm from './AddressForm';
import BusStops from './BusStops';
import '../styles/dashboard.css';

const Dashboard = () => {
  const { user, logout, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [showAddressForm, setShowAddressForm] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Verifica se está autenticado mas não tem usuário
  if (isAuthenticated && !user) {
    return (
      <div className="dashboard-loading">
        <div className="dashboard-loading-spinner" />
        <p>Erro: Autenticado mas sem dados do usuário. Redirecionando...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="dashboard-loading">
        <div className="dashboard-loading-spinner" />
        <p>Carregando usuário...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="container">
        <header className="dashboard-header">
          <h1 className="dashboard-title">Dashboard - UniRoute</h1>
          <p className="dashboard-welcome">
            Bem-vindo, <strong>{user.name}</strong>!
          </p>
        </header>

        <main>
          <section className="card">
            <div className="card-header">
              <h2>Informações do Usuário</h2>
              <button 
                onClick={() => setShowAddressForm(true)}
                className="edit-address-button"
              >
                {user.address ? '✏️ Editar Endereço' : '➕ Adicionar Endereço'}
              </button>
            </div>
            <div className="card-body">
              <div className="dashboard-user-info">
                <div className="dashboard-info-item">
                  <span className="dashboard-info-icon">📧</span>
                  <span className="dashboard-info-label">Email:</span>
                  <span className="dashboard-info-value">{user.email}</span>
                </div>
                
                {user.address && (
                  <div className="dashboard-info-item">
                    <span className="dashboard-info-icon">�</span>
                    <span className="dashboard-info-label">Endereço:</span>
                    <span className="dashboard-info-value">
                      {user.address.street}
                      {user.address.postalCode && ` - CEP: ${user.address.postalCode}`}
                    </span>
                  </div>
                )}
                
                <div className="dashboard-info-item">
                  <span className="dashboard-info-icon">👤</span>
                  <span className="dashboard-info-label">Status:</span>
                  <span className="dashboard-info-value">Ativo</span>
                </div>
              </div>
            </div>
          </section>

          {/* Bus Stops Section */}
          <BusStops />

          <div className="dashboard-actions">
            <button 
              onClick={handleLogout}
              className="dashboard-logout-btn"
              aria-label="Sair do sistema"
            >
              <span className="dashboard-logout-icon">🚪</span>
              Sair
            </button>
          </div>
        </main>

        {/* Address Form Modal */}
        {showAddressForm && (
          <AddressForm onClose={() => setShowAddressForm(false)} />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
