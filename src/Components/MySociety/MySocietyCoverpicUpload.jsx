import { FaPencilAlt, FaTimes } from "react-icons/fa";
import { useEffect, useRef, useState } from "react";

const MySocietyCoverpicUpload = ({
  coverImage,
  onChangeImage,
  isUploading,
  isCreator = false,
}) => {
  const [imagePreview, setImagePreview] = useState(
    coverImage ||
      "https://thumbs.dreamstime.com/b/profile-picture-caucasian-male-employee-posing-office-happy-young-worker-look-camera-workplace-headshot-portrait-smiling-190186649.jpg"
  ); // Default image
  const [imageFile, setImageFile] = useState(null); 
  const fileInputRef = useRef(null);

  // Fullscreen preview state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Keep preview in sync if parent updates coverImage
  useEffect(() => {
    if (coverImage) setImagePreview(coverImage);
  }, [coverImage]);

  // Handle image selection from file input
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation for file type and size
    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      // 15MB limit
      alert("File size should not exceed 15MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
    setImageFile(file);
    if (typeof onChangeImage === "function") {
      onChangeImage(file);
    }
  };

  // Open file picker
  const handleFromGallery = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  // Open fullscreen preview
  const openPreview = () => {
    if (imagePreview) setIsPreviewOpen(true);
  };

  // Close fullscreen preview
  const closePreview = () => setIsPreviewOpen(false);

  // ESC to close
  useEffect(() => {
    if (!isPreviewOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") closePreview();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isPreviewOpen]);

  return (
    <div className="">
      {/* Main Section */}
      <div className="flex-1 flex flex-col items-center justify-center text-center w-full mx-auto">
        {/* Profile Image Box */}
        <div
          className="relative w-full  h-60 rounded-2xl border-4 border-white bg-gray-200 shadow-xl overflow-hidden flex items-center justify-center mb-2 cursor-pointer"
          onClick={openPreview}
          role="button"
          aria-label="Open image preview"
          title="Click to preview"
        >
          <img
            src={imagePreview}
            alt="Profile"
            className="object-cover w-full h-full"
          />

          {/* Edit icon (opens file picker) - Only show for creators */}
          {isCreator && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation(); // prevent triggering preview
                handleFromGallery();
              }}
              className="absolute bottom-1 right-1 p-2 rounded-full bg-black/60 hover:bg-black/70 transition disabled:opacity-60"
              disabled={isUploading}
              aria-label="Change image"
              title="Change image"
            >
              <FaPencilAlt className="text-white cursor-pointer" size={12} />
            </button>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          className="hidden"
          onChange={handleImageChange}
        />
      </div>

      {/* Fullscreen Preview Overlay */}
      {isPreviewOpen && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closePreview}
          aria-modal="true"
          role="dialog"
        >
          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              closePreview();
            }}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
            aria-label="Close preview"
            title="Close"
          >
            <FaTimes className="text-white" size={18} />
          </button>

          {/* Image container (clicking image won't close) */}
          <div
            className="max-w-[95vw] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={imagePreview}
              alt="Full preview"
              className="max-w-[95vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MySocietyCoverpicUpload;
