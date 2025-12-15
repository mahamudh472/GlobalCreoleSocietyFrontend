"use client";

import { useState, useEffect, useRef } from "react";
import { useCurrentUser } from "../../hooks/queries/useUser";
import { X, ChevronRight } from "lucide-react";
import { useUserSocieties } from "../../hooks/queries/useSocieties";
import { useConversations } from "../../hooks/queries/useChat";
import { apiMethods } from "../../utils/api";
import { ENDPOINTS } from "../../config/apiConfig";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

// Accept either a full postData object or just a postId from parent components
const ShareModal = ({ isOpen, onClose, postData, postId }) => {
  const [shareMessage, setShareMessage] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedSocieties, setSelectedSocieties] = useState([]);
  const { data: currentUser } = useCurrentUser();
  const navigate = useNavigate();
  const popupRef = useRef(null);

  // Load conversations
  const {
    data: conversations = [],
    isLoading: isLoadingConversations,
    error: conversationsError,
  } = useConversations();

  // Load user societies
  const {
    data: userSocieties = [],
    isLoading: isLoadingSocieties,
    error: societiesError,
  } = useUserSocieties();

  const handleUserSelect = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSocietySelect = (societyId) => {
    setSelectedSocieties((prev) =>
      prev.includes(societyId)
        ? prev.filter((id) => id !== societyId)
        : [...prev, societyId]
    );
  };

  const handleShareNow = async () => {
    try {
      if (selectedUsers.length === 0 && selectedSocieties.length === 0) {
        toast.info("Select at least one chat or society to share.");
        return;
      }

      // Ensure content is never empty
      const effectivePostId = postData?.id || postId;
      // Share a link that routes to the specific post in the Feed by hash
      const postLink = effectivePostId ? `/feed#post-${effectivePostId}` : "";

      // Always include the post link to ensure navigation from inbox
      const contentToSend = `${
        shareMessage?.trim() ? shareMessage.trim() + "\n" : ""
      }${postLink}`.trim();
      // console.log("Content to send:", contentToSend ,postLink);
      console.log("share message", shareMessage, "\n", postData);

      // Share to selected users
      await Promise.all(
        selectedUsers.map(async (targetId) => {
          let conversationId = null;
          try {
            const createResp = await apiMethods.post(
              ENDPOINTS.CHAT.CREATE_CONVERSATION,
              { user_id: targetId }
            );
            conversationId =
              createResp?.data?.id || createResp?.data?.conversation?.id;
          } catch (e) {
            console.warn("Failed to create conversation, using existing", e);
            const existing = Array.isArray(conversations)
              ? conversations.find((c) => c.userId === targetId)
              : null;
            conversationId = existing?.id || targetId;
          }

          const payload = {
            content: contentToSend,
            post_id: effectivePostId,
          };
          await apiMethods.post(
            ENDPOINTS.CHAT.SEND_MESSAGE(conversationId),
            payload
          );
        })
      );

      // Share to selected societies by creating a post in each society (no link, only text/content)
      let createdSocietyPosts = [];
      if (selectedSocieties.length > 0) {
        const groupContent =
          (shareMessage || "").trim() || postData?.content || "Shared a post";
        createdSocietyPosts = await Promise.all(
          selectedSocieties.map(async (societyId) => {
            const payload = { content: groupContent, society: societyId };
            const resp = await apiMethods.post(ENDPOINTS.POSTS.CREATE, payload);
            return { societyId, post: resp.data };
          })
        );
      }

      toast.success("Shared successfully!");
      onClose();
      // Navigate based on what was shared: go to first society's post if any societies selected; otherwise to chat
      if (createdSocietyPosts.length > 0) {
        const first = createdSocietyPosts[0];
        const newPostId = first?.post?.id;
        if (newPostId) {
          navigate(`/society/${first.societyId}#post-${newPostId}`);
        } else {
          navigate(`/society/${first.societyId}`);
        }
      } else {
        navigate("/chat");
      }
    } catch (err) {
      console.error("Share error:", err);
      toast.error("Failed to share. Please try again.");
    }
  };

  // Close modal on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  if (!isOpen) return null;

  const displayName =
    currentUser?.profile_name ||
    currentUser?.name ||
    currentUser?.username ||
    "User";
  const displayAvatar =
    currentUser?.profile_image ||
    currentUser?.profile_image_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      displayName
    )}&size=150&background=3b82f6&color=fff`;

  return (
    <div className="fixed inset-0 bg-black/15 flex items-center justify-center z-50 transition-opacity duration-300">
      <div
        ref={popupRef}
        className="bg-white rounded-xl w-[50%] max-h-[90vh] overflow-hidden transform transition-transform duration-500 ease-out min-w-[420px]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Share</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* User Profile Section */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center space-x-3 mb-3">
              <img
                src={displayAvatar}
                alt={displayName}
                className="w-10 h-10 rounded-full object-cover"
              />
              <span className="font-bold text-gray-900">{displayName}</span>
            </div>

            <textarea
              value={shareMessage}
              onChange={(e) => setShareMessage(e.target.value)}
              placeholder="Say something about this (optional)"
              className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="4"
            />

            <div className="flex justify-end mt-3">
              <button
                onClick={handleShareNow}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium cursor-pointer"
              >
                Share now
              </button>
            </div>
          </div>

          {/* Send in Message Section */}
          <div className="px-4 py-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Send in Message
            </h3>
            <div className="flex items-center space-x-3 overflow-x-auto pb-2 gap-5">
              {isLoadingConversations && (
                <div className="text-xs text-gray-500">Loading…</div>
              )}
              {conversationsError && (
                <div className="text-xs text-red-500">
                  Failed to load your chats
                </div>
              )}
              {Array.isArray(conversations) &&
                conversations.length > 0 &&
                conversations.map((conv) => (
                  <div key={conv.id} className="flex-shrink-0 text-center">
                    <button
                      onClick={() => handleUserSelect(conv.userId || conv.id)}
                      className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-colors ${
                        selectedUsers.includes(conv.userId || conv.id)
                          ? "border-blue-500"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <img
                        src={conv.avatar || "/placeholder.svg"}
                        alt={conv.name}
                        className="w-full h-full object-cover"
                      />
                    </button>
                    <span className="text-xs text-gray-600 mt-1 block">
                      {conv.name}
                    </span>
                  </div>
                ))}
              <button className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Send in Society Section */}
          <div className="px-4 py-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Send in Society
            </h3>
            <div className="flex items-center space-x-3 overflow-x-auto pb-2 gap-5">
              {isLoadingSocieties && (
                <div className="text-xs text-gray-500">Loading…</div>
              )}
              {societiesError && (
                <div className="text-xs text-red-500">
                  Failed to load your societies
                </div>
              )}
              {Array.isArray(userSocieties) &&
                userSocieties.length > 0 &&
                userSocieties.map((society) => (
                  <div key={society.id} className="flex-shrink-0 text-center">
                    <button
                      onClick={() => handleSocietySelect(society.id)}
                      className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-colors ${
                        selectedSocieties.includes(society.id)
                          ? "border-blue-500"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <img
                        src={
                          society.avatar ||
                          society.profile_image ||
                          "/placeholder.svg"
                        }
                        alt={society.name || society.title}
                        className="w-full h-full object-cover"
                      />
                      {selectedSocieties.includes(society.id) && (
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg
                            className="w-2.5 h-2.5 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </button>
                    <span className="text-xs text-gray-600 mt-1 block">
                      {society.name || society.title}
                    </span>
                  </div>
                ))}
              <button className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Share Button */}
        <div className="p-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={handleShareNow}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium cursor-pointer"
          >
            Share
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
