import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import '../styles/auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    return strength;
  };

  const getPasswordStrengthText = (strength) => {
    if (strength < 50) return 'Fraca';
    if (strength < 75) return 'Média';
    return 'Forte';
  };

  const getPasswordStrengthClass = (strength) => {
    if (strength < 50) return 'weak';
    if (strength < 75) return 'medium';
    return 'strong';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
    
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    if (error) {
      clearError();
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Nome é obrigatório';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Nome deve ter pelo menos 2 caracteres';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email inválido';
    }
    
    if (!formData.password) {
      errors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      errors.password = 'Senha deve ter pelo menos 6 caracteres';
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirmação de senha é obrigatória';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Senhas não coincidem';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isLoading) {
      return;
    }
    
    if (!validateForm()) {
      return;
    }

    try {
      const { confirmPassword, ...userData } = formData;
      const result = await register(userData);
      
      // Mostrar mensagem de sucesso e redirecionar após um breve delay
      if (result && result.success) {
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Conta criada com sucesso! Faça login para continuar.',
              type: 'success'
            }
          });
        }, 500);
      }
    } catch (error) {
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Criar Conta</h1>
          <p>Junte-se ao UniRoute</p>
        </div>

        {error && (
          <div className="alert error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Nome Completo</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={validationErrors.name ? 'error' : ''}
              placeholder="Digite seu nome completo"
              autoComplete="name"
            />
            {validationErrors.name && (
              <span className="field-error">{validationErrors.name}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={validationErrors.email ? 'error' : ''}
              placeholder="Digite seu email"
              autoComplete="email"
            />
            {validationErrors.email && (
              <span className="field-error">{validationErrors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={validationErrors.password ? 'error' : ''}
              placeholder="Digite sua senha"
              autoComplete="new-password"
            />
            {validationErrors.password && (
              <span className="field-error">{validationErrors.password}</span>
            )}
            {formData.password && (
              <div className="password-strength">
                <div className="strength-bar">
                  <div
                    className={`strength-fill ${getPasswordStrengthClass(passwordStrength)}`}
                    style={{ width: `${passwordStrength}%` }}
                  />
                </div>
                <div className="strength-text">
                  Força da senha: {getPasswordStrengthText(passwordStrength)}
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Senha</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={validationErrors.confirmPassword ? 'error' : ''}
              placeholder="Confirme sua senha"
              autoComplete="new-password"
            />
            {validationErrors.confirmPassword && (
              <span className="field-error">{validationErrors.confirmPassword}</span>
            )}
          </div>

          <button
            type="submit"
            className={`auth-button ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Criando conta...' : 'Criar Conta'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Já tem uma conta?{' '}
            <Link to="/login" className="auth-link">
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
