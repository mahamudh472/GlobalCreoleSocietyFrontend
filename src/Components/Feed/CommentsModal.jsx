"use client"

import { useState, useEffect, useRef } from "react"
import { X, Heart } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import { useCurrentUser } from "../../hooks/queries/useUser"
import { usePostComments } from "../../hooks/queries/usePosts"
import { useCreateCommentMutation, useLikeCommentMutation } from "../../hooks/mutations/usePosts"
import { DEFAULT_AVATAR } from "../../utils/defaultAvatar"

const CommentsModal = ({ isOpen, onClose, postId, onCommentAdded }) => {
  const { data: user } = useCurrentUser();
  const navigate = useNavigate();
  const [shareMessage, setShareMessage] = useState("")
  const popupRef = useRef(null)

  // Fetch comments using TanStack Query
  const { 
    data: commentsData, 
    isLoading: loading,
    refetch 
  } = usePostComments(postId, { enabled: isOpen && !!postId })
  
  const comments = commentsData || []
  
  const createCommentMutation = useCreateCommentMutation()
  const likeCommentMutation = useLikeCommentMutation()

  const handleUserClick = (userId) => {
    if (userId) {
      if (user && userId === user.id) {
        navigate('/profile');
      } else {
        navigate(`/profile/${userId}`);
      }
      onClose(); // Close modal when navigating
    }
  };

  const handlePostComment = () => {
    if (!shareMessage.trim()) return;

    createCommentMutation.mutate(
      { postId, content: shareMessage },
      {
        onSuccess: () => {
          setShareMessage("");
          
          // Notify parent component to update comment count
          if (onCommentAdded) {
            onCommentAdded(postId);
          }
        }
      }
    );
  };

  const handleLikeComment = (commentId) => {
    likeCommentMutation.mutate({ postId, commentId })
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handlePostComment();
    }
  };

  // Close the modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/15 flex items-center justify-center z-100 transition-opacity duration-300 p-2 sm:p-4">
      <div
        ref={popupRef} // Assign ref to the modal container
        className={`bg-white rounded-xl w-full sm:w-[85%] md:w-[70%] lg:w-[60%] max-h-[90vh] overflow-y-auto transform transition-transform duration-500 ease-out ${isOpen ? "translate-y-0" : "translate-y-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Comments</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
          </button>
        </div>

        {/* Comments Section */}
        <div className="px-3 sm:px-4 py-3 overflow-y-auto max-h-[400px] sm:max-h-[500px]">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center text-gray-500 py-8 text-sm sm:text-base">No comments yet. Be the first to comment!</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex items-start space-x-2 sm:space-x-3 mb-4">
                <img 
                  src={comment.user?.profile_image || DEFAULT_AVATAR} 
                  alt={comment.user?.profile_name || comment.user?.username} 
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover cursor-pointer hover:opacity-80 flex-shrink-0" 
                  onClick={() => handleUserClick(comment.user?.id)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                    <span 
                      className="font-semibold text-gray-900 cursor-pointer hover:underline text-sm sm:text-base"
                      onClick={() => handleUserClick(comment.user?.id)}
                    >
                      {comment.user?.profile_name || comment.user?.username}
                    </span>
                    <span className="text-xs sm:text-sm text-gray-500">
                      {comment.created_at ? new Date(comment.created_at).toLocaleString() : comment.timestamp}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-700 mt-1 break-words">{comment.content}</p>
                  <div className="flex items-center mt-2 space-x-4">
                    <button
                      onClick={() => handleLikeComment(comment.id)}
                      className="flex items-center space-x-1 text-xs sm:text-sm text-gray-500 hover:text-red-500"
                    >
                      <Heart 
                        className={`w-3 h-3 sm:w-4 sm:h-4 ${comment.is_liked ? 'fill-red-500 text-red-500' : ''}`} 
                      />
                      <span>{comment.like_count || 0}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Comment Input Section */}
        <div className="p-3 sm:p-4 border-t border-gray-200">
          <textarea
            value={shareMessage}
            onChange={(e) => setShareMessage(e.target.value)}
            placeholder="Write a comment..."
            onKeyDown={handleKeyPress}
            disabled={createCommentMutation.isPending}
            className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 text-sm sm:text-base"
            rows="3"
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handlePostComment}
              disabled={createCommentMutation.isPending || !shareMessage.trim()}
              className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createCommentMutation.isPending ? "Posting..." : "Post Comment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CommentsModal
