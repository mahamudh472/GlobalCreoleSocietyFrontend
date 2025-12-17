import React, { useState } from "react";
import Navbar from "../Navbar";
import { Link } from "react-router-dom";
import { useBlockedUsersQuery } from "../../hooks/queries/useBlock";
import { useUnblockUserMutation } from "../../hooks/mutations/useFriends";

function Blocking() {
  const [query, setQuery] = useState("");
  const { data, isLoading, isError, refetch } = useBlockedUsersQuery();
  const { mutate: unblockUser, isPending: isUnblocking } =
    useUnblockUserMutation();
  const blockedUsers = Array.isArray(data) ? data : data?.results || [];

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
                All • {blockedUsers.length}
              </h2>
            </div>

            {/* Add Someone row */}
            <div className="flex items-center border-2 border-dashed border-purple-300 rounded-md p-2 mb-4">
              <Link to="/settings/add_blocking">
                <button
                  className="flex items-center justify-center w-8 h-8 rounded-md bg-blue-50 border border-blue-200 text-blue-600 text-xl mr-2"
                  title="Add"
                >
                  +
                </button>
              </Link>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Add Someone"
                className="flex-1 outline-none px-2 py-1 text-sm border border-transparent focus:border-purple-300 rounded"
              />
            </div>

            {/* Blocked list */}
            <div className="space-y-3">
              {isLoading && (
                <div className="text-sm text-gray-600">
                  Loading blocked users…
                </div>
              )}
              {isError && (
                <div className="text-sm text-red-600">
                  Failed to load blocked users
                </div>
              )}
              {!isLoading && !isError && blockedUsers.length === 0 && (
                <div className="text-sm text-gray-600">No blocked users</div>
              )}
              {blockedUsers.map((user) => {
                const name =
                  user.profile_name || user.name || user.email || "Unknown";
                const avatar = user.profile_image || user.avatarUrl || null;
                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-300">
                        {avatar ? (
                          <img
                            src={avatar}
                            alt={name}
                            className="w-full h-full object-cover"
                          />
                        ) : null}
                      </div>
                      <span className="text-sm text-gray-800">{name}</span>
                    </div>
                    <button
                      disabled={isUnblocking}
                      onClick={() =>
                        unblockUser(user.id, {
                          onSuccess: () => refetch(),
                        })
                      }
                      className="px-4 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm disabled:opacity-50"
                    >
                      {isUnblocking ? "Unblocking…" : "Unblock"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Blocking;
