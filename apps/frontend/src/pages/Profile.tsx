import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Shield } from 'lucide-react';

export default function Profile() {
  const { userProfile, user, session, refreshProfile } = useAuth();
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (userProfile) {
      setUsername(userProfile.username || '');
      setBio(userProfile.bio || '');
      setAvatarUrl(userProfile.avatarUrl || '');
    }
  }, [userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const trimmedUsername = username.trim();
    if (trimmedUsername && trimmedUsername.length < 3) {
      setMessage({ type: 'error', text: 'Username must be at least 3 characters.' });
      setLoading(false);
      return;
    }
    if (trimmedUsername && !/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
      setMessage({ type: 'error', text: 'Username can only contain letters, numbers, hyphens and underscores.' });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          username: trimmedUsername || undefined,
          bio: bio.trim() || undefined,
          avatarUrl: avatarUrl.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      await refreshProfile();
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const avatarInitial = (userProfile?.username || user?.email || 'Q')[0].toUpperCase();

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-cinzel font-bold gold-gradient pb-2 mb-8">My Profile</h1>

      {message && (
        <div
          className={`p-4 mb-6 rounded-md text-sm ${
            message.type === 'success'
              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Profile header with avatar preview */}
      <div className="flex items-center gap-5 mb-8 p-5 rounded-xl border border-border bg-card/50 backdrop-blur-sm">
        <div className="relative shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-20 h-20 rounded-full object-cover border-2 border-primary/50"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div
            className={`w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/50 ${
              avatarUrl ? 'hidden' : ''
            }`}
          >
            <span className="text-2xl font-bold text-primary">{avatarInitial}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1 overflow-hidden">
          <span className="text-lg font-semibold truncate">
            {userProfile?.username || 'Unnamed Adventurer'}
          </span>
          <span className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" />
            {user?.email}
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/30">
              <Shield className="w-3 h-3" />
              {userProfile?.role || 'player'}
            </span>
            {userProfile?.isAdmin && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
                Super Admin
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Edit form */}
      <form onSubmit={handleSubmit} className="space-y-6 p-6 rounded-xl border border-border bg-card/50 backdrop-blur-sm">
        <div className="space-y-2">
          <label htmlFor="username" className="flex items-center gap-2 text-sm font-medium">
            <User className="w-4 h-4 text-muted-foreground" />
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-background/50 border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Choose a unique username"
            minLength={3}
            maxLength={50}
          />
          <p className="text-xs text-muted-foreground">
            3-50 characters. This is how other players will identify you.
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="avatarUrl" className="text-sm font-medium">
            Avatar URL
          </label>
          <input
            id="avatarUrl"
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-background/50 border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="https://example.com/my-avatar.png"
          />
          <p className="text-xs text-muted-foreground">
            Paste a URL to an image. The preview updates above.
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="bio" className="text-sm font-medium">
            Bio
          </label>
          <textarea
            id="bio"
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-background/50 border-border focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            placeholder="Tell others about yourself, your playstyle, favorite campaigns..."
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground text-right">
            {bio.length}/500
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 font-medium bg-primary/20 text-primary border border-primary/50 rounded-md hover:bg-primary/30 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
