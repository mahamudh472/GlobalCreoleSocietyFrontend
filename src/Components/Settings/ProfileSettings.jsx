import React, { useState } from "react";
import {
  FaUser,
  FaLock,
  FaKey,
  FaChevronRight,
} from "react-icons/fa";
import Navbar from "../Navbar";
import { useNavigate } from "react-router-dom";
import { CiEdit } from "react-icons/ci";
import { useCurrentUserProfile } from "../../hooks/queries/useUser";
import {
  useToggleProfileLockMutation,
  useSendOTPMutation,
  useAddEmailMutation,
  useDeleteEmailMutation,
  useAddPhoneNumberMutation,
  useDeletePhoneNumberMutation,
} from "../../hooks/mutations/useProfileSettings";

function ProfileSettings() {
  const navigate = useNavigate();
  
  // Fetch current user profile
  const { data: userData, isLoading, refetch } = useCurrentUserProfile();
  
  // Mutations
  const toggleProfileLock = useToggleProfileLockMutation();
  const sendOTP = useSendOTPMutation();
  const addEmailMutation = useAddEmailMutation();
  const deleteEmailMutation = useDeleteEmailMutation();
  const addPhoneNumberMutation = useAddPhoneNumberMutation();
  const deletePhoneNumberMutation = useDeletePhoneNumberMutation();
  
  // Modal states
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  
  // Form states
  const [phoneInput, setPhoneInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // Format birthday
  const formatBirthday = (dateString) => {
    if (!dateString) return "Not set";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Handle profile lock toggle
  const handleProfileLockToggle = () => {
    toggleProfileLock.mutate(undefined, {
      onSuccess: () => refetch(),
    });
  };

  // Validation functions
  const validatePhone = (val) => {
    const cleaned = val.replace(/\s|-/g, "");
    return /^\+?[0-9]{7,15}$/.test(cleaned);
  };

  const validateEmail = (val) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  // Handle send OTP
  const handleSendOTP = async () => {
    try {
      await sendOTP.mutateAsync();
      setOtpSent(true);
    } catch (error) {
      console.error("Failed to send OTP:", error);
    }
  };

  // Reset modal state
  const resetModalState = () => {
    setPasswordInput("");
    setOtpInput("");
    setOtpSent(false);
    setEmailInput("");
    setPhoneInput("");
  };

  // Handle add phone number
  const handleAddPhone = async () => {
    if (!validatePhone(phoneInput)) return;
    
    try {
      await addPhoneNumberMutation.mutateAsync({
        phone_number: phoneInput.replace(/\s|-/g, ""),
        password: passwordInput,
        code: otpInput,
      });
      setContactModalOpen(false);
      resetModalState();
      refetch();
    } catch (error) {
      console.error("Failed to add phone:", error);
    }
  };

  // Handle remove phone number
  const handleRemovePhone = async (phoneId) => {
    try {
      await deletePhoneNumberMutation.mutateAsync(phoneId);
      refetch();
    } catch (error) {
      console.error("Failed to remove phone:", error);
    }
  };

  // Handle add email
  const handleAddEmail = async () => {
    if (!validateEmail(emailInput)) return;
    
    try {
      await addEmailMutation.mutateAsync({
        email: emailInput.trim(),
        password: passwordInput,
        code: otpInput,
      });
      setEmailModalOpen(false);
      resetModalState();
      refetch();
    } catch (error) {
      console.error("Failed to add email:", error);
    }
  };

  // Handle remove email
  const handleRemoveEmail = async (emailId) => {
    try {
      await deleteEmailMutation.mutateAsync(emailId);
      refetch();
    } catch (error) {
      console.error("Failed to remove email:", error);
    }
  };

  // Open phone modal
  const handleContactInfoClick = () => {
    resetModalState();
    setContactModalOpen(true);
  };

  // Open email modal
  const handleEmailClick = () => {
    resetModalState();
    setEmailModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="bg-gray-100 min-h-screen">
        <div className="py-7">
          <Navbar />
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  // Build phone numbers list (primary + extra)
  const phoneNumbers = [];
  if (userData?.phone_number) {
    phoneNumbers.push({ id: 'primary', phone_number: userData.phone_number, isPrimary: true });
  }
  if (userData?.extra_phone_numbers) {
    phoneNumbers.push(...userData.extra_phone_numbers.map(p => ({ ...p, isPrimary: false })));
  }

  // Build emails list (primary + extra)
  const emails = [];
  if (userData?.email) {
    emails.push({ id: 'primary', email: userData.email, isPrimary: true });
  }
  if (userData?.extra_emails) {
    emails.push(...userData.extra_emails.map(e => ({ ...e, isPrimary: false })));
  }

  return (
    <div className="bg-gray-100">
      <div className="py-7">
        <Navbar />
      </div>

      {/* Main part */}
      <div className="min-h-screen py-6 px-4 sm:px-6 lg:px-8">
        <div className="2xl:px-44 xl:px-36 lg:px-28 md:px-20 sm:px-14 px-8">
          {/* Profile Section */}
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Profile
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4">
              Manage your personal information, update your profile details, and
              control what others see about you.
            </p>

            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 space-y-4">
              {/* User Info */}
              <div className="flex items-center space-x-3">
                {userData?.profile_image ? (
                  <img
                    src={userData.profile_image}
                    alt={userData.profile_name}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <FaUser className="text-white text-lg sm:text-xl" />
                  </div>
                )}
                <span className="text-sm sm:text-base font-medium text-gray-900">
                  {userData?.profile_name || "User"}
                </span>
              </div>

              {/* Lock Profile Toggle */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <FaLock className="text-white text-sm sm:text-base" />
                  </div>
                  <span className="text-sm sm:text-base font-medium text-gray-900">
                    Lock your profile
                  </span>
                </div>

                {/* Toggle Switch */}
                <button
                  onClick={handleProfileLockToggle}
                  disabled={toggleProfileLock.isPending}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 cursor-pointer focus:ring-blue-500 focus:ring-offset-2 ${
                    userData?.profile_lock ? "bg-blue-500" : "bg-gray-300"
                  } ${toggleProfileLock.isPending ? "opacity-50" : ""}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      userData?.profile_lock ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Password Section */}
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Password
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4">
              Password change allows users to update their current password to a
              new one, ensuring account security and protecting personal
              information.
            </p>

            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <button
                onClick={() => navigate("/settings/profile_settings/chnage_password")}
                className="cursor-pointer w-full flex items-center justify-between hover:bg-gray-50 transition-colors rounded-lg p-2 -m-2"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <FaKey className="text-white text-sm sm:text-base" />
                  </div>
                  <span className="text-sm sm:text-base font-medium text-gray-900">
                    Change Password
                  </span>
                </div>
                <FaChevronRight className="text-gray-400 text-sm sm:text-base" />
              </button>
            </div>
          </div>

          {/* Personal Details Section */}
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Personal details
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4">
              This information is used to verify your identity and to keep our
              community safe. You decide what personal details you make visible
              to others.
            </p>

            <div className="bg-white rounded-lg shadow-sm">
              {/* Phone Number Card */}
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm sm:text-base font-medium text-gray-900">
                    Phone Number
                  </h3>
                  <CiEdit size={20} className="text-gray-600" />
                </div>

                {/* Add phone action row */}
                <button
                  type="button"
                  onClick={handleContactInfoClick}
                  className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 border border-blue-200">
                    <span className="text-blue-600 text-lg leading-none">+</span>
                  </span>
                  <span>Add Phone Number</span>
                </button>

                {/* Phone list */}
                <div className="mt-4 space-y-3">
                  {phoneNumbers.length === 0 ? (
                    <p className="text-sm text-gray-500">No phone numbers added</p>
                  ) : (
                    phoneNumbers.map((phone) => (
                      <div key={phone.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-xs text-gray-600">📱</span>
                          </div>
                          <div>
                            <span className="text-sm text-gray-700">{phone.phone_number}</span>
                            {phone.isPrimary && (
                              <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                Primary
                              </span>
                            )}
                          </div>
                        </div>
                        {!phone.isPrimary && (
                          <button
                            type="button"
                            onClick={() => handleRemovePhone(phone.id)}
                            disabled={deletePhoneNumberMutation.isPending}
                            className="px-3 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm disabled:opacity-50"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="border-t border-gray-100" />

              {/* Email Card */}
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm sm:text-base font-medium text-gray-900">
                    Email
                  </h3>
                  <CiEdit size={20} className="text-gray-600" />
                </div>

                {/* Add email action row */}
                <button
                  type="button"
                  onClick={handleEmailClick}
                  className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 border border-blue-200">
                    <span className="text-blue-600 text-lg leading-none">+</span>
                  </span>
                  <span>Add Email</span>
                </button>

                {/* Email list */}
                <div className="mt-4 space-y-3">
                  {emails.length === 0 ? (
                    <p className="text-sm text-gray-500">No emails added</p>
                  ) : (
                    emails.map((em) => (
                      <div key={em.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-xs text-gray-600">✉️</span>
                          </div>
                          <div>
                            <span className="text-sm text-gray-700">{em.email}</span>
                            {em.isPrimary && (
                              <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                Primary
                              </span>
                            )}
                          </div>
                        </div>
                        {!em.isPrimary && (
                          <button
                            type="button"
                            onClick={() => handleRemoveEmail(em.id)}
                            disabled={deleteEmailMutation.isPending}
                            className="px-3 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm disabled:opacity-50"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Birthday */}
              <div className="w-full flex items-center justify-between p-4 sm:p-6 border-t border-gray-100">
                <div className="text-left">
                  <div className="text-sm sm:text-base font-medium text-gray-900 mb-1">
                    Birthday
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500">
                    {formatBirthday(userData?.date_of_birth)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Add Phone Number Modal */}
      {contactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white w-11/12 sm:w-[480px] rounded-lg shadow-lg p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Add phone number
              </h3>
              <button
                onClick={() => {
                  setContactModalOpen(false);
                  resetModalState();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="e.g. +18005551234"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {phoneInput && !validatePhone(phoneInput) && (
                  <p className="mt-1 text-xs text-red-500">
                    Enter a valid phone number (7-15 digits).
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Verification Code
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    placeholder="Enter OTP"
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={sendOTP.isPending}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
                  >
                    {sendOTP.isPending ? "Sending..." : otpSent ? "Resend" : "Send OTP"}
                  </button>
                </div>
                {otpSent && (
                  <p className="mt-1 text-xs text-green-600">
                    OTP sent to your email
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setContactModalOpen(false);
                    resetModalState();
                  }}
                  className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddPhone}
                  disabled={!validatePhone(phoneInput) || !passwordInput || !otpInput || addPhoneNumberMutation.isPending}
                  className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addPhoneNumberMutation.isPending ? "Adding..." : "Add"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Email Modal */}
      {emailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white w-11/12 sm:w-[480px] rounded-lg shadow-lg p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add email</h3>
              <button
                onClick={() => {
                  setEmailModalOpen(false);
                  resetModalState();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="e.g. user@example.com"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {emailInput && !validateEmail(emailInput) && (
                  <p className="mt-1 text-xs text-red-500">
                    Enter a valid email address.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Verification Code
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    placeholder="Enter OTP"
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={sendOTP.isPending}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
                  >
                    {sendOTP.isPending ? "Sending..." : otpSent ? "Resend" : "Send OTP"}
                  </button>
                </div>
                {otpSent && (
                  <p className="mt-1 text-xs text-green-600">
                    OTP sent to your email
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setEmailModalOpen(false);
                    resetModalState();
                  }}
                  className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddEmail}
                  disabled={!validateEmail(emailInput) || !passwordInput || !otpInput || addEmailMutation.isPending}
                  className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addEmailMutation.isPending ? "Adding..." : "Add"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileSettings;
