import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

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
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (session: Session) => {
    try {
      const response = await fetch('/api/users/me', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (response.ok) {
        const profile = await response.json();
        setUserProfile(profile);
      }
    } catch (e) {
      console.error("Failed to fetch user profile", e);
    }
  };

  const refreshProfile = async () => {
    if (session) {
      await fetchProfile(session);
    }
  };

  useEffect(() => {
    // Initial session fetch
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session) {
        fetchProfile(session).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session) {
          fetchProfile(session);
        } else {
          setUserProfile(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const isGuest = !session && !loading;
  const isAuthenticated = !!session && !loading;

  return (
    <AuthContext.Provider value={{ session, user, userProfile, loading, isGuest, isAuthenticated, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
