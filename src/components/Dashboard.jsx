import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="dashboard-loading">
        <div className="dashboard-loading-spinner" />
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
            </div>
            <div className="card-body">
              <div className="dashboard-user-info">
                <div className="dashboard-info-item">
                  <span className="dashboard-info-icon">📧</span>
                  <span className="dashboard-info-label">Email:</span>
                  <span className="dashboard-info-value">{user.email}</span>
                </div>
                
                {user.phone && (
                  <div className="dashboard-info-item">
                    <span className="dashboard-info-icon">📱</span>
                    <span className="dashboard-info-label">Telefone:</span>
                    <span className="dashboard-info-value">{user.phone}</span>
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
      </div>
    </div>
  );
};

export default Dashboard;
