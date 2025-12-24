"use client";

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiMethods } from "../../utils/api";
import { ENDPOINTS } from "../../config/apiConfig";
import { FiSearch } from "react-icons/fi";
import { RiMenuAddLine } from "react-icons/ri";
import Navbar from "../Navbar";
import { AnimatePresence, motion } from "framer-motion";

function PendingMembers() {
  const { id } = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [approvingId, setApprovingId] = useState(null);

  // Real API call
  useEffect(() => {
    const fetchMembers = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const { data } = await apiMethods.get(ENDPOINTS.SOCIETIES.MEMBERS(id));
        const list = Array.isArray(data) ? data : data?.results || [];
        const normalized = list.map((m) => ({
          id: m.id,
          name:
            m.user?.profile_name ||
            m.user?.email ||
            m.user?.username ||
            "Unknown",
          avatar: m.user?.profile_image || undefined,
          timestamp: m.created_at || "",
        }));
        setFriends(normalized);
      } catch (err) {
        console.error("Failed to fetch pending members", err);
        setError("Failed to load pending members");
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, [id]);

  // Search handling
  const handleSearch = (e) => setSearchQuery(e.target.value);

  // Menu toggle
  const handleMenuToggle = () => setShowMenu((prev) => !prev);

  // Add Society handler
  const handleAddSociety = async (friendId) => {
    if (!id || !friendId) return;
    try {
      setApprovingId(friendId);
      await apiMethods.post(
        ENDPOINTS.SOCIETIES.APPROVE_MEMBERSHIP(id, friendId),
        {}
      );
      setFriends((prev) => prev.filter((f) => f.id !== friendId));
    } catch (err) {
      console.error("Failed to approve membership", err);
      setError("Failed to approve membership");
    } finally {
      setApprovingId(null);
    }
  };

  // Filtered list
  const filteredFriends = friends.filter((friend) =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />

      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Search bar */}
        <div className="bg-white shadow-sm px-4 py-3 rounded-xl flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <FiSearch
              className="absolute top-3 left-3 text-gray-400"
              size={20}
            />
            <input
              type="search"
              placeholder="Search members..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <RiMenuAddLine
            onClick={handleMenuToggle}
            size={40}
            className={`cursor-pointer p-2 rounded-lg transition-colors ${
              showMenu ? "bg-blue-700" : "bg-blue-500"
            }`}
            color="white"
          />
        </div>

        {/* Menu Dropdown */}
        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white mt-2 rounded-lg shadow-md p-4"
            >
              <p className="text-gray-600 text-sm">
                ⚙️ Future menu actions (e.g. filter by date, sort, bulk approve,
                etc.)
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <h3 className="my-6 text-3xl font-bold text-gray-800">
          Pending Members
        </h3>

        {/* Members Grid */}
        {loading && <p className="text-gray-600">Loading pending members...</p>}
        {error && <p className="text-red-500">{error}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {filteredFriends.map((friend) => (
              <motion.div
                key={friend.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-lg p-4 shadow hover:shadow-md transition-shadow flex items-center justify-between"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <img
                    src={friend.avatar}
                    alt={friend.name}
                    className="w-12 h-12 rounded-full object-cover border border-gray-200"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">
                      {friend.name}
                    </h3>
                    <p className="text-xs text-gray-500 truncate">
                      {friend.timestamp}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleAddSociety(friend.id, friend.name)}
                  disabled={approvingId === friend.id}
                  className={`ml-3 px-4 py-2 text-sm font-medium text-white rounded-lg transition ${
                    approvingId === friend.id
                      ? "bg-blue-300 cursor-not-allowed"
                      : "bg-blue-500 hover:bg-blue-600"
                  }`}
                >
                  {approvingId === friend.id ? "Approving..." : "Approve"}
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {filteredFriends.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500 text-sm">No pending members found</p>
          </div>
        )}

        {/* Count */}
        <div className="mt-8 text-center text-sm text-gray-500">
          Showing {filteredFriends.length} of {friends.length} members
        </div>
      </div>
    </div>
  );
}

export default PendingMembers;
