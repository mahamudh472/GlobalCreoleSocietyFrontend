"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useLocation, useNavigate } from "react-router-dom"
import { FaHeart, FaRegHeart } from "react-icons/fa"
import { Video, X, Users } from "lucide-react"
import Navbar from "../Navbar"
import { livestreamAPI } from "../../services/livestreamService"
import { useCurrentUser } from "../../hooks/queries"
import { toast } from "react-toastify"

function LiveStream() {
    const { id } = useParams()
    const location = useLocation()
    const navigate = useNavigate()
    const { data: user } = useCurrentUser()
    
    const [livestream, setLivestream] = useState(location.state?.livestream || null)
    const [isStreamer, setIsStreamer] = useState(location.state?.isStreamer || false)
    const [comments, setComments] = useState([])
    const [newComment, setNewComment] = useState("")
    const [isLiked, setIsLiked] = useState(false)
    const [isFollowing, setIsFollowing] = useState(false)
    const [viewerCount, setViewerCount] = useState(0)
    const [streamStatus, setStreamStatus] = useState('preparing')
    const [viewId, setViewId] = useState(null)
    
    const commentsEndRef = useRef(null)
    const videoPlayerRef = useRef(null)
    const wsRef = useRef(null)
    const ivsPlayerRef = useRef(null)

    const DEFAULT_PROFILE_IMAGE = user
        ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.profile_name || user.email || "User")}&size=150&background=3b82f6&color=fff`
        : "https://ui-avatars.com/api/?name=User&size=150&background=3b82f6&color=fff"

    // Load IVS player script
    useEffect(() => {
        const script = document.createElement('script')
        script.src = 'https://player.live-video.net/1.23.0/amazon-ivs-player.min.js'
        script.async = true
        document.body.appendChild(script)

        return () => {
            document.body.removeChild(script)
        }
    }, [])

    // Fetch livestream data
    useEffect(() => {
        const fetchLivestream = async () => {
            try {
                const data = await livestreamAPI.getLivestream(id || livestream?.id)
                setLivestream(data)
                setIsStreamer(data.user.id === user?.id)
                setViewerCount(data.viewer_count || 0)
                setStreamStatus(data.status)
            } catch (error) {
                console.error('Error fetching livestream:', error)
                toast.error('Failed to load livestream')
            }
        }

        if (id && !livestream) {
            fetchLivestream()
        }
    }, [id, livestream, user])

    // Initialize IVS player
    useEffect(() => {
        if (!livestream?.playback_url || !videoPlayerRef.current) return

        const initPlayer = () => {
            if (window.IVSPlayer && !ivsPlayerRef.current) {
                const { isPlayerSupported } = window.IVSPlayer

                if (!isPlayerSupported) {
                    console.error('IVS Player is not supported in this browser')
                    toast.error('Video player not supported in this browser')
                    return
                }

                const player = window.IVSPlayer.create()
                player.attachHTMLVideoElement(videoPlayerRef.current)

                // Set up event listeners
                player.addEventListener(window.IVSPlayer.PlayerState.PLAYING, () => {
                    console.log('Player is playing')
                    setStreamStatus('live')
                })

                player.addEventListener(window.IVSPlayer.PlayerState.ENDED, () => {
                    console.log('Stream ended')
                    setStreamStatus('ended')
                })

                player.addEventListener(window.IVSPlayer.PlayerEventType.ERROR, (error) => {
                    console.error('Player error:', error)
                })

                // Load the stream
                player.load(livestream.playback_url)
                player.play()

                ivsPlayerRef.current = player
            }
        }

        // Wait for script to load
        if (window.IVSPlayer) {
            initPlayer()
        } else {
            const checkPlayer = setInterval(() => {
                if (window.IVSPlayer) {
                    initPlayer()
                    clearInterval(checkPlayer)
                }
            }, 100)

            return () => clearInterval(checkPlayer)
        }

        return () => {
            if (ivsPlayerRef.current) {
                ivsPlayerRef.current.delete()
                ivsPlayerRef.current = null
            }
        }
    }, [livestream?.playback_url])

    // WebSocket connection for real-time features
    useEffect(() => {
        if (!livestream?.id) return

        const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8000'}/ws/livestream/${livestream.id}/`
        const token = localStorage.getItem('access_token')
        
        const ws = new WebSocket(`${wsUrl}?token=${token}`)

        ws.onopen = () => {
            console.log('WebSocket connected')
        }

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data)

            switch (data.type) {
                case 'comment':
                    setComments(prev => [...prev, data.comment])
                    break
                case 'viewer_count':
                    setViewerCount(data.count)
                    break
                case 'stream_status':
                    setStreamStatus(data.status)
                    break
                case 'like':
                    // Handle like animation or counter
                    break
                default:
                    break
            }
        }

        ws.onerror = (error) => {
            console.error('WebSocket error:', error)
        }

        ws.onclose = () => {
            console.log('WebSocket disconnected')
        }

        wsRef.current = ws

        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close()
            }
        }
    }, [livestream?.id])

    // Track view
    useEffect(() => {
        if (!livestream?.id || isStreamer) return

        const trackView = async () => {
            try {
                const view = await livestreamAPI.joinLivestream(livestream.id)
                setViewId(view.id)
            } catch (error) {
                console.error('Error tracking view:', error)
            }
        }

        trackView()

        return () => {
            if (viewId) {
                livestreamAPI.leaveLivestream(viewId).catch(console.error)
            }
        }
    }, [livestream?.id, isStreamer])

    // Auto-scroll comments
    const scrollToBottom = () => {
        commentsEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [comments])

    // Handle comment submission
    const handleSubmitComment = (e) => {
        e.preventDefault()
        if (!newComment.trim()) return

        // Send via WebSocket
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'comment',
                comment: newComment.trim()
            }))
            setNewComment("")
        }
    }

    // Handle like
    const handleLike = () => {
        setIsLiked(!isLiked)
        
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'like'
            }))
        }
    }

    // End stream (for streamer)
    const handleEndStream = async () => {
        if (!window.confirm('Are you sure you want to end this live stream?')) return

        try {
            await livestreamAPI.endLivestream(livestream.id)
            toast.success('Live stream ended')
            navigate('/feed')
        } catch (error) {
            console.error('Error ending stream:', error)
            toast.error('Failed to end stream')
        }
    }

    // Start broadcasting (for streamer)
    const handleStartBroadcast = async () => {
        try {
            await livestreamAPI.startLivestream(livestream.id)
            setStreamStatus('live')
            toast.success('Live stream started! You can now broadcast using your streaming software.')
            
            // Show streaming instructions
            toast.info(
                <div>
                    <p className="font-bold">Streaming Instructions:</p>
                    <p className="text-xs mt-1">Server: {livestream.ingest_endpoint}</p>
                    <p className="text-xs">Stream Key: {livestream.stream_key?.slice(0, 10)}...</p>
                </div>,
                { autoClose: false }
            )
        } catch (error) {
            console.error('Error starting stream:', error)
            toast.error('Failed to start stream')
        }
    }

    if (!livestream) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white">Loading...</div>
            </div>
        )
    }

    return (
        <div>
            <div>
                <Navbar />
            </div>

            {/* Main Part */}
            <div className="relative w-full min-h-[calc(100vh-97px)] bg-gray-900 overflow-hidden">
                {/* Video Player */}
                <div className="absolute inset-0">
                    <video
                        ref={videoPlayerRef}
                        className="w-full h-full object-cover"
                        playsInline
                    />
                    
                    {/* Overlay when not live */}
                    {streamStatus !== 'live' && (
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                            <div className="text-center text-white">
                                {streamStatus === 'preparing' && (
                                    <>
                                        <Video className="w-16 h-16 mx-auto mb-4" />
                                        <p className="text-xl font-bold mb-2">Stream is being prepared...</p>
                                        {isStreamer && (
                                            <button
                                                onClick={handleStartBroadcast}
                                                className="mt-4 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
                                            >
                                                Start Broadcasting
                                            </button>
                                        )}
                                    </>
                                )}
                                {streamStatus === 'ended' && (
                                    <>
                                        <p className="text-xl font-bold">This stream has ended</p>
                                        <button
                                            onClick={() => navigate('/feed')}
                                            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                                        >
                                            Back to Feed
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Left Sidebar Overlay */}
                <div className="absolute left-0 top-0 bottom-0 w-full sm:w-96 bg-gradient-to-r from-black/80 via-black/60 to-transparent p-4 sm:p-6 flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-2">
                            <div className="bg-red-600 text-white px-3 py-1 rounded text-xs font-bold flex items-center space-x-1">
                                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                                <span>{streamStatus === 'live' ? 'LIVE' : 'PREPARING'}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-white text-sm">
                                <Users className="w-4 h-4" />
                                <span>{viewerCount}</span>
                            </div>
                        </div>
                        
                        {isStreamer && (
                            <button
                                onClick={handleEndStream}
                                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                            >
                                End Stream
                            </button>
                        )}
                    </div>

                    {/* Stream Info */}
                    <div className="mb-6">
                        <h1 className="text-white text-xl sm:text-2xl font-bold mb-3 leading-tight">
                            {livestream.title}
                        </h1>
                        {livestream.description && (
                            <p className="text-gray-300 text-sm leading-relaxed">
                                {livestream.description}
                            </p>
                        )}
                    </div>

                    {/* Host Info */}
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/20">
                        <div className="flex items-center space-x-3">
                            <img
                                src={livestream.user?.profile_image || DEFAULT_PROFILE_IMAGE}
                                alt={livestream.user?.profile_name || livestream.user?.username}
                                className="w-10 h-10 rounded-full border-2 border-yellow-500 object-cover"
                            />
                            <span className="text-white text-sm font-medium">
                                {livestream.user?.profile_name || livestream.user?.username}
                            </span>
                        </div>
                        {!isStreamer && (
                            <button
                                onClick={() => setIsFollowing(!isFollowing)}
                                className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                                    isFollowing 
                                        ? "bg-gray-600 text-white" 
                                        : "bg-white text-gray-900 hover:bg-gray-100"
                                }`}
                            >
                                {isFollowing ? "Following" : "Follow"}
                            </button>
                        )}
                    </div>

                    {/* Comments Section */}
                    <div className="flex-1 overflow-y-auto mb-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                        {comments.map((comment, index) => (
                            <div key={comment.id || index} className="flex space-x-2">
                                <img
                                    src={comment.user?.profile_image || DEFAULT_PROFILE_IMAGE}
                                    alt={comment.user?.username}
                                    className="w-8 h-8 rounded-full flex-shrink-0 object-cover"
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline space-x-2">
                                        <span className="text-white text-sm font-medium">
                                            {comment.user?.profile_name || comment.user?.username}
                                        </span>
                                        <span className="text-gray-400 text-xs">
                                            {new Date(comment.created_at).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <p className="text-gray-300 text-sm mt-0.5">{comment.comment}</p>
                                </div>
                            </div>
                        ))}
                        <div ref={commentsEndRef} />
                    </div>

                    {/* Comment Input */}
                    <form onSubmit={handleSubmitComment} className="flex items-center space-x-2">
                        <img
                            src={user?.profile_image || DEFAULT_PROFILE_IMAGE}
                            alt="You"
                            className="w-8 h-8 rounded-full flex-shrink-0 object-cover"
                        />
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Write a comment..."
                                className="w-full bg-white/90 text-gray-900 placeholder-gray-500 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                maxLength={500}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleLike}
                            className="flex-shrink-0 text-white hover:scale-110 transition-transform"
                        >
                            {isLiked ? (
                                <FaHeart className="text-red-500 text-xl" />
                            ) : (
                                <FaRegHeart className="text-xl" />
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default LiveStream
