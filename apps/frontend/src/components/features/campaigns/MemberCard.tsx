import { Shield, User, X, BadgeCheck } from "lucide-react";

import { formatDistanceToNow } from "date-fns";

interface MemberCardProps {
  id: string;
  username: string;
  avatarUrl?: string;
  role: "dm" | "player";
  joinedAt: string;
  isDM: boolean; // Indicates if current user is DM of campaign
  onRemove?: () => void;
}

export function MemberCard({
  id: _id,
  username,
  avatarUrl,
  role,
  joinedAt,
  isDM,
  onRemove,
}: MemberCardProps) {
  const isDMRole = role === "dm";

  return (
    <div className="relative group bg-gray-900/40 border border-gray-800/60 rounded-2xl p-4 flex items-center justify-between transition-all duration-300 hover:bg-gray-800/40 hover:border-primary-500/20 shadow-lg hover:shadow-primary-500/5">
      <div className="flex items-center">
        {/* Avatar Container */}
        <div className="relative">
          <div
            className={`w-14 h-14 rounded-2xl overflow-hidden border-2 transition-colors duration-300 ${
              isDMRole
                ? "border-primary-500/40 shadow-primary-500/20 shadow-md"
                : "border-gray-800"
            }`}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={username}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center text-primary-400 font-bold text-xl uppercase">
                {username.substring(0, 2)}
              </div>
            )}
          </div>

          {/* Role Icon Overlay */}
          <div
            className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-lg flex items-center justify-center border-2 border-gray-950 ${
              isDMRole
                ? "bg-primary-600 text-white"
                : "bg-gray-800 text-gray-400"
            }`}
          >
            {isDMRole ? (
              <Shield className="w-3 h-3" />
            ) : (
              <User className="w-3 h-3" />
            )}
          </div>
        </div>

        {/* Info */}
        <div className="ml-4">
          <div className="flex items-center gap-2">
            <h4 className="text-white font-bold tracking-tight text-base group-hover:text-primary-400 transition-colors">
              {username}
            </h4>
            {isDMRole && (
              <span className="flex items-center gap-1 bg-primary-500/10 text-primary-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                <BadgeCheck className="w-3 h-3" />
                Dungeon Master
              </span>
            )}
          </div>
          <p className="text-gray-500 text-xs mt-1 flex items-center gap-1.5 font-medium">
            Joined {formatDistanceToNow(new Date(joinedAt))} ago
          </p>
        </div>
      </div>

      {/* Actions */}
      {isDM && !isDMRole && onRemove && (
        <button
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-300 transform scale-90 hover:scale-100"
          title="Remove player"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
