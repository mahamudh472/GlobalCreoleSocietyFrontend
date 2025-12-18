import React, { useEffect, useState } from "react";
import Navbar from "../Navbar";
import { apiMethods } from "../../utils/api";
import { ENDPOINTS } from "../../config/apiConfig";
import {
  useBlockUserMutation,
  useUnblockUserMutation,
} from "../../hooks/mutations/useFriends";

function AddBlocking() {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const { mutate: blockUser, isPending: isBlocking } = useBlockUserMutation();
  const { mutate: unblockUser, isPending: isUnblocking } =
    useUnblockUserMutation();

  useEffect(() => {
    const searchFriends = async () => {
      const trimmed = query.trim();
      if (trimmed.length === 0) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const response = await apiMethods.get(ENDPOINTS.CHAT.SEARCH_FRIENDS, {
          params: { q: trimmed },
        });
        setSearchResults(response.data || []);
      } catch (error) {
        console.error("Error searching friends:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchFriends, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleBlock = (userId) => {
    if (!userId) return;
    blockUser(userId, {
      onSuccess: () => {
        // Remove the user from local search results immediately
        setSearchResults((prev) => prev.filter((u) => u.id !== userId));
      },
    });
  };

  const handleUnblock = (userId) => {
    if (!userId) return;
    unblockUser(userId, {
      onSuccess: () => {
        // Optionally re-add to search results or leave as-is
      },
    });
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="py-7">
        <Navbar />
      </div>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="2xl:px-44 xl:px-36 lg:px-28 md:px-20 sm:px-14 px-8">
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                Add Blocking
              </h2>
            </div>
            {/* Search & results */}
            <div className="mb-4">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search person to block"
                className="w-full outline-none px-3 py-2 text-sm border border-gray-300 focus:border-purple-400 rounded"
              />
            </div>

            <div className="space-y-3">
              {isSearching ? (
                <div className="p-2 text-sm text-gray-500">Searching...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-300">
                        <img
                          src={
                            user.profile_image ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              user.profile_name || "User"
                            )}&size=150&background=3b82f6&color=fff`
                          }
                          alt={user.profile_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <span className="block text-sm font-medium text-gray-800">
                          {user.profile_name}
                        </span>
                        <span className="block text-xs text-gray-500">
                          {user.email}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        disabled={isBlocking}
                        onClick={() => handleBlock(user.id)}
                        className="px-4 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm disabled:opacity-60"
                      >
                        {isBlocking ? "Blocking..." : "Block"}
                      </button>
                      <button
                        disabled={isUnblocking}
                        onClick={() => handleUnblock(user.id)}
                        className="px-4 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm disabled:opacity-60"
                      >
                        {isUnblocking ? "Unblocking..." : "Unblock"}
                      </button>
                    </div>
                  </div>
                ))
              ) : query.trim().length > 0 ? (
                <div className="p-2 text-sm text-gray-500">No users found</div>
              ) : (
                <div className="p-2 text-sm text-gray-500">
                  Search to find users
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddBlocking;
