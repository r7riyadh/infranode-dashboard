import React, { createContext, useContext, useState, useEffect } from 'react';
import { verifyCredentials } from '../services/operatorService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = () => {
      const activeStr = localStorage.getItem('active-user-session');
      if (activeStr) {
        try {
          const activeUser = JSON.parse(activeStr);
          const userSession = { user: activeUser };
          setSession(userSession);
          setUser(activeUser);
        } catch (err) {
          localStorage.removeItem('active-user-session');
        }
      }
      setLoading(false);
    };

    checkSession();
  }, []);

  const loginUser = (username, password) => {
    const authenticated = verifyCredentials(username, password);
    if (!authenticated) {
      throw new Error('Invalid username or password');
    }

    localStorage.setItem('active-user-session', JSON.stringify(authenticated));
    const userSession = { user: authenticated };
    setSession(userSession);
    setUser(authenticated);
    return authenticated;
  };

  const signOut = () => {
    localStorage.removeItem('active-user-session');
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, loginUser, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
