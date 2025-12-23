import { FaPencilAlt, FaTimes } from "react-icons/fa";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const DEFAULT_IMAGE =
  "https://cdn.pixabay.com/photo/2025/05/23/08/54/girl-9617241_1280.png";

const SocietyImgUpload = ({
  societyId,
  societyImage,
  onChangeImage,
  isUploading,
  isCreator = false,
}) => {
  const getStoredImage = () => {
    try {
      if (!societyId || typeof window === "undefined") return null;
      const raw = window.localStorage.getItem(
        `society:profile_image:${societyId}`
      );
      if (!raw) return null;
      const { url, ts } = JSON.parse(raw);
      const ttlMs = 24 * 60 * 60 * 1000;
      if (!url || (ts && Date.now() - ts > ttlMs)) return null;
      return typeof url === "string" && url.trim().length ? url : null;
    } catch {
      return null;
    }
  };

  const [imagePreview, setImagePreview] = useState(
    societyImage || getStoredImage() || DEFAULT_IMAGE
  );

  const fileInputRef = useRef(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  /* 🔁 Sync preview from backend image; clear stored fallback when backend provides */
  useEffect(() => {
    if (societyImage && societyImage !== imagePreview) {
      setImagePreview(societyImage);
      try {
        if (societyId && typeof window !== "undefined") {
          window.localStorage.removeItem(`society:profile_image:${societyId}`);
        }
      } catch {}
    }
  }, [societyImage, imagePreview, societyId]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      alert("Image must be under 15MB");
      return;
    }

    /* Local preview (instant UI feedback) */
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      setImagePreview(result);
      // Persist fallback so it survives refresh until backend sends final URL
      try {
        if (societyId && typeof window !== "undefined") {
          window.localStorage.setItem(
            `society:profile_image:${societyId}`,
            JSON.stringify({ url: result, ts: Date.now() })
          );
        }
      } catch {}
    };
    reader.readAsDataURL(file);

    /* Send to parent (API upload) */
    onChangeImage?.(file);
  };

  return (
    <div className="flex flex-col items-center">
      <div
        onClick={() => setIsPreviewOpen(true)}
        className="relative w-28 h-28 lg:w-48 lg:h-48 rounded-2xl overflow-hidden cursor-pointer border-4 border-white shadow-xl"
      >
        <img
          src={imagePreview}
          alt="Society"
          className="w-full h-full object-cover"
        />

        {isCreator && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            disabled={isUploading}
            className="absolute bottom-2 right-2 p-2 bg-black/60 rounded-full hover:bg-black/80 transition-colors"
          >
            <FaPencilAlt className="text-white" size={12} />
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleImageChange}
      />

      {/* Fullscreen Preview */}
      {isPreviewOpen &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center"
            onClick={() => setIsPreviewOpen(false)}
          >
            <img
              src={imagePreview}
              alt="Preview"
              className="max-w-[90vw] max-h-[90vh] rounded-lg"
            />
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="absolute top-4 right-4 text-white"
            >
              <FaTimes size={20} />
            </button>
          </div>,
          document.body
        )}
    </div>
  );
};

export default SocietyImgUpload;
