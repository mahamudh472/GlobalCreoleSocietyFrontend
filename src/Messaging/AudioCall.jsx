"use client"

import { useState, useEffect, useRef } from "react"
import { FaMicrophone, FaMicrophoneSlash, FaVideo } from "react-icons/fa"
import { useNavigate } from "react-router-dom"
import Navbar from "../Components/Navbar"
import { useCall } from "../context/CallContext"
import { DEFAULT_AVATAR } from "../utils/defaultAvatar"

function AudioCall() {
    const navigate = useNavigate()
    const { activeCall, callStatus, localStream, remoteStream, endCall, toggleMicrophone } = useCall()
    const [isMuted, setIsMuted] = useState(false)
    const [callDuration, setCallDuration] = useState(0)
    const localAudioRef = useRef(null)
    const remoteAudioRef = useRef(null)

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
            console.log('[AudioCall] No call activity, redirecting to chat');
            navigate('/chat');
        }
    }, [activeCall, callStatus, navigate]);

    // Setup audio streams
    useEffect(() => {
        if (localStream && localAudioRef.current) {
            localAudioRef.current.srcObject = localStream
            // Mute local audio to avoid echo
            localAudioRef.current.muted = true
        }
    }, [localStream])

    useEffect(() => {
        if (remoteStream && remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStream
        }
    }, [remoteStream])

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

    const handleSwitchToVideo = () => {
        console.log("Switching to video call - feature coming soon")
        // TODO: Implement video call upgrade
    }

    const handleEndCall = () => {
        endCall(true) // Pass true to indicate manual user action
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
    const userAvatar = otherUser?.profile_image || DEFAULT_AVATAR

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
        <div className="min-h-[calc(100vh-110px)]">
            <div>
                <Navbar />
            </div>

            {/* Hidden audio elements */}
            <audio ref={localAudioRef} autoPlay playsInline />
            <audio ref={remoteAudioRef} autoPlay playsInline />

            <div className="min-h-[calc(100vh-100px)] bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="w-full container mx-auto max-w-2xl">
                    {/* Main Call Area */}
                    <div className="bg-white rounded-2xl shadow-2xl p-8 sm:p-12 mb-6">
                        <div className="flex flex-col items-center">
                            {/* User Avatar */}
                            <div className="relative mb-6">
                                <div className="w-48 h-48 sm:w-64 sm:h-64 rounded-full overflow-hidden border-4 border-blue-500 shadow-xl">
                                    <img
                                        src={userAvatar}
                                        alt={userName}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                {/* Microphone Icon Overlay */}
                                <div className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 ${isMuted ? 'bg-red-500' : 'bg-white'} rounded-full p-3 shadow-lg`}>
                                    {isMuted ? (
                                        <FaMicrophoneSlash className="text-white text-xl" />
                                    ) : (
                                        <FaMicrophone className="text-blue-500 text-xl" />
                                    )}
                                </div>
                            </div>

                            {/* User Name */}
                            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4">{userName}</h2>

                            {/* Call Status */}
                            <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-full">
                                {callStatus === 'connected' && (
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                )}
                                <span className="text-sm font-medium text-gray-600">{getStatusText()}</span>
                            </div>

                            {/* Connection indicator */}
                            {callStatus === 'ringing' && (
                                <div className="mt-4 text-blue-500 animate-pulse">
                                    Ringing...
                                </div>
                            )}
                            {callStatus === 'connecting' && (
                                <div className="mt-4 text-blue-500">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Call Controls */}
                    <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6">
                        <div className="flex items-center justify-between">
                            {/* Left Controls */}
                            <div className="flex items-center space-x-3 sm:space-x-4">
                                {/* Mute/Unmute Button */}
                                <button
                                    onClick={handleToggleMute}
                                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"
                                        } shadow-lg`}
                                    title={isMuted ? "Unmute" : "Mute"}
                                >
                                    {isMuted ? (
                                        <FaMicrophoneSlash className="text-white text-lg sm:text-xl" />
                                    ) : (
                                        <FaMicrophone className="text-white text-lg sm:text-xl" />
                                    )}
                                </button>

                                {/* Switch to Video Button */}
                                <button
                                    onClick={handleSwitchToVideo}
                                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-300 hover:bg-gray-400 flex items-center justify-center transition-all shadow-lg"
                                    title="Switch to video (coming soon)"
                                    disabled
                                >
                                    <FaVideo className="text-gray-600 text-lg sm:text-xl" />
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

export default AudioCall
