import React, { createContext, useContext, useState, useEffect } from 'react';
import { IUser, UserRole } from '../types/index.js';

interface AuthContextType {
  currentUser: IUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  registerUser: (data: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
    phone?: string;
    teamMemberId?: string;
  }) => Promise<{ success: boolean; message?: string; user?: IUser }>;
  logout: () => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  isAuthModalOpen: boolean;
  refreshUsersList: () => Promise<IUser[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'prospectpulse_auth_token';
const USER_KEY = 'prospectpulse_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<IUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Initialize session on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setCurrentUser(parsedUser);

          // Verify with backend
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${storedToken}` },
          });

          if (res.ok) {
            const data = await res.json();
            if (data.user) {
              setCurrentUser(data.user);
              localStorage.setItem(USER_KEY, JSON.stringify(data.user));
            }
          }
        } catch {
          // Token expired or invalid
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          setToken(null);
          setCurrentUser(null);
        }
      } else {
        // Auto-login as default Admin (Akhilesh) for seamless first-time experience
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'akhilesh@gmail.com', password: 'akhilesh' }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.user && data.token) {
              setToken(data.token);
              setCurrentUser(data.user);
              localStorage.setItem(TOKEN_KEY, data.token);
              localStorage.setItem(USER_KEY, JSON.stringify(data.user));
            }
          }
        } catch {
          // Ignore network errors
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, pass: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: pass }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Login failed' };
      }

      setToken(data.token);
      setCurrentUser(data.user);
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setIsAuthModalOpen(false);

      return { success: true, message: data.message };
    } catch (err) {
      return { success: false, message: (err as Error).message || 'Network error during login' };
    }
  };

  const registerUser = async (data: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
    phone?: string;
    teamMemberId?: string;
  }): Promise<{ success: boolean; message?: string; user?: IUser }> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      });

      const resData = await res.json();
      if (!res.ok) {
        return { success: false, message: resData.error || 'Failed to create user' };
      }

      return { success: true, message: resData.message, user: resData.user };
    } catch (err) {
      return { success: false, message: (err as Error).message || 'Network error' };
    }
  };

  const logout = () => {
    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const refreshUsersList = async (): Promise<IUser[]> => {
    try {
      const res = await fetch('/api/auth/users', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.users || [];
    } catch {
      return [];
    }
  };

  const isAdmin = currentUser?.role === 'admin';
  const isAuthenticated = Boolean(currentUser && token);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        isAuthenticated,
        isAdmin,
        isLoading,
        login,
        registerUser,
        logout,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        isAuthModalOpen,
        refreshUsersList,
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
