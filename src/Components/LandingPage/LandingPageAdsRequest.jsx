import { useState } from "react";
import LandingPageNavbar from "./LandingPageNavbar";
import { API_BASE_URL, ENDPOINTS } from "../../config/apiConfig";
import { countryCodes } from "../../utils/countryCodes";


const LandingPageAdsRequest = () => {
    const [formData, setFormData] = useState({
        companyName: "",
        email: "",
        phoneNumber: "",
        countryCode: "+1",
        ownerName: "",
        title: "",
        description: "",
        agreeToShare: false,
        mediaFiles: [],
        time: "",
        price: ""

    })
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }))
    }

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files)
        setFormData((prev) => ({
            ...prev,
            mediaFiles: files,
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true);
        setSubmitStatus({ type: '', message: '' });

        try {
            // Create FormData for multipart/form-data submission
            const submitData = new FormData();
            submitData.append('company_name', formData.companyName);
            submitData.append('email', formData.email);
            submitData.append('country_code', formData.countryCode);
            submitData.append('phone_number', formData.phoneNumber);
            submitData.append('owner_name', formData.ownerName);
            submitData.append('title', formData.title);
            submitData.append('description', formData.description);
            submitData.append('duration_days', formData.time);
            submitData.append('price_per_day', formData.price);
            submitData.append('agree_to_share', formData.agreeToShare);

            // Append media files
            formData.mediaFiles.forEach((file) => {
                submitData.append('media_files', file);
            });

            const response = await fetch(`${API_BASE_URL}${ENDPOINTS.ADVERTISEMENTS.CREATE}`, {
                method: 'POST',
                body: submitData,
            });

            const data = await response.json();

            if (response.ok) {
                setSubmitStatus({
                    type: 'success',
                    message: data.message || 'Advertisement request submitted successfully!'
                });
                // Reset form
                setFormData({
                    companyName: "",
                    email: "",
                    phoneNumber: "",
                    countryCode: "+1",
                    ownerName: "",
                    title: "",
                    description: "",
                    agreeToShare: false,
                    mediaFiles: [],
                    time: "",
                    price: ""
                });
            } else {
                // Handle validation errors
                const errorMessages = Object.entries(data)
                    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                    .join('\n');
                setSubmitStatus({
                    type: 'error',
                    message: errorMessages || 'Failed to submit advertisement request.'
                });
            }
        } catch (error) {
            console.error('Error submitting advertisement:', error);
            setSubmitStatus({
                type: 'error',
                message: 'An error occurred while submitting your request. Please try again.'
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen  py-8 px-4">
            <div>
                <LandingPageNavbar></LandingPageNavbar>
            </div>
            <div className="max-w-2xl lg:max-w-4xl mx-auto  rounded-lg  p-6">
                <h1 className="text-5xl font-medium text-center text-gray-900 mb-8">Advertisement</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Company Name */}
                    <div>
                        <label className="block text-md text-gray-600 mb-2">Company name</label>
                        <input
                            type="text"
                            name="companyName"
                            value={formData.companyName}
                            onChange={handleInputChange}
                            placeholder="Enter your company name"
                            className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-xl text-gray-600 mb-2">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="Enter your email address"
                            className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Phone Number */}
                    <div>
                        <label className="block text-md text-gray-600 mb-2">Phone number</label>
                        <div className="flex">
                            <select
                                name="countryCode"
                                value={formData.countryCode}
                                onChange={handleInputChange}
                                className="px-3 py-2 border border-gray-200 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            >
                                {countryCodes.map((country) => (
                                    <option key={country.id} value={country.code}>
                                        {country.flag} {country.code}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="tel"
                                name="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={handleInputChange}
                                placeholder="Phone number"
                                className="flex-1 px-3 py-2 border border-l-0 border-gray-200 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Add Media */}
                    <div>
                        <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                            <div className="mb-4">
                                <svg className="mx-auto h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                    />
                                </svg>
                            </div>
                            <p className="text-md text-gray-600 mb-2">Add Media</p>
                            <input
                                type="file"
                                multiple
                                accept="image/*,video/*"
                                onChange={handleFileChange}
                                className="hidden"
                                id="media-upload"
                            />
                            <label htmlFor="media-upload" className="cursor-pointer text-blue-500 hover:text-blue-600 text-md">
                                Click to upload files
                            </label>
                            {formData.mediaFiles.length > 0 && (
                                <p className="text-xs text-gray-500 mt-2">{formData.mediaFiles.length} file(s) selected</p>
                            )}
                        </div>
                    </div>

                    {/* Owner Name */}
                    <div>
                        <label className="block text-md text-gray-600 mb-2">Owner name</label>
                        <input
                            type="text"
                            name="ownerName"
                            value={formData.ownerName}
                            onChange={handleInputChange}
                            placeholder="Enter your owner name"
                            className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div className="flex justify-between gap-5">
                        <div className="w-1/2">
                            <label className="block text-md text-gray-600 mb-2">Time</label>
                            <input
                                type="number"
                                name="time"
                                value={formData.time}
                                onChange={handleInputChange}
                                placeholder=" How many days you want to run"
                                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div className="w-1/2">
                            <label className="block text-md text-gray-600 mb-2">Per day Price in USD</label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleInputChange}
                                placeholder="USD"
                                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-md text-gray-600 mb-2">Title</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            placeholder="Enter title"
                            className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-md text-gray-600 mb-2">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder="Enter your description"
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                    </div>


                    {/* Status Message */}
                    {submitStatus.message && (
                        <div className={`p-4 rounded-md ${submitStatus.type === 'success'
                            ? 'bg-green-50 border border-green-200 text-green-700'
                            : 'bg-red-50 border border-red-200 text-red-700'
                            }`}>
                            <p className="whitespace-pre-line">{submitStatus.message}</p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full font-medium py-3 px-4 rounded-full transition duration-200 cursor-pointer ${isSubmitting
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-gray-400 hover:bg-gray-500 text-white'
                            }`}
                    >
                        {isSubmitting ? 'Submitting...' : 'Continue'}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default LandingPageAdsRequest

