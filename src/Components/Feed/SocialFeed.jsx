"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import StoriesSection from "./StoriesSection";
import CreatePostSection from "./CreatePostSection";
import PostCard from "./PostCard";
import LiveStreamCard from "./LiveStreamCard";
import CommentsModal from "./CommentsModal";
import ShareModal from "./ShareModal";
import { useCurrentUser } from "../../hooks/queries";
import { usePostsInfinite, usePost } from "../../hooks/queries";
import { livestreamAPI } from "../../services/livestreamService";

const SocialFeed = () => {
  const { data: user } = useCurrentUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const sharedPostId = searchParams.get("sharedPost");
  
  const [activeSharePostId, setActiveSharePostId] = useState(null);
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [liveStreams, setLiveStreams] = useState([]);
  const [liveStreamsLoading, setLiveStreamsLoading] = useState(true);
  const loadMoreRef = useRef(null);

  // Fetch shared post if sharedPostId is present
  const { data: sharedPost, isLoading: sharedPostLoading } = usePost(sharedPostId, {
    enabled: !!sharedPostId,
  });

  // Use infinite query for posts
  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } =
    usePostsInfinite({});

  // Flatten pages into single posts array
  const allPosts = data?.pages.flatMap((page) => page.results) ?? [];
  
  // Filter out the shared post from regular posts to avoid duplicates
  const posts = sharedPostId 
    ? allPosts.filter(post => post.id !== sharedPostId)
    : allPosts;

  // Clear the sharedPost param after initial load (optional - keeps URL clean)
  useEffect(() => {
    if (sharedPost && sharedPostId) {
      // Optionally clear the URL param after showing the post
      // Uncomment the next line if you want to clean the URL
      // setSearchParams({});
    }
  }, [sharedPost, sharedPostId]);

  // Fetch active live streams
  useEffect(() => {
    const fetchLiveStreams = async () => {
      try {
        setLiveStreamsLoading(true);
        const streams = await livestreamAPI.getActiveLivestreams();
        setLiveStreams(Array.isArray(streams) ? streams : []);
      } catch (error) {
        console.error('Error fetching live streams:', error);
        setLiveStreams([]);
      } finally {
        setLiveStreamsLoading(false);
      }
    };

    fetchLiveStreams();
    
    // Refresh live streams every 30 seconds
    const interval = setInterval(fetchLiveStreams, 30000);
    return () => clearInterval(interval);
  }, []);

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
    setActiveSharePostId(postId);
  };

  const handleOpenCommentModal = (postId) => {
    setActiveCommentPostId(postId);
  };

  const closeShareModal = () => {
    setActiveSharePostId(null);
  };

  const closeCommentModal = () => {
    setActiveCommentPostId(null);
  };

  return (
    <div className="min-h-screen">
      <StoriesSection />
      <CreatePostSection currentUser={user} />

      {/* Live Streams Section - Only show if there are active streams */}
      {!liveStreamsLoading && liveStreams.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <h2 className="text-lg font-bold text-gray-800">Live Now</h2>
            <span className="text-sm text-gray-500">({liveStreams.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {liveStreams.map((stream) => (
              <LiveStreamCard key={stream.id} livestream={stream} />
            ))}
          </div>
        </div>
      )}

      {isLoading && posts.length === 0 && !sharedPostLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : posts.length === 0 && liveStreams.length === 0 && !sharedPost ? (
        <div className="bg-white rounded-xl p-8 text-center">
          <p className="text-gray-500">
            No posts yet. Be the first to share something!
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {/* Show shared post first if present */}
            {sharedPostLoading && sharedPostId && (
              <div className="bg-white rounded-xl p-8">
                <div className="flex justify-center items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              </div>
            )}
            {sharedPost && (
              <div className="relative">
                <div className="absolute -top-2 left-4 bg-blue-500 text-white text-xs px-3 py-1 rounded-full z-10">
                  Shared Post
                </div>
                <div className="ring-2 ring-blue-500 rounded-xl">
                  <PostCard
                    key={`shared-${sharedPost.id}`}
                    post={sharedPost}
                    onComment={() => handleOpenCommentModal(sharedPost.id)}
                    onShare={() => handleOpenShareModal(sharedPost.id)}
                  />
                </div>
              </div>
            )}
            
            {/* Regular posts */}
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
            <div
              ref={loadMoreRef}
              className="flex justify-center items-center py-8"
            >
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
      <ShareModal
        isOpen={!!activeSharePostId}
        onClose={closeShareModal}
        postId={activeSharePostId}
      />
      <CommentsModal
        isOpen={!!activeCommentPostId}
        onClose={closeCommentModal}
        postId={activeCommentPostId}
      />
    </div>
  );
};

export default SocialFeed;
