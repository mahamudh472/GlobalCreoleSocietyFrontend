function Message({ message }) {
  const getDefaultProfileImage = () => {
    const name = message.senderName || "User";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=150&background=3b82f6&color=fff`;
  };

  const renderFileContent = () => {
    if (!message.file_url) return null

    switch (message.file_type) {
      case 'image':
        return (
          <img 
            src={message.file_url} 
            alt="Attachment" 
            className="max-w-xs rounded-lg mb-2"
          />
        )
      case 'video':
        return (
          <video 
            src={message.file_url} 
            controls 
            className="max-w-xs rounded-lg mb-2"
          />
        )
      case 'audio':
        return (
          <audio 
            src={message.file_url} 
            controls 
            className="mb-2"
          />
        )
      default:
        return (
          <a 
            href={message.file_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 underline mb-2 block"
          >
            Download File
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
          {message.text && <p className="text-sm leading-relaxed">{message.text}</p>}
        </div>
        <p className={`text-xs text-gray-500 mt-1 ${message.isOwn ? "text-right mr-1" : "ml-1"}`}>
          {message.timestamp}
        </p>
      </div>
    </div>
  )
}

export default Message
