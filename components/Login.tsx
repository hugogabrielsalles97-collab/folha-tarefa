import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleEditorLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
        setError('Por favor, insira a senha de editor.');
        return;
    }
    const success = login(password);
    if (!success) {
      setError('Senha incorreta. Acesso não autorizado.');
    } else {
      setError('');
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error) {
      setError(''); // Clear error when user starts typing
    }
  };

  const handleViewerLogin = () => {
    login(''); // No password needed for viewer
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-dark-surface p-8 rounded-lg border border-neon-cyan/50 shadow-lg shadow-neon-cyan/20">
        <h1 className="text-2xl font-bold text-center text-white mb-2">NSA - Serra das Araras</h1>
        <p className="text-center text-gray-400 mb-8">Controle de Atividades</p>

        <form onSubmit={handleEditorLogin} className="space-y-4">
          <div>
            <label htmlFor="password" className="sr-only">Senha de Editor</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="Senha para modo editor"
              className="w-full bg-dark-bg border border-dark-border rounded-md shadow-sm p-3 text-white focus:ring-neon-magenta focus:border-neon-magenta placeholder-gray-500"
            />
          </div>

          {error && <p className="text-red-500 text-center text-xs">{error}</p>}

          <button
            type="submit"
            className="w-full bg-neon-magenta text-black font-bold py-3 px-4 rounded-lg shadow-neon-magenta hover:bg-neon-magenta/90 transition-all duration-300 transform hover:scale-105"
          >
            Entrar como Editor
          </button>
        </form>

        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-dark-border"></div>
          <span className="flex-shrink mx-4 text-gray-400">ou</span>
          <div className="flex-grow border-t border-dark-border"></div>
        </div>

        <button
          onClick={handleViewerLogin}
          className="w-full bg-dark-border text-neon-cyan font-bold py-3 px-4 rounded-lg hover:bg-neon-cyan hover:text-black transition-all duration-300"
        >
          Acessar como Visitante
        </button>
      </div>
    </div>
  );
};

export default Login;