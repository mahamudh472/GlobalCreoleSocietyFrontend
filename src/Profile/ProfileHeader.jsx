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
    <div className="bg-white shadow-xl rounded-lg max-w-full max-h-[550px]">
      {/* Cover Photo */}
      <div className="relative h-[40%]" style={{ backgroundColor: coverPreview ? 'transparent' : DEFAULT_BACKGROUND_COLOR }}>
        {coverPreview && (
          <img
            className="w-full rounded-t-lg object-cover max-h-[270px] min-h-[200px]"
            src={coverPreview}
            alt="cover_Profile"
          />
        )}
        {!coverPreview && (
          <div className="w-full rounded-t-lg max-h-[270px] min-h-[200px]" />
        )}
        {isOwnProfile && (
          <button
            onClick={onEditCoverClick}
            disabled={isUploadingCover}
            className="absolute top-3 right-3 px-3 py-1.5 text-xs bg-black/60 text-white rounded-md hover:bg-black/70 transition disabled:opacity-50"
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
          <div className="absolute left-5 lg:left-10 -bottom-12 lg:-bottom-20 h-28 w-28 rounded-2xl bg-gray-100">
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
          <div className="absolute left-5 lg:left-10 -bottom-12 lg:-bottom-20 h-28 w-28 rounded-2xl bg-gray-100 overflow-hidden shadow-lg">
            <img
              src={data?.profile_image || DEFAULT_AVATAR}
              alt="profile"
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Profile Information Section */}
      <div className="flex py-15 md:py-8 pl-8 pr-4 rounded-lg h-[60%] flex-col sm:flex-row sm:justify-between">
        <div className="w-[20%]"></div>
        <div className="sm:w-[40%] mb-4 sm:mb-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold">
              {data?.profile_name || data?.email || "User"}
            </h1>
            {/* Friend Action Button - Beside name for other users */}
            {!isOwnProfile && !friendStatusLoading && (
              <>
                {friendStatus === 'friends' && (
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                    <FaUserCheck />
                    Friends
                  </span>
                )}
                {friendStatus === 'pending' && (
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">
                    <FaUserClock />
                    Request Sent
                  </span>
                )}
                {friendStatus === 'request_received' && (
                  <button
                    onClick={onAcceptFriendRequest}
                    disabled={acceptingRequest}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50 transition cursor-pointer"
                  >
                    <FaCheck />
                    {acceptingRequest ? 'Accepting...' : 'Accept Request'}
                  </button>
                )}
                {friendStatus === 'none' && (
                  <button
                    onClick={onSendFriendRequest}
                    disabled={sendingRequest}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50 transition cursor-pointer"
                  >
                    <FaUserPlus />
                    {sendingRequest ? 'Sending...' : 'Add Friend'}
                  </button>
                )}
              </>
            )}
            {!isOwnProfile && friendStatusLoading && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-400 rounded-lg text-sm">
                Loading...
              </span>
            )}
          </div>
          <p className="text-sm opacity-60 mb-2 mt-2">
            {data?.description || "No bio yet"}
          </p>
          <div className="flex items-center gap-4">
            <h3 className="text-sm opacity-60">{friendsCount} friends</h3>
            {data?.profile_lock && (
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Private
              </span>
            )}
          </div>
        </div>

        <div className="sm:w-[40%] flex justify-between sm:justify-around sm:mt-0 mt-4">
          <div>
            <p className="text-sm font-semibold">Posts</p>
            <p className="text-lg font-bold">{posts.length}</p>
          </div>
          <div>
            <p className="text-sm font-semibold">Friends</p>
            <p className="text-lg font-bold">{friendsCount}</p>
          </div>
          <div>
            <p className="text-sm font-semibold">Joined</p>
            <p className="font-bold text-sm">
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
