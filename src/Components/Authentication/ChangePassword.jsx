"use client"

import { useState } from "react"
import { FaEye, FaEyeSlash, FaArrowLeft } from "react-icons/fa"
import { useNavigate } from "react-router-dom"
import { useChangePasswordMutation } from "../../hooks/mutations/useProfileSettings"
import Navbar from "../Navbar"

function ChangePassword() {
  const navigate = useNavigate()
  const changePasswordMutation = useChangePasswordMutation()
  
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState({})

  // Handle password form input change
  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  // Validate form
  const validateForm = () => {
    const newErrors = {}
    
    if (!passwordForm.oldPassword) {
      newErrors.oldPassword = "Current password is required"
    }
    
    if (!passwordForm.newPassword) {
      newErrors.newPassword = "New password is required"
    } else if (passwordForm.newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters"
    }
    
    if (!passwordForm.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your new password"
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle password change submit
  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    try {
      await changePasswordMutation.mutateAsync({
        old_password: passwordForm.oldPassword,
        new_password: passwordForm.newPassword,
      })
      
      // Reset form and go back
      setPasswordForm({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      navigate("/settings/profile_settings")
    } catch (error) {
      console.error("Failed to change password:", error)
    }
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="py-7">
        <Navbar />
      </div>
      
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="2xl:px-44 xl:px-36 lg:px-28 md:px-20 sm:px-14 px-8">
          {/* Back Button */}
          <button
            onClick={() => navigate("/settings/profile_settings")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <FaArrowLeft />
            <span>Back to Settings</span>
          </button>
          
          <div className="bg-white rounded-lg shadow-sm max-w-lg mx-auto p-6 sm:p-8">
            {/* Page Title */}
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 text-center mb-8">
              Change Password
            </h2>

            <form onSubmit={handlePasswordChangeSubmit} className="space-y-6">
              {/* Old Password */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Current Password</label>
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                  >
                    {showOldPassword ? <FaEyeSlash className="text-xs" /> : <FaEye className="text-xs" />}
                    <span>{showOldPassword ? "Hide" : "Show"}</span>
                  </button>
                </div>
                <input
                  type={showOldPassword ? "text" : "password"}
                  name="oldPassword"
                  value={passwordForm.oldPassword}
                  onChange={handlePasswordInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.oldPassword ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter your current password"
                />
                {errors.oldPassword && (
                  <p className="mt-1 text-xs text-red-500">{errors.oldPassword}</p>
                )}
              </div>

              {/* New Password */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">New Password</label>
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                  >
                    {showNewPassword ? <FaEyeSlash className="text-xs" /> : <FaEye className="text-xs" />}
                    <span>{showNewPassword ? "Hide" : "Show"}</span>
                  </button>
                </div>
                <input
                  type={showNewPassword ? "text" : "password"}
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.newPassword ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter your new password"
                />
                {errors.newPassword && (
                  <p className="mt-1 text-xs text-red-500">{errors.newPassword}</p>
                )}
              </div>

              {/* Confirm New Password */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <FaEyeSlash className="text-xs" /> : <FaEye className="text-xs" />}
                    <span>{showConfirmPassword ? "Hide" : "Show"}</span>
                  </button>
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.confirmPassword ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Confirm your new password"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={changePasswordMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 rounded-full transition-colors text-lg mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChangePassword
