import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Navbar from '../Navbar'
import GlobalCreoleSocietyCard from './GlobalCreoleSocietyCard'
import GroupSection from './GroupSection'
import GroupInfo from './GroupInfo'
import PostCard from '../Feed/PostCard'
import ShareModal from '../Feed/ShareModal'
import CommentsModal from '../Feed/CommentsModal'
import CreatePostSection from '../Feed/CreatePostSection'
import { apiMethods } from '../../utils/api'
import { ENDPOINTS } from '../../config/apiConfig'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext'

const MySociety = () => {
    const { id: societyId } = useParams()
    const { user: currentUser } = useAuth()
    const [posts, setPosts] = useState([])
    const [society, setSociety] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)

    useEffect(() => {
        fetchSocietyData()
        fetchSocietyPosts()
    }, [societyId])

    const fetchSocietyData = async () => {
        try {
            const response = await apiMethods.get(ENDPOINTS.SOCIETIES.DETAIL(societyId))
            setSociety(response.data)
        } catch (error) {
            console.error('Error fetching society data:', error)
            toast.error('Failed to load society details')
        }
    }

    const fetchSocietyPosts = async () => {
        try {
            setLoading(true)
            const response = await apiMethods.get(ENDPOINTS.SOCIETIES.POSTS(societyId))
            const postsData = response.data.results || response.data
            setPosts(Array.isArray(postsData) ? postsData : [])
        } catch (error) {
            console.error('Error fetching society posts:', error)
            toast.error('Failed to load society posts')
        } finally {
            setLoading(false)
        }
    }



    // Modals: comment & share ...................................................
    const [activeSharePostId, setActiveSharePostId] = useState(null)
    const [activeCommentPostId, setActiveCommentPostId] = useState(null)

    const handleOpenShareModal = (postId) => setActiveSharePostId(postId)
    const handleOpenCommentModal = (postId) => setActiveCommentPostId(postId)

    const closeShareModal = () => setActiveSharePostId(null)
    const closeCommentModal = () => setActiveCommentPostId(null)

    const handleCommentAdded = (postId) => {
        // Update the comment count for the specific post
        setPosts((prev) => 
            prev.map(post => 
                post.id === postId 
                    ? { ...post, comment_count: (post.comment_count || post.comments || 0) + 1 }
                    : post
            )
        );
    };

    const handleCreatePost = (newPost) => {
        // Add the new post to the beginning of the posts array
        setPosts((prev) => [newPost, ...prev])
        toast.success('Post created successfully!')
    }
// ..................................................................................



    
    return (
        <div className=' bg-[#F3F4F6] '>
            <section>
                <Navbar></Navbar>
            </section>
            {/* Mai part */}

            <section className='sm:grid grid-cols-12 gap-5 lg:gap-10 mt-6 container mx-auto'>
                <section className='col-span-4'>
                    <div>
                        <GlobalCreoleSocietyCard society={society} postsCount={posts.length} />
                    </div>
                </section>


                <section className='col-span-8'>
                    <GroupSection society={society} />

                    <div className='mt-5'>
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
    )
}

export default MySociety