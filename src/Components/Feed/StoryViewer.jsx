import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Trash2, Eye } from 'lucide-react';
import { getStory, deleteStory } from '../../services/storyService';
import { DEFAULT_AVATAR } from '../../utils/defaultAvatar';

const StoryViewer = ({ storyId, isOpen, onClose, onStoryDeleted, stories = [], currentIndex = 0, onNavigate }) => {
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen && storyId) {
      fetchStory();
    }
  }, [isOpen, storyId]);

  const fetchStory = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getStory(storyId);
      setStory(data);
      setCurrentMediaIndex(0);
    } catch (err) {
      setError('Failed to load story');
      console.error('Error fetching story:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this story?')) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteStory(storyId);
      if (onStoryDeleted) {
        onStoryDeleted(storyId);
      }
      onClose();
    } catch (err) {
      alert('Failed to delete story');
      console.error('Error deleting story:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePrevious = () => {
    if (story?.media && story.media.length > 0) {
      setCurrentMediaIndex((prev) => 
        prev > 0 ? prev - 1 : story.media.length - 1
      );
    }
  };

  const handleNext = () => {
    if (story?.media && story.media.length > 0) {
      setCurrentMediaIndex((prev) => 
        prev < story.media.length - 1 ? prev + 1 : 0
      );
    }
  };

  const handleNextStory = () => {
    if (onNavigate && stories.length > 0 && currentIndex < stories.length - 1) {
      onNavigate(currentIndex + 1);
    }
  };

  const handlePreviousStory = () => {
    if (onNavigate && stories.length > 0 && currentIndex > 0) {
      onNavigate(currentIndex - 1);
    }
  };

  const getCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  const currentUser = getCurrentUser();
  const isOwnStory = story && currentUser && story.user.id === currentUser.id;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-black/60 flex items-center justify-center z-50">
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      ) : error ? (
        <div className="text-white text-center">
          <p className="text-xl mb-4">{error}</p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white text-black rounded-lg hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      ) : story ? (
        <div className="relative w-full max-w-md h-full md:h-auto md:max-h-[90vh]">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-2 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <img
                  src={story.user.profile_image || DEFAULT_AVATAR}
                  alt={story.user.profile_name}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white object-cover"
                  onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
                />
                <div>
                  <p className="text-white font-semibold text-sm sm:text-base">{story.user.profile_name}</p>
                  <p className="text-white/80 text-[10px] sm:text-xs">
                    {new Date(story.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                {isOwnStory && (
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="text-white hover:text-red-400 transition-colors p-1 sm:p-2"
                    title="Delete story"
                  >
                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="text-white hover:text-gray-300 transition-colors p-1 sm:p-2"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>

            {/* Progress Indicators */}
            {story.media && story.media.length > 1 && (
              <div className="flex gap-1 mt-3">
                {story.media.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 flex-1 rounded-full ${
                      index === currentMediaIndex ? 'bg-white' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="relative h-full md:h-[90vh] bg-black rounded-lg overflow-hidden">
            {story.media && story.media.length > 0 ? (
              <>
                {story.media[currentMediaIndex].media_type === 'image' ? (
                  <img
                    src={story.media[currentMediaIndex].file}
                    alt="Story"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <video
                    src={story.media[currentMediaIndex].file}
                    className="w-full h-full object-contain"
                    controls
                    autoPlay
                  />
                )}

                {/* Media Navigation Buttons (for multiple media in one story) */}
                {story.media.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevious}
                      className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1.5 sm:p-2 rounded-full hover:bg-black/70 transition-colors z-10"
                    >
                      <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
                    </button>
                    <button
                      onClick={handleNext}
                      className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1.5 sm:p-2 rounded-full hover:bg-black/70 transition-colors z-10"
                    >
                      <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                <p className="text-white text-base sm:text-xl font-semibold px-4 sm:px-8 text-center">
                  {story.content || 'No content'}
                </p>
              </div>
            )}

            {/* Story Navigation Buttons (between different stories) */}
            {stories.length > 1 && (
              <>
                {currentIndex > 0 && (
                  <button
                    onClick={handlePreviousStory}
                    className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm text-white p-2 sm:p-3 rounded-full hover:bg-white/30 transition-all shadow-lg"
                    title="Previous story"
                  >
                    <ChevronLeft className="w-5 h-5 sm:w-8 sm:h-8" />
                  </button>
                )}
                {currentIndex < stories.length - 1 && (
                  <button
                    onClick={handleNextStory}
                    className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm text-white p-2 sm:p-3 rounded-full hover:bg-white/30 transition-all shadow-lg"
                    title="Next story"
                  >
                    <ChevronRight className="w-5 h-5 sm:w-8 sm:h-8" />
                  </button>
                )}
              </>
            )}

            {/* Content Overlay */}
            {story.content && story.media && story.media.length > 0 && (
              <div className="absolute bottom-12 sm:bottom-16 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 sm:p-6">
                <p className="text-white text-xs sm:text-sm">{story.content}</p>
              </div>
            )}
          </div>

          {/* Story Info - Visible to all users */}
          <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4 text-white text-[10px] sm:text-xs">
            <div className="flex items-center justify-between bg-black/30 backdrop-blur-sm rounded-lg p-2 sm:p-3">
              <div className="flex items-center gap-1 sm:gap-2">
                <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>{story.view_count || 0} views</span>
              </div>
              <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs ${
                story.is_active ? 'bg-green-500/30' : 'bg-red-500/30'
              }`}>
                {story.is_active ? 'Active' : 'Expired'}
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default StoryViewer;
