import React, { createContext, useState, useContext, ReactNode } from 'react';

type Role = 'VIEWER' | 'EDITOR';

interface AuthContextType {
  role: Role | null;
  login: (password: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role | null>(() => {
    return sessionStorage.getItem('userRole') as Role | null;
  });

  const login = (password: string) => {
    const userRole = password === 'EGTC@2026' ? 'EDITOR' : 'VIEWER';
    sessionStorage.setItem('userRole', userRole);
    setRole(userRole);
  };

  const logout = () => {
    sessionStorage.removeItem('userRole');
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ role, login, logout }}>
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