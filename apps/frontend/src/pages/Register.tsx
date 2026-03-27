import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Check, X, Loader2 } from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../contexts/AuthContext";

export function Register() {
  const [username, setUsername] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameChecking, setUsernameChecking] = useState(false);

  const [email, setEmail] = useState("");
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [emailChecking, setEmailChecking] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate("/library", { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Username check effect...
  useEffect(() => {
    if (username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setUsernameAvailable(false);
      return;
    }

    const timer = setTimeout(async () => {
      setUsernameChecking(true);
      try {
        const response = await fetch(`/api/users/check-username/${username}`);
        const data = await response.json();
        setUsernameAvailable(data.available);
      } catch {
        // Silently fail check
      } finally {
        setUsernameChecking(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  // Email check effect
  useEffect(() => {
    if (!email || !email.includes('@')) {
      setEmailAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setEmailChecking(true);
      try {
        const response = await fetch(`/api/auth/check-email/${encodeURIComponent(email)}`);
        const data = await response.json();
        setEmailAvailable(data.available);
      } catch {
        // Silently fail check
      } finally {
        setEmailChecking(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [email]);

  const validate = (): string | null => {
    if (!username.trim()) return "Username is required.";
    if (username.trim().length < 3) return "Username must be at least 3 characters.";
    if (usernameAvailable === false) return "Username is already taken.";
    if (username.trim().length > 50) return "Username must be at most 50 characters.";
    if (!/^[a-zA-Z0-9_-]+$/.test(username.trim()))
      return "Username can only contain letters, numbers, hyphens and underscores.";
    if (!email) return "Email is required.";
    if (emailAvailable === false) return "This email is already registered.";
    if (!password) return "Password is required.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    if (password !== confirmPassword) return "Passwords do not match.";
    return null;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    // 1. Create user in Supabase Auth with username in metadata
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: username.trim() },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // 2. If we got a session (auto-confirm enabled), set the username via the API
    if (data.session) {
      try {
        // Fetch profile to ensure it's created (backend auto-creates on GET)
        const response = await fetch("/api/users/me", {
          headers: { Authorization: `Bearer ${data.session.access_token}` },
        });

        if (response.ok) {
          // Profile created or retrieved, now explicitly update with username to be sure
          const updateRes = await fetch("/api/users/me", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${data.session.access_token}`,
            },
            body: JSON.stringify({ username: username.trim() }),
          });

          if (!updateRes.ok) {
            const errorData = await updateRes.json();
            console.warn("Failed to set username:", errorData.message);
          }
        }
      } catch (err) {
        console.error("Post-registration profile setup failed:", err);
      }
      navigate("/library", { replace: true });
    } else {
      // Email confirmation required
      setSuccess(true);
    }

    setLoading(false);
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="w-full max-w-md p-8 space-y-6 rounded-xl border border-border bg-card/50 backdrop-blur-sm text-center">
          <h1 className="text-3xl font-cinzel font-bold gold-gradient pb-2">Check Your Email</h1>
          <p className="text-muted-foreground">
            We've sent a confirmation link to <strong className="text-foreground">{email}</strong>.
            Please verify your email to complete registration.
          </p>
          <Link
            to="/login"
            className="inline-block px-4 py-2.5 font-medium bg-primary/20 text-primary border border-primary/50 rounded-md hover:bg-primary/30 transition-colors"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 space-y-6 rounded-xl border border-border bg-card/50 backdrop-blur-sm">
        <div className="text-center">
          <h1 className="text-3xl font-cinzel font-bold gold-gradient pb-2">Join the Quest</h1>
          <p className="text-sm text-muted-foreground">Create your QuestMasters account</p>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-400 bg-red-500/10 rounded-md border border-red-500/20">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => {
              if (username.trim().length < 3) {
                setError("Please choose a username first to sync with your OAuth account.");
                return;
              }
              // Save username to sessionStorage to persist across redirect
              sessionStorage.setItem('pending_username', username.trim());
              
              supabase.auth.signInWithOAuth({ 
                provider: 'google', 
                options: { 
                  redirectTo: window.location.origin + "/library",
                } 
              });
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-border rounded-md bg-background/50 hover:bg-accent transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </button>
          <button
            type="button"
            onClick={() => {
              if (username.trim().length < 3) {
                setError("Please choose a username first to sync with your OAuth account.");
                return;
              }
              // Save username to sessionStorage to persist across redirect
              sessionStorage.setItem('pending_username', username.trim());

              supabase.auth.signInWithOAuth({ 
                provider: 'discord', 
                options: { 
                  redirectTo: window.location.origin + "/library",
                } 
              });
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-border rounded-md bg-background/50 hover:bg-accent transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037a19.736 19.736 0 0 0-4.885 1.515a.069.069 0 0 0-.032.027C.533 9.048-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.372.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            Discord
          </button>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground font-cinzel text-shadow-glow">or sign up with email</span>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleRegister}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="username">Username</label>
            <div className="relative">
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                maxLength={50}
                className={cn(
                  "w-full px-3 py-2 border rounded-md bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors pr-10",
                  usernameAvailable === true && "border-green-500/50 ring-green-500/10",
                  usernameAvailable === false && "border-red-500/50 ring-red-500/10",
                  usernameAvailable === null && "border-border"
                )}
                placeholder="your_adventurer_name"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameChecking && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                {!usernameChecking && usernameAvailable === true && <Check className="w-4 h-4 text-green-500" />}
                {!usernameChecking && usernameAvailable === false && <X className="w-4 h-4 text-red-500" />}
              </div>
            </div>
            {usernameAvailable === false && (
              <p className="text-xs text-red-400">Username is already taken.</p>
            )}
            <p className="text-xs text-muted-foreground">3-50 characters. Letters, numbers, hyphens and underscores only.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">Email</label>
            <div className="relative">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={cn(
                  "w-full px-3 py-2 border rounded-md bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors pr-10",
                  emailAvailable === true && "border-green-500/50 ring-green-500/10",
                  emailAvailable === false && "border-red-500/50 ring-red-500/10",
                  emailAvailable === null && "border-border"
                )}
                placeholder="adventurer@example.com"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {emailChecking && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                {!emailChecking && emailAvailable === true && <Check className="w-4 h-4 text-green-500" />}
                {!emailChecking && emailAvailable === false && <X className="w-4 h-4 text-red-500" />}
              </div>
            </div>
            {emailAvailable === false && (
              <p className="text-xs text-red-400">This email is already registered.</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 border rounded-md bg-background/50 border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-xs text-muted-foreground">Minimum 6 characters.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className={`w-full px-3 py-2 border rounded-md bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                confirmPassword && confirmPassword !== password
                  ? "border-red-500/50"
                  : "border-border"
              }`}
            />
            {confirmPassword && confirmPassword !== password && (
              <p className="text-xs text-red-400">Passwords do not match.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2.5 font-medium bg-primary/20 text-primary border border-primary/50 rounded-md hover:bg-primary/30 transition-colors disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
