import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "react-router-dom"
import ChatSidebar from "./ChatSidebar"
import ChatWindow from "./ChatWindow"
import Navbar from "../Components/Navbar"
import { WS_ENDPOINTS } from "../config/apiConfig"
import { useCurrentUser } from "../hooks/queries/useUser"
import { useConversations, useConversationMessages } from "../hooks/queries/useChat"
import { 
    useMarkAsReadMutation, 
    useSendMessageMutation,
    useCreateConversationMutation,
    useDeleteConversationMutation 
} from "../hooks/mutations/useChat"
import { toast } from "react-toastify"

function ChatApp() {
    const { data: user } = useCurrentUser()
    const [searchParams, setSearchParams] = useSearchParams()
    const [selectedChat, setSelectedChat] = useState(null)
    const [filter, setFilter] = useState("all")
    const [error, setError] = useState(null)
    const [showMobileSidebar, setShowMobileSidebar] = useState(false)
    const wsRef = useRef(null)
    
    // Use TanStack Query for conversations list
    const { data: conversationsData = [], isLoading: loading, refetch: refetchConversations } = useConversations()
    
    // Use TanStack Query for messages of selected conversation
    const {
        data: messagesData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage: loadingMore,
        isLoading: loadingMessages,
        refetch: refetchMessages,
    } = useConversationMessages(selectedChat?.id, { enabled: !!selectedChat })
    
    // Flatten all pages into single messages array
    const messages = messagesData?.pages.flatMap(page => page.messages) || []
    
    // Chat mutations
    const markAsReadMutation = useMarkAsReadMutation()
    const sendMessageMutation = useSendMessageMutation()
    const createConversationMutation = useCreateConversationMutation()
    const deleteConversationMutation = useDeleteConversationMutation()

    // Fetch conversations on mount - handled by TanStack Query automatically

    // Connect to WebSocket when a chat is selected
    useEffect(() => {
        if (selectedChat) {
            connectWebSocket(selectedChat.id)
            // Mark as read when opening conversation
            markAsReadMutation.mutate(selectedChat.id)
        }

        return () => {
            disconnectWebSocket()
        }
    }, [selectedChat])
    
    // Auto-select conversation from URL or first conversation
    useEffect(() => {
        if (conversationsData.length > 0 && !selectedChat) {
            const conversationIdFromUrl = searchParams.get('conversation')
            let conversationToSelect = null
            
            if (conversationIdFromUrl) {
                conversationToSelect = conversationsData.find(conv => conv.id === conversationIdFromUrl)
                console.log(`🔗 Restoring conversation from URL: ${conversationIdFromUrl}`, conversationToSelect ? '✅' : '❌')
            }
            
            // If no conversation found in URL, select first conversation
            if (!conversationToSelect && conversationsData.length > 0) {
                conversationToSelect = conversationsData[0]
                console.log(`📋 Auto-selecting first conversation: ${conversationToSelect.name}`)
            }
            
            // Set the selected conversation
            if (conversationToSelect) {
                setSelectedChat(conversationToSelect)
                // Update URL if it's different
                if (conversationToSelect.id !== conversationIdFromUrl) {
                    setSearchParams({ conversation: conversationToSelect.id })
                }
            }
        }
    }, [conversationsData, selectedChat, searchParams, setSearchParams])

    const handleLoadMoreMessages = () => {
        if (selectedChat && hasNextPage && !loadingMore) {
            console.log("📜 Loading more messages...")
            fetchNextPage()
        }
    }

    const updateConversationList = (conversationId, lastMessageContent, timestamp, markAsUnread = false) => {
        console.log(`📝 Updating conversation ${conversationId}, unread: ${markAsUnread}`)
        
        // Refetch conversations to get updated data from server
        refetchConversations()
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
                console.log("💬 New message received, refetching messages...")
                // Refetch messages to get the new message from server
                refetchMessages()
                
                // Update conversation list with new message
                updateConversationList(
                    selectedChat.id, 
                    data.content, 
                    data.created_at, 
                    data.sender?.id !== user?.id
                );
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
    }

    const handleSendMessage = async (message, file = null) => {
        if (!selectedChat) return

        try {
            // Use TanStack Query mutation for sending messages
            if (file || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
                // Use REST API for file messages or when WebSocket is not available
                console.log(file ? "📎 Sending message with file via REST API" : "📤 Sending message via REST API (WebSocket unavailable)")
                
                sendMessageMutation.mutate(
                    { 
                        conversationId: selectedChat.id, 
                        content: message, 
                        file 
                    },
                    {
                        onSuccess: () => {
                            console.log("✅ Message sent via REST API")
                            // Update conversation list
                            updateConversationList(selectedChat.id, message || '[File]', new Date().toISOString(), false)
                        },
                        onError: (error) => {
                            console.error("❌ Failed to send message:", error)
                            setError("Failed to send message")
                        }
                    }
                )
            } else {
                // For text-only messages with active WebSocket, send via WebSocket for instant delivery
                console.log("📤 Sending message via WebSocket:", message)
                console.log("👤 From user:", user?.profile_name, "ID:", user?.id)
                
                wsRef.current.send(JSON.stringify({
                    type: 'chat_message',
                    content: message
                }))
                console.log("✅ Message sent via WebSocket")
                
                // Update conversation list (no need to mark as unread since we sent it)
                updateConversationList(selectedChat.id, message, new Date().toISOString(), false)
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
        createConversationMutation.mutate(friendId, {
            onSuccess: (newConversation) => {
                console.log("✅ Conversation created:", newConversation)
                
                // Format the conversation data
                const formattedConversation = {
                    id: newConversation.id,
                    userId: newConversation.other_participant.id,
                    name: newConversation.other_participant.profile_name || newConversation.other_participant.email,
                    avatar: newConversation.other_participant.profile_image,
                    lastMessage: "",
                    timestamp: new Date().toISOString(),
                    unread: false,
                    isActive: true
                }
                
                // Select the new conversation
                setSelectedChat(formattedConversation)
                setSearchParams({ conversation: formattedConversation.id })
            },
            onError: (error) => {
                console.error("Error creating conversation:", error)
            }
        })
    }

    const handleDeleteConversation = async (conversationId) => {
        deleteConversationMutation.mutate(conversationId, {
            onSuccess: () => {
                console.log("✅ Conversation deleted:", conversationId)
                
                // Clear selected chat if it was the deleted one
                if (selectedChat?.id === conversationId) {
                    setSelectedChat(null)
                    setSearchParams({})
                }
            },
            onError: (error) => {
                console.error("Error deleting conversation:", error)
            }
        })
    }

    const filteredChats = filter === "unread" 
        ? conversationsData.filter((chat) => chat.unread) 
        : conversationsData

    const handleMobileChatSelect = (chat) => {
        handleChatSelect(chat)
        setShowMobileSidebar(false) // Close drawer after selecting
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <Navbar></Navbar>
            {loading && conversationsData.length === 0 ? (
                <div className="flex h-[calc(100vh-160px)] items-center justify-center text-gray-500 pt-7">Loading conversations...</div>
            ) : error && conversationsData.length === 0 ? (
                <div className="flex h-[calc(100vh-160px)] items-center justify-center text-red-500 pt-7">{error}</div>
            ) : (
                <div className="flex h-[calc(100vh-120px)] sm:h-[calc(100vh-160px)] relative pt-7">
                    {/* Mobile Sidebar Overlay */}
                    {showMobileSidebar && (
                        <div 
                            className="fixed inset-0 bg-black/50 z-40 md:hidden"
                            onClick={() => setShowMobileSidebar(false)}
                        />
                    )}
                    
                    {/* Mobile Sidebar Drawer - only shown when showMobileSidebar is true */}
                    {showMobileSidebar && (
                        <div className="fixed inset-y-0 left-0 z-50 w-[85%] max-w-sm animate-slide-in md:hidden">
                            <ChatSidebar
                                chats={filteredChats}
                                selectedChat={selectedChat}
                                onChatSelect={handleMobileChatSelect}
                                filter={filter}
                                onFilterChange={handleFilterChange}
                                onCreateConversation={handleCreateConversation}
                                onClose={() => setShowMobileSidebar(false)}
                                isMobileDrawer={true}
                            />
                        </div>
                    )}
                    
                    {/* Desktop Sidebar - always visible on desktop, hidden on mobile when chat is selected */}
                    <div className={`
                        ${selectedChat ? 'hidden md:block' : 'w-full md:w-auto'} 
                        md:relative md:z-auto
                    `}>
                        <ChatSidebar
                            chats={filteredChats}
                            selectedChat={selectedChat}
                            onChatSelect={handleChatSelect}
                            filter={filter}
                            onFilterChange={handleFilterChange}
                            onCreateConversation={handleCreateConversation}
                        />
                    </div>
                    {selectedChat ? (
                        <ChatWindow 
                            chat={selectedChat} 
                            messages={messages} 
                            onSendMessage={handleSendMessage}
                            onDeleteConversation={handleDeleteConversation}
                            onLoadMoreMessages={handleLoadMoreMessages}
                            hasMoreMessages={hasNextPage}
                            loadingMore={loadingMore}
                            onBack={() => setSelectedChat(null)}
                            onShowConversations={() => setShowMobileSidebar(true)}
                        />
                    ) : (
                        <div className="hidden md:flex flex-1 items-center justify-center text-gray-500 text-sm">Select a chat to start messaging</div>
                    )}
                </div>
            )}
        </div>
    )
}

export default ChatApp
