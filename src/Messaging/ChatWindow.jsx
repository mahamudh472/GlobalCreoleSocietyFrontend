"use client";

import { useState, useRef, useEffect } from "react";
import {
  FaPhone,
  FaVideo,
  FaEllipsisV,
  FaPaperclip,
  FaSmile,
  FaPaperPlane,
} from "react-icons/fa";
import Message from "./Message";
import { useNavigate } from "react-router-dom";
import { apiMethods } from "../utils/api";
import { ENDPOINTS } from "../config/apiConfig";
import { toast } from "react-toastify";
import { useCall } from "../context/CallContext";

function ChatWindow({
  chat,
  messages,
  onSendMessage,
  onDeleteConversation,
  onLoadMoreMessages,
  hasMoreMessages,
  loadingMore,
}) {
  const [messageText, setMessageText] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const previousScrollHeightRef = useRef(0);
  const isLoadingRef = useRef(false);
  const hasScrolledToBottomRef = useRef(false); // Track if we've scrolled to bottom initially
  const { initiateCall } = useCall();

  const getDefaultProfileImage = () => {
    const name = chat?.name || "User";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name
    )}&size=150&background=3b82f6&color=fff`;
  };

  // Filter out system messages
  const userMessages = messages.filter((msg) => msg.file_type !== "system");
  const hasUserMessages = userMessages.length > 0;

  const scrollToBottom = () => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Scroll to bottom on initial load only
  useEffect(() => {
    if (messages.length > 0 && !hasScrolledToBottomRef.current) {
      // Use setTimeout to ensure DOM is fully rendered
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: "instant" });
          hasScrolledToBottomRef.current = true;
        }
      }, 100);
    }
  }, [messages.length]);

  // Reset scroll flag when chat changes
  useEffect(() => {
    hasScrolledToBottomRef.current = false;
  }, [chat?.id]);

  // Auto-scroll when new messages arrive or after sending your own message
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const nearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      100;
    const lastMsg = userMessages[userMessages.length - 1];

    if (userMessages.length > 0 && (nearBottom || lastMsg?.isOwn)) {
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }
  }, [userMessages]);

  // Handle scroll for loading older messages
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight } = container;

    // Prevent multiple simultaneous loads
    if (isLoadingRef.current || loadingMore) {
      return;
    }

    // Check if scrolled near top (within 150px) and has more messages
    if (scrollTop < 150 && hasMoreMessages) {
      isLoadingRef.current = true;
      previousScrollHeightRef.current = scrollHeight;

      if (onLoadMoreMessages) {
        onLoadMoreMessages();
      }
    }
  };

  // Restore scroll position after loading older messages
  useEffect(() => {
    if (loadingMore === false && isLoadingRef.current) {
      const container = messagesContainerRef.current;
      if (container && previousScrollHeightRef.current) {
        // Use requestAnimationFrame to ensure DOM is updated
        requestAnimationFrame(() => {
          const newScrollHeight = container.scrollHeight;
          const scrollDifference =
            newScrollHeight - previousScrollHeightRef.current;
          container.scrollTop = scrollDifference + 50; // Add small offset to prevent immediate retrigger

          // Reset the loading flag after a short delay
          setTimeout(() => {
            isLoadingRef.current = false;
          }, 100);
        });
      } else {
        isLoadingRef.current = false;
      }
    }
  }, [loadingMore]);

  const handleSend = (e) => {
    e.preventDefault();
    if (messageText.trim() || selectedFile) {
      onSendMessage(messageText, selectedFile);
      setMessageText("");
      setSelectedFile(null);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleMenuAction = async (action) => {
    setShowMenu(false);

    switch (action) {
      case "view-profile":
        // Navigate to user profile
        navigate(`/profile/${chat.userId}`);
        break;

      case "block":
        if (window.confirm(`Are you sure you want to block ${chat.name}?`)) {
          try {
            await apiMethods.post(ENDPOINTS.USERS.BLOCK(chat.userId));
            toast.success(`${chat.name} has been blocked`);
            // Optionally delete the conversation or just go back
            if (onDeleteConversation) {
              onDeleteConversation(chat.id);
            }
          } catch (error) {
            console.error("Error blocking user:", error);
            toast.error("Failed to block user");
          }
        }
        break;

      // Delete chat is hidden for now - needs optimization for one-sided deletion
      // case "delete":
      //   if (window.confirm(`Are you sure you want to delete this conversation with ${chat.name}?`)) {
      //     try {
      //       await apiMethods.delete(ENDPOINTS.CHAT.DELETE_CONVERSATION(chat.id))
      //       toast.success("Conversation deleted")
      //       if (onDeleteConversation) {
      //         onDeleteConversation(chat.id)
      //       }
      //     } catch (error) {
      //       console.error("Error deleting conversation:", error)
      //       toast.error("Failed to delete conversation")
      //     }
      //   }
      //   break

      default:
        break;
    }
  };

  return (
    <div className="flex-1 flex flex-col ">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={chat.avatar || getDefaultProfileImage()}
              alt={chat.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            {chat.isActive && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{chat.name}</h3>
            <p className="text-xs text-green-500">Active</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={async () => {
              console.log("Voice call to:", chat.name);
              const token = localStorage.getItem("access_token");
              if (!token) {
                toast.error(
                  "Authentication token not found. Please login again."
                );
                return;
              }
              // Pass userId instead of conversation id for receiver_id
              const otherUser = { id: chat.userId, name: chat.name };
              await initiateCall(chat.id, otherUser, "audio", token);
              // Navigate to call page immediately
              navigate("/chat/audiocall");
            }}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Start audio call"
          >
            <FaPhone className="text-gray-600" />
          </button>
          <button
            onClick={async () => {
              console.log("Video call to:", chat.name);
              const token = localStorage.getItem("access_token");
              if (!token) {
                toast.error(
                  "Authentication token not found. Please login again."
                );
                return;
              }
              // Pass userId instead of conversation id for receiver_id
              const otherUser = { id: chat.userId, name: chat.name };
              await initiateCall(chat.id, otherUser, "video", token);
              // Navigate to call page immediately
              navigate("/chat/videocall");
            }}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Start video call"
          >
            <FaVideo className="text-gray-600" />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FaEllipsisV className="text-gray-600" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200  z-10 ">
                <button
                  onClick={() => handleMenuAction("view-profile")}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-400 rounded-t-xl transition-colors cursor-pointer "
                >
                  View profile
                </button>
                <button
                  onClick={() => handleMenuAction("block")}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-400 rounded-b-xl transition-colors cursor-pointer"
                >
                  Block
                </button>
                {/* Delete Chat - Hidden for now (needs optimization for one-sided deletion) */}
                {/* <button
                  onClick={() => handleMenuAction("delete")}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-400 rounded-b-xl transition-colors cursor-pointer"
                >
                  Delete Chat
                </button> */}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {/* Loading indicator at top */}
        {loadingMore && hasMoreMessages && (
          <div className="flex justify-center py-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        )}

        {!loadingMore && hasMoreMessages && userMessages.length > 0 && (
          <div className="text-center py-2">
            <p className="text-xs text-gray-400">
              Scroll up to load older messages
            </p>
          </div>
        )}

        {!hasUserMessages ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-500 text-sm">
                You and <span className="font-semibold">{chat.name}</span> are
                now connected! Start chatting.
              </p>
            </div>
          </div>
        ) : (
          <>
            {userMessages.map((message) => (
              <Message key={message.id} message={message} />
            ))}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
            <input
              type="text"
              placeholder="Type something here..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder-gray-500"
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
            />
            {selectedFile && (
              <span className="text-xs text-gray-600 bg-blue-100 px-2 py-1 rounded">
                {selectedFile.name}
              </span>
            )}
            <button
              type="button"
              onClick={handleAttachClick}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FaPaperclip className="text-lg" />
            </button>
            <button
              type="button"
              onClick={() => {}}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FaSmile className="text-lg" />
            </button>
          </div>
          <button
            type="submit"
            disabled={!messageText.trim() && !selectedFile}
            className="p-3 cursor-pointer bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaPaperPlane />
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatWindow;
