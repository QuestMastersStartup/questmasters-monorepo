import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  const validate = (): string | null => {
    if (!username.trim()) return "Username is required.";
    if (username.trim().length < 3) return "Username must be at least 3 characters.";
    if (username.trim().length > 50) return "Username must be at most 50 characters.";
    if (!/^[a-zA-Z0-9_-]+$/.test(username.trim()))
      return "Username can only contain letters, numbers, hyphens and underscores.";
    if (!email) return "Email is required.";
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

    // 1. Create user in Supabase Auth
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // 2. If we got a session (auto-confirm enabled), set the username via the API
    if (data.session) {
      try {
        const response = await fetch("/api/users/me", {
          headers: { Authorization: `Bearer ${data.session.access_token}` },
        });

        if (response.ok) {
          // Profile created by GET, now update with username
          await fetch("/api/users/me", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${data.session.access_token}`,
            },
            body: JSON.stringify({ username: username.trim() }),
          });
        }
      } catch {
        // Non-critical — profile will be created on next login
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

        <form className="space-y-4" onSubmit={handleRegister}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={50}
              className="w-full px-3 py-2 border rounded-md bg-background/50 border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="your_adventurer_name"
            />
            <p className="text-xs text-muted-foreground">3-50 characters. Letters, numbers, hyphens and underscores only.</p>
          </div>

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
