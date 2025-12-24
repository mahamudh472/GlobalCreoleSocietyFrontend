import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL, ENDPOINTS } from "../../config/apiConfig";

const LandingPageAdds = () => {
  const [playingAdId, setPlayingAdId] = useState(null);
  const [advertisements, setAdvertisements] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdvertisements = async () => {
      try {
        console.log('Fetching advertisements from:', `${API_BASE_URL}${ENDPOINTS.ADVERTISEMENTS.PUBLIC}`);
        const response = await fetch(`${API_BASE_URL}${ENDPOINTS.ADVERTISEMENTS.PUBLIC}`);
        console.log('Response status:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('API Response:', data);
          
          // Handle both paginated and non-paginated responses
          const adsArray = Array.isArray(data) ? data : (data.results || []);
          
          if (adsArray && adsArray.length > 0) {
            // Transform API data to match component structure
            const transformedAds = adsArray.map((ad) => ({
              id: ad.id,
              logo: "https://via.placeholder.com/30", // Default logo
              title: ad.title,
              description: ad.description,
              // Get first image as thumbnail, or first media
              videoThumbnail: ad.media?.find(m => m.media_type === 'image')?.file_url 
                || ad.media?.[0]?.file_url 
                || "https://via.placeholder.com/400x300",
              // Get video URL if available
              videoUrl: ad.media?.find(m => m.media_type === 'video')?.file_url || null,
              name: ad.owner_name,
              role: ad.company_name,
              hasVideo: ad.media?.some(m => m.media_type === 'video'),
            }));
            console.log('Transformed ads:', transformedAds);
            setAdvertisements(transformedAds);
          } else {
            // No approved ads from API
            console.log('No approved ads found');
            setAdvertisements([]);
          }
        } else {
          // API error
          console.log('API error, status:', response.status);
          setAdvertisements([]);
        }
      } catch (error) {
        console.error('Error fetching advertisements:', error);
        setAdvertisements([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAdvertisements();
  }, []);

  // Check if media is a video based on file extension or if it's a YouTube URL
  const isPlayableVideo = (url) => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.mov', '.avi', '.webm'];
    const isVideoFile = videoExtensions.some(ext => url.toLowerCase().includes(ext));
    const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
    return isVideoFile || isYouTube;
  };

  return (
    <div className="px-4 py-20 mx-auto text-center">
      {/* Heading */}
      <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
        Unlock Your <br />
        <span className="text-blue-600 font-extrabold">Social Media Growth</span>
      </h2>
      <p className="text-gray-500 mt-4 max-w-2xl mx-auto">
        We help you amplify your voice, grow your online influence, and connect
        with the world. From creators to businesses, we empower you to reach new
        heights.
      </p>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center mt-10 py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : advertisements.length === 0 ? (
        /* Empty State */
        <div className="mt-10 py-16 px-4">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Advertisements Yet</h3>
            <p className="text-gray-500 mb-6">
              Be the first to showcase your brand! Submit your advertisement and reach thousands of potential customers.
            </p>
          </div>
        </div>
      ) : (
        /* Ads Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-10">
          {advertisements.map((ad) => (
            <div
              key={ad.id}
              className="bg-white rounded-2xl p-4 shadow hover:shadow-lg transition duration-300 text-left flex flex-col"
            >
              {/* Logo + Brand */}
              <div className="flex items-center mb-4 space-x-2">
                <img src={ad.logo} alt="logo" className="w-6 h-6" />
                <span className="font-bold text-sm text-blue-600">{ad.role || "Logoipsum"}</span>
              </div>

              {/* Title */}
              <p className="font-medium text-gray-800 mb-4">{ad.title}</p>

              {/* Video / Thumbnail */}
              <div className="relative rounded-xl overflow-hidden aspect-video">
                {playingAdId === ad.id && ad.videoUrl ? (
                  // Playing video
                  isPlayableVideo(ad.videoUrl) && ad.videoUrl.includes('youtube') ? (
                    <iframe
                      width="100%"
                      height="100%"
                      src={`${ad.videoUrl}?autoplay=1`}
                      title={ad.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="rounded-xl"
                    ></iframe>
                  ) : (
                    <video
                      width="100%"
                      height="100%"
                      src={ad.videoUrl}
                      autoPlay
                      controls
                      className="rounded-xl object-cover"
                    />
                  )
                ) : (
                  <>
                    <img
                      src={ad.videoThumbnail}
                      alt={ad.title}
                      className="w-full h-full object-cover rounded-xl"
                    />
                    {(ad.videoUrl || ad.hasVideo) && (
                      <button
                        onClick={() => setPlayingAdId(ad.id)}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <div className="bg-white p-2 rounded-full shadow-md">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="black"
                            viewBox="0 0 24 24"
                            className="w-6 h-6"
                          >
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Name + Role */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-4 text-sm text-gray-700">
                <span>{ad.name}</span>
                <span className="text-gray-400 sm:ml-4">{ad.role}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Advertisement Button */}
      <button
        onClick={() => navigate("/advertisement-request")}
        className="mt-10 w-full sm:w-auto px-4 py-2 sm:px-5 sm:py-3 md:px-6 md:py-3 
                   bg-blue-600 text-white text-sm sm:text-base md:text-xl lg:text-2xl 
                   rounded-full hover:bg-blue-700 transition font-semibold cursor-pointer"
      >
        Add your advertisement
      </button>
    </div>
  );
};

export default LandingPageAdds;
