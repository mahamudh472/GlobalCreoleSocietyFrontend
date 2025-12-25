"use client"

function ChatListItem({ chat, isSelected, onClick }) {
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

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 cursor-pointer transition-colors border-b border-gray-100 ${
        isSelected ? "bg-blue-50" : "hover:bg-gray-50"
      }`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <img src={chat.avatar || "/placeholder.svg"} alt={chat.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover" />
        {chat.isActive && (
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 border-2 border-white rounded-full"></div>
        )}
      </div>

      {/* Chat Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5 sm:mb-1">
          <h3 className="font-semibold text-gray-900 text-xs sm:text-sm truncate">{chat.name}</h3>
          <span className="text-[10px] sm:text-xs text-gray-500 flex-shrink-0 ml-2">{formatTimestamp(chat.timestamp)}</span>
        </div>
        <p className="text-xs sm:text-sm text-gray-600 truncate">{chat.lastMessage}</p>
      </div>

      {/* Unread Indicator */}
      {chat.unread && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>}
    </div>
  )
}

export default ChatListItem
