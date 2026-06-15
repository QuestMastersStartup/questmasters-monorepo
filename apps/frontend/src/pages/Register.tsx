import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, X, Loader2 } from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../contexts/AuthContext";
import { setSession } from "../lib/auth";

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

  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate("/library", { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

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
      } catch { /* silently fail */ }
      finally { setUsernameChecking(false); }
    }, 500);
    return () => clearTimeout(timer);
  }, [username]);

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
      } catch { /* silently fail */ }
      finally { setEmailChecking(false); }
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
    if (password.length < 8) return "Password must be at least 8 characters.";
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
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, username: username.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Registration failed");
      } else {
        setSession(data.token, { id: data.userId, email, username: username.trim() });
        navigate("/library", { replace: true });
      }
    } catch {
      setError("Network error");
    }
    setLoading(false);
  };

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
                  usernameAvailable === true && "border-green-500/50",
                  usernameAvailable === false && "border-red-500/50",
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
                  emailAvailable === true && "border-green-500/50",
                  emailAvailable === false && "border-red-500/50",
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
              minLength={8}
              className="w-full px-3 py-2 border rounded-md bg-background/50 border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-xs text-muted-foreground">Minimum 8 characters.</p>
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
                confirmPassword && confirmPassword !== password ? "border-red-500/50" : "border-border"
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
