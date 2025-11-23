import { FaCamera, FaImage } from 'react-icons/fa';
import { ChevronRight } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { MdModeEdit } from 'react-icons/md';
import { apiMethods } from '../utils/api';
import { ENDPOINTS } from '../config/apiConfig';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const UploadProfilePage = ({ currentImage, onImageUpdate }) => {
    const { updateUser, user } = useAuth();
    const DEFAULT_IMAGE = "https://ui-avatars.com/api/?name=User&size=150&background=3b82f6&color=fff";
    const [imagePreview, setImagePreview] = useState(currentImage || DEFAULT_IMAGE);
    const [imageFile, setImageFile] = useState(null); // Store the image file
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    // Update preview when currentImage prop changes
    useEffect(() => {
        if (currentImage) {
            setImagePreview(currentImage);
        }
    }, [currentImage]);

    // Handle image selection from file input
    const handleImageChange = async (e) => {
        const file = e.target.files[0];

        // Basic validation for file type and size
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error('Please upload a valid image.');
                return;
            }
            if (file.size > 15 * 1024 * 1024) { // 15MB limit
                toast.error('File size should not exceed 15MB.');
                return;
            }

            // Show preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
            
            // Upload to server
            setUploading(true);
            try {
                const formData = new FormData();
                formData.append('profile_image', file);

                const response = await apiMethods.patch(
                    ENDPOINTS.AUTH.PROFILE,
                    formData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        },
                    }
                );

                toast.success('Profile picture updated successfully!');
                
                // Update AuthContext - this will update Navbar and everywhere else
                if (user) {
                    updateUser({
                        ...user,
                        profile_image: response.data.profile_image
                    });
                }
                
                // Update parent component
                if (onImageUpdate) {
                    onImageUpdate(response.data.profile_image);
                }
            } catch (error) {
                console.error('Error uploading profile image:', error);
                toast.error(error.response?.data?.error || 'Failed to upload profile picture');
                // Revert preview on error
                setImagePreview(currentImage || DEFAULT_IMAGE);
            } finally {
                setUploading(false);
            }
        }
    };

    // Handle file input from gallery or camera
    const handleFromGallery = () => {
        if (fileInputRef.current) fileInputRef.current.click();
    };

    return (
        <div className="">
            {/* Main Section */}
            <div className="flex-1 flex flex-col items-center justify-center text-center max-w-xl mx-auto">

                {/* Profile Image Circle */}
                <div className="relative w-28 h-28 lg:w-36 lg:h-36 rounded-2xl border-4 border-white bg-gray-200 der-dashed shadow-2xl overflow-hidden flex items-center justify-center mb-2 cursor-pointer"
                >
                    {uploading && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                        </div>
                    )}
                    <img
                        src={imagePreview}
                        alt="Profile"
                        className="object-cover w-full h-full"
                    />
                    <button
                        type="button"
                        onClick={handleFromGallery}
                        disabled={uploading}
                        className="absolute hover:scale-103 lg:hover:scale-107 right-1 bottom-2 shadow-2xl text-white text-base disabled:opacity-50"
                    >
                        <MdModeEdit color="white" size={20} />
                    </button>
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

        </div>
    );
};

export default UploadProfilePage;
