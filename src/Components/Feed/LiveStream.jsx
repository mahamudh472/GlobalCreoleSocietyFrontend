"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useLocation, useNavigate } from "react-router-dom"
import { FaHeart, FaRegHeart } from "react-icons/fa"
import { Video, X, Users, Mic, MicOff, VideoOff, UserPlus, UserCheck, Clock } from "lucide-react"
import Navbar from "../Navbar"
import { livestreamAPI } from "../../services/livestreamService"
import { useCurrentUser } from "../../hooks/queries"
import { useSendFriendRequestMutation } from "../../hooks/mutations/useFriends"
import { apiMethods } from "../../utils/api"
import { ENDPOINTS } from "../../config/apiConfig"
import { toast } from "react-toastify"

function LiveStream() {
    const { id } = useParams()
    const location = useLocation()
    const navigate = useNavigate()
    const { data: user } = useCurrentUser()
    const sendFriendRequestMutation = useSendFriendRequestMutation()
    
    const [livestream, setLivestream] = useState(location.state?.livestream || null)
    const [isStreamer, setIsStreamer] = useState(location.state?.isStreamer || false)
    const [isIdentified, setIsIdentified] = useState(false) // True after we've determined streamer status
    const [friendStatus, setFriendStatus] = useState('none') // 'none', 'pending', 'friends', 'request_received'
    const [comments, setComments] = useState([])
    const [newComment, setNewComment] = useState("")
    const [isLiked, setIsLiked] = useState(false)
    const [viewerCount, setViewerCount] = useState(0)
    const [streamStatus, setStreamStatus] = useState(location.state?.livestream?.status || 'preparing')
    const [viewId, setViewId] = useState(null)
    const [isBroadcasting, setIsBroadcasting] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const [isVideoOff, setIsVideoOff] = useState(false)
    const [isPlayerReady, setIsPlayerReady] = useState(false)
    
    const commentsEndRef = useRef(null)
    const videoPlayerRef = useRef(null)
    const previewVideoRef = useRef(null)
    const wsRef = useRef(null)
    const ivsPlayerRef = useRef(null)
    const ivsBroadcastClientRef = useRef(null)
    const mediaStreamRef = useRef(null)

    const DEFAULT_PROFILE_IMAGE = user
        ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.profile_name || user.email || "User")}&size=150&background=3b82f6&color=fff`
        : "https://ui-avatars.com/api/?name=User&size=150&background=3b82f6&color=fff"

    // Load IVS player and broadcast SDK scripts
    useEffect(() => {
        // Load IVS Player
        const playerScript = document.createElement('script')
        playerScript.src = 'https://player.live-video.net/1.23.0/amazon-ivs-player.min.js'
        playerScript.async = true
        document.body.appendChild(playerScript)

        // Load IVS Web Broadcast SDK for browser streaming
        const broadcastScript = document.createElement('script')
        broadcastScript.src = 'https://web-broadcast.live-video.net/1.6.0/amazon-ivs-web-broadcast.js'
        broadcastScript.async = true
        document.body.appendChild(broadcastScript)

        return () => {
            if (document.body.contains(playerScript)) {
                document.body.removeChild(playerScript)
            }
            if (document.body.contains(broadcastScript)) {
                document.body.removeChild(broadcastScript)
            }
        }
    }, [])

    // Fetch livestream data - always fetch to get full details including playback_url
    useEffect(() => {
        const fetchLivestream = async () => {
            try {
                const streamId = id || livestream?.id
                if (!streamId) return
                
                const data = await livestreamAPI.getLivestream(streamId)
                setLivestream(data)
                const streamerStatus = user && data.user.id === user.id
                setIsStreamer(streamerStatus)
                setViewerCount(data.viewer_count || 0)
                setStreamStatus(data.status)
                // Mark as identified so WebSocket can connect with correct status
                setIsIdentified(true)
            } catch (error) {
                console.error('Error fetching livestream:', error)
                toast.error('Failed to load livestream')
            }
        }

        // Always fetch to get full data (playback_url may not be in list serializer)
        if (id || livestream?.id) {
            fetchLivestream()
        }
    }, [id, user])

    // Check friendship status with streamer
    useEffect(() => {
        const checkFriendshipStatus = async () => {
            if (!livestream?.user?.id || isStreamer || !user) return
            
            try {
                const response = await apiMethods.get(ENDPOINTS.FRIENDS.STATUS(livestream.user.id))
                const status = response.data.status
                
                if (status === 'friends') {
                    setFriendStatus('friends')
                } else if (status === 'request_sent') {
                    setFriendStatus('pending')
                } else if (status === 'request_received') {
                    setFriendStatus('request_received')
                } else {
                    setFriendStatus('none')
                }
            } catch (error) {
                console.error('Error checking friendship status:', error)
                setFriendStatus('none')
            }
        }
        
        checkFriendshipStatus()
    }, [livestream?.user?.id, isStreamer, user])

    // Handle send friend request
    const handleSendFriendRequest = () => {
        if (!livestream?.user?.id) return
        
        sendFriendRequestMutation.mutate(livestream.user.id, {
            onSuccess: () => {
                setFriendStatus('pending')
            }
        })
    }

    // Poll stream status when preparing
    useEffect(() => {
        if (streamStatus !== 'preparing' || !livestream?.id) return

        const pollStatus = async () => {
            try {
                const statusData = await livestreamAPI.checkStatus(livestream.id)
                if (statusData.aws_state === 'LIVE' && streamStatus !== 'live') {
                    setStreamStatus('live')
                    toast.success('Stream is now live!')
                }
            } catch (error) {
                console.error('Error checking stream status:', error)
            }
        }

        // Poll every 5 seconds
        const interval = setInterval(pollStatus, 5000)
        return () => clearInterval(interval)
    }, [streamStatus, livestream?.id])

    // Initialize IVS player
    useEffect(() => {
        // Only initialize player if stream is live and we have a playback URL
        if (!livestream?.playback_url || !videoPlayerRef.current || streamStatus !== 'live') {
            // Clean up existing player if status changed
            if (ivsPlayerRef.current && streamStatus !== 'live') {
                ivsPlayerRef.current.delete()
                ivsPlayerRef.current = null
                setIsPlayerReady(false)
            }
            return
        }

        let retryCount = 0
        const maxRetries = 10
        const retryDelay = 3000 // 3 seconds between retries

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
                    setIsPlayerReady(true)
                })

                player.addEventListener(window.IVSPlayer.PlayerState.ENDED, () => {
                    console.log('Stream ended')
                    setStreamStatus('ended')
                    setIsPlayerReady(false)
                })

                player.addEventListener(window.IVSPlayer.PlayerEventType.ERROR, (error) => {
                    // Retry on 404 errors (stream not ready yet) - suppress logs during retry
                    if (error.code === 404 && retryCount < maxRetries) {
                        retryCount++
                        // Only log on first retry, not every attempt
                        if (retryCount === 1) {
                            console.log('Stream not ready yet, will retry automatically...')
                        }
                        setTimeout(() => {
                            if (ivsPlayerRef.current) {
                                ivsPlayerRef.current.load(livestream.playback_url)
                                ivsPlayerRef.current.play()
                            }
                        }, retryDelay)
                    } else if (error.code === 404 && retryCount >= maxRetries) {
                        console.error('Failed to load stream after maximum retries')
                        toast.error('Unable to connect to stream. Please try refreshing.')
                    } else {
                        // Log non-404 errors
                        console.error('Player error:', error)
                        toast.error('Stream playback error')
                    }
                })

                // Load the stream
                player.load(livestream.playback_url)
                player.play()

                ivsPlayerRef.current = player
            }
        }

        // Wait for script to load, then add a small delay for stream to be ready
        const startPlayer = () => {
            // Add initial delay to give IVS time to generate HLS playlist
            setTimeout(() => {
                if (window.IVSPlayer) {
                    initPlayer()
                } else {
                    const checkPlayer = setInterval(() => {
                        if (window.IVSPlayer) {
                            initPlayer()
                            clearInterval(checkPlayer)
                        }
                    }, 100)
                }
            }, 2000) // 2 second initial delay
        }

        startPlayer()

        return () => {
            if (ivsPlayerRef.current) {
                ivsPlayerRef.current.delete()
                ivsPlayerRef.current = null
                setIsPlayerReady(false)
            }
        }
    }, [livestream?.playback_url, streamStatus])

    // Keep preview video connected to media stream when broadcasting
    useEffect(() => {
        if (isBroadcasting && mediaStreamRef.current && previewVideoRef.current) {
            previewVideoRef.current.srcObject = mediaStreamRef.current
        }
    }, [isBroadcasting, isPlayerReady])

    // WebSocket connection for real-time features
    // Only connect after we know if user is streamer or viewer (after fetch completes)
    useEffect(() => {
        // Wait until we've fetched livestream data and determined isStreamer
        if (!livestream?.id || !isIdentified) return

        const wsUrl = `${import.meta.env.VITE_WS_URL || import.meta.env.VITE_WEBSOCKET_URL || 'ws://127.0.0.1:8001'}/ws/livestream/${livestream.id}/`
        const token = localStorage.getItem('access_token')
        
        const ws = new WebSocket(`${wsUrl}?token=${token}`)

        ws.onopen = () => {
            console.log('WebSocket connected, isStreamer:', isStreamer)
            // Identify ourselves as streamer or viewer
            ws.send(JSON.stringify({
                type: 'identify',
                is_streamer: isStreamer
            }))
        }

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data)

            switch (data.type) {
                case 'comment':
                    // Prevent duplicate comments by checking if ID already exists
                    setComments(prev => {
                        const exists = prev.some(c => c.id === data.comment.id)
                        if (exists) return prev
                        return [...prev, data.comment]
                    })
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
    }, [livestream?.id, isIdentified]) // Only depend on livestream.id and isIdentified, NOT isStreamer

    // Note: Viewer count is now tracked via WebSocket connection/disconnection
    // No need for separate API call to track view

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
            // Stop broadcasting first
            await handleStopBroadcast()
            
            // Then update status on backend
            await livestreamAPI.endLivestream(livestream.id)
            setStreamStatus('ended')
            toast.success('Live stream ended')
            navigate('/feed')
        } catch (error) {
            console.error('Error ending stream:', error)
            toast.error('Failed to end stream')
        }
    }

    // Start broadcasting (for streamer) using IVS Web Broadcast SDK
    const handleStartBroadcast = async () => {
        if (!livestream?.stream_key || !livestream?.ingest_endpoint) {
            toast.error('Stream configuration not available. Please try creating a new stream.')
            return
        }

        try {
            // Check if IVS Broadcast SDK is loaded
            if (!window.IVSBroadcastClient) {
                toast.error('Broadcast SDK not loaded. Please refresh the page.')
                return
            }

            // Get user media (camera and microphone)
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                },
                audio: true
            })

            mediaStreamRef.current = stream

            // Show preview
            if (previewVideoRef.current) {
                previewVideoRef.current.srcObject = stream
            }

            // Create broadcast client
            const client = window.IVSBroadcastClient.create({
                streamConfig: window.IVSBroadcastClient.STANDARD_LANDSCAPE
            })

            // Add video and audio devices
            const videoTrack = stream.getVideoTracks()[0]
            const audioTrack = stream.getAudioTracks()[0]

            if (videoTrack) {
                client.addVideoInputDevice(stream, 'camera', { index: 0 })
            }

            if (audioTrack) {
                client.addAudioInputDevice(stream, 'microphone')
            }

            // Start streaming to IVS
            const ingestUrl = `rtmps://${livestream.ingest_endpoint}:443/app/`
            await client.startBroadcast(livestream.stream_key, ingestUrl)

            ivsBroadcastClientRef.current = client
            setIsBroadcasting(true)

            // Update status to live
            await livestreamAPI.startLivestream(livestream.id)
            setStreamStatus('live')
            
            toast.success('You are now live!')

        } catch (error) {
            console.error('Error starting broadcast:', error)
            
            // Cleanup on error
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(track => track.stop())
            }
            
            toast.error('Failed to start broadcast: ' + (error.message || 'Unknown error'))
        }
    }

    // Stop broadcasting
    const handleStopBroadcast = async () => {
        try {
            if (ivsBroadcastClientRef.current) {
                await ivsBroadcastClientRef.current.stopBroadcast()
                ivsBroadcastClientRef.current = null
            }

            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(track => track.stop())
                mediaStreamRef.current = null
            }

            setIsBroadcasting(false)
        } catch (error) {
            console.error('Error stopping broadcast:', error)
        }
    }

    // Toggle mute
    const toggleMute = () => {
        if (mediaStreamRef.current) {
            const audioTrack = mediaStreamRef.current.getAudioTracks()[0]
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled
                setIsMuted(!audioTrack.enabled)
            }
        }
    }

    // Toggle video
    const toggleVideo = () => {
        if (mediaStreamRef.current) {
            const videoTrack = mediaStreamRef.current.getVideoTracks()[0]
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled
                setIsVideoOff(!videoTrack.enabled)
            }
        }
    }

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            handleStopBroadcast()
        }
    }, [])

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
                    {/* Broadcaster's local preview - shown as main video until IVS playback is ready */}
                    {isStreamer && isBroadcasting && (
                        <video
                            ref={previewVideoRef}
                            className={`${isPlayerReady ? 'absolute bottom-24 right-4 w-48 h-36 rounded-lg border-2 border-white shadow-lg z-20' : 'w-full h-full'} object-cover`}
                            autoPlay
                            muted
                            playsInline
                        />
                    )}
                    
                    {/* Main video player (IVS playback) - hidden until ready for broadcaster */}
                    <video
                        ref={videoPlayerRef}
                        className={`w-full h-full object-cover ${isStreamer && isBroadcasting && !isPlayerReady ? 'hidden' : ''}`}
                        playsInline
                    />
                    
                    {/* Loading indicator for broadcaster while waiting for IVS playback */}
                    {isStreamer && isBroadcasting && !isPlayerReady && streamStatus === 'live' && (
                        <div className="absolute top-4 left-4 bg-black/60 text-white px-4 py-2 rounded-lg flex items-center space-x-2 z-10">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm">Connecting to stream playback...</span>
                        </div>
                    )}
                    
                    {/* Streamer viewing their own live stream but not broadcasting (e.g., after refresh) */}
                    {isStreamer && !isBroadcasting && streamStatus === 'live' && (
                        <div className="absolute top-4 left-4 bg-yellow-600/90 text-white px-4 py-3 rounded-lg z-10 max-w-sm">
                            <p className="text-sm font-medium mb-2">Your stream is live!</p>
                            <p className="text-xs text-yellow-100 mb-3">
                                You're viewing your stream. To resume broadcasting from this browser, click below.
                            </p>
                            <button
                                onClick={handleStartBroadcast}
                                className="bg-white text-yellow-700 px-4 py-1.5 rounded text-sm font-medium hover:bg-yellow-50"
                            >
                                Resume Broadcasting
                            </button>
                        </div>
                    )}
                    
                    {/* Overlay when not live */}
                    {streamStatus !== 'live' && (
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                            <div className="text-center text-white max-w-md px-6">
                                {streamStatus === 'preparing' && (
                                    <>
                                        <Video className="w-16 h-16 mx-auto mb-4" />
                                        <p className="text-xl font-bold mb-2">
                                            {isStreamer ? 'Ready to go live?' : 'Stream is being prepared...'}
                                        </p>
                                        {isStreamer ? (
                                            <div className="mt-4 space-y-4">
                                                <p className="text-sm text-gray-300">
                                                    Click the button below to start broadcasting from your browser.
                                                    Make sure to allow camera and microphone access.
                                                </p>
                                                <button
                                                    onClick={handleStartBroadcast}
                                                    className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 font-semibold flex items-center justify-center mx-auto"
                                                >
                                                    <Video className="w-5 h-5 mr-2" />
                                                    Start Broadcasting
                                                </button>
                                            </div>
                                        ) : (
                                            <p className="mt-4 text-gray-300">Waiting for the broadcaster to start streaming...</p>
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
                            <div className={`${streamStatus === 'live' ? 'bg-red-600' : 'bg-gray-600'} text-white px-3 py-1 rounded text-xs font-bold flex items-center space-x-1`}>
                                {streamStatus === 'live' && <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>}
                                <span>{streamStatus === 'live' ? 'LIVE' : streamStatus === 'preparing' ? 'PREPARING' : 'ENDED'}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-white text-sm">
                                <Users className="w-4 h-4" />
                                <span>{viewerCount}</span>
                            </div>
                        </div>
                        
                        {isStreamer && streamStatus === 'live' && (
                            <div className="flex items-center space-x-2">
                                {/* Mic toggle */}
                                <button
                                    onClick={toggleMute}
                                    className={`p-2 rounded ${isMuted ? 'bg-red-600' : 'bg-gray-600'} text-white hover:opacity-80`}
                                    title={isMuted ? 'Unmute' : 'Mute'}
                                >
                                    {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                </button>
                                {/* Video toggle */}
                                <button
                                    onClick={toggleVideo}
                                    className={`p-2 rounded ${isVideoOff ? 'bg-red-600' : 'bg-gray-600'} text-white hover:opacity-80`}
                                    title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
                                >
                                    {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                                </button>
                                {/* End stream */}
                                <button
                                    onClick={handleEndStream}
                                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                                >
                                    End Stream
                                </button>
                            </div>
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
                            friendStatus === 'friends' ? (
                                <div className="flex items-center space-x-2 px-4 py-1.5 rounded text-sm font-medium bg-green-600/20 text-green-400 border border-green-500/30">
                                    <UserCheck className="w-4 h-4" />
                                    <span>Friends</span>
                                </div>
                            ) : friendStatus === 'pending' ? (
                                <div className="flex items-center space-x-2 px-4 py-1.5 rounded text-sm font-medium bg-gray-600 text-gray-300">
                                    <Clock className="w-4 h-4" />
                                    <span>Request Sent</span>
                                </div>
                            ) : friendStatus === 'request_received' ? (
                                <div className="flex items-center space-x-2 px-4 py-1.5 rounded text-sm font-medium bg-yellow-600/20 text-yellow-400 border border-yellow-500/30">
                                    <Clock className="w-4 h-4" />
                                    <span>Respond to Request</span>
                                </div>
                            ) : (
                                <button
                                    onClick={handleSendFriendRequest}
                                    disabled={sendFriendRequestMutation.isPending}
                                    className="flex items-center space-x-2 px-4 py-1.5 rounded text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                    <UserPlus className="w-4 h-4" />
                                    <span>{sendFriendRequestMutation.isPending ? 'Sending...' : 'Add Friend'}</span>
                                </button>
                            )
                        )}
                    </div>

                    {/* Comments Section */}
                    <div className="flex-1 overflow-y-auto mb-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                        {comments.map((comment, index) => (
                            <div key={comment.id || index} className="flex space-x-2">
                                <img
                                    src={comment.user?.profile_image || DEFAULT_PROFILE_IMAGE}
                                    alt={comment.user?.profile_name || comment.user?.email}
                                    className="w-8 h-8 rounded-full flex-shrink-0 object-cover"
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline space-x-2">
                                        <span className="text-white text-sm font-medium">
                                            {comment.user?.profile_name || comment.user?.email?.split('@')[0] || 'User'}
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
