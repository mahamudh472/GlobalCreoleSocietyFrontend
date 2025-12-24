import React from "react";
import { useNavigate } from "react-router-dom";
import { IoMdClose } from "react-icons/io";
import { FaUser } from "react-icons/fa";
import { DEFAULT_AVATAR } from "../utils/defaultAvatar";

const SearchResults = ({ results, isLoading, query, onClose, onSelectUser }) => {
  const navigate = useNavigate();

  const handleUserClick = (user) => {
    if (onSelectUser) {
      onSelectUser(user);
    }
    navigate(`/profile/${user.id}`);
    onClose();
  };

  if (!query || query.trim().length < 2) {
    return null;
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-sm font-semibold text-gray-700">
          Search Results {results?.count > 0 && `(${results.count})`}
        </span>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <IoMdClose className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="p-4">
          <div className="flex items-center space-x-3 animate-pulse">
            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      )}

      {/* No Results */}
      {!isLoading && results?.results?.length === 0 && (
        <div className="p-6 text-center">
          <FaUser className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No users found for "{query}"</p>
          <p className="text-gray-400 text-xs mt-1">Try a different search term</p>
        </div>
      )}

      {/* Results List */}
      {!isLoading && results?.results?.length > 0 && (
        <div className="py-2">
          {results.results.map((user) => (
            <button
              key={user.id}
              onClick={() => handleUserClick(user)}
              className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors text-left"
            >
              {/* User Avatar */}
              <img
                src={user.profile_image || DEFAULT_AVATAR}
                alt={user.profile_name || "User"}
                className="w-12 h-12 rounded-full object-cover border-2 border-gray-100"
              />
              
              {/* User Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">
                  {user.profile_name || user.username || "Unknown User"}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {user.email}
                </p>
              </div>
              
              {/* View Profile Indicator */}
              <span className="text-xs text-blue-600 font-medium whitespace-nowrap">
                View Profile
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchResults;
