import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';
import { AuthUser } from '../types';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  loginLoading: boolean;
  loginError: string | null;
  login: (uname: string, pass: string) => Promise<AuthUser>;
  quickLogin: (uname: string) => Promise<AuthUser>;
  logout: () => void;
  updateUser: (updated: Partial<AuthUser>) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  isChangePassModalOpen: boolean;
  setIsChangePassModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isAccountInfoModalOpen: boolean;
  setIsAccountInfoModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loginLoading, setLoginLoading] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isChangePassModalOpen, setIsChangePassModalOpen] = useState(false);
  const [isAccountInfoModalOpen, setIsAccountInfoModalOpen] = useState(false);

  useEffect(() => {
    const token = api.getToken();
    if (token) {
      api.getProfile()
        .then((profile) => {
          setUser(profile);
        })
        .catch(() => {
          api.logout();
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (uname: string, pass: string): Promise<AuthUser> => {
    setLoginLoading(true);
    setLoginError(null);
    try {
      const res = await api.login(uname, pass);
      setUser(res.user);
      return res.user;
    } catch (err: any) {
      const msg = err.message || 'Đăng nhập không thành công.';
      setLoginError(msg);
      throw err;
    } finally {
      setLoginLoading(false);
    }
  };

  const quickLogin = async (uname: string): Promise<AuthUser> => {
    return login(uname, 'Admin@123456');
  };

  const logout = () => {
    api.logout();
    setUser(null);
  };

  const updateUser = (updated: Partial<AuthUser>) => {
    setUser((prev) => (prev ? { ...prev, ...updated } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginLoading,
        loginError,
        login,
        quickLogin,
        logout,
        updateUser,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        isChangePassModalOpen,
        setIsChangePassModalOpen,
        isAccountInfoModalOpen,
        setIsAccountInfoModalOpen,
      }}
    >
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
