import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { authFetch } from "../lib/api";
import { isTesisMode, getTesisToken, getTesisUser, clearTesisSession } from "../lib/tesis-auth";

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
  session: Session | null;
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isGuest: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  /** Fetch autenticado que siempre usa el token más fresco (auto-refresh incluido) */
  authFetch: typeof authFetch;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  userProfile: null,
  loading: true,
  isGuest: false,
  isAuthenticated: false,
  signOut: async () => {},
  refreshProfile: async () => {},
  authFetch,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const response = await authFetch('/api/users/me');
      if (response.ok) {
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
            } catch (err) {
              console.error("Failed to sync pending username", err);
            }
          }
        }

        setUserProfile(profile);
      }
    } catch (e) {
      console.error("Failed to fetch user profile", e);
    }
  };

  const refreshProfile = async () => {
    if (isTesisMode() ? !!getTesisToken() : !!session) {
      await fetchProfile();
    }
  };

  useEffect(() => {
    if (isTesisMode()) {
      const tesisUser = getTesisUser();
      if (tesisUser && getTesisToken()) {
        fetchProfile().finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session) {
        fetchProfile().finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session) {
          fetchProfile();
        } else {
          setUserProfile(null);
        }
      }
    );

    return () => { subscription.unsubscribe(); };
  }, []);

  const signOut = async () => {
    if (isTesisMode()) {
      clearTesisSession();
      setUserProfile(null);
      window.location.href = '/login';
      return;
    }
    await supabase.auth.signOut();
  };

  const isAuthenticated = isTesisMode() ? !!getTesisToken() : (!!session && !loading);
  const isGuest = !isAuthenticated && !loading;

  return (
    <AuthContext.Provider value={{ session, user, userProfile, loading, isGuest, isAuthenticated, signOut, refreshProfile, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
};
