import React, { useState, useRef } from "react"
import { Video, ImageIcon, X } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import { useCurrentUser } from "../../hooks/queries/useUser"
import { useCreatePostMutation } from "../../hooks/mutations/usePosts"

const CreatePostSection = ({ currentUser, onCreatePost, societyId = null }) => {
  const [postText, setPostText] = useState("")
  const [selectedFiles, setSelectedFiles] = useState([])
  const [privacy, setPrivacy] = useState("public")
  const fileInputRef = useRef(null)
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const createPostMutation = useCreatePostMutation();

  const DEFAULT_PROFILE_IMAGE = (user || currentUser)
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent((user || currentUser).profile_name || (user || currentUser).email || "User")}&size=150&background=3b82f6&color=fff`
    : "https://ui-avatars.com/api/?name=User&size=150&background=3b82f6&color=fff";

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    setSelectedFiles(prev => [...prev, ...files])
  }

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!postText.trim() && selectedFiles.length === 0) {
      toast.error("Please add some content or media")
      return
    }

    const formData = new FormData()
    formData.append('content', postText)
    formData.append('privacy', privacy)

    // Add society ID if posting to a society
    if (societyId) {
      formData.append('society', societyId)
    }

    // Add media files properly
    if (selectedFiles.length > 0) {
      selectedFiles.forEach((file, index) => {
        formData.append('media_files', file)
      })
    }

    createPostMutation.mutate(formData, {
      onSuccess: (data) => {
        console.log('Post created response:', data); // Debug log
        toast.success("Post created successfully!")
        setPostText("")
        setSelectedFiles([])
        setPrivacy("public")
        
        if (onCreatePost) {
          onCreatePost(data)
        }
      },
      onError: (error) => {
        console.error('Error creating post:', error)
        toast.error(error.response?.data?.error || "Failed to create post")
      }
    })
  }

  const displayUser = user || currentUser;

  return (
    <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
      <form onSubmit={handleSubmit}>
        <div className="flex items-start space-x-3">
          <img
            src={displayUser?.profile_image || DEFAULT_PROFILE_IMAGE}
            alt="Your avatar"
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="flex-1">
            <textarea
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              placeholder="Write your story today..."
              className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent
               placeholder-gray-500 dark:placeholder-gray-400
               text-gray-900 dark:text-gray-900"
              rows="3"
            />
            
            {/* Selected Files Preview */}
            {selectedFiles.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative">
                    {file.type.startsWith('image/') ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt="Preview"
                        className="w-full h-24 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Video className="w-8 h-8 text-gray-500" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-3">
          <div className="flex space-x-4 items-center">
            <button
              onClick={() => navigate("/feed/livestream")}
              type="button"
              className="flex items-center space-x-2 cursor-pointer px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Video className="w-5 h-5" />
              <span className="text-sm font-medium">Live</span>
            </button>
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <ImageIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Media</span>
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            <select
              value={privacy}
              onChange={(e) => setPrivacy(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="public">Public</option>
              <option value="friends">Friends</option>
              <option value="private">Private</option>
            </select>
          </div>
          
          {(postText.trim() || selectedFiles.length > 0) && (
            <button
              type="submit"
              disabled={createPostMutation.isPending}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createPostMutation.isPending ? "Posting..." : "Post"}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

export default CreatePostSection
