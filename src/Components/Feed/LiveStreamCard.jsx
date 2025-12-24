import React from "react";
import { Users, Radio } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "../../hooks/queries/useUser";
import { DEFAULT_AVATAR } from "../../utils/defaultAvatar";

const LiveStreamCard = ({ livestream }) => {
  const { data: user } = useCurrentUser();
  const navigate = useNavigate();

  const handleClick = () => {
    const isStreamer = user && livestream.user && user.id === livestream.user.id;
    navigate(`/feed/livestream/${livestream.id}`, {
      state: { livestream, isStreamer }
    });
  };

  const handleUserClick = (e) => {
    e.stopPropagation();
    if (livestream.user?.id) {
      if (user && livestream.user.id === user.id) {
        navigate("/profile");
      } else {
        navigate(`/profile/${livestream.user.id}`);
      }
    }
  };

  const isLive = livestream.status === 'live';

  return (
    <div
      onClick={handleClick}
      className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden shadow-lg cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl mb-4"
    >
      {/* Live Stream Preview */}
      <div className="relative aspect-video bg-black">
        {/* Placeholder/Thumbnail */}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-600/20 to-purple-600/20">
          <div className="text-center">
            <Radio className={`w-16 h-16 mx-auto mb-2 ${isLive ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} />
            <p className="text-white text-lg font-medium">
              {isLive ? 'Live Now' : 'Starting Soon...'}
            </p>
          </div>
        </div>

        {/* Live Badge */}
        <div className="absolute top-3 left-3 flex items-center space-x-2">
          <div className={`${isLive ? 'bg-red-600' : 'bg-yellow-600'} text-white px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1`}>
            {isLive && <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>}
            <span>{isLive ? 'LIVE' : 'PREPARING'}</span>
          </div>
        </div>

        {/* Viewer Count */}
        {isLive && (
          <div className="absolute top-3 right-3 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
            <Users className="w-3 h-3" />
            <span>{livestream.viewer_count || 0} watching</span>
          </div>
        )}

        {/* Watch Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors">
          <button className="bg-red-600 text-white px-6 py-2 rounded-full font-semibold opacity-0 hover:opacity-100 transition-opacity transform hover:scale-105">
            {isLive ? 'Watch Now' : 'Join Stream'}
          </button>
        </div>
      </div>

      {/* Stream Info */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-white font-bold text-lg mb-2 line-clamp-1">
          {livestream.title || 'Untitled Stream'}
        </h3>

        {/* Description */}
        {livestream.description && (
          <p className="text-gray-400 text-sm mb-3 line-clamp-2">
            {livestream.description}
          </p>
        )}

        {/* User Info */}
        <div 
          className="flex items-center space-x-3 cursor-pointer hover:opacity-80"
          onClick={handleUserClick}
        >
          <img
            src={livestream.user?.profile_image || DEFAULT_AVATAR}
            alt={livestream.user?.profile_name || "User"}
            className="w-10 h-10 rounded-full object-cover border-2 border-red-500"
          />
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm truncate">
              {livestream.user?.profile_name || livestream.user?.email?.split('@')[0] || 'Anonymous'}
            </p>
            <p className="text-gray-400 text-xs">
              {livestream.started_at 
                ? `Started ${new Date(livestream.started_at).toLocaleTimeString()}`
                : livestream.created_at 
                  ? `Created ${new Date(livestream.created_at).toLocaleTimeString()}`
                  : 'Just now'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveStreamCard;
