import React, { useState } from "react";
import {
  FaUser,
  FaLock,
  FaKey,
  FaPhone,
  FaEnvelope,
  FaBirthdayCake,
  FaChevronRight,
} from "react-icons/fa";
import Navbar from "../Navbar";
import { useNavigate } from "react-router-dom";
import { CiEdit } from "react-icons/ci";

function ProfileSettings() {
  const [isProfileLocked, setIsProfileLocked] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneNumbers, setPhoneNumbers] = useState(["+1123654789"]);
  const [emailInput, setEmailInput] = useState("");
  const [emails, setEmails] = useState(["email@email.com"]);
  const navigate = useNavigate();

  // User data
  const userData = {
    name: "Emon Hasan",
    email: "email@email.com",
    birthday: "October 28, 1990",
  };

  // Handle profile lock toggle
  const handleProfileLockToggle = () => {
    setIsProfileLocked(!isProfileLocked);
    console.log("Profile Lock Status:", !isProfileLocked);
    console.log("User Data:", userData);
  };

  // Handle change password click
  const handleChangePassword = () => {
    console.log("Change Password clicked");
    console.log("Current User:", userData.name);
  };

  // Handle contact info click
  const handleContactInfoClick = () => {
    setContactModalOpen(true);
  };

  const validatePhone = (val) => {
    // Basic international phone validation: starts with + optional, digits 7-15
    const cleaned = val.replace(/\s|-/g, "");
    return /^\+?[0-9]{7,15}$/.test(cleaned);
  };

  const validateEmail = (val) => {
    // Basic email validation pattern
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const addPhoneNumber = () => {
    if (!validatePhone(phoneInput)) return;
    const normalized = phoneInput.replace(/\s|-/g, "");
    if (phoneNumbers.includes(normalized)) return;
    setPhoneNumbers((prev) => [...prev, normalized]);
    setPhoneInput("");
  };

  const removePhoneNumber = (num) => {
    setPhoneNumbers((prev) => prev.filter((n) => n !== num));
  };

  const addEmail = () => {
    if (!validateEmail(emailInput)) return;
    const normalized = emailInput.trim();
    if (emails.includes(normalized)) return;
    setEmails((prev) => [...prev, normalized]);
    setEmailInput("");
  };

  const removeEmail = (em) => {
    setEmails((prev) => prev.filter((e) => e !== em));
  };

  // Handle email click

  // Handle birthday click
  const handleBirthdayClick = () => {
    console.log("Birthday clicked");
    console.log("Birthday:", userData.birthday);
  };

  return (
    <div className="bg-gray-100">
      <div className="py-7">
        <Navbar></Navbar>
      </div>

      {/* Main part....................... */}
      <div className="min-h-screen  py-6 px-4 sm:px-6 lg:px-8">
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
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <FaUser className="text-white text-lg sm:text-xl" />
                </div>
                <span className="text-sm sm:text-base font-medium text-gray-900">
                  {userData.name}
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
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 cursor-pointer focus:ring-blue-500 focus:ring-offset-2 ${
                    isProfileLocked ? "bg-blue-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isProfileLocked ? "translate-x-6" : "translate-x-1"
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
                onClick={() => {
                  handleChangePassword();
                  navigate("/settings/profile_settings/chnage_password");
                }}
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
              Meta uses this information to verify your identity and to keep our
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
                    <span className="text-blue-600 text-lg leading-none">
                      +
                    </span>
                  </span>
                  <span>Add Phone Number</span>
                </button>

                {/* Phone list */}
                <div className="mt-4 space-y-3">
                  {phoneNumbers.map((num) => (
                    <div
                      key={num}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gray-300" />
                        <span className="text-sm text-gray-700">{num}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePhoneNumber(num)}
                        className="px-3 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
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
                  onClick={() => setEmailModalOpen(true)}
                  className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 border border-blue-200">
                    <span className="text-blue-600 text-lg leading-none">
                      +
                    </span>
                  </span>
                  <span>Add Email</span>
                </button>

                {/* Email list */}
                <div className="mt-4 space-y-3">
                  {emails.map((em) => (
                    <div key={em} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gray-300" />
                        <span className="text-sm text-gray-700">{em}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeEmail(em)}
                        className="px-3 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Birthday */}
              <button
                onClick={handleBirthdayClick}
                className="w-full flex items-center justify-between hover:bg-gray-50 transition-colors p-4 sm:p-6"
              >
                <div className="text-left">
                  <div className="text-sm sm:text-base font-medium text-gray-900 mb-1">
                    Birthday
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500">
                    {userData.birthday}
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Contact Info Modal */}
      {contactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white w-11/12 sm:w-[480px] rounded-lg shadow-lg p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Add phone number
              </h3>
              <button
                onClick={() => setContactModalOpen(false)}
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
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setContactModalOpen(false)}
                  className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={addPhoneNumber}
                  disabled={!validatePhone(phoneInput)}
                  className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Email Modal */}
      {emailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white w-11/12 sm:w-[480px] rounded-lg shadow-lg p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add email</h3>
              <button
                onClick={() => setEmailModalOpen(false)}
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
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setEmailModalOpen(false)}
                  className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    addEmail();
                    if (validateEmail(emailInput)) setEmailModalOpen(false);
                  }}
                  disabled={!validateEmail(emailInput)}
                  className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
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
