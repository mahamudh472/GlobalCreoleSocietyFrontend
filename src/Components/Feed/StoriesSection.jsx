import React, { useState, useEffect } from "react"
import { Plus } from "lucide-react"
import { useNavigate } from "react-router-dom";
import CreateStoryModal from "./CreateStoryModal";
import StoryViewer from "./StoryViewer";
import { getStories, createStory } from "../../services/storyService";
import { DEFAULT_AVATAR } from "../../utils/defaultAvatar";

const StoriesSection = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeStories, setActiveStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);


  const handleStoryClick = (story, index) => {
    setSelectedStoryIndex(index);
    setIsViewerOpen(true);
  }


  const handleCreateStoryClick = () => {
    setIsModalOpen(true);
  }

  const handleStoryCreated = async (formData) => {
    try {
      await createStory(formData);
      // Refresh stories list
      await fetchStories();
    } catch (error) {
      console.error('Failed to create story:', error);
      throw error;
    }
  }

  const handleStoryDeleted = (storyId) => {
    // Remove deleted story from list
    setActiveStories(activeStories.filter(story => story.id !== storyId));
    setIsViewerOpen(false);
  }

  const handleNavigate = (newIndex) => {
    setSelectedStoryIndex(newIndex);
  }

  const fetchStories = async () => {
    try {
      setLoading(true);
      const data = await getStories();
      setActiveStories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch stories:', error);
      setActiveStories([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStories();
  }, [])



  return (
    <>
      <CreateStoryModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStoryCreated={handleStoryCreated}
      />

      <StoryViewer 
        storyId={activeStories[selectedStoryIndex]?.id}
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        onStoryDeleted={handleStoryDeleted}
        stories={activeStories}
        currentIndex={selectedStoryIndex}
        onNavigate={handleNavigate}
      />
      
      <div className="bg-white rounded-xl p-2 sm:p-4 mb-4 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-6 sm:py-8">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="flex space-x-2 sm:space-x-4 overflow-x-auto scrollbar-hide pb-1">
            {/* Create Story Button */}
            <div className="flex-shrink-0 cursor-pointer">
              <div
                onClick={handleCreateStoryClick}
                className="flex flex-col items-center">
                <div className="w-20 h-28 sm:w-28 sm:h-36 md:w-32 md:h-40 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center hover:border-blue-400 transition-colors">
                  <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                </div>
                <span className="text-[10px] sm:text-xs text-gray-600 mt-1 sm:mt-2 text-center max-w-16 sm:max-w-20 truncate">Create Story</span>
              </div>
            </div>

            {/* Stories from API */}
            {Array.isArray(activeStories) && activeStories.length > 0 ? (
              activeStories.map((story, index) => (
                <div key={story.id} className="flex-shrink-0 cursor-pointer">
                  <div className="flex flex-col items-center">
                    <div
                      onClick={() => handleStoryClick(story, index)}
                      className="w-20 h-28 sm:w-28 sm:h-36 md:w-32 md:h-40 rounded-xl p-0.5 bg-gradient-to-tr from-yellow-400 via-red-500 to-pink-500 relative"
                    >
                      {/* User Avatar Overlay */}
                      <div className="absolute top-1 left-1 z-10">
                        <img
                          src={story.user?.profile_image || DEFAULT_AVATAR}
                          alt={story.user?.profile_name || 'User'}
                          className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-blue-500 object-cover"
                          onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
                        />
                      </div>
                      <div className="w-full h-full rounded-xl overflow-hidden border-2 border-white bg-white">
                        {story.media && story.media.length > 0 ? (
                          story.media[0].media_type === 'image' ? (
                            <img
                              src={story.media[0].file}
                              alt={story.user?.profile_name || 'Story'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <video
                              src={story.media[0].file}
                              className="w-full h-full object-cover"
                            />
                          )
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg sm:text-2xl">
                            {story.user?.profile_name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] sm:text-xs text-gray-600 mt-1 sm:mt-2 text-center max-w-16 sm:max-w-20 truncate">
                      {story.user?.profile_name || 'Unknown'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              /* No stories message */
              !loading && (
                <div className="flex-1 text-center py-4 text-gray-500 text-sm">
                  No active stories. Be the first to share!
                </div>
              )
            )}
          </div>
        )}
      </div>
    </>
  )
}

export default StoriesSection
