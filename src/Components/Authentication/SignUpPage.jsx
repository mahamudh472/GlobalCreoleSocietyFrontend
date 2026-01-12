
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import AuthButton from "./AuthButton";
import { useAuth } from "../../context/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../utils/queryKeys";
import { toast } from "react-toastify";
import { countryCodes } from "../../utils/countryCodes";


const SignUpPage = ({ onSwitchToLogin }) => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const queryClient = useQueryClient();
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        profileName: "",
        email: "",
        phoneNumber: "",
        countryCode: "+1",
        password: "",
        promotionalCode: "",
        gender: "",
        birthMonth: "",
        birthDate: "",
        birthYear: "",
        agreeToShare: false,
    })

    const [showPassword, setShowPassword] = useState(false);
    const [passwordErrors, setPasswordErrors] = useState([]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }))

        // Validate password on change
        if (name === "password") {
            validatePassword(value);
        }
    }

    const validatePassword = (password) => {
        const errors = [];
        if (password.length < 8) {
            errors.push("At least 8 characters");
        }
        if (!/[a-z]/.test(password)) {
            errors.push("At least one lowercase letter");
        }
        if (!/[A-Z]/.test(password)) {
            errors.push("At least one uppercase letter");
        }
        if (!/[0-9]/.test(password)) {
            errors.push("At least one number");
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push("At least one special character");
        }
        setPasswordErrors(errors);
        return errors.length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true);

        // Validate password before submitting
        if (!validatePassword(formData.password)) {
            toast.error("Please fix password validation errors");
            setIsLoading(false);
            return;
        }

        // Combine date of birth
        const dateOfBirth = `${formData.birthYear}-${String(formData.birthMonth).padStart(2, '0')}-${String(formData.birthDate).padStart(2, '0')}`;

        // Prepare registration data according to API requirements
        const registrationData = {
            email: formData.email,
            password: formData.password,
            profile_name: formData.profileName,
            phone_number: formData.countryCode + formData.phoneNumber,
            date_of_birth: dateOfBirth,
            gender: formData.gender || undefined,
        };

        try {
            // Use AuthContext register which properly updates React state
            const result = await register(registrationData);

            if (result.success) {
                // Invalidate all queries to ensure fresh data
                queryClient.resetQueries();
                toast.success('Registration successful!');
                navigate('/feed');
            } else {
                // Handle error messages from API
                const errorData = result.error;
                if (typeof errorData === 'object' && errorData !== null) {
                    Object.entries(errorData).forEach(([field, messages]) => {
                        if (Array.isArray(messages)) {
                            messages.forEach(msg => toast.error(`${field}: ${msg}`));
                        } else {
                            toast.error(`${field}: ${messages}`);
                        }
                    });
                } else {
                    toast.error(errorData || 'Registration failed');
                }
            }
        } catch (error) {
            const errorData = error?.response?.data;
            if (typeof errorData === 'object' && errorData !== null) {
                Object.entries(errorData).forEach(([field, messages]) => {
                    if (Array.isArray(messages)) {
                        messages.forEach(msg => toast.error(`${field}: ${msg}`));
                    } else {
                        toast.error(`${field}: ${messages}`);
                    }
                });
            } else {
                toast.error('Registration failed');
            }
        } finally {
            setIsLoading(false);
        }
    }

    const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ]

    const days = Array.from({ length: 31 }, (_, i) => i + 1)
    const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i)

    return (
        <div className="min-h-screen  py-8 px-4">
            <div className="max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-4xl mx-auto  rounded-lg  p-6">
                <h1 className="text-5xl font-medium text-center text-gray-900 mb-8">Sign up for free</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Profile Name */}
                    <div>
                        <label className="block text-md text-gray-600 mb-2">Profile name</label>
                        <input
                            type="text"
                            name="profileName"
                            value={formData.profileName}
                            onChange={handleInputChange}
                            placeholder="Enter your profile name"
                            className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

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

                    {/* Password */}
                    <div>
                        <label className="block text-md text-gray-600 mb-2">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                placeholder="Enter your password"
                                className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                                {showPassword ? (
                                    <EyeOff className="w-5 h-5" />
                                ) : (
                                    <Eye className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                        {formData.password && (
                            <div className="mt-2 space-y-1">
                                {passwordErrors.length > 0 ? (
                                    passwordErrors.map((error, index) => (
                                        <p key={index} className="text-xs text-red-500 flex items-center">
                                            <span className="mr-1">✗</span> {error}
                                        </p>
                                    ))
                                ) : (
                                    <p className="text-xs text-green-500 flex items-center">
                                        <span className="mr-1">✓</span> Password meets all requirements
                                    </p>
                                )}
                            </div>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                            Use 8 or more characters with a mix of letters, numbers & symbols
                        </p>
                    </div>

                    {/* Promotional Code */}
                    {/* <div>
                        <label className="block text-md text-gray-600 mb-2">Promotional Code</label>
                        <input
                            type="text"
                            name="promotionalCode"
                            value={formData.promotionalCode}
                            onChange={handleInputChange}
                            placeholder="Enter your Promotional Code"
                            className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div> */}

                    {/* Gender */}
                    <div>
                        <label className="block text-md text-gray-600 mb-3">
                            What's your gender? <span className="text-gray-400">(optional)</span>
                        </label>
                        <div className="flex space-x-6">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="gender"
                                    value="female"
                                    checked={formData.gender === "female"}
                                    onChange={handleInputChange}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                />
                                <span className="ml-2 text-md text-gray-700">Female</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="gender"
                                    value="male"
                                    checked={formData.gender === "male"}
                                    onChange={handleInputChange}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                />
                                <span className="ml-2 text-md text-gray-700">Male</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="gender"
                                    value="non-binary"
                                    checked={formData.gender === "non-binary"}
                                    onChange={handleInputChange}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                />
                                <span className="ml-2 text-md text-gray-700">Non-binary</span>
                            </label>
                        </div>
                    </div>

                    {/* Date of Birth */}
                    <div>
                        <label className="block text-md text-gray-600 mb-3">What's your date of birth?</label>
                        <div className="grid grid-cols-3 gap-3">
                            <select
                                name="birthMonth"
                                value={formData.birthMonth}
                                onChange={handleInputChange}
                                className="px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            >
                                <option value="">Month</option>
                                {months.map((month, index) => (
                                    <option key={month} value={index + 1}>
                                        {month}
                                    </option>
                                ))}
                            </select>
                            <select
                                name="birthDate"
                                value={formData.birthDate}
                                onChange={handleInputChange}
                                className="px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            >
                                <option value="">Date</option>
                                {days.map((day) => (
                                    <option key={day} value={day}>
                                        {day}
                                    </option>
                                ))}
                            </select>
                            <select
                                name="birthYear"
                                value={formData.birthYear}
                                onChange={handleInputChange}
                                className="px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            >
                                <option value="">Year</option>
                                {years.map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Agreement Checkbox */}
                    <div className="flex items-start space-x-3">
                        <input
                            type="checkbox"
                            name="agreeToShare"
                            checked={formData.agreeToShare}
                            onChange={handleInputChange}
                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="text-md text-gray-600 leading-relaxed">
                            Share my registration data with our content providers for marketing purposes.
                        </label>
                    </div>

                    {/* Terms Agreement */}
                    <p className="text-xs text-gray-500 leading-relaxed">
                        By creating an account, you agree to the{" "}
                        <a href="#" className="text-blue-500 hover:text-blue-600">
                            Terms of use
                        </a>{" "}
                        and{" "}
                        <a href="#" className="text-blue-500 hover:text-blue-600">
                            Privacy Policy
                        </a>
                        .
                    </p>

                    {/* Submit Button */}
                    <AuthButton
                        text={isLoading ? "Creating Account..." : "Sign Up"}
                        type="submit"
                        className="w-full "
                        disabled={isLoading}
                    />

                    {/* Switch to Login */}
                    <p className="text-center text-md text-gray-600">
                        Already have an account?{" "}
                        <button
                            type="button" onClick={() => navigate('/signin')} className="text-blue-500 hover:text-blue-600 font-medium cursor-pointer">
                            Log in
                        </button>
                    </p>
                </form>
            </div>
        </div>
    )
}

export default SignUpPage
