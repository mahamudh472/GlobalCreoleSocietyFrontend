"use client"

import { useState, useEffect, useRef } from "react"
import { X, Heart } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { apiMethods } from "../../utils/api"
import { ENDPOINTS } from "../../config/apiConfig"
import { toast } from "react-toastify"
import { useAuth } from "../../context/AuthContext"

const CommentsModal = ({ isOpen, onClose, postId, onCommentAdded }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [shareMessage, setShareMessage] = useState("")
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(false)
  const [posting, setPosting] = useState(false)
  const popupRef = useRef(null)

  const DEFAULT_PROFILE_IMAGE = user 
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.profile_name || user.email || "User")}&size=150&background=3b82f6&color=fff`
    : "https://ui-avatars.com/api/?name=User&size=150&background=3b82f6&color=fff";

  const getDefaultProfileImage = (commentUser) => {
    if (!commentUser) return DEFAULT_PROFILE_IMAGE;
    const name = commentUser.profile_name || commentUser.email || "User";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=150&background=3b82f6&color=fff`;
  };

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

  // Fetch comments when modal opens
  useEffect(() => {
    if (isOpen && postId) {
      fetchComments();
    }
  }, [isOpen, postId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await apiMethods.get(ENDPOINTS.POSTS.COMMENTS(postId));
      
      // Handle paginated response or plain array
      const commentsData = response.data.results || response.data;
      setComments(Array.isArray(commentsData) ? commentsData : []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handlePostComment = async () => {
    if (!shareMessage.trim()) return;

    setPosting(true);
    try {
      const response = await apiMethods.post(ENDPOINTS.POSTS.COMMENTS(postId), {
        content: shareMessage
      });
      
      // Add the new comment to the beginning of the list
      setComments([response.data, ...comments]);
      setShareMessage("");
      toast.success("Comment posted!");
      
      // Notify parent component to update comment count
      if (onCommentAdded) {
        onCommentAdded(postId);
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment');
    } finally {
      setPosting(false);
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      const response = await apiMethods.post(ENDPOINTS.COMMENTS.LIKE(commentId));
      
      // Update the comment in the list
      setComments(prevComments => 
        prevComments.map(comment => 
          comment.id === commentId 
            ? { 
                ...comment, 
                is_liked: response.data.liked,
                like_count: response.data.liked 
                  ? (comment.like_count || 0) + 1 
                  : (comment.like_count || 0) - 1
              }
            : comment
        )
      );
    } catch (error) {
      console.error('Error liking comment:', error);
      toast.error('Failed to like comment');
    }
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
    <div className="fixed inset-0 bg-black/15 flex items-center justify-center z-100 transition-opacity duration-300">
      <div
        ref={popupRef} // Assign ref to the modal container
        className={`bg-white rounded-xl w-[60%] max-h-[90vh] overflow-y-auto transform transition-transform duration-500 ease-out min-w-[420px] ${isOpen ? "translate-y-0" : "translate-y-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Comments</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Comments Section */}
        <div className="px-4 py-3 overflow-y-auto max-h-[500px]">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No comments yet. Be the first to comment!</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex items-start space-x-3 mb-4">
                <img 
                  src={comment.user?.profile_image || getDefaultProfileImage(comment.user)} 
                  alt={comment.user?.profile_name || comment.user?.username} 
                  className="w-10 h-10 rounded-full object-cover cursor-pointer hover:opacity-80" 
                  onClick={() => handleUserClick(comment.user?.id)}
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span 
                      className="font-semibold text-gray-900 cursor-pointer hover:underline"
                      onClick={() => handleUserClick(comment.user?.id)}
                    >
                      {comment.user?.profile_name || comment.user?.username}
                    </span>
                    <span className="text-sm text-gray-500">
                      {comment.created_at ? new Date(comment.created_at).toLocaleString() : comment.timestamp}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
                  <div className="flex items-center mt-2 space-x-4">
                    <button
                      onClick={() => handleLikeComment(comment.id)}
                      className="flex items-center space-x-1 text-sm text-gray-500 hover:text-red-500"
                    >
                      <Heart 
                        className={`w-4 h-4 ${comment.is_liked ? 'fill-red-500 text-red-500' : ''}`} 
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
        <div className="p-4 border-t border-gray-200">
          <textarea
            value={shareMessage}
            onChange={(e) => setShareMessage(e.target.value)}
            placeholder="Write a comment..."
            onKeyDown={handleKeyPress}
            disabled={posting}
            className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            rows="4"
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handlePostComment}
              disabled={posting || !shareMessage.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {posting ? "Posting..." : "Post Comment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CommentsModal
