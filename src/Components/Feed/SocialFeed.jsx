"use client";

import { useState, useRef, useEffect } from "react";
import StoriesSection from "./StoriesSection";
import CreatePostSection from "./CreatePostSection";
import PostCard from "./PostCard";
import LiveStreamCard from "./LiveStreamCard";
import CommentsModal from "./CommentsModal";
import ShareModal from "./ShareModal";
import { useCurrentUser } from "../../hooks/queries";
import { usePostsInfinite } from "../../hooks/queries";
import { livestreamAPI } from "../../services/livestreamService";

const SocialFeed = () => {
  const { data: user } = useCurrentUser();
  const [activeSharePostId, setActiveSharePostId] = useState(null);
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [liveStreams, setLiveStreams] = useState([]);
  const [liveStreamsLoading, setLiveStreamsLoading] = useState(true);
  const loadMoreRef = useRef(null);

  // Use infinite query for posts
  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } =
    usePostsInfinite({});

  // Flatten pages into single posts array
  const posts = data?.pages.flatMap((page) => page.results) ?? [];

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

  // Scroll to a specific post if hash is present (e.g., #post-123)
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || !hash.startsWith("#post-")) return;
    // Delay to ensure posts rendered in DOM
    const t = setTimeout(() => {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 150);
    return () => clearTimeout(t);
  }, [posts.length]);

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

      {isLoading && posts.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : posts.length === 0 && liveStreams.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center">
          <p className="text-gray-500">
            No posts yet. Be the first to share something!
          </p>
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
