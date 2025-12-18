import React, { useEffect, useRef, useState } from "react";
import UploadProfilePage from "./UploadProfilePage";
import { apiMethods } from "../utils/api";
import { ENDPOINTS } from "../config/apiConfig";

const ProfileHeader = ({
  data,
  posts = [],
  friendsCount = 0,
  isOwnProfile = true,
  onProfileUpdate,
}) => {
  const DEFAULT_PROFILE_IMAGE =
    "https://ui-avatars.com/api/?name=" +
    encodeURIComponent(data?.profile_name || data?.email || "User") +
    "&size=150&background=3b82f6&color=fff";

  const DEFAULT_COVER_IMAGE =
    "https://fiverr-res.cloudinary.com/images/q_auto,f_auto/gigs/109754369/original/7d68bae2733a0643c7b6d1376f66f3450c1b8207/create-a-premium-facebook-cover.jpg";

  const [coverPreview, setCoverPreview] = useState(
    data?.cover_photo || DEFAULT_COVER_IMAGE
  );
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const coverInputRef = useRef(null);

  useEffect(() => {
    setCoverPreview(data?.cover_photo || DEFAULT_COVER_IMAGE);
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
      <div className="relative h-[40%]">
        <img
          className="w-full rounded-t-lg object-cover max-h-[270px] min-h-[200px]"
          src={coverPreview}
          alt="cover_Profile"
        />
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
          <div className="transform transition-transform duration-700 ease-in-out hover:scale-103 absolute left-5 lg:left-10 -bottom-12 lg:-bottom-20 h-28 w-28 rounded-2xl bg-gray-100">
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
              src={data?.profile_image || DEFAULT_PROFILE_IMAGE}
              alt="profile"
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Profile Information Section */}
      <div className="flex py-15 md:py-8 pl-8 rounded-lg h-[60%] flex-col sm:flex-row sm:justify-between">
        <div className="w-[20%]"></div>
        <div className="sm:w-[40%] mb-4 sm:mb-0">
          <h1 className="text-3xl font-bold pb-2">
            {data?.profile_name || data?.email || "User"}
          </h1>
          <p className="text-sm opacity-60 mb-2">
            {data?.description || "No bio yet"}
          </p>
          <div className="flex items-center gap-4">
            <h3 className="text-sm opacity-60">{friendsCount} friends</h3>
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
