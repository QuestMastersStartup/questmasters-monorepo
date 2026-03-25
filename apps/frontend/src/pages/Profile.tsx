import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Shield, Upload, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { resizeImageToWebP } from '../lib/resize-image';

export default function Profile() {
  const { userProfile, user, session, refreshProfile } = useAuth();
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userProfile) {
      setUsername(userProfile.username || '');
      setBio(userProfile.bio || '');
      setAvatarUrl(userProfile.avatarUrl || '');
    }
  }, [userProfile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);

    try {
      const resizedBlob = await resizeImageToWebP(file, 256);
      const formData = new FormData();
      formData.append('file', resizedBlob, 'avatar.webp');

      const response = await fetch('/api/users/me/avatar', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to upload avatar');

      setAvatarUrl(data.avatarUrl);
      await refreshProfile();
      setMessage({ type: 'success', text: 'Avatar updated successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

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
      if (!response.ok) throw new Error(data.message || 'Failed to update profile');

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
      <h1 className="text-3xl font-cinzel font-bold gold-gradient pb-2 mb-8 text-shadow-glow">My Profile</h1>

      {message && (
        <div
          className={`p-4 mb-6 rounded-md text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${
            message.type === 'success'
              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}
        >
          {message.type === 'error' && <AlertCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      {/* Profile header with avatar preview */}
      <div className="flex items-center gap-6 mb-8 p-6 rounded-xl border border-border bg-card/50 backdrop-blur-md shadow-xl shadow-black/20">
        <div className="relative group">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary/50 relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div
              className={`w-full h-full bg-primary/20 flex items-center justify-center ${
                avatarUrl ? 'hidden' : ''
              }`}
            >
              <span className="text-3xl font-bold text-primary">{avatarInitial}</span>
            </div>
            
            {uploading && (
              <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:scale-110 transition-transform disabled:opacity-50 border-2 border-background"
            title="Upload new avatar"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleAvatarUpload} 
            className="hidden" 
            accept="image/*"
          />
        </div>

        <div className="flex flex-col gap-1 overflow-hidden">
          <span className="text-xl font-semibold truncate leading-tight">
            {userProfile?.username || 'Unnamed Adventurer'}
          </span>
          <span className="text-sm text-muted-foreground flex items-center gap-1.5 opacity-80">
            <Mail className="w-3.5 h-3.5" />
            {user?.email}
          </span>
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 font-bold">
              <Shield className="w-3 h-3" />
              {userProfile?.role || 'player'}
            </span>
            {userProfile?.isAdmin && (
              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-bold">
                Super Admin
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Edit form */}
      <form onSubmit={handleSubmit} className="space-y-6 p-8 rounded-xl border border-border bg-card/60 backdrop-blur-md shadow-2xl shadow-black/10">
        <div className="space-y-2">
          <label htmlFor="username" className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
            <User className="w-4 h-4" />
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg bg-background/50 border-border focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
            placeholder="Choose a unique username"
            minLength={3}
            maxLength={50}
          />
          <p className="text-[11px] text-muted-foreground/70 pl-1">
            3-50 characters. This is how other players will identify you.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
              <LinkIcon className="w-4 h-4" />
              Avatar
            </label>
            <button 
              type="button" 
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="text-xs text-primary hover:underline"
            >
              {showUrlInput ? 'Hide URL field' : 'Edit URL manually'}
            </button>
          </div>
          
          {showUrlInput && (
            <input
              id="avatarUrl"
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg bg-background/30 border-border focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
              placeholder="https://example.com/my-avatar.png"
            />
          )}
          
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 flex items-start gap-3">
            <div className="p-1 rounded bg-primary/20 text-primary">
              <Upload className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Recommended: Upload a square image. We'll automatically resize and optimize it for your profile (max 5MB).
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="bio" className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Bio
          </label>
          <textarea
            id="bio"
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg bg-background/50 border-border focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none transition-all"
            placeholder="Tell others about yourself..."
            maxLength={500}
          />
          <p className="text-[10px] text-muted-foreground/60 text-right font-mono">
            {bio.length}/500
          </p>
        </div>

        <div className="flex justify-end pt-4 border-t border-border/50">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 font-cinzel font-bold bg-primary/20 text-primary border border-primary/50 rounded-lg hover:bg-primary/30 transition-all shadow-lg shadow-primary/5 active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Saving Changes...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
