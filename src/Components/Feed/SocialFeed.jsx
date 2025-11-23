"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import StoriesSection from "./StoriesSection"
import CreatePostSection from "./CreatePostSection"
import PostCard from "./PostCard"
import CommentsModal from "./CommentsModal"
import ShareModal from "./ShareModal"
import { apiMethods } from "../../utils/api"
import { ENDPOINTS } from "../../config/apiConfig"
import { toast } from "react-toastify"
import { useAuth } from "../../context/AuthContext"

const mockStories = [
    { id: "add", type: "add", title: "Add your reels" },
    { id: 1, username: "Morgan", avatar: "https://st3.depositphotos.com/15648834/17930/v/450/depositphotos_179308454-stock-illustration-unknown-person-silhouette-glasses-profile.jpg", hasStory: true },
    { id: 2, username: "Stanley", avatar: "/man-professional.jpg", hasStory: true },
    { id: 3, username: "Allen", avatar: "/young-man.jpg", hasStory: true },
    { id: 4, username: "Lucas", avatar: "/man-casual.jpg", hasStory: true },
    { id: 5, username: "Danny", avatar: "/woman-outdoor.jpg", hasStory: true },
]

const SocialFeed = () => {
    const { user } = useAuth();
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [nextPage, setNextPage] = useState(1)
    const [activeSharePostId, setActiveSharePostId] = useState(null)
    const [activeCommentPostId, setActiveCommentPostId] = useState(null)
    
    const observerRef = useRef(null)
    const loadMoreRef = useRef(null)

    // Fetch initial posts
    useEffect(() => {
        fetchPosts(1);
    }, []);

    // Infinite scroll observer
    useEffect(() => {
        if (loading || loadingMore || !hasMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loadingMore) {
                    fetchPosts(nextPage);
                }
            },
            { threshold: 0.1 }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        observerRef.current = observer;

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [loading, loadingMore, hasMore, nextPage]);

    const fetchPosts = async (page = 1) => {
        try {
            if (page === 1) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }

            const response = await apiMethods.get(`${ENDPOINTS.POSTS.LIST}?page=${page}`);
            
            // Handle paginated response
            const newPosts = response.data.results || response.data;
            const next = response.data.next;
            
            if (page === 1) {
                setPosts(newPosts);
            } else {
                setPosts((prev) => [...prev, ...newPosts]);
            }
            
            setHasMore(!!next);
            if (next) {
                setNextPage(page + 1);
            }
        } catch (error) {
            console.error('Error fetching posts:', error);
            if (page === 1) {
                toast.error('Failed to load posts');
            }
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const handleCreatePost = (newPost) => {
        // Add new post to the beginning of the list
        setPosts((prev) => [newPost, ...prev])
    }

    const handleDeletePost = (postId) => {
        setPosts((prev) => prev.filter(post => post.id !== postId));
    }

    const handleCommentAdded = (postId) => {
        // Update the comment count for the specific post
        setPosts((prev) => 
            prev.map(post => 
                post.id === postId 
                    ? { ...post, comment_count: (post.comment_count || 0) + 1 }
                    : post
            )
        );
    };

    const handleOpenShareModal = (postId) => {
        setActiveSharePostId(postId)
    }

    const handleOpenCommentModal = (postId) => {
        setActiveCommentPostId(postId)
    }

    const closeShareModal = () => {
        setActiveSharePostId(null)
    }

    const closeCommentModal = () => {
        setActiveCommentPostId(null)
    }

    return (
        <div className="min-h-screen">
            <StoriesSection stories={mockStories} />
            <CreatePostSection
                currentUser={user}
                onCreatePost={handleCreatePost}
            />

            {loading && posts.length === 0 ? (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            ) : posts.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center">
                    <p className="text-gray-500">No posts yet. Be the first to share something!</p>
                </div>
            ) : (
                <>
                    <div className="space-y-4">
                        {posts.map((post) => (
                            <PostCard
                                key={post.id}
                                post={post}
                                onComment={() => handleOpenCommentModal(post.id)}
                                onShare={() => handleOpenShareModal(post.id)}
                                onDelete={handleDeletePost}
                            />
                        ))}
                    </div>

                    {/* Infinite scroll trigger */}
                    {hasMore && (
                        <div ref={loadMoreRef} className="flex justify-center items-center py-8">
                            {loadingMore && (
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            )}
                        </div>
                    )}

                    {!hasMore && posts.length > 0 && (
                        <div className="text-center py-8 text-gray-500">
                            No more posts to load
                        </div>
                    )}
                </>
            )}

            {/* Modals */}
            <ShareModal isOpen={!!activeSharePostId} onClose={closeShareModal} postId={activeSharePostId} />
            <CommentsModal 
                isOpen={!!activeCommentPostId} 
                onClose={closeCommentModal} 
                postId={activeCommentPostId}
                onCommentAdded={handleCommentAdded}
            />
        </div>
    )
}

export default SocialFeed
