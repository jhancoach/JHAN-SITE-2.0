import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from '../firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.email === 'jhanmedeiros@gmail.com' && user?.emailVerified === true;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    }, (err) => {
      console.error("Auth state change error:", err);
      setError(err.message);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async () => {
    setError(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Login failed:", err);
      let message = "Erro ao entrar: " + err.message;
      
      if (err.code === 'auth/popup-blocked') {
        message = "O pop-up de login foi bloqueado pelo seu navegador. Por favor, permita pop-ups para este site.";
      } else if (err.code === 'auth/unauthorized-domain') {
        message = "Este domínio não está autorizado no Firebase. Você precisa adicionar 'jhan-site-2-0.vercel.app' aos domínios autorizados no console do Firebase.";
      }
      
      setError(message);
      alert(message);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setError(null);
    } catch (err: any) {
      console.error("Logout failed:", err);
      setError(err.message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, login, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a FirebaseProvider');
  }
  return context;
};
