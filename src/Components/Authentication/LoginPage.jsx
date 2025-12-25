import { useState } from "react"
import { Eye, EyeOff } from "lucide-react";
import AuthButton from "../Authentication/AuthButton";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../utils/queryKeys";
import { toast } from "react-toastify";

const LoginPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const queryClient = useQueryClient();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        showPassword: false,
    })

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }))
        // Clear error when user types
        if (error) setError(null);
    }

    const togglePasswordVisibility = () => {
        setFormData((prev) => ({
            ...prev,
            showPassword: !prev.showPassword,
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true);
        setError(null);

        try {
            // Use AuthContext login which properly updates React state AND localStorage
            const result = await login(formData.email, formData.password);
            
            if (result.success) {
                // Also invalidate all queries to ensure fresh data
                queryClient.resetQueries();
                queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
                queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
                queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
                
                toast.success('Login successful!');
                navigate('/feed');
            } else {
                setError(result.error);
                toast.error(result.error);
            }
        } catch (err) {
            const errorMessage = err.response?.data?.error || 
                                err.response?.data?.detail || 
                                'Login failed. Please try again.';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-xl lg:max-w-3xl xl:max-w-4xl rounded-lg p-6 sm:p-8">
                <h1 className="text-5xl font-bold text-center text-gray-900 mb-6">Log In</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Email */}
                    <div>
                        <label className="block text-md text-gray-600 mb-2">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="Enter your email address"
                            className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-md text-gray-600 mb-2">Password</label>
                        <div className="relative">
                            <input
                                type={formData.showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                placeholder="Enter your password"
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
                        <div className="text-red-500 text-sm text-center">
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <AuthButton
                        text={isLoading ? "Logging in..." : "Log In"}
                        type="submit"
                        className="w-full "
                        disabled={isLoading}
                    />

                    {/* Forgot Password */}
                    <div className="text-center">
                        <a href="#" className="text-md text-gray-600 hover:text-gray-800">
                            Forgot your password?
                        </a>
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
    )
}

export default LoginPage
