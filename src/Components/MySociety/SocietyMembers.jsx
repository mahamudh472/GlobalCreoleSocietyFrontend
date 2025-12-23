import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiSearch, FiArrowLeft } from "react-icons/fi";
import Navbar from "../Navbar";
import { AnimatePresence, motion } from "framer-motion";
import { useSocietyMembers } from "../../hooks/queries/useSocieties";

function SocietyMembers() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  // Use TanStack Query for fetching members
  const { data: membersData = [], isLoading: loading, isError: error } = useSocietyMembers(id);

  // Search handling
  const handleSearch = (e) => setSearchQuery(e.target.value);

  // Filtered list
  const filteredMembers = membersData.filter((member) => {
    const name = member.user?.profile_name || member.user?.email || member.user?.username || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />

      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Back Button & Search bar */}
        <div className="bg-white shadow-sm px-4 py-3 rounded-xl flex items-center justify-between gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <FiArrowLeft size={20} className="text-gray-600" />
          </button>
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
        </div>

        {/* Header */}
        <h3 className="my-6 text-3xl font-bold text-gray-800">
          All Members ({membersData.length})
        </h3>

        {/* Members Grid */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg p-4 shadow animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {error && <p className="text-red-500">Failed to load members</p>}
        
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence>
              {filteredMembers.map((member, index) => (
                <motion.div
                  key={member.id || index}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-lg p-4 shadow hover:shadow-md transition-shadow flex items-center gap-3 cursor-pointer"
                  onClick={() => navigate(`/profile/${member.user?.id}`)}
                >
                  <img
                    src={
                      member.user?.profile_image ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        member.user?.profile_name || member.user?.email || "User"
                      )}&size=150&background=3b82f6&color=fff`
                    }
                    alt={member.user?.profile_name || "Member"}
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">
                      {member.user?.profile_name || member.user?.username || member.user?.email || "Unknown"}
                    </h3>
                    <p className="text-xs text-gray-500 truncate">
                      {member.role === "admin" ? "Admin" : member.role === "moderator" ? "Moderator" : "Member"}
                    </p>
                    {member.joined_at && (
                      <p className="text-xs text-gray-400">
                        Joined {new Date(member.joined_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredMembers.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500 text-sm">
              {searchQuery ? "No members found matching your search" : "No members in this society yet"}
            </p>
          </div>
        )}

        {/* Count */}
        {!loading && filteredMembers.length > 0 && (
          <div className="mt-8 text-center text-sm text-gray-500">
            Showing {filteredMembers.length} of {membersData.length} members
          </div>
        )}
      </div>
    </div>
  );
}

export default SocietyMembers;
