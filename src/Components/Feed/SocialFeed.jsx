"use client"

import { useState, useRef, useEffect } from "react"
import StoriesSection from "./StoriesSection"
import CreatePostSection from "./CreatePostSection"
import PostCard from "./PostCard"
import CommentsModal from "./CommentsModal"
import ShareModal from "./ShareModal"
import { useCurrentUser } from "../../hooks/queries"
import { usePostsInfinite } from "../../hooks/queries"

const mockStories = [
    { id: "add", type: "add", title: "Add your reels" },
    { id: 1, username: "Morgan", avatar: "https://st3.depositphotos.com/15648834/17930/v/450/depositphotos_179308454-stock-illustration-unknown-person-silhouette-glasses-profile.jpg", hasStory: true },
    { id: 2, username: "Stanley", avatar: "/man-professional.jpg", hasStory: true },
    { id: 3, username: "Allen", avatar: "/young-man.jpg", hasStory: true },
    { id: 4, username: "Lucas", avatar: "/man-casual.jpg", hasStory: true },
    { id: 5, username: "Danny", avatar: "/woman-outdoor.jpg", hasStory: true },
]

const SocialFeed = () => {
    const { data: user } = useCurrentUser();
    const [activeSharePostId, setActiveSharePostId] = useState(null)
    const [activeCommentPostId, setActiveCommentPostId] = useState(null)
    const loadMoreRef = useRef(null)

    // Use infinite query for posts
    const {
        data,
        isLoading,
        isFetchingNextPage,
        fetchNextPage,
        hasNextPage,
    } = usePostsInfinite({});

    // Flatten pages into single posts array
    const posts = data?.pages.flatMap(page => page.results) ?? [];

    // Infinite scroll observer
    useEffect(() => {
        if (isLoading || isFetchingNextPage || !hasNextPage) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1 }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => {
            if (loadMoreRef.current) {
                observer.disconnect();
            }
        };
    }, [isLoading, isFetchingNextPage, hasNextPage, fetchNextPage]);

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
            <CreatePostSection currentUser={user} />

            {isLoading && posts.length === 0 ? (
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
                            />
                        ))}
                    </div>

                    {/* Infinite scroll trigger */}
                    {hasNextPage && (
                        <div ref={loadMoreRef} className="flex justify-center items-center py-8">
                            {isFetchingNextPage && (
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            )}
                        </div>
                    )}

                    {!hasNextPage && posts.length > 0 && (
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
            />
        </div>
    )
}

export default SocialFeed
