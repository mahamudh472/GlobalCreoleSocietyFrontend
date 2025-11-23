"use client"

import { useState, useRef, useEffect } from "react"
import chatIcon from "../../assets/globalchat.png"
import ChatHeader from "./ChatHeader"
import ChatMessages from "./ChatMessages"
import ChatInput from "./ChatInput"
import { WS_ENDPOINTS } from "../../config/apiConfig"
import { useCurrentUser } from "../../hooks/queries/useUser"
import { useGlobalMessages } from "../../hooks/queries/useChat"
import { useSendGlobalMessageMutation } from "../../hooks/mutations/useChat"

const GlobalChatPopUp = () => {
    const { data: user } = useCurrentUser()
    const [isOpen, setIsOpen] = useState(false)
    const [isActive, setIsActive] = useState(false)
    const [message, setMessage] = useState("")
    
    // Define formatTimestamp function before using it
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return ""
        
        const date = new Date(timestamp)
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }
    
    // Use TanStack Query for messages
    const {
        data: messagesData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        refetch: refetchMessages,
    } = useGlobalMessages({ enabled: isActive })
    
    // Flatten all pages into single messages array and transform to component format
    // Backend returns newest first within each page, so reverse each page to show oldest first
    // Then flatten all reversed pages to maintain chronological order
    const messages = messagesData?.pages.flatMap(page => 
        page.messages.map(msg => ({
            id: msg.id,
            user: msg.senderName,
            message: msg.text,
            time: formatTimestamp(msg.timestamp),
            avatar: msg.senderAvatar,
            isOwn: msg.isOwn,
            file_url: msg.file_url,
            file_type: msg.file_type,
        })).reverse()
    ) || []
    
    const sendMessageMutation = useSendGlobalMessageMutation()
    
    const [loadingMore, setLoadingMore] = useState(false)
    const messagesEndRef = useRef(null)
    const messagesContainerRef = useRef(null)
    const popupRef = useRef(null)
    const wsRef = useRef(null)
    const isLoadingRef = useRef(false)
    const previousScrollHeightRef = useRef(0)
    const hasScrolledToBottomRef = useRef(false) // Track if we've scrolled to bottom initially

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    // Scroll to bottom on initial load only
    useEffect(() => {
        if (messages.length > 0 && !hasScrolledToBottomRef.current && !isLoadingRef.current) {
            // Use setTimeout to ensure DOM is fully rendered
            setTimeout(() => {
                if (messagesEndRef.current) {
                    messagesEndRef.current.scrollIntoView({ behavior: "instant" })
                    hasScrolledToBottomRef.current = true
                    console.log("📍 Global chat initial scroll to bottom completed")
                }
            }, 100)
        }
    }, [messages.length])

    // Reset scroll flag when chat is opened/closed
    useEffect(() => {
        if (isActive) {
            hasScrolledToBottomRef.current = false
        }
    }, [isActive])

    // Handle scroll for loading older messages
    const handleScroll = () => {
        const container = messagesContainerRef.current
        if (!container) return

        const { scrollTop, scrollHeight, clientHeight } = container
        
        console.log(`📊 Global chat scroll - scrollTop: ${scrollTop}, scrollHeight: ${scrollHeight}, clientHeight: ${clientHeight}`)

        // Prevent multiple simultaneous loads
        if (isLoadingRef.current || isFetchingNextPage) {
            console.log("⏸️ Already loading, skipping...")
            return
        }

        // Check if scrolled near top (within 150px) and has more messages
        if (scrollTop < 150 && hasNextPage) {
            console.log("📜 Near top - loading more global messages")
            isLoadingRef.current = true
            previousScrollHeightRef.current = scrollHeight
            fetchNextPage() // Use TanStack Query's fetchNextPage
        }
    }

    // Restore scroll position after loading older messages
    useEffect(() => {
        if (loadingMore === false && isLoadingRef.current) {
            const container = messagesContainerRef.current
            if (container && previousScrollHeightRef.current) {
                // Use requestAnimationFrame to ensure DOM is updated
                requestAnimationFrame(() => {
                    const newScrollHeight = container.scrollHeight
                    const scrollDifference = newScrollHeight - previousScrollHeightRef.current
                    container.scrollTop = scrollDifference + 50 // Add small offset to prevent immediate retrigger
                    console.log(`📍 Restored global chat scroll position: ${scrollDifference}px (new scrollTop: ${container.scrollTop})`)
                    
                    // Reset the loading flag after a short delay
                    setTimeout(() => {
                        isLoadingRef.current = false
                    }, 100)
                })
            } else {
                isLoadingRef.current = false
            }
        }
    }, [loadingMore])

    // Fetch global chat messages on mount  
    useEffect(() => {
        if (isActive) {
            connectWebSocket()
        }
        
        return () => {
            disconnectWebSocket()
        }
    }, [isActive])
    
    // Handle loading more messages
    useEffect(() => {
        if (isFetchingNextPage) {
            setLoadingMore(true)
        } else {
            setLoadingMore(false)
        }
    }, [isFetchingNextPage])

    const connectWebSocket = () => {
        disconnectWebSocket() // Close existing connection if any
        
        const token = localStorage.getItem('access_token')
        
        if (!token) {
            console.error("No access token found")
            return
        }

        // WebSocket URL with token as query parameter
        const wsUrlWithToken = `${WS_ENDPOINTS.GLOBAL_CHAT}?token=${token}`
        console.log("Connecting to Global Chat WebSocket:", wsUrlWithToken.replace(token, '***TOKEN***'))
        wsRef.current = new WebSocket(wsUrlWithToken)

        wsRef.current.onopen = () => {
            console.log("✅ Global WebSocket connected successfully")
        }

        wsRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data)
            console.log("Global WebSocket message received:", data)
            
            if (data.type === "chat_message") {
                console.log("💬 New global message received, refetching messages...")
                // Refetch messages to get the new message from server
                refetchMessages()
            }
        }

        wsRef.current.onerror = (error) => {
            console.error("❌ Global WebSocket error:", error)
            console.error("WebSocket readyState:", wsRef.current?.readyState)
        }

        wsRef.current.onclose = (event) => {
            console.log("Global WebSocket disconnected. Code:", event.code, "Reason:", event.reason)
        }
    }

    const disconnectWebSocket = () => {
        if (wsRef.current) {
            wsRef.current.close()
            wsRef.current = null
        }
    }

    const handleSendMessage = async (e) => {
        e.preventDefault()
        if (message.trim()) {
            try {
                // Send via WebSocket for instant delivery
                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({
                        type: 'chat_message',
                        content: message.trim()
                    }))
                    setMessage("")
                } else {
                    console.error("WebSocket is not connected")
                    // Fallback to REST API mutation if WebSocket is not available
                    sendMessageMutation.mutate({ content: message.trim() })
                    setMessage("")
                }
            } catch (err) {
                console.error("Failed to send global message:", err)
            }
        }
    }

    const handleInputFocus = () => {
        if (!isActive) {
            setIsActive(true)
        }
    }

    const handleClose = () => {
        setIsOpen(false)
        setIsActive(false)
        setMessage("")
        disconnectWebSocket()
    }

    // Close the popup if the user clicks outside of the chat
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                handleClose()
            }
        }

        document.addEventListener("mousedown", handleClickOutside)

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    if (!isOpen) {
        return (
            <div className="fixed bottom-6 right-6 z-50">
                <button onClick={() => setIsOpen(true)}>
                    <img src={chatIcon} alt="" className="h-full w-full cursor-pointer" />
                </button>
            </div>
        )
    }

    return (
        <div className="relative">
            <div className="fixed bottom-6 right-6 z-50">
                <button onClick={() => setIsOpen(!isOpen)}>
                    <img src={chatIcon} alt="" className="h-full w-full cursor-pointer" />
                </button>
            </div>

            <div
                ref={popupRef}
                className={`absolute bottom-30 right-10 w-[350px] h-[600px] xl:h-[700px] xl:w-[400px] bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 ease-in-out ${
                    isOpen ? "opacity-100 transform scale-100" : "opacity-0 transform scale-90"
                }`}
            >
                {!isActive ? (
                    // Initial popup state
                    <div className=" h-full bg-gradient-to-br from-[#1B3B66] via-[#0057FF] to-[#CAF4F7] flex flex-col justify-between p-6 text-white">
                        <div>
                            <ChatHeader onClose={handleClose} />
                            <div className="text-start mt-10">
                                <h2 className="text-3xl font-semibold mb-2 opacity-70">Join</h2>
                                <p className="text-2xl leading-relaxed opacity-90 font-semibold">
                                    the global chat to talk, share, and connect with everyone in real time.
                                </p>
                            </div>
                        </div>
                        <ChatInput
                            message={message}
                            setMessage={setMessage}
                            onFocus={handleInputFocus}
                            onSend={handleSendMessage}
                        />
                    </div>
                ) : (
                    // Active chat state with gradient background
                    <div className="h-full flex flex-col transition-all duration-500 ease-in-out bg-gradient-to-br from-[#1B3B66] via-[#0057FF] to-[#CAF4F7]">
                        <ChatHeader onClose={handleClose} />
                        {isLoading ? (
                            <div className="flex-1 flex items-center justify-center text-white">
                                Loading messages...
                            </div>
                        ) : (
                            <div 
                                ref={messagesContainerRef}
                                onScroll={handleScroll}
                                className="flex-1 overflow-y-auto p-4 space-y-3"
                            >
                                {/* Loading indicator at top */}
                                {isFetchingNextPage && hasNextPage && (
                                    <div className="flex justify-center py-2">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                    </div>
                                )}
                                
                                {!isFetchingNextPage && hasNextPage && messages.length > 0 && (
                                    <div className="text-center py-2">
                                        <p className="text-xs text-gray-300">Scroll up to load older messages</p>
                                    </div>
                                )}
                                
                                {messages.map((msg, index) => (
                                    <div
                                        key={msg.id || index}
                                        className={`flex items-start gap-2 ${msg.isOwn ? "flex-row-reverse" : ""}`}
                                    >
                                        <img
                                            src={msg.avatar}
                                            alt={msg.user}
                                            className="w-8 h-8 rounded-full"
                                        />
                                        <div className={`flex flex-col ${msg.isOwn ? "items-end" : "items-start"}`}>
                                            <p className="text-xs text-white/80 mb-1">{msg.user}</p>
                                            <div
                                                className={`px-4 py-2 rounded-lg max-w-[200px] ${
                                                    msg.isOwn
                                                        ? "bg-white/20 text-white"
                                                        : "bg-white/10 text-white"
                                                }`}
                                            >
                                                {msg.file_url && (
                                                    <div className="mb-2">
                                                        {msg.file_type === "image" && (
                                                            <img
                                                                src={msg.file_url}
                                                                alt="attachment"
                                                                className="max-w-full rounded"
                                                            />
                                                        )}
                                                        {msg.file_type === "video" && (
                                                            <video controls className="max-w-full rounded">
                                                                <source src={msg.file_url} />
                                                            </video>
                                                        )}
                                                        {msg.file_type === "document" && (
                                                            <a
                                                                href={msg.file_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-blue-300 underline"
                                                            >
                                                                Download File
                                                            </a>
                                                        )}
                                                    </div>
                                                )}
                                                <p className="text-sm">{msg.message}</p>
                                            </div>
                                            <p className="text-xs text-white/60 mt-1">{msg.time}</p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                        <ChatInput
                            message={message}
                            setMessage={setMessage}
                            onFocus={handleInputFocus}
                            onSend={handleSendMessage}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}

export default GlobalChatPopUp
