import React, { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import Navbar from '../Components/Navbar'
import ProfileHeader from './ProfileHeader'
import AboutMe from './AboutMe'
import FriendsGrid from './FriendsGrid'
import Description from './Description'
import PostCard from '../Components/Feed/PostCard'
import EditAboutModal from './EditAboutModal'
import ShareModal from '../Components/Feed/ShareModal'
import CommentsModal from '../Components/Feed/CommentsModal'
import { apiMethods } from '../utils/api'
import { ENDPOINTS } from '../config/apiConfig'
import { useCurrentUser } from '../hooks/queries/useUser'
import { useFriends, useUserFriendsQuery } from '../hooks/queries/useFriends'

const Profile = () => {
    const { userId } = useParams() // Get user ID from URL if viewing another user's profile
    const { data: currentUser, refetch: refetchCurrentUser } = useCurrentUser()
    
    // Determine which friends list to fetch
    const shouldFetchUserFriends = userId && userId !== currentUser?.id
    const { data: ownFriends = [] } = useFriends({ enabled: !shouldFetchUserFriends })
    const { data: otherUserFriends = [] } = useUserFriendsQuery(userId, { enabled: shouldFetchUserFriends })
    
    const friendsCount = shouldFetchUserFriends ? otherUserFriends.length : ownFriends.length
    
    const [profile, setProfile] = useState(null)
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [nextPage, setNextPage] = useState(1)
    const [error, setError] = useState(null)

    const [isModalOpen, setIsModalOpen] = useState(false)
    const editAboutmodal = useRef(null)

    // Modals: comment & share
    const [activeSharePostId, setActiveSharePostId] = useState(null)
    const [activeCommentPostId, setActiveCommentPostId] = useState(null)
    
    const observerRef = useRef(null)
    const loadMoreRef = useRef(null)

    const handleOpenShareModal = (postId) => setActiveSharePostId(postId)
    const handleOpenCommentModal = (postId) => setActiveCommentPostId(postId)

    const closeShareModal = () => setActiveSharePostId(null)
    const closeCommentModal = () => setActiveCommentPostId(null)

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

    // Fetch profile data
    useEffect(() => {
        fetchProfile()
        fetchProfilePosts(1)
    }, [userId])

    // Infinite scroll observer
    useEffect(() => {
        if (loading || loadingMore || !hasMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loadingMore) {
                    fetchProfilePosts(nextPage);
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
    }, [loading, loadingMore, hasMore, nextPage])

    const fetchProfile = async () => {
        try {
            setLoading(true)
            
            // Check if viewing other user's profile or own profile
            if (userId && userId !== currentUser?.id) {
                // Fetch other user's profile
                const response = await apiMethods.get(ENDPOINTS.AUTH.OTHER_USER_PROFILE(userId))
                setProfile(response.data)
                setError(null)
            } else {
                // Fetch current user's own profile
                const response = await apiMethods.get(ENDPOINTS.AUTH.PROFILE)
                setProfile(response.data)
                setError(null)
            }
        } catch (err) {
            console.error("Failed to fetch profile:", err)
            if (err.response?.status === 403) {
                setError("This profile is private")
            } else if (err.response?.status === 404) {
                setError("User not found")
            } else {
                setError("Failed to load profile")
            }
        } finally {
            setLoading(false)
        }
    }

    const fetchProfilePosts = async (page = 1) => {
        try {
            if (page === 1) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }

            // Determine which user's posts to fetch
            const targetUserId = userId || currentUser?.id
            
            // Fetch user's posts with pagination, user filter, and exclude society posts
            const response = await apiMethods.get(
                `${ENDPOINTS.POSTS.LIST}?page=${page}&user_id=${targetUserId}&exclude_society=true`
            )
            
            // Handle paginated response
            const userPosts = response.data.results || response.data;
            const next = response.data.next;
            
            if (page === 1) {
                setPosts(userPosts);
            } else {
                setPosts((prev) => [...prev, ...userPosts]);
            }
            
            setHasMore(!!next);
            if (next) {
                setNextPage(page + 1);
            }
        } catch (err) {
            console.error("Failed to fetch profile posts:", err)
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }

    const updateProfile = async (updatedData) => {
        try {
            const response = await apiMethods.patch(ENDPOINTS.AUTH.PROFILE, updatedData)
            setProfile(response.data)
            return { success: true }
        } catch (err) {
            console.error("Failed to update profile:", err)
            return { success: false, error: err.response?.data || "Update failed" }
        }
    }
    
    
    const handleEditAboutPopup = () => {
        setIsModalOpen(prev => !prev)
    }

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (editAboutmodal.current && !editAboutmodal.current.contains(event.target)) {
                setIsModalOpen(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    const isOwnProfile = !userId || userId === currentUser?.id

    if (loading && !profile) {
        return (
            <div className="relative bg-[#F0F0F0] min-h-screen pb-20 my-7">
                <nav>
                    <Navbar />
                </nav>
                <div className="flex items-center justify-center h-96">
                    <div className="text-xl text-gray-600">Loading profile...</div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="relative bg-[#F0F0F0] min-h-screen pb-20 my-7">
                <nav>
                    <Navbar />
                </nav>
                <div className="flex items-center justify-center h-96">
                    <div className="text-xl text-red-600">{error}</div>
                </div>
            </div>
        )
    }

   

    return (
        <div className="relative bg-[#F0F0F0] pb-20 my-7">

            {/* Edit Profile Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                    <div ref={editAboutmodal} className="bg-white rounded-lg p-6 shadow-xl">
                        <EditAboutModal />
                        <div className="flex justify-end mt-4">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Navbar */}
            <nav>
                <Navbar />
            </nav>

            {/* Profile Body */}
            <div className="2xl:px-44 xl:px-36 lg:px-28 md:px-20 sm:px-14 px-8 mt-5">
                <section className="pb-5 rounded-lg transform transition-transform duration-700 ease-out hover:scale-101">
                    <ProfileHeader 
                        data={profile} 
                        posts={posts}
                        friendsCount={friendsCount}
                        isOwnProfile={isOwnProfile}
                        onProfileUpdate={(updatedProfile) => {
                            setProfile(updatedProfile);
                            // Update current user cache if viewing own profile
                            if (isOwnProfile) {
                                refetchCurrentUser();
                            }
                        }}
                    />
                </section>

                <section className="md:grid grid-cols-12 gap-5">
                    <section className="col-span-4">
                        <div className="bg-white rounded-lg mb-5 p-8 shadow-xl transform transition-transform duration-700 ease-out hover:scale-103">
                            <AboutMe 
                                profile={profile} 
                                handleEditAboutPopup={handleEditAboutPopup} 
                                isOwnProfile={isOwnProfile}
                            />
                        </div>
                        <div className="bg-white rounded-lg mb-5 p-8 shadow-xl transform transition-transform duration-700 ease-out hover:scale-103">
                            <FriendsGrid userId={profile?.id} />
                        </div>
                    </section>

                    <section className="col-span-8">
                        <div className="bg-white rounded-lg mb-5 p-8 shadow-xl transform transition-transform duration-700 ease-out hover:scale-102">
                            <Description 
                                profile={profile} 
                                onUpdate={updateProfile}
                                isOwnProfile={isOwnProfile}
                            />
                        </div>

                        {/* Posts Section */}
                        {loading && posts.length === 0 ? (
                            <div className="bg-white rounded-lg p-8 text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                            </div>
                        ) : posts.length === 0 ? (
                            <div className="bg-white rounded-lg p-8 text-center text-gray-500">
                                No posts yet
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
                    </section>
                </section>
            </div>

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
    )
}

export default Profile
