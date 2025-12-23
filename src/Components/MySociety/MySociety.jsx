import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../Navbar";
import GlobalCreoleSocietyCard from "./GlobalCreoleSocietyCard";
import GroupSection from "./GroupSection";
import GroupInfo from "./GroupInfo";
import PostCard from "../Feed/PostCard";
import ShareModal from "../Feed/ShareModal";
import CommentsModal from "../Feed/CommentsModal";
import CreatePostSection from "../Feed/CreatePostSection";
import { toast } from "react-toastify";
import { useCurrentUser } from "../../hooks/queries/useUser";
import { useSociety } from "../../hooks/queries/useSocieties";
import { useSocietyPosts } from "../../hooks/queries/usePosts";

const MySociety = () => {
  const { id: societyId } = useParams();
  const { data: currentUser } = useCurrentUser();

  // Fetch society data and posts using TanStack Query
  const { data: society } = useSociety(societyId);
  const { data: posts = [], isLoading: loading } = useSocietyPosts(societyId);

  // Check if current user is the creator
  const isCreator =
    currentUser && society?.creator && currentUser.id === society.creator.id;

  // Modals: comment & share ...................................................
  const [activeSharePostId, setActiveSharePostId] = useState(null);
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);

  const handleOpenShareModal = (postId) => setActiveSharePostId(postId);
  const handleOpenCommentModal = (postId) => setActiveCommentPostId(postId);

  const closeShareModal = () => setActiveSharePostId(null);
  const closeCommentModal = () => setActiveCommentPostId(null);

  const handleCommentAdded = (postId) => {
    // Query will auto-update via cache invalidation
    toast.success("Comment added!");
  };

  const handleCreatePost = (newPost) => {
    // Query will auto-update via cache invalidation from usePosts mutation
  };
  // ..................................................................................

  // Scroll to a specific post if URL hash is present (e.g., #post-123)
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || !hash.startsWith("#post-")) return;
    const t = setTimeout(() => {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 200);
    return () => clearTimeout(t);
  }, [posts.length]);

  return (
    <div className=" bg-[#F3F4F6] ">
      <section>
        <Navbar></Navbar>
      </section>
      {/* Mai part */}

      <section className="sm:grid grid-cols-12 gap-5 lg:gap-10 mt-6 container mx-auto">
        <section className="col-span-4">
          <GlobalCreoleSocietyCard
            society={society}
            postsCount={posts.length}
          />
        </section>

        <section className="col-span-8">
          <GroupSection society={society} isCreator={isCreator} />

          <div className="mt-5">
            {/* Create Post Section */}
            {currentUser && (
              <CreatePostSection
                currentUser={currentUser}
                onCreatePost={handleCreatePost}
                societyId={societyId}
              />
            )}

            {/* Posts Section */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-lg shadow">
                <p className="text-gray-500">No posts in this society yet</p>
              </div>
            ) : (
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
            )}
          </div>
        </section>
      </section>

      {/* Share & Comment Modals */}
      <ShareModal
        isOpen={!!activeSharePostId}
        onClose={closeShareModal}
        postId={activeSharePostId}
      />
      <CommentsModal
        isOpen={!!activeCommentPostId}
        onClose={closeCommentModal}
        postId={activeCommentPostId}
        onCommentAdded={handleCommentAdded}
      />
    </div>
  );
};

export default MySociety;
