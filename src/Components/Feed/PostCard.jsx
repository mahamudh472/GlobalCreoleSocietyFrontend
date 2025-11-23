import React, { useState, useEffect } from "react"
import { Heart, MessageCircle, MoreVertical, Trash2, Edit } from "lucide-react"
import { FaShareFromSquare } from "react-icons/fa6"
import { useNavigate } from "react-router-dom"
import { apiMethods } from "../../utils/api"
import { ENDPOINTS } from "../../config/apiConfig"
import { toast } from "react-toastify"
import { useAuth } from "../../context/AuthContext"

const PostCard = ({ post, onComment, onShare, onDelete, onUpdate }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isLiked, setIsLiked] = useState(post.is_liked || false)
    const [likesCount, setLikesCount] = useState(post.like_count || 0)
    const [commentCount, setCommentCount] = useState(post.comment_count || 0)
    const [showMenu, setShowMenu] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const DEFAULT_PROFILE_IMAGE = post.user 
        ? `https://ui-avatars.com/api/?name=${encodeURIComponent(post.user.profile_name || post.user.email || "User")}&size=150&background=3b82f6&color=fff`
        : "https://ui-avatars.com/api/?name=User&size=150&background=3b82f6&color=fff";

    // Update comment count when post prop changes
    React.useEffect(() => {
        setCommentCount(post.comment_count || 0);
    }, [post.comment_count]);

    const handleLike = async () => {
        try {
            const response = await apiMethods.post(ENDPOINTS.POSTS.LIKE(post.id));
            const newLikedState = response.data.liked;
            setIsLiked(newLikedState);
            setLikesCount((prev) => newLikedState ? prev + 1 : prev - 1);
        } catch (error) {
            console.error('Error liking post:', error);
            toast.error('Failed to like post');
        }
    }

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this post?')) {
            return;
        }

        setIsDeleting(true);
        try {
            await apiMethods.delete(ENDPOINTS.POSTS.DELETE(post.id));
            toast.success('Post deleted successfully');
            if (onDelete) onDelete(post.id);
        } catch (error) {
            console.error('Error deleting post:', error);
            toast.error('Failed to delete post');
        } finally {
            setIsDeleting(false);
            setShowMenu(false);
        }
    }

    const handleUserClick = () => {
        if (post.user?.id) {
            // Navigate to user's profile (own or other's)
            if (user && post.user.id === user.id) {
                navigate('/profile');
            } else {
                navigate(`/profile/${post.user.id}`);
            }
        }
    }

    const handleSocietyClick = (e) => {
        e.stopPropagation(); // Prevent triggering user click
        if (post.society?.id) {
            navigate(`/society/${post.society.id}`);
        }
    }

    const DEFAULT_SOCIETY_IMAGE = post.society 
        ? `https://ui-avatars.com/api/?name=${encodeURIComponent(post.society.name || "Society")}&size=150&background=10b981&color=fff`
        : null;

    const isOwnPost = user && post.user && (user.id === post.user.id);

    return (
        <div className="bg-white rounded-xl p-4 mb-4 shadow-sm transform transition-transform duration-700 ease-out hover:scale-102">
            {/* Society Header - Show if post belongs to a society */}
            {post.society && (
                <div 
                    onClick={handleSocietyClick}
                    className="flex items-center space-x-3 mb-3 pb-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 -m-4 p-4 rounded-t-xl transition-colors"
                >
                    <img
                        src={post.society.cover_picture || post.society.cover_image || DEFAULT_SOCIETY_IMAGE}
                        alt={post.society.name}
                        className="w-12 h-12 rounded-lg object-cover border-2 border-gray-200"
                    />
                    <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-base hover:underline">{post.society.name}</h3>
                        <p className="text-xs text-gray-500">Society · {post.society.members_count || 0} members</p>
                    </div>
                </div>
            )}

            {/* User Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                    <div 
                        className="flex items-center space-x-3 cursor-pointer hover:opacity-80"
                        onClick={handleUserClick}
                    >
                        <img
                            src={post.user?.profile_image || DEFAULT_PROFILE_IMAGE}
                            alt={post.user?.profile_name || "User"}
                            className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                            <h3 className="font-semibold text-gray-900">{post.user?.profile_name || post.user?.username}</h3>
                            <p className="text-sm text-gray-500">
                                {post.created_at ? new Date(post.created_at).toLocaleString() : 'Just now'}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="relative">
                    {isOwnPost && (
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-2 hover:bg-gray-100 rounded-full cursor-pointer"
                        >
                            <MoreVertical className="w-4 h-4 text-gray-500" />
                        </button>
                    )}
                    {showMenu && isOwnPost && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center space-x-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span>{isDeleting ? 'Deleting...' : 'Delete Post'}</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="mb-3">
                <p className="text-gray-800 mb-3">{post.content}</p>
                {post.media && post.media.length > 0 && (
                    <div className="grid grid-cols-1 gap-2">
                        {post.media.map((mediaItem, index) => (
                            <div key={mediaItem.id || index}>
                                {mediaItem.media_type === 'image' && (
                                    <img
                                        src={mediaItem.file || "/placeholder.svg"}
                                        alt={mediaItem.caption || "Post content"}
                                        className="w-full rounded-lg object-cover max-h-96"
                                    />
                                )}
                                {mediaItem.media_type === 'video' && (
                                    <video
                                        src={mediaItem.file}
                                        controls
                                        className="w-full rounded-lg max-h-96"
                                    />
                                )}
                                {mediaItem.caption && (
                                    <p className="text-sm text-gray-600 mt-1">{mediaItem.caption}</p>
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
                        className="w-full rounded-lg object-cover max-h-96"
                    />
                )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center space-x-6">
                    <button
                        onClick={handleLike}
                        className="cursor-pointer flex items-center space-x-2 text-gray-500 hover:text-red-500 transition-colors"
                    >
                        <Heart className={`w-5 h-5 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
                        <span className="text-sm">{likesCount} Likes</span>
                    </button>
                    <button
                        onClick={onComment}
                        className="cursor-pointer flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors"
                    >
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-sm">{commentCount} Comments</span>
                    </button>
                </div>
                <button
                    onClick={onShare}
                    className="p-2 hover:bg-gray-100 rounded-full cursor-pointer transform transition-transform duration-700 ease-out hover:scale-120"
                >
                    <FaShareFromSquare className="w-4 h-4 text-gray-500" />
                </button>
            </div>
        </div>
    )
}

export default PostCard
