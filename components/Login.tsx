
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loginAsViewer } = useAuth();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
        setError('Por favor, insira a senha.');
        return;
    }
    const success = login(password);
    if (!success) {
      setError('Senha incorreta. Acesso não autorizado.');
    } else {
      setError('');
    }
  };

  const handleViewerLogin = () => {
    loginAsViewer();
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error) {
      setError(''); // Clear error when user starts typing
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-dark-surface p-8 rounded-lg border border-neon-cyan/50 shadow-lg shadow-neon-cyan/20">
        <h1 className="text-2xl font-bold text-center text-white mb-2 uppercase tracking-[2px]">NSA - Serra das Araras</h1>
        <p className="text-center text-neon-cyan/60 text-[10px] font-black uppercase tracking-[4px] mb-8">Controle de Atividades</p>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="password" className="sr-only">Senha</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="Digite a senha de acesso"
              className="w-full bg-dark-bg border border-dark-border rounded-md shadow-sm p-3 text-white focus:ring-neon-orange focus:border-neon-orange placeholder-gray-500 outline-none transition-all"
            />
          </div>

          {error && <p className="text-neon-red text-center text-[10px] font-black uppercase tracking-widest">{error}</p>}

          <button
            type="submit"
            className="w-full bg-neon-orange text-black font-black py-4 px-4 rounded-none shadow-neon-orange hover:bg-white transition-all duration-300 transform active:scale-95 uppercase text-xs tracking-[2px]"
          >
            Acesso Restrito
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-dark-border" />
          </div>
          <div className="relative flex justify-center text-[10px] font-black">
            <span className="bg-dark-surface px-4 text-white/20 uppercase tracking-widest">OU</span>
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={handleViewerLogin}
            className="w-full bg-transparent border border-white/10 text-white/40 font-black py-3 px-4 rounded-none hover:text-neon-cyan hover:border-neon-cyan transition-all duration-300 uppercase text-[10px] tracking-widest"
          >
            Acessar como Visitante
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
