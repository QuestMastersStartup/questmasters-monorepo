import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { authFetch } from "../lib/api";
import { getToken, clearSession } from "../lib/auth";

interface UserProfile {
  id: string;
  username: string | null;
  avatarUrl: string | null;
  bio: string | null;
  role: 'admin' | 'creator' | 'player';
  isAdmin: boolean;
  createdAt: string;
}

interface AuthContextType {
  userProfile: UserProfile | null;
  loading: boolean;
  isGuest: boolean;
  isAuthenticated: boolean;
  signOut: () => void;
  refreshProfile: () => Promise<void>;
  authFetch: typeof authFetch;
}

const AuthContext = createContext<AuthContextType>({
  userProfile: null,
  loading: true,
  isGuest: false,
  isAuthenticated: false,
  signOut: () => {},
  refreshProfile: async () => {},
  authFetch,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const response = await authFetch('/api/users/me');
      if (!response.ok) return;
      let profile = await response.json();

      if (profile && !profile.username) {
        const pendingUsername = sessionStorage.getItem('pending_username');
        if (pendingUsername) {
          try {
            const updateRes = await authFetch('/api/users/me', {
              method: 'PUT',
              body: JSON.stringify({ username: pendingUsername }),
            });
            if (updateRes.ok) {
              profile = await updateRes.json();
              sessionStorage.removeItem('pending_username');
            }
          } catch { /* ignore */ }
        }
      }

      setUserProfile(profile);
    } catch { /* silent fail */ }
  };

  const refreshProfile = async () => {
    if (getToken()) await fetchProfile();
  };

  useEffect(() => {
    if (getToken()) {
      fetchProfile().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const signOut = () => {
    clearSession();
    setUserProfile(null);
    window.location.href = '/login';
  };

  const isAuthenticated = !!getToken();
  const isGuest = !isAuthenticated && !loading;

  return (
    <AuthContext.Provider
      value={{ userProfile, loading, isGuest, isAuthenticated, signOut, refreshProfile, authFetch }}
    >
      {children}
    </AuthContext.Provider>
  );
};
