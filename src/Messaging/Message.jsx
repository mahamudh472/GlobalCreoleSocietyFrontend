import { FaFile, FaDownload, FaImage, FaVideo, FaMusic } from 'react-icons/fa'

function Message({ message }) {
  const getDefaultProfileImage = () => {
    const name = message.senderName || "User";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=150&background=3b82f6&color=fff`;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return ""
    
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffMinutes < 1) {
      return "Just now"
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`
    } else if (diffHours < 24) {
      return `${diffHours}h ago`
    } else if (diffDays === 1) {
      return "Yesterday"
    } else if (diffDays < 7) {
      return `${diffDays}d ago`
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  const renderFileContent = () => {
    if (!message.file_url) return null

    const fileUrl = message.file_url
    const fileType = message.file_type || 'file'

    switch (fileType) {
      case 'image':
        return (
          <div className="mb-2">
            <a href={fileUrl} target="_blank" rel="noopener noreferrer">
              <img 
                src={fileUrl} 
                alt="Attachment" 
                className="max-w-xs max-h-64 rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150"%3E%3Crect fill="%23f3f4f6" width="200" height="150"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EImage not available%3C/text%3E%3C/svg%3E';
                }}
              />
            </a>
          </div>
        )
      case 'video':
        return (
          <div className="mb-2">
            <video 
              src={fileUrl} 
              controls 
              className="max-w-xs max-h-64 rounded-lg"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        )
      case 'audio':
        return (
          <div className="mb-2">
            <audio 
              src={fileUrl} 
              controls 
              className="w-full max-w-xs"
            >
              Your browser does not support the audio tag.
            </audio>
          </div>
        )
      default:
        // Generic file download
        const fileName = fileUrl.split('/').pop() || 'file'
        return (
          <a 
            href={fileUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className={`flex items-center gap-2 p-3 rounded-lg mb-2 transition-colors ${
              message.isOwn 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            <FaFile className={message.isOwn ? 'text-white' : 'text-gray-700'} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${
                message.isOwn ? 'text-white' : 'text-gray-900'
              }`}>
                {fileName}
              </p>
              <p className={`text-xs ${
                message.isOwn ? 'text-blue-100' : 'text-gray-500'
              }`}>
                Click to download
              </p>
            </div>
            <FaDownload className={message.isOwn ? 'text-white' : 'text-gray-700'} />
          </a>
        )
    }
  }

  return (
    <div className={`flex gap-2 ${message.isOwn ? "justify-end" : "justify-start"}`}>
      {/* Show avatar for received messages (not own messages) */}
      {!message.isOwn && (
        <img 
          src={message.senderAvatar || getDefaultProfileImage()} 
          alt={message.senderName}
          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
        />
      )}
      
      <div className={`max-w-xs md:max-w-md lg:max-w-lg ${message.isOwn ? "order-2" : "order-1"}`}>
        {!message.isOwn && <p className="text-xs text-gray-600 mb-1 ml-1">{message.senderName}</p>}
        <div
          className={`rounded-2xl px-4 py-2.5 ${
            message.isOwn ? "bg-blue-500 text-white rounded-br-none" : "bg-gray-100 text-gray-900 rounded-bl-none"
          }`}
        >
          {renderFileContent()}
          {message.text && <p className="text-sm leading-relaxed break-words">{message.text}</p>}
        </div>
        <p className={`text-xs text-gray-500 mt-1 ${message.isOwn ? "text-right mr-1" : "ml-1"}`}>
          {formatTimestamp(message.timestamp)}
        </p>
      </div>
    </div>
  )
}

export default Message
