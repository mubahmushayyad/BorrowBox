import { createContext, useContext, useEffect, useState } from 'react';
import { AuthAPI } from '../api/endpoints';

const AuthContext = createContext(null);
const TOKEN_KEY = 'borrowbox_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    AuthAPI.me()
      .then((u) => setUser(u))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { user: u, token } = await AuthAPI.login({ email, password });
    localStorage.setItem(TOKEN_KEY, token);
    setUser(u);
    return u;
  };

  const register = async (payload) => {
    const { user: u, token } = await AuthAPI.register(payload);
    localStorage.setItem(TOKEN_KEY, token);
    setUser(u);
    return u;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  const updateUser = (partial) => setUser((prev) => ({ ...prev, ...partial }));

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
