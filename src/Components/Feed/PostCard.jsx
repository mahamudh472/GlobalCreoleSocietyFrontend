import React, { useState } from "react";
import { Heart, MessageCircle, MoreVertical, Trash2, Edit, Globe, Lock, Users } from "lucide-react";
import { FaShareFromSquare } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useCurrentUser } from "../../hooks/queries/useUser";
import {
  useLikePostMutation,
  useDeletePostMutation,
} from "../../hooks/mutations/usePosts";
import { DEFAULT_AVATAR } from "../../utils/defaultAvatar";

const PostCard = ({ post, onComment, onShare, onDelete, onUpdate }) => {
  const { data: user } = useCurrentUser();
  const navigate = useNavigate();
  const [commentCount, setCommentCount] = useState(post.comment_count || 0);
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [likesCount, setLikesCount] = useState(post.like_count || 0);
  const [showMenu, setShowMenu] = useState(false);

  const likeMutation = useLikePostMutation();
  const deleteMutation = useDeletePostMutation();

  // Update counts when post prop changes (but not for likes - we handle those locally)
  React.useEffect(() => {
    setCommentCount(post.comment_count || 0);
  }, [post.comment_count]);

  // Only sync like state when post ID changes (new post)
  React.useEffect(() => {
    setIsLiked(post.is_liked || false);
    setLikesCount(post.like_count || 0);
  }, [post.id]);

  const handleLike = () => {
    // Capture current state before any changes
    const oldIsLiked = isLiked;
    const oldLikesCount = likesCount;

    // Immediate UI feedback with optimistic update
    const newIsLiked = !oldIsLiked;
    setIsLiked(newIsLiked);
    setLikesCount(newIsLiked ? oldLikesCount + 1 : oldLikesCount - 1);

    // Send mutation with OLD state (before toggle)
    likeMutation.mutate(
      {
        postId: post.id,
        isLiked: oldIsLiked,
      },
      {
        onError: () => {
          // Revert on error
          setIsLiked(oldIsLiked);
          setLikesCount(oldLikesCount);
        },
      }
    );
  };

  const handleDelete = () => {
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }

    deleteMutation.mutate(post.id, {
      onSuccess: () => {
        toast.success("Post deleted successfully");
        if (onDelete) onDelete(post.id);
        setShowMenu(false);
      },
      onError: (error) => {
        console.error("Error deleting post:", error);
        toast.error("Failed to delete post");
      },
    });
  };

  const handleUserClick = () => {
    if (post.user?.id) {
      // Navigate to user's profile (own or other's)
      if (user && post.user.id === user.id) {
        navigate("/profile");
      } else {
        navigate(`/profile/${post.user.id}`);
      }
    }
  };

  const handleSocietyClick = (e) => {
    e.stopPropagation(); // Prevent triggering user click
    if (post.society?.id) {
      navigate(`/society/${post.society.id}`);
    }
  };

  const isOwnPost = user && post.user && user.id === post.user.id;

  // Get privacy icon and text
  const getPrivacyIcon = () => {
    switch (post.privacy) {
      case "public":
        return <Globe className="w-4 h-4" />;
      case "private":
        return <Lock className="w-4 h-4" />;
      case "friends":
        return <Users className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  const getPrivacyText = () => {
    switch (post.privacy) {
      case "public":
        return "Public";
      case "private":
        return "Private";
      case "friends":
        return "Friends";
      default:
        return "Public";
    }
  };

  return (
    <div
      id={`post-${post.id}`}
      className="bg-white rounded-xl p-3 sm:p-4 mb-3 sm:mb-4 shadow-sm"
    >
      {/* Society Header - Show if post belongs to a society */}
      {post.society && (
        <div
          onClick={handleSocietyClick}
          className="flex items-center space-x-2 sm:space-x-3 mb-3 pb-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 -m-3 sm:-m-4 p-3 sm:p-4 rounded-t-xl transition-colors"
        >
          <img
            src={
              post.society.profile_image_url ||
              DEFAULT_AVATAR
            }
            alt={post.society.name}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover border-2 border-gray-200"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-sm sm:text-base hover:underline truncate">
              {post.society.name}
            </h3>
            <p className="text-[10px] sm:text-xs text-gray-500">
              Society · {post.society.members_count || 0} members
            </p>
          </div>
        </div>
      )}

      {/* User Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div
            className="flex items-center space-x-2 sm:space-x-3 cursor-pointer hover:opacity-80"
            onClick={handleUserClick}
          >
            <img
              src={post.user?.profile_image || DEFAULT_AVATAR}
              alt={post.user?.profile_name || "User"}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0"
            />
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                {post.user?.profile_name || post.user?.username}
              </h3>
              <div className="flex flex-wrap items-center gap-1 text-xs sm:text-sm text-gray-500">
                <span className="truncate max-w-[100px] sm:max-w-none">
                  {post.created_at
                    ? new Date(post.created_at).toLocaleString()
                    : "Just now"}
                </span>
                <span>·</span>
                <div className="flex items-center space-x-1">
                  {getPrivacyIcon()}
                  <span className="hidden sm:inline">{getPrivacyText()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="relative flex-shrink-0">
          {isOwnPost && (
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full cursor-pointer"
            >
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </button>
          )}
          {showMenu && isOwnPost && (
            <div className="absolute right-0 mt-2 w-40 sm:w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="w-full px-3 sm:px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center space-x-2 text-sm"
              >
                <Trash2 className="w-4 h-4" />
                <span>
                  {deleteMutation.isPending ? "Deleting..." : "Delete Post"}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mb-3">
        <p className="text-gray-800 mb-3 text-sm sm:text-base">{post.content}</p>
        {post.media && post.media.length > 0 && (
          <div className="grid grid-cols-1 gap-2">
            {post.media.map((mediaItem, index) => (
              <div key={mediaItem.id || index}>
                {mediaItem.media_type === "image" && (
                  <img
                    src={mediaItem.file || "/placeholder.svg"}
                    alt={mediaItem.caption || "Post content"}
                    className="w-full rounded-lg object-cover max-h-[400px] sm:max-h-[700px]"
                  />
                )}
                {mediaItem.media_type === "video" && (
                  <video
                    src={mediaItem.file}
                    controls
                    className="w-full rounded-lg max-h-72 sm:max-h-96"
                  />
                )}
                {mediaItem.caption && (
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    {mediaItem.caption}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
        {/* Support old format */}
        {!post.media && post.image && (
          <img
            src={post.image || "/placeholder.svg"}
            alt="Post content"
            className="w-full rounded-lg object-cover max-h-72 sm:max-h-96"
          />
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-3 sm:space-x-6">
          <button
            onClick={handleLike}
            className="cursor-pointer flex items-center space-x-1 sm:space-x-2 text-gray-500 hover:text-red-500 transition-colors"
          >
            <Heart
              className={`w-4 h-4 sm:w-5 sm:h-5 ${
                isLiked ? "fill-red-500 text-red-500" : ""
              }`}
            />
            <span className="text-xs sm:text-sm">{likesCount} <span className="hidden xs:inline">Likes</span></span>
          </button>
          <button
            onClick={onComment}
            className="cursor-pointer flex items-center space-x-1 sm:space-x-2 text-gray-500 hover:text-blue-500 transition-colors"
          >
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm">{commentCount} <span className="hidden xs:inline">Comments</span></span>
          </button>
        </div>
        <button
          onClick={onShare}
          className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full cursor-pointer"
        >
          <FaShareFromSquare className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    </div>
  );
};

export default PostCard;
