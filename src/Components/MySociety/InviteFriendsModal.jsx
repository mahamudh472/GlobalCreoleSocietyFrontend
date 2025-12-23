import React, { useState } from "react";
import { FiX, FiSearch, FiSend } from "react-icons/fi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiMethods } from "../../utils/api";
import { ENDPOINTS } from "../../config/apiConfig";
import { toast } from "react-toastify";
import { AnimatePresence, motion } from "framer-motion";

const InviteFriendsModal = ({ isOpen, onClose, societyId, societyName }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [invitingIds, setInvitingIds] = useState(new Set());
  const queryClient = useQueryClient();

  // Fetch invitable friends
  const { data: friends = [], isLoading } = useQuery({
    queryKey: ["invitableFriends", societyId, searchQuery],
    queryFn: async () => {
      const params = searchQuery ? { search: searchQuery } : {};
      const response = await apiMethods.get(
        ENDPOINTS.SOCIETIES.INVITABLE_FRIENDS(societyId),
        { params }
      );
      return response.data.results || response.data || [];
    },
    enabled: isOpen && !!societyId,
  });

  // Invite mutation
  const inviteMutation = useMutation({
    mutationFn: async (friendId) => {
      const response = await apiMethods.post(
        ENDPOINTS.SOCIETIES.INVITE(societyId),
        { friend_id: friendId }
      );
      return response.data;
    },
    onSuccess: (_, friendId) => {
      toast.success("Invitation sent!");
      setInvitingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(friendId);
        return newSet;
      });
      // Remove the invited friend from the list
      queryClient.setQueryData(
        ["invitableFriends", societyId, searchQuery],
        (old) => (old ? old.filter((f) => f.id !== friendId) : [])
      );
    },
    onError: (error, friendId) => {
      toast.error(error.response?.data?.error || "Failed to send invitation");
      setInvitingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(friendId);
        return newSet;
      });
    },
  });

  const handleInvite = (friendId) => {
    setInvitingIds((prev) => new Set(prev).add(friendId));
    inviteMutation.mutate(friendId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Invite Friends
            </h2>
            <p className="text-sm text-gray-500">to {societyName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg animate-pulse"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-200" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : friends.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {searchQuery
                  ? "No friends found matching your search"
                  : "All your friends are already members of this society"}
              </p>
            </div>
          ) : (
            <AnimatePresence>
              <div className="space-y-2">
                {friends.map((friend) => (
                  <motion.div
                    key={friend.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <img
                      src={
                        friend.profile_image ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          friend.profile_name || "User"
                        )}&size=150&background=3b82f6&color=fff`
                      }
                      alt={friend.profile_name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">
                        {friend.profile_name || friend.email || "Unknown"}
                      </p>
                    </div>
                    <button
                      onClick={() => handleInvite(friend.id)}
                      disabled={invitingIds.has(friend.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {invitingIds.has(friend.id) ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <FiSend className="w-4 h-4" />
                          <span>Invite</span>
                        </>
                      )}
                    </button>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 rounded-b-2xl">
          <p className="text-xs text-gray-500 text-center">
            An invitation message will be sent to your friend's chat
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default InviteFriendsModal;
