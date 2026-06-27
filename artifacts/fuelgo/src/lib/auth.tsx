import React, { createContext, useContext, useEffect, useState } from 'react';
import { useGetMe, UserProfile, getGetMeQueryKey, setAuthTokenGetter } from '@workspace/api-client-react';

setAuthTokenGetter(() => localStorage.getItem('fuelgo_token'));

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('fuelgo_token'));

  const { data: user, isLoading, isError } = useGetMe({
    query: { 
      enabled: !!token,
      queryKey: getGetMeQueryKey(),
      retry: false
    }
  });

  useEffect(() => {
    if (isError) {
      localStorage.removeItem('fuelgo_token');
      setToken(null);
    }
  }, [isError]);

  const login = (newToken: string) => {
    localStorage.setItem('fuelgo_token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('fuelgo_token');
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user: user || null, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};