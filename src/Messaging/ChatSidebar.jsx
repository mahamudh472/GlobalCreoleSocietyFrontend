"use client"

import { useState, useEffect } from "react"
import { FaSearch, FaTimes } from "react-icons/fa"
import ChatListItem from "./ChatListItem"
import { apiMethods } from "../utils/api"
import { ENDPOINTS } from "../config/apiConfig"
import { DEFAULT_AVATAR } from "../utils/defaultAvatar"

function ChatSidebar({ chats, selectedChat, onChatSelect, filter, onFilterChange, onCreateConversation, onClose, isMobileDrawer }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    const searchFriends = async () => {
      if (searchQuery.trim().length > 0) {
        setIsSearching(true)
        try {
          const response = await apiMethods.get(ENDPOINTS.CHAT.SEARCH_FRIENDS, {
            params: { q: searchQuery }
          })
          setSearchResults(response.data)
        } catch (error) {
          console.error("Error searching friends:", error)
          setSearchResults([])
        } finally {
          setIsSearching(false)
        }
      } else {
        setSearchResults([])
      }
    }

    const debounce = setTimeout(() => {
      searchFriends()
    }, 300)

    return () => clearTimeout(debounce)
  }, [searchQuery])

  const handleSearch = (e) => {
    setSearchQuery(e.target.value)
  }

  const handleFriendSelect = async (friend) => {
    if (friend.has_conversation) {
      // Find and select existing conversation
      const existingChat = chats.find(chat => chat.id === friend.conversation_id)
      if (existingChat) {
        onChatSelect(existingChat)
      }
    } else {
      // Create new conversation
      if (onCreateConversation) {
        await onCreateConversation(friend.id)
      }
    }
    setSearchQuery("") // Clear search after selection
    setSearchResults([])
  }

  const filteredChats = searchQuery.trim().length === 0 
    ? chats.filter((chat) => chat.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : []

  return (
    <div className={`w-full md:w-72 lg:w-80 xl:w-96 border-r border-gray-200 flex flex-col bg-white ${isMobileDrawer ? 'h-full' : ''}`}>
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Chats</h2>
          {isMobileDrawer && onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors md:hidden"
            >
              <FaTimes className="text-gray-600" />
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-3 sm:mb-4">
          <input
            type="text"
            placeholder="Search person"
            value={searchQuery}
            onChange={handleSearch}
            className="w-full pl-3 sm:pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
          />
          <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs sm:text-sm" />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <button
            onClick={() => onFilterChange("all")}
            className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${
              filter === "all" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            See All
          </button>
          <button
            onClick={() => onFilterChange("unread")}
            className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${
              filter === "unread" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Unread
          </button>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {searchQuery.trim().length > 0 ? (
          // Show search results (friends)
          isSearching ? (
            <div className="p-3 sm:p-4 text-center text-gray-500 text-xs sm:text-sm">Searching...</div>
          ) : searchResults.length > 0 ? (
            searchResults.map((friend) => (
              <div
                key={friend.id}
                onClick={() => handleFriendSelect(friend)}
                className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={friend.profile_image || DEFAULT_AVATAR}
                    alt={friend.profile_name}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate text-sm sm:text-base">{friend.profile_name}</h3>
                  <p className="text-xs sm:text-sm text-gray-500 truncate">{friend.email}</p>
                  {!friend.has_conversation && (
                    <p className="text-xs text-blue-500 mt-0.5 sm:mt-1">Click to start conversation</p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-3 sm:p-4 text-center text-gray-500 text-xs sm:text-sm">No friends found</div>
          )
        ) : filteredChats.length > 0 ? (
          // Show existing conversations
          filteredChats.map((chat) => (
            <ChatListItem
              key={chat.id}
              chat={chat}
              isSelected={selectedChat?.id === chat.id}
              onClick={() => onChatSelect(chat)}
            />
          ))
        ) : (
          <div className="p-4 text-center text-gray-500 text-sm">No chats found</div>
        )}
      </div>
    </div>
  )
}

export default ChatSidebar
