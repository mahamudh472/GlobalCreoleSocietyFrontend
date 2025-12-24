"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaDesktop, FaExpand } from "react-icons/fa"
import { useNavigate } from "react-router-dom"
import Navbar from "../Components/Navbar"
import { useCall } from "../context/CallContext"

function VideoCall() {
    const navigate = useNavigate()
    const { activeCall, callStatus, localStream, remoteStream, endCall, toggleMicrophone, toggleCamera } = useCall()
    const [isMuted, setIsMuted] = useState(false)
    const [isVideoOn, setIsVideoOn] = useState(true)
    const [isScreenSharing, setIsScreenSharing] = useState(false)
    const [callDuration, setCallDuration] = useState(0)
    const [localStreamReady, setLocalStreamReady] = useState(false)
    const [remoteStreamReady, setRemoteStreamReady] = useState(false)
    const localVideoRef = useRef(null)
    const remoteVideoRef = useRef(null)

    // Redirect if no active call
    useEffect(() => {
        // Only redirect if there's no call activity at all
        const hasCallActivity = activeCall || 
                                callStatus === 'initiating' || 
                                callStatus === 'ringing' || 
                                callStatus === 'connecting' ||
                                callStatus === 'accepting' ||
                                callStatus === 'incoming';
        
        if (!hasCallActivity) {
            console.log('[VideoCall] No call activity, redirecting to chat');
            navigate('/chat');
        }
    }, [activeCall, callStatus, navigate]);

    // Robust stream attachment function
    const attachStream = useCallback((videoElement, stream, streamType) => {
        if (!videoElement || !stream) {
            console.log(`[VideoCall] Cannot attach ${streamType} stream:`, { 
                hasElement: !!videoElement, 
                hasStream: !!stream 
            });
            return false;
        }

        try {
            // Check if stream has active tracks
            const tracks = stream.getTracks();
            console.log(`[VideoCall] Attaching ${streamType} stream with ${tracks.length} tracks:`, 
                tracks.map(t => `${t.kind}:${t.readyState}`));

            // Only attach if not already attached or stream changed
            if (videoElement.srcObject !== stream) {
                videoElement.srcObject = stream;
                console.log(`[VideoCall] ${streamType} stream attached to video element`);
            }

            // Ensure video plays
            videoElement.play().catch(err => {
                console.log(`[VideoCall] ${streamType} autoplay blocked:`, err.message);
                // Try playing with user interaction fallback
            });

            return true;
        } catch (error) {
            console.error(`[VideoCall] Error attaching ${streamType} stream:`, error);
            return false;
        }
    }, []);

    // Setup local video stream with retry
    useEffect(() => {
        if (localStream && localVideoRef.current) {
            const attached = attachStream(localVideoRef.current, localStream, 'local');
            setLocalStreamReady(attached);
            
            // Retry attachment after a short delay if initial attach had issues
            if (!attached) {
                const retryTimeout = setTimeout(() => {
                    if (localVideoRef.current && localStream) {
                        attachStream(localVideoRef.current, localStream, 'local (retry)');
                    }
                }, 500);
                return () => clearTimeout(retryTimeout);
            }
        }
    }, [localStream, attachStream]);

    // Setup remote video stream with retry
    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) {
            console.log('[VideoCall] Remote stream changed, tracks:', 
                remoteStream.getTracks().map(t => `${t.kind}:${t.readyState}`));
            
            const attached = attachStream(remoteVideoRef.current, remoteStream, 'remote');
            setRemoteStreamReady(attached);
            
            // Retry attachment after a short delay if initial attach had issues
            if (!attached) {
                const retryTimeout = setTimeout(() => {
                    if (remoteVideoRef.current && remoteStream) {
                        attachStream(remoteVideoRef.current, remoteStream, 'remote (retry)');
                    }
                }, 500);
                return () => clearTimeout(retryTimeout);
            }
        }
    }, [remoteStream, attachStream]);

    // Also try to attach when component mounts if streams exist
    useEffect(() => {
        const checkAndAttach = () => {
            if (localStream && localVideoRef.current && !localVideoRef.current.srcObject) {
                attachStream(localVideoRef.current, localStream, 'local (mount check)');
            }
            if (remoteStream && remoteVideoRef.current && !remoteVideoRef.current.srcObject) {
                attachStream(remoteVideoRef.current, remoteStream, 'remote (mount check)');
            }
        };
        
        // Check immediately and after a delay
        checkAndAttach();
        const timeout = setTimeout(checkAndAttach, 1000);
        
        return () => clearTimeout(timeout);
    }, [localStream, remoteStream, attachStream]);

    // Call duration timer (start when connected)
    useEffect(() => {
        let timer
        if (callStatus === 'connected') {
            timer = setInterval(() => {
                setCallDuration((prev) => prev + 1)
            }, 1000)
        }

        return () => {
            if (timer) clearInterval(timer)
        }
    }, [callStatus])

    // Format duration as MM:SS
    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
    }

    const handleToggleMute = () => {
        const newMutedState = toggleMicrophone()
        setIsMuted(!newMutedState)
    }

    const handleToggleVideo = () => {
        const newVideoState = toggleCamera()
        setIsVideoOn(newVideoState)
    }

    const handleToggleScreenShare = () => {
        setIsScreenSharing(!isScreenSharing)
        console.log("Screen sharing - feature coming soon")
        // TODO: Implement screen sharing
    }

    const handleFullscreen = () => {
        const element = document.documentElement
        if (!document.fullscreenElement) {
            element.requestFullscreen()
        } else {
            document.exitFullscreen()
        }
    }

    const handleEndCall = () => {
        endCall()
        navigate('/chat')
    }

    if (!activeCall) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-500">Loading call...</p>
                </div>
            </div>
        )
    }

    const otherUser = activeCall.is_caller ? activeCall.receiver : activeCall.caller
    const userName = otherUser?.profile_name || 'Unknown'

    const getStatusText = () => {
        switch (callStatus) {
            case 'ringing':
                return 'Calling...'
            case 'connecting':
                return 'Connecting...'
            case 'connected':
                return formatDuration(callDuration)
            default:
                return 'In call'
        }
    }

    return (
        <div>
            <div>
                <Navbar />
            </div>

            {/* Main part */}
            <div className="min-h-[calc(100vh-100px)] bg-gray-900 flex items-center justify-center p-4">
                <div className="w-full container mx-auto">
                    {/* Video Area */}
                    <div
                        className="relative bg-black rounded-2xl overflow-hidden shadow-2xl mb-6"
                        style={{ aspectRatio: "16/9", maxHeight: "calc(100vh - 250px)" }}
                    >
                        {/* Remote Video Feed (Main) */}
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="absolute inset-0 w-full h-full object-cover"
                        />

                        {/* Fallback when no remote stream */}
                        {!remoteStream && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-900 to-indigo-900">
                                <div className="text-center text-white">
                                    <div className="w-32 h-32 rounded-full bg-blue-600 flex items-center justify-center mx-auto mb-4">
                                        <span className="text-4xl font-bold">
                                            {userName.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <h3 className="text-2xl font-semibold mb-2">{userName}</h3>
                                    <p className="text-blue-200">{getStatusText()}</p>
                                </div>
                            </div>
                        )}

                        {/* Local Video (Picture-in-Picture) */}
                        <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden shadow-xl border-2 border-gray-600">
                            {isVideoOn && localStream ? (
                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                                    <FaVideoSlash className="text-gray-400 text-3xl" />
                                </div>
                            )}
                            <div className="absolute bottom-2 left-2 text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                                You
                            </div>
                        </div>

                        {/* Top Bar - Call Info */}
                        <div className="absolute top-4 left-4 bg-black bg-opacity-50 backdrop-blur-sm px-4 py-2 rounded-full">
                            <div className="flex items-center space-x-2">
                                {callStatus === 'connected' && (
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                )}
                                <span className="text-white text-sm font-medium">{getStatusText()}</span>
                            </div>
                        </div>

                        {/* Bottom Bar - User Name */}
                        <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 backdrop-blur-sm px-4 py-2 rounded-full">
                            <span className="text-white text-sm font-medium">{userName}</span>
                        </div>

                        {/* Fullscreen Button */}
                        <button
                            onClick={handleFullscreen}
                            className="absolute bottom-4 right-4 w-10 h-10 bg-black bg-opacity-50 backdrop-blur-sm hover:bg-opacity-70 rounded-full flex items-center justify-center transition-all"
                            title="Toggle fullscreen"
                        >
                            <FaExpand className="text-white text-sm" />
                        </button>
                    </div>

                    {/* Call Controls */}
                    <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6">
                        <div className="flex items-center justify-between">
                            {/* Left Controls */}
                            <div className="flex items-center space-x-3 sm:space-x-4">
                                {/* Mute/Unmute Button */}
                                <button
                                    onClick={handleToggleMute}
                                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all ${
                                        isMuted ? "bg-red-500 hover:bg-red-600" : "bg-gray-700 hover:bg-gray-800"
                                    } shadow-lg`}
                                    title={isMuted ? "Unmute" : "Mute"}
                                >
                                    {isMuted ? (
                                        <FaMicrophoneSlash className="text-white text-lg sm:text-xl" />
                                    ) : (
                                        <FaMicrophone className="text-white text-lg sm:text-xl" />
                                    )}
                                </button>

                                {/* Video On/Off Button */}
                                <button
                                    onClick={handleToggleVideo}
                                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all ${
                                        isVideoOn ? "bg-gray-700 hover:bg-gray-800" : "bg-red-500 hover:bg-red-600"
                                    } shadow-lg`}
                                    title={isVideoOn ? "Turn off video" : "Turn on video"}
                                >
                                    {isVideoOn ? (
                                        <FaVideo className="text-white text-lg sm:text-xl" />
                                    ) : (
                                        <FaVideoSlash className="text-white text-lg sm:text-xl" />
                                    )}
                                </button>

                                {/* Screen Share Button */}
                                <button
                                    onClick={handleToggleScreenShare}
                                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all ${
                                        isScreenSharing ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-300 hover:bg-gray-400"
                                    } shadow-lg`}
                                    title={isScreenSharing ? "Stop sharing" : "Share screen (coming soon)"}
                                    disabled
                                >
                                    <FaDesktop className={`text-lg sm:text-xl ${isScreenSharing ? "text-white" : "text-gray-600"}`} />
                                </button>
                            </div>

                            {/* End Call Button */}
                            <button
                                onClick={handleEndCall}
                                className="px-6 sm:px-8 py-3 sm:py-3.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-full transition-all shadow-lg transform hover:scale-105"
                            >
                                End Call
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default VideoCall
