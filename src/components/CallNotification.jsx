import { useEffect, useState } from 'react';
import { FaPhone, FaVideo, FaTimes, FaPhoneSlash } from 'react-icons/fa';
import { useCall } from '../context/CallContext';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_AVATAR } from '../utils/defaultAvatar';

/**
 * CallNotification - Bottom-right popup for incoming calls (Facebook style)
 */
function CallNotification() {
  const { incomingCall, acceptCall, rejectCall } = useCall();
  const [isRinging, setIsRinging] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (incomingCall) {
      setIsRinging(true);
      
      // Play ringtone (optional - add your own audio)
      // const audio = new Audio('/ringtone.mp3');
      // audio.loop = true;
      // audio.play();
      
      return () => {
        setIsRinging(false);
        // audio.pause();
      };
    }
  }, [incomingCall]);

  const handleAccept = async () => {
    await acceptCall();
    // Navigate to appropriate call page
    if (incomingCall.call_type === 'video') {
      navigate('/chat/videocall');
    } else {
      navigate('/chat/audiocall');
    }
  };

  const handleReject = () => {
    rejectCall();
  };

  if (!incomingCall) {
    return null;
  }

  const caller = incomingCall.caller;
  const callType = incomingCall.call_type;
  const callerName = caller?.profile_name || 'Unknown';
  const callerAvatar = caller?.profile_image || DEFAULT_AVATAR;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      {/* Call notification card */}
      <div className={`bg-white rounded-lg shadow-2xl border-2 ${isRinging ? 'border-blue-500 animate-pulse' : 'border-gray-200'} w-80 overflow-hidden`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-white">
            {callType === 'video' ? (
              <FaVideo className="text-lg" />
            ) : (
              <FaPhone className="text-lg" />
            )}
            <span className="font-semibold">
              Incoming {callType === 'video' ? 'Video' : 'Audio'} Call
            </span>
          </div>
          <button
            onClick={handleReject}
            className="text-white hover:text-red-200 transition-colors p-1"
            aria-label="Reject call"
          >
            <FaTimes className="text-lg" />
          </button>
        </div>

        {/* Caller info */}
        <div className="p-6 text-center">
          <div className="mb-4">
            <img
              src={callerAvatar}
              alt={callerName}
              className={`w-20 h-20 rounded-full mx-auto border-4 ${isRinging ? 'border-blue-500' : 'border-gray-200'} object-cover`}
            />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-1">
            {callerName}
          </h3>
          <p className="text-gray-500 text-sm mb-4">
            {isRinging ? 'Calling...' : 'Incoming call'}
          </p>

          {/* Action buttons */}
          <div className="flex justify-center space-x-4">
            {/* Reject button */}
            <button
              onClick={handleReject}
              className="bg-red-500 hover:bg-red-600 text-white rounded-full p-4 transition-all transform hover:scale-110 shadow-lg"
              aria-label="Reject call"
            >
              <FaPhoneSlash className="text-xl" />
            </button>

            {/* Accept button */}
            <button
              onClick={handleAccept}
              className="bg-green-500 hover:bg-green-600 text-white rounded-full p-4 transition-all transform hover:scale-110 shadow-lg"
              aria-label="Accept call"
            >
              {callType === 'video' ? (
                <FaVideo className="text-xl" />
              ) : (
                <FaPhone className="text-xl" />
              )}
            </button>
          </div>
        </div>

        {/* Ringing indicator */}
        {isRinging && (
          <div className="h-1 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-400 animate-shimmer" />
        )}
      </div>
    </div>
  );
}

export default CallNotification;
