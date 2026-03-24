import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/library";
  const message = location.state?.message;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    } else {
      navigate(from, { replace: true });
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 space-y-6 rounded-xl border border-border bg-card/50 backdrop-blur-sm">
        <div className="text-center">
          <h1 className="text-3xl font-cinzel font-bold gold-gradient pb-2">Welcome Back</h1>
          <p className="text-sm text-muted-foreground">Sign in to your QuestMasters account</p>
        </div>

        {message && !error && (
          <div className="p-3 text-sm text-primary bg-primary/10 rounded-md border border-primary/20 text-center font-medium animate-pulse">
            {message}
          </div>
        )}

        {error && (
          <div className="p-3 text-sm text-red-400 bg-red-500/10 rounded-md border border-red-500/20">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleLogin}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md bg-background/50 border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="adventurer@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md bg-background/50 border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2.5 font-medium bg-primary/20 text-primary border border-primary/50 rounded-md hover:bg-primary/30 transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/register" className="text-primary hover:underline font-medium">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
