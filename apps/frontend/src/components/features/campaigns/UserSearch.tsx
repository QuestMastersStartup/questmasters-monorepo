import { useState, useEffect, useCallback } from "react";
import { Search, UserPlus, X, Loader2 } from "lucide-react";
import { debounce } from "lodash";
import { authFetch } from "../../../lib/api";

interface UserSearchResult {
  id: string;
  username: string;
  avatarUrl?: string;
}

interface UserSearchProps {
  onSelect: (user: UserSearchResult) => void;
  excludeUserIds: string[];
}

export function UserSearch({ onSelect, excludeUserIds }: UserSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const searchUsers = useCallback(
    debounce(async (searchQuery: string) => {
      if (searchQuery.length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }

      try {
        const res = await authFetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        const filtered = data.filter(
          (u: UserSearchResult) => !excludeUserIds.includes(u.id),
        );
        setResults(filtered);
      } catch (error) {
        console.error("Search users error:", error);
      } finally {
        setLoading(false);
      }
    }, 400),
    [excludeUserIds],
  );

  useEffect(() => {
    if (query.length >= 2) {
      setLoading(true);
      setShowResults(true);
      searchUsers(query);
    } else {
      setResults([]);
      setShowResults(false);
    }
  }, [query, searchUsers]);

  const handleSelect = (user: UserSearchResult) => {
    onSelect(user);
    setQuery("");
    setShowResults(false);
    setResults([]);
  };

  return (
    <div className="relative w-full">
      <div className="flex items-center bg-gray-900/50 border border-gray-700/50 rounded-xl px-4 py-2 group focus-within:border-primary-500/50 transition-all duration-300">
        <Search className="w-5 h-5 text-gray-400 group-focus-within:text-primary-400" />
        <label htmlFor="user-query" className="sr-only">Buscar usuarios</label>
        <input
          id="user-query"
          name="user-query"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by username..."
          className="bg-transparent border-none focus:ring-0 text-white placeholder-gray-500 w-full ml-2 text-sm"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="p-1 hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>

      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200">
          {loading ? (
            <div className="p-8 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
              <p className="text-gray-400 text-sm">
                Searching for adventurers...
              </p>
            </div>
          ) : results.length > 0 ? (
            <ul className="divide-y divide-gray-800 max-h-80 overflow-y-auto">
              {results.map((user) => (
                <li key={user.id}>
                  <button
                    onClick={() => handleSelect(user)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-primary-500/10 transition-colors group"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 overflow-hidden flex-shrink-0">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-primary-400 font-bold uppercase">
                            {user.username.substring(0, 2)}
                          </div>
                        )}
                      </div>
                      <div className="ml-3 text-left">
                        <p className="text-white font-medium text-sm">
                          {user.username}
                        </p>
                        <p className="text-gray-500 text-xs text-shilling">
                          Invite to campaign
                        </p>
                      </div>
                    </div>
                    <div className="bg-gray-800 group-hover:bg-primary-500/20 p-2 rounded-lg transition-colors">
                      <UserPlus className="w-4 h-4 text-gray-400 group-hover:text-primary-400" />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : query.length >= 2 ? (
            <div className="p-8 text-center">
              <p className="text-gray-400 text-sm">
                No users found with that name.
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
