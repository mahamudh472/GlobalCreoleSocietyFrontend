import React, { useEffect, useRef, useState } from "react";
import UploadProfilePage from "./UploadProfilePage";
import { apiMethods } from "../utils/api";
import { ENDPOINTS } from "../config/apiConfig";
import { DEFAULT_AVATAR, DEFAULT_BACKGROUND_COLOR } from "../utils/defaultAvatar";
import { FaUserPlus, FaUserCheck, FaUserClock, FaCheck } from "react-icons/fa";

const ProfileHeader = ({
  data,
  posts = [],
  friendsCount = 0,
  isOwnProfile = true,
  friendStatus = 'none',
  friendStatusLoading = false,
  onSendFriendRequest,
  onAcceptFriendRequest,
  sendingRequest = false,
  acceptingRequest = false,
  onProfileUpdate,
}) => {

  const [coverPreview, setCoverPreview] = useState(
    data?.cover_photo || null
  );
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  const coverInputRef = useRef(null);

  useEffect(() => {
    setCoverPreview(data?.cover_photo || null);
  }, [data?.cover_photo]);

  const onEditCoverClick = () => {
    coverInputRef.current?.click();
  };

  const handleCoverFileChange = async (e) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        alert("Please upload a valid image.");
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        alert("File size should not exceed 15MB.");
        return;
      }

      // Local preview for instant feedback
      const reader = new FileReader();
      reader.onloadend = () => setCoverPreview(reader.result);
      reader.readAsDataURL(file);

      // Upload via PATCH multipart/form-data to accounts profile
      const formData = new FormData();
      formData.append("cover_photo", file);
      setIsUploadingCover(true);
      const resp = await apiMethods.patch(ENDPOINTS.AUTH.PROFILE, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Prefer server value if provided; otherwise keep local preview
      const serverCover =
        resp?.data?.cover_photo || resp?.data?.profile?.cover_photo;
      if (serverCover && onProfileUpdate) {
        onProfileUpdate({ ...data, cover_photo: serverCover });
      } else if (onProfileUpdate) {
        onProfileUpdate({ ...data, cover_photo: coverPreview });
      }
    } catch (err) {
      console.error("Cover upload failed:", err);
      alert("Failed to update cover photo. Please try again.");
    } finally {
      setIsUploadingCover(false);
      // Allow selecting the same file again
      if (e.target) e.target.value = "";
    }
  };

  return (
    <div className="bg-white shadow-xl rounded-lg max-w-full">
      {/* Cover Photo */}
      <div className="relative h-[150px] sm:h-[200px] md:h-[250px]" style={{ backgroundColor: coverPreview ? 'transparent' : DEFAULT_BACKGROUND_COLOR }}>
        {coverPreview && (
          <img
            className="w-full h-full rounded-t-lg object-cover"
            src={coverPreview}
            alt="cover_Profile"
          />
        )}
        {!coverPreview && (
          <div className="w-full h-full rounded-t-lg" />
        )}
        {isOwnProfile && (
          <button
            onClick={onEditCoverClick}
            disabled={isUploadingCover}
            className="absolute top-2 right-2 sm:top-3 sm:right-3 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs bg-black/60 text-white rounded-md hover:bg-black/70 transition disabled:opacity-50"
            title={isUploadingCover ? "Uploading…" : "Edit Cover"}
          >
            {isUploadingCover ? "Uploading…" : "Edit Cover"}
          </button>
        )}
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleCoverFileChange}
        />

        {/* Profile Image Upload Section - Only show for own profile */}
        {isOwnProfile && (
          <div className="absolute left-3 sm:left-5 lg:left-10 -bottom-10 sm:-bottom-12 lg:-bottom-16 h-20 w-20 sm:h-24 sm:w-24 lg:h-28 lg:w-28 rounded-2xl bg-gray-100">
            <UploadProfilePage
              currentImage={data?.profile_image}
              onImageUpdate={(newImage) => {
                if (onProfileUpdate) {
                  onProfileUpdate({ ...data, profile_image: newImage });
                }
              }}
            />
          </div>
        )}
        {/* Profile Image Display - For other users */}
        {!isOwnProfile && (
          <div className="absolute left-3 sm:left-5 lg:left-10 -bottom-10 sm:-bottom-12 lg:-bottom-16 h-20 w-20 sm:h-24 sm:w-24 lg:h-28 lg:w-28 rounded-2xl bg-gray-100 overflow-hidden shadow-lg">
            <img
              src={data?.profile_image || DEFAULT_AVATAR}
              alt="profile"
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Profile Information Section */}
      <div className="flex pt-20 sm:pt-24 md:pt-28 pb-4 sm:pb-6 md:pb-8 px-3 sm:px-4 md:px-8 rounded-lg flex-col sm:flex-row sm:justify-between gap-4">
        <div className="hidden sm:block w-[15%] lg:w-[20%]"></div>
        <div className="sm:w-[45%] lg:w-[40%]">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
              {data?.profile_name || data?.email || "User"}
            </h1>
            {/* Friend Action Button - Beside name for other users */}
            {!isOwnProfile && !friendStatusLoading && (
              <>
                {friendStatus === 'friends' && (
                  <span className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-green-100 text-green-700 rounded-lg text-xs sm:text-sm font-medium">
                    <FaUserCheck className="w-3 h-3 sm:w-4 sm:h-4" />
                    Friends
                  </span>
                )}
                {friendStatus === 'pending' && (
                  <span className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs sm:text-sm font-medium">
                    <FaUserClock className="w-3 h-3 sm:w-4 sm:h-4" />
                    Request Sent
                  </span>
                )}
                {friendStatus === 'request_received' && (
                  <button
                    onClick={onAcceptFriendRequest}
                    disabled={acceptingRequest}
                    className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-green-500 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-green-600 disabled:opacity-50 transition cursor-pointer"
                  >
                    <FaCheck className="w-3 h-3 sm:w-4 sm:h-4" />
                    {acceptingRequest ? 'Accepting...' : 'Accept Request'}
                  </button>
                )}
                {friendStatus === 'none' && (
                  <button
                    onClick={onSendFriendRequest}
                    disabled={sendingRequest}
                    className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-500 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-600 disabled:opacity-50 transition cursor-pointer"
                  >
                    <FaUserPlus className="w-3 h-3 sm:w-4 sm:h-4" />
                    {sendingRequest ? 'Sending...' : 'Add Friend'}
                  </button>
                )}
              </>
            )}
            {!isOwnProfile && friendStatusLoading && (
              <span className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-100 text-gray-400 rounded-lg text-xs sm:text-sm">
                Loading...
              </span>
            )}
          </div>
          {/* Bio with truncation */}
          <div className="relative">
            <p
              className={`text-xs sm:text-sm opacity-60 mb-1 sm:mb-2 mt-1 sm:mt-2 transition-all duration-300 ${!isBioExpanded ? 'line-clamp-3' : ''}`}
            >
              {data?.description || "No bio yet"}
            </p>
            {data?.description && data.description.length > 150 && (
              <button
                onClick={() => setIsBioExpanded(!isBioExpanded)}
                className="text-xs text-blue-500 hover:text-blue-700 font-medium mt-1 focus:outline-none"
              >
                {isBioExpanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <h3 className="text-xs sm:text-sm opacity-60">{friendsCount} friends</h3>
            {data?.profile_lock && (
              <span className="text-[10px] sm:text-xs bg-gray-200 text-gray-600 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 sm:h-3 sm:w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Private
              </span>
            )}
          </div>
        </div>

        <div className="sm:w-[35%] lg:w-[40%] flex justify-between sm:justify-around mt-3 sm:mt-0">
          <div className="text-center">
            <p className="text-xs sm:text-sm font-semibold">Posts</p>
            <p className="text-base sm:text-lg font-bold">{posts.length}</p>
          </div>
          <div className="text-center">
            <p className="text-xs sm:text-sm font-semibold">Friends</p>
            <p className="text-base sm:text-lg font-bold">{friendsCount}</p>
          </div>
          <div className="text-center">
            <p className="text-xs sm:text-sm font-semibold">Joined</p>
            <p className="font-bold text-xs sm:text-sm">
              {data?.date_joined
                ? new Date(data.date_joined).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })
                : "N/A"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
