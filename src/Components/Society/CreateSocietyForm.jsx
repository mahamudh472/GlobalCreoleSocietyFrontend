import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useCurrentUser } from "../../hooks/queries/useUser";
import { useCreateSocietyMutation } from "../../hooks/mutations/useSocieties";

const CreateSocietyForm = ({ isOpen, onClose, onSuccess }) => {
  const modalRef = useRef(null);
  const modalContentRef = useRef(null);
  const { data: user } = useCurrentUser();
  const createSocietyMutation = useCreateSocietyMutation();
  const [coverImage, setCoverImage] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    privacy: "public",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error("Society name is required");
      return;
    }

    const submitData = new FormData();
    submitData.append("name", formData.name);
    submitData.append("description", formData.description || "");
    submitData.append("privacy", formData.privacy);

    if (coverImage) {
      submitData.append("cover_image", coverImage);
    }

    createSocietyMutation.mutate(submitData, {
      onSuccess: () => {
        // Reset form
        setFormData({ name: "", description: "", privacy: "public" });
        setCoverImage(null);

        // Refresh societies list
        if (onSuccess) {
          onSuccess();
        }

        onClose();
      },
    });
  };

  // For Modal...................................

  // Close the modal if clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target) && // Clicked outside modal container
        modalContentRef.current &&
        !modalContentRef.current.contains(event.target) // Clicked outside modal content
      ) {
        onClose(); // Close modal if clicked outside
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside); // Add event listener when modal is open
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside); // Clean up when modal is closed
    };
  }, [isOpen, onClose]);

  // Don't render the modal if it's not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 bg-opacity-50 z-50">
      <div
        ref={modalRef}
        className="w-full max-w-md max-h-[600px] p-6 bg-white rounded-lg shadow-md border border-gray-200 overflow-y-auto"
      >
        <h2 className="text-2xl font-bold mb-4">Create Society</h2>
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-purple-500 rounded-full mr-2 flex items-center justify-center text-white font-bold">
            {user?.first_name?.[0]}
            {user?.last_name?.[0]}
          </div>
          <div>
            <p className="text-gray-700 font-medium">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-gray-500 text-sm">Admin</p>
          </div>
        </div>

        <form
          ref={modalContentRef}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div>
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="name"
            >
              Society Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Society Name"
            />
          </div>

          <div>
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="description"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe your society..."
            />
          </div>

          <div>
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="coverImage"
            >
              Cover Picture
            </label>
            <input
              type="file"
              id="coverImage"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {coverImage && (
              <p className="text-sm text-gray-600 mt-1">{coverImage.name}</p>
            )}
          </div>

          <div>
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="privacy"
            >
              Choose privacy
            </label>
            <select
              id="privacy"
              name="privacy"
              value={formData.privacy}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="public">Public - Anyone can join</option>
              <option value="private">Private - Requires approval</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={createSocietyMutation.isPending}
            className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createSocietyMutation.isPending ? "Creating..." : "Create"}
          </button>
        </form>

        <button
          onClick={onClose}
          disabled={createSocietyMutation.isPending}
          className="mt-4 bg-gray-300 py-2 px-4 rounded cursor-pointer w-full disabled:opacity-50"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default CreateSocietyForm;
