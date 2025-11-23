import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "react-router-dom"
import ChatSidebar from "./ChatSidebar"
import ChatWindow from "./ChatWindow"
import Navbar from "../Components/Navbar"
import { apiMethods } from "../utils/api"
import { ENDPOINTS, WS_ENDPOINTS } from "../config/apiConfig"
import { useAuth } from "../context/AuthContext"
import { toast } from "react-toastify"

function ChatApp() {
    const { user } = useAuth()
    const [searchParams, setSearchParams] = useSearchParams()
    const [selectedChat, setSelectedChat] = useState(null)
    const [filter, setFilter] = useState("all")
    const [conversations, setConversations] = useState([])
    const [messages, setMessages] = useState([])
    const [loading, setLoading] = useState(false)
    const [loadingMore, setLoadingMore] = useState(false)
    const [hasMoreMessages, setHasMoreMessages] = useState(true)
    const [nextMessagesUrl, setNextMessagesUrl] = useState(null)
    const [error, setError] = useState(null)
    const wsRef = useRef(null)

    // Fetch conversations on mount
    useEffect(() => {
        fetchConversations()
    }, [])

    // Connect to WebSocket when a chat is selected
    useEffect(() => {
        if (selectedChat) {
            connectWebSocket(selectedChat.id)
            fetchMessages(selectedChat.id, true) // true = initial load
        }

        return () => {
            disconnectWebSocket()
        }
    }, [selectedChat])

    const fetchConversations = async () => {
        try {
            setLoading(true)
            const response = await apiMethods.get(ENDPOINTS.CHAT.CONVERSATIONS)
            
            // Handle paginated response or plain array
            const conversationsData = response.data.results || response.data
            const conversations = Array.isArray(conversationsData) ? conversationsData : []
            
            // Helper function for default profile image
            const getDefaultProfileImage = (user) => {
                if (!user) return "https://ui-avatars.com/api/?name=User&size=150&background=3b82f6&color=fff";
                const name = user.profile_name || user.email || "User";
                return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=150&background=3b82f6&color=fff`;
            };
            
            // Transform API response to match component structure
            const transformedConversations = conversations.map(conv => ({
                id: conv.id,
                name: conv.other_participant?.profile_name || conv.other_participant?.email || "Unknown User",
                avatar: conv.other_participant?.profile_image || getDefaultProfileImage(conv.other_participant),
                lastMessage: conv.last_message?.content || "No messages yet",
                timestamp: formatTimestamp(conv.last_message?.created_at),
                isActive: conv.other_participant?.is_online || false,
                unread: conv.unread_count > 0,
                userId: conv.other_participant?.id,
            }))
            
            setConversations(transformedConversations)
            
            // Try to restore conversation from URL parameter
            const conversationIdFromUrl = searchParams.get('conversation')
            let conversationToSelect = null
            
            if (conversationIdFromUrl) {
                // Find the conversation from URL
                conversationToSelect = transformedConversations.find(conv => conv.id === conversationIdFromUrl)
                console.log(`🔗 Restoring conversation from URL: ${conversationIdFromUrl}`, conversationToSelect ? '✅' : '❌')
            }
            
            // If no conversation found in URL or URL param doesn't exist, select first conversation
            if (!conversationToSelect && transformedConversations.length > 0) {
                conversationToSelect = transformedConversations[0]
                console.log(`📋 Auto-selecting first conversation: ${conversationToSelect.name}`)
            }
            
            // Set the selected conversation if one was found and no chat is currently selected
            if (conversationToSelect && !selectedChat) {
                setSelectedChat(conversationToSelect)
                // Update URL if it's different
                if (conversationToSelect.id !== conversationIdFromUrl) {
                    setSearchParams({ conversation: conversationToSelect.id })
                }
            }
            
            setError(null)
        } catch (err) {
            console.error("Failed to fetch conversations:", err)
            setError("Failed to load conversations")
        } finally {
            setLoading(false)
        }
    }

    const fetchMessages = async (conversationId, isInitialLoad = false) => {
        try {
            if (isInitialLoad) {
                setLoading(true)
                setMessages([])
                setHasMoreMessages(true)
                setNextMessagesUrl(null)
            } else {
                setLoadingMore(true)
            }
            
            // Use pagination URL if loading more, otherwise fetch first page
            const url = isInitialLoad 
                ? ENDPOINTS.CHAT.MESSAGES(conversationId)
                : nextMessagesUrl
            
            if (!url) {
                setLoadingMore(false)
                return
            }
            
            const response = await apiMethods.get(url)
            
            // Helper function for default profile image
            const getDefaultProfileImage = (user) => {
                if (!user) return "https://ui-avatars.com/api/?name=User&size=150&background=3b82f6&color=fff";
                const name = user.profile_name || user.email || "User";
                return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=150&background=3b82f6&color=fff`;
            };
            
            // Handle paginated response
            const messageData = response.data.results || response.data
            const nextUrl = response.data.next
            
            // Transform API response to match component structure
            const transformedMessages = messageData.map(msg => ({
                id: msg.id,
                text: msg.content,
                timestamp: formatTimestamp(msg.created_at),
                isOwn: msg.sender?.id === user?.id,
                senderName: msg.sender?.profile_name || msg.sender?.email || "Unknown",
                senderAvatar: msg.sender?.profile_image || getDefaultProfileImage(msg.sender),
                file_url: msg.file_url,
                file_type: msg.file_type,
            }))
            
            if (isInitialLoad) {
                setMessages(transformedMessages)
            } else {
                // Prepend older messages
                setMessages(prev => [...transformedMessages, ...prev])
            }
            
            setNextMessagesUrl(nextUrl)
            setHasMoreMessages(!!nextUrl)
            setError(null)
            
            // Mark messages as read
            if (isInitialLoad) {
                await apiMethods.post(ENDPOINTS.CHAT.MARK_AS_READ(conversationId))
            }
        } catch (err) {
            console.error("Failed to fetch messages:", err)
            setError("Failed to load messages")
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }

    const handleLoadMoreMessages = () => {
        if (selectedChat && hasMoreMessages && !loadingMore) {
            console.log("📜 Loading more messages...")
            fetchMessages(selectedChat.id, false)
        }
    }

    const updateConversationList = (conversationId, lastMessageContent, timestamp, markAsUnread = false) => {
        console.log(`📝 Updating conversation ${conversationId}, unread: ${markAsUnread}`)
        
        setConversations(prev => {
            // Find the conversation to update
            const conversationIndex = prev.findIndex(conv => conv.id === conversationId)
            
            if (conversationIndex === -1) {
                console.log("⚠️ Conversation not found in list:", conversationId)
                return prev
            }
            
            // Create updated conversation
            const updatedConversation = {
                ...prev[conversationIndex],
                lastMessage: lastMessageContent,
                timestamp: formatTimestamp(timestamp),
                unread: markAsUnread || prev[conversationIndex].unread,
            }
            
            // Remove from current position and add to top
            const newConversations = [...prev]
            newConversations.splice(conversationIndex, 1)
            newConversations.unshift(updatedConversation)
            
            console.log(`✅ Conversation moved to top: ${updatedConversation.name}`)
            return newConversations
        })
    }

    const connectWebSocket = (conversationId) => {
        disconnectWebSocket() // Close existing connection if any
        
        const wsUrl = WS_ENDPOINTS.PRIVATE_CHAT(conversationId)
        const token = localStorage.getItem('access_token')
        
        if (!token) {
            console.error("❌ No access token found")
            setError("Authentication required. Please login again.")
            return
        }

        // WebSocket URL with token as query parameter
        const wsUrlWithToken = `${wsUrl}?token=${token}`
        console.log("🔌 Connecting to WebSocket:", wsUrlWithToken.replace(token, '***TOKEN***'))
        console.log("👤 User:", user?.profile_name, "ID:", user?.id)
        
        wsRef.current = new WebSocket(wsUrlWithToken)

        wsRef.current.onopen = () => {
            console.log("✅ WebSocket connected successfully for conversation:", conversationId)
            console.log("✅ User", user?.profile_name, "connected to conversation", conversationId)
            setError(null)
        }

        wsRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data)
            console.log("📨 WebSocket message received:", data)
            
            if (data.type === "chat_message") {
                // Helper function for default profile image
                const getDefaultProfileImage = (user) => {
                    if (!user) return "https://ui-avatars.com/api/?name=User&size=150&background=3b82f6&color=fff";
                    const name = user.profile_name || user.email || "User";
                    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=150&background=3b82f6&color=fff`;
                };
                
                const newMessage = {
                    id: data.id || Date.now(),
                    text: data.content,
                    timestamp: formatTimestamp(data.created_at || new Date().toISOString()),
                    isOwn: data.sender?.id === user?.id,
                    senderName: data.sender?.profile_name || data.sender?.email || "Unknown",
                    senderAvatar: data.sender?.profile_image || getDefaultProfileImage(data.sender),
                    file_url: data.file_url,
                    file_type: data.file_type,
                }
                
                console.log("➕ Adding message to UI:", newMessage.id, "isOwn:", newMessage.isOwn)
                
                // Add message or replace temporary message
                setMessages(prev => {
                    // Check if this is a real message replacing a temporary one
                    if (newMessage.isOwn) {
                        // Remove any temporary messages with same content (optimistic updates)
                        const withoutTemp = prev.filter(msg => 
                            !(msg.id.toString().startsWith('temp-') && msg.text === newMessage.text)
                        );
                        
                        // Check if real message already exists
                        const exists = withoutTemp.find(msg => msg.id === newMessage.id);
                        if (exists) {
                            console.log("⚠️ Message already exists, skipping:", newMessage.id)
                            return prev;
                        }
                        
                        console.log("✅ Message added to state (replaced temp)")
                        return [...withoutTemp, newMessage];
                    } else {
                        // For messages from others, just check duplicates
                        const exists = prev.find(msg => msg.id === newMessage.id);
                        if (exists) {
                            console.log("⚠️ Message already exists, skipping:", newMessage.id)
                            return prev;
                        }
                        console.log("✅ Message added to state")
                        return [...prev, newMessage];
                    }
                });
                
                // Update conversation list with new message
                updateConversationList(conversationId, data.content, data.created_at, !newMessage.isOwn);
            } else if (data.type === "conversation_update") {
                // Handle conversation list updates even when in different conversations
                console.log("🔔 Conversation update received:", data.conversation_id)
                const isFromCurrentUser = data.sender_id === user?.id
                const shouldMarkUnread = !isFromCurrentUser && data.conversation_id !== selectedChat?.id
                
                updateConversationList(
                    data.conversation_id, 
                    data.last_message, 
                    data.timestamp, 
                    shouldMarkUnread
                );
            }
        }

        wsRef.current.onerror = (error) => {
            console.error("❌ WebSocket error:", error)
            console.error("❌ WebSocket readyState:", wsRef.current?.readyState)
            setError("Connection error. Please try refreshing.")
        }

        wsRef.current.onclose = (event) => {
            console.log("🔌 WebSocket disconnected. Code:", event.code, "Reason:", event.reason)
            if (event.code !== 1000) {
                console.error("❌ Abnormal disconnection")
                setError("Connection lost. Please refresh the page.")
            }
        }
    }

    const disconnectWebSocket = () => {
        if (wsRef.current) {
            wsRef.current.close()
            wsRef.current = null
        }
    }

    const handleChatSelect = (chat) => {
        setSelectedChat(chat)
        
        // Update URL with selected conversation ID
        setSearchParams({ conversation: chat.id })
        
        // Mark conversation as read in the list when selected
        setConversations(prev => 
            prev.map(conv => 
                conv.id === chat.id ? { ...conv, unread: false } : conv
            )
        )
    }

    const handleSendMessage = async (message, file = null) => {
        if (!selectedChat) return

        try {
            // If there's a file, we need to use REST API
            if (file) {
                console.log("📎 Sending message with file via REST API")
                const formData = new FormData()
                formData.append('content', message)
                formData.append('file', file)
                
                // Determine file type based on file MIME type
                if (file.type.startsWith('image/')) {
                    formData.append('file_type', 'image')
                } else if (file.type.startsWith('video/')) {
                    formData.append('file_type', 'video')
                } else if (file.type.startsWith('audio/')) {
                    formData.append('file_type', 'audio')
                } else {
                    formData.append('file_type', 'document')
                }

                await apiMethods.post(ENDPOINTS.CHAT.SEND_MESSAGE(selectedChat.id), formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                })
                
                console.log("✅ File message sent via REST API (will appear via WebSocket)")
                // No need to reload - message will come via WebSocket broadcast
                
                // Update conversation list
                updateConversationList(selectedChat.id, message || '[File]', new Date().toISOString(), false)
            } else {
                // For text-only messages, send via WebSocket for instant delivery
                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                    console.log("📤 Sending message via WebSocket:", message)
                    console.log("👤 From user:", user?.profile_name, "ID:", user?.id)
                    
                    // Optimistic update - add message to UI immediately
                    const tempId = `temp-${Date.now()}`
                    const optimisticMessage = {
                        id: tempId,
                        text: message,
                        timestamp: formatTimestamp(new Date().toISOString()),
                        isOwn: true,
                        senderName: user?.profile_name || user?.email || "You",
                        senderAvatar: user?.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.profile_name || 'You')}&size=150&background=3b82f6&color=fff`,
                        file_url: null,
                        file_type: 'text',
                    }
                    
                    setMessages(prev => [...prev, optimisticMessage])
                    console.log("✅ Optimistic message added to UI")
                    
                    wsRef.current.send(JSON.stringify({
                        type: 'chat_message',
                        content: message
                    }))
                    console.log("✅ Message sent via WebSocket")
                    
                    // Update conversation list (no need to mark as unread since we sent it)
                    updateConversationList(selectedChat.id, message, new Date().toISOString(), false)
                } else {
                    console.error("❌ WebSocket is not connected. State:", wsRef.current?.readyState)
                    setError("Connection lost. Please refresh.")
                }
            }
            
        } catch (err) {
            console.error("❌ Failed to send message:", err)
            setError("Failed to send message")
        }
    }

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return ""
        
        const date = new Date(timestamp)
        const now = new Date()
        const diffMs = now - date
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
        
        if (diffDays === 0) {
            // Today - show time
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        } else if (diffDays === 1) {
            return "Yesterday"
        } else if (diffDays < 7) {
            return `${diffDays}d ago`
        } else if (diffDays < 30) {
            return `${Math.floor(diffDays / 7)}w ago`
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }
    }

    const handleFilterChange = (filterType) => {
        setFilter(filterType)
    }

    const handleCreateConversation = async (friendId) => {
        try {
            const response = await apiMethods.post(ENDPOINTS.CHAT.CREATE_CONVERSATION, {
                user_id: friendId
            })
            
            // Format the conversation data
            const newConversation = {
                id: response.data.id,
                userId: response.data.other_participant.id,
                name: response.data.other_participant.profile_name,
                avatar: response.data.other_participant.profile_image,
                lastMessage: "",
                timestamp: new Date().toISOString(),
                unread: false,
                isActive: true
            }
            
            // Add to conversations list
            setConversations(prev => [newConversation, ...prev])
            
            // Select the new conversation
            setSelectedChat(newConversation)
            setSearchParams({ conversation: newConversation.id })
            
            toast.success("Conversation created")
        } catch (error) {
            console.error("Error creating conversation:", error)
            toast.error("Failed to create conversation")
        }
    }

    const handleDeleteConversation = async (conversationId) => {
        // Remove from list
        setConversations(prev => prev.filter(conv => conv.id !== conversationId))
        
        // Clear selected chat if it was the deleted one
        if (selectedChat?.id === conversationId) {
            setSelectedChat(null)
            setSearchParams({})
        }
    }

    const filteredChats = filter === "unread" ? conversations.filter((chat) => chat.unread) : conversations

    return (
        <div className="min-h-screen  bg-gray-100 ">
            <div className="py-7">
                <Navbar></Navbar>
            </div>
            {loading && conversations.length === 0 ? (
                <div className="flex h-[calc(100vh-160px)] items-center justify-center text-gray-500">Loading conversations...</div>
            ) : error && conversations.length === 0 ? (
                <div className="flex h-[calc(100vh-160px)] items-center justify-center text-red-500">{error}</div>
            ) : (
                <div className="flex h-[calc(100vh-160px)]  ">
                    <ChatSidebar
                        chats={filteredChats}
                        selectedChat={selectedChat}
                        onChatSelect={handleChatSelect}
                        filter={filter}
                        onFilterChange={handleFilterChange}
                        onCreateConversation={handleCreateConversation}
                    />
                    {selectedChat ? (
                        <ChatWindow 
                            chat={selectedChat} 
                            messages={messages} 
                            onSendMessage={handleSendMessage}
                            onDeleteConversation={handleDeleteConversation}
                            onLoadMoreMessages={handleLoadMoreMessages}
                            hasMoreMessages={hasMoreMessages}
                            loadingMore={loadingMore}
                        />
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-500">Select a chat to start messaging</div>
                    )}
                </div>
            )}
        </div>
    )
}

export default ChatApp
