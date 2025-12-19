import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Video, Mic, Monitor } from "lucide-react";
import { livestreamAPI } from "../../services/livestreamService";
import { useCurrentUser } from "../../hooks/queries";
import Navbar from "../Navbar";

const GoLivePage = () => {
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCamera, setSelectedCamera] = useState("");
  const [selectedMicrophone, setSelectedMicrophone] = useState("");
  const [devices, setDevices] = useState({ cameras: [], microphones: [] });
  const [isCreating, setIsCreating] = useState(false);
  const [previewStream, setPreviewStream] = useState(null);
  const videoPreviewRef = useRef(null);

  const DEFAULT_PROFILE_IMAGE = user
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.profile_name || user.email || "User")}&size=150&background=3b82f6&color=fff`
    : "https://ui-avatars.com/api/?name=User&size=150&background=3b82f6&color=fff";

  // Get available media devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        // Request permissions first
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        
        const deviceList = await navigator.mediaDevices.enumerateDevices();
        const cameras = deviceList.filter(device => device.kind === 'videoinput');
        const microphones = deviceList.filter(device => device.kind === 'audioinput');
        
        setDevices({ cameras, microphones });
        
        // Set default devices
        if (cameras.length > 0) setSelectedCamera(cameras[0].deviceId);
        if (microphones.length > 0) setSelectedMicrophone(microphones[0].deviceId);
      } catch (error) {
        console.error('Error getting devices:', error);
        toast.error('Failed to access camera/microphone');
      }
    };

    getDevices();
  }, []);

  // Update preview when camera changes
  useEffect(() => {
    if (selectedCamera) {
      startPreview();
    }
    
    return () => {
      if (previewStream) {
        previewStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [selectedCamera, selectedMicrophone]);

  const startPreview = async () => {
    try {
      // Stop existing stream
      if (previewStream) {
        previewStream.getTracks().forEach(track => track.stop());
      }

      // Start new stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: selectedCamera ? { exact: selectedCamera } : undefined },
        audio: { deviceId: selectedMicrophone ? { exact: selectedMicrophone } : undefined }
      });

      setPreviewStream(stream);
      
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error starting preview:', error);
      toast.error('Failed to start camera preview');
    }
  };

  const handleGoLive = async () => {
    if (!title.trim()) {
      toast.error("Please add a title for your livestream");
      return;
    }

    setIsCreating(true);

    try {
      // Create livestream on backend
      const livestream = await livestreamAPI.createLivestream({
        title: title.trim(),
        description: description.trim()
      });

      // Stop preview
      if (previewStream) {
        previewStream.getTracks().forEach(track => track.stop());
      }

      // Navigate to livestream page with the created stream data
      navigate(`/feed/livestream/${livestream.id}`, { 
        state: { 
          livestream,
          isStreamer: true 
        } 
      });

    } catch (error) {
      console.error('Error creating livestream:', error);
      toast.error(error.response?.data?.error || 'Failed to create livestream');
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      <div className="py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Go Live</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left side - Camera Preview */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Camera Preview</h2>
              
              <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video mb-4">
                <video
                  ref={videoPreviewRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                {!previewStream && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Video className="w-16 h-16 text-gray-600" />
                  </div>
                )}
              </div>

              {/* Device Selection */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Video className="w-4 h-4 inline mr-2" />
                    Camera
                  </label>
                  <select
                    value={selectedCamera}
                    onChange={(e) => setSelectedCamera(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {devices.cameras.length === 0 ? (
                      <option>No camera found</option>
                    ) : (
                      devices.cameras.map(device => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label || `Camera ${device.deviceId.slice(0, 5)}`}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mic className="w-4 h-4 inline mr-2" />
                    Microphone
                  </label>
                  <select
                    value={selectedMicrophone}
                    onChange={(e) => setSelectedMicrophone(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {devices.microphones.length === 0 ? (
                      <option>No microphone found</option>
                    ) : (
                      devices.microphones.map(device => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label || `Microphone ${device.deviceId.slice(0, 5)}`}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* Right side - Stream Details */}
            <div className="space-y-4">
              {/* Stream Info */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-800 mb-4">
                  Stream Details
                </h2>

                <input
                  type="text"
                  placeholder="Title (required)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-200 mb-3"
                  maxLength={100}
                />

                <div className="flex items-center mb-3">
                  <img
                    src={user?.profile_image || DEFAULT_PROFILE_IMAGE}
                    alt="User"
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <span className="ml-3 text-sm font-semibold text-gray-800">
                    {user?.profile_name || user?.username || "User"}
                  </span>
                </div>

                <textarea
                  placeholder="What's on your mind?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-sm resize-none border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  maxLength={500}
                />
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  Before you go live:
                </h3>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Make sure your camera and microphone are working</li>
                  <li>• Choose a well-lit environment</li>
                  <li>• Check your internet connection</li>
                  <li>• Be respectful and follow community guidelines</li>
                </ul>
              </div>

              {/* Go Live Button */}
              <button
                onClick={handleGoLive}
                disabled={isCreating || !selectedCamera || !title.trim()}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Setting up...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <Video className="w-5 h-5 mr-2" />
                    Go Live
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoLivePage;

