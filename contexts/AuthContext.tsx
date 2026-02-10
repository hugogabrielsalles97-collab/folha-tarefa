import React, { createContext, useState, useContext, ReactNode } from 'react';

type Role = 'VIEWER' | 'PLANEJADOR' | 'PRODUÇÃO';

interface AuthContextType {
  role: Role | null;
  login: (password: string) => boolean;
  loginAsViewer: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role | null>(() => {
    return sessionStorage.getItem('userRole') as Role | null;
  });

  const login = (password: string): boolean => {
    if (password === 'EGTC@2026') {
      const userRole = 'PLANEJADOR';
      sessionStorage.setItem('userRole', userRole);
      setRole(userRole);
      return true;
    }
    
    if (password === 'EGTC#2026') {
      const userRole = 'PRODUÇÃO';
      sessionStorage.setItem('userRole', userRole);
      setRole(userRole);
      return true;
    }

    // Qualquer outra senha é uma tentativa incorreta e falha o login.
    return false;
  };
  
  const loginAsViewer = () => {
    const userRole = 'VIEWER';
    sessionStorage.setItem('userRole', userRole);
    setRole(userRole);
  };

  const logout = () => {
    sessionStorage.removeItem('userRole');
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ role, login, loginAsViewer, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};