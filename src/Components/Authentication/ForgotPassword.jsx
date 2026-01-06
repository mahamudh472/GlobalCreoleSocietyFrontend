import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import AuthButton from "./AuthButton";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../utils/api";

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [isSendingOTP, setIsSendingOTP] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [error, setError] = useState(null);
    
    const [formData, setFormData] = useState({
        email: "",
        code: "",
        new_password: "",
        showPassword: false,
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        // Clear error when user types
        if (error) setError(null);
    };

    const togglePasswordVisibility = () => {
        setFormData((prev) => ({
            ...prev,
            showPassword: !prev.showPassword,
        }));
    };

    const handleSendOTP = async () => {
        if (!formData.email) {
            toast.error("Please enter your email address");
            return;
        }

        setIsSendingOTP(true);
        setError(null);

        try {
            // Send OTP request - this will need to be a public endpoint on the backend
            // For now, using the reset-password endpoint to trigger OTP
            const response = await api.post("/accounts/reset-password/", {
                email: formData.email
            });

            if (response.data) {
                setOtpSent(true);
                toast.success("OTP sent to your email! Please check your inbox.");
            }
        } catch (err) {
            const errorMessage = err.response?.data?.error || 
                                err.response?.data?.detail || 
                                err.response?.data?.message ||
                                'Failed to send OTP. Please try again.';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsSendingOTP(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation
        if (!formData.email) {
            toast.error("Email is required");
            return;
        }
        if (!formData.code) {
            toast.error("OTP code is required");
            return;
        }
        if (!formData.new_password) {
            toast.error("New password is required");
            return;
        }
        if (formData.new_password.length < 8) {
            toast.error("Password must be at least 8 characters long");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await api.post("/accounts/reset-password/", {
                email: formData.email,
                code: formData.code,
                new_password: formData.new_password
            });

            if (response.data) {
                toast.success("Password reset successfully! Please login with your new password.");
                navigate("/signin");
            }
        } catch (err) {
            const errorMessage = err.response?.data?.error || 
                                err.response?.data?.code?.[0] ||
                                err.response?.data?.detail || 
                                err.response?.data?.message ||
                                'Failed to reset password. Please try again.';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-xl lg:max-w-3xl xl:max-w-4xl rounded-lg p-6 sm:p-8">
                <h1 className="text-5xl font-bold text-center text-gray-900 mb-2">Reset Password</h1>
                <p className="text-center text-gray-600 mb-6">
                    Enter your email to receive a verification code
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Email */}
                    <div>
                        <label className="block text-md text-gray-600 mb-2">Email Address</label>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="Enter your email address"
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={otpSent}
                            />
                            <button
                                type="button"
                                onClick={handleSendOTP}
                                disabled={isSendingOTP || otpSent || !formData.email}
                                className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                            >
                                {isSendingOTP ? "Sending..." : otpSent ? "Sent" : "Send"}
                            </button>
                        </div>
                        {otpSent && (
                            <p className="text-xs text-green-600 mt-1">
                                ✓ OTP sent successfully! Check your email.
                            </p>
                        )}
                    </div>

                    {/* OTP Code */}
                    <div>
                        <label className="block text-md text-gray-600 mb-2">Verification Code</label>
                        <input
                            type="text"
                            name="code"
                            value={formData.code}
                            onChange={handleInputChange}
                            placeholder="Enter the 6-digit code"
                            maxLength="6"
                            className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Enter the verification code sent to your email
                        </p>
                    </div>

                    {/* New Password */}
                    <div>
                        <label className="block text-md text-gray-600 mb-2">New Password</label>
                        <div className="relative">
                            <input
                                type={formData.showPassword ? "text" : "password"}
                                name="new_password"
                                value={formData.new_password}
                                onChange={handleInputChange}
                                placeholder="Enter your new password"
                                className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button
                                type="button"
                                onClick={togglePasswordVisibility}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                                {formData.showPassword ? (
                                    <EyeOff className="w-5 h-5" />
                                ) : (
                                    <Eye className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Use 8 or more characters with a mix of letters, numbers & symbols
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-md">
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <AuthButton
                        text={isLoading ? "Resetting Password..." : "Reset Password"}
                        type="submit"
                        className="w-full"
                        disabled={isLoading || !otpSent}
                    />

                    {/* Back to Login */}
                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => navigate('/signin')}
                            className="text-md text-gray-600 hover:text-gray-800"
                        >
                            ← Back to Login
                        </button>
                    </div>

                    {/* Switch to Sign Up */}
                    <p className="text-center text-md text-gray-600">
                        Don't have an account?{" "}
                        <button
                            type="button"
                            onClick={() => navigate('/signup')}
                            className="text-blue-500 hover:text-blue-600 font-medium cursor-pointer"
                        >
                            Sign up
                        </button>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;
