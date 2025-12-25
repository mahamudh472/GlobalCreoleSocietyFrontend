import React, { useEffect, useRef } from "react";
import { FaUser, FaBan, FaQuestionCircle } from "react-icons/fa";
import { MdOutlineExpandLess } from "react-icons/md";
import { Link } from "react-router-dom";

const Modal = ({ isOpen, onClose }) => {
  const modalRef = useRef(null);
  const modalContentRef = useRef(null);

  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalContentRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black/30 bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4"
    >
      <div
        ref={modalContentRef}
        className="bg-white rounded-lg shadow-md p-3 sm:p-4 max-w-md w-full"
      >
        <h2 className="text-gray-800 text-base sm:text-lg font-semibold mb-3 sm:mb-4">Settings</h2>

        <hr className="border border-[#E2E8F0] my-2 sm:my-3" />
        <div className="space-y-2">
          <Link
            to="/settings/profile_settings"
            className="flex items-center justify-between bg-blue-100 rounded-lg p-2.5 sm:p-3 hover:bg-blue-200 transition duration-200"
          >
            <div className="flex items-center">
              <FaUser className="text-blue-600 mr-2 w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-gray-700 text-sm sm:text-base">Account Center</span>
            </div>
            <MdOutlineExpandLess className="rotate-90 w-5 h-5 sm:w-6 sm:h-6" />
          </Link>
          <Link
            to="/settings/blocking"
            className="flex items-center justify-between bg-blue-100 rounded-lg p-2.5 sm:p-3 hover:bg-blue-200 transition duration-200"
          >
            <div className="flex items-center">
              <FaBan className="text-blue-600 mr-2 w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-gray-700 text-sm sm:text-base">Blocking</span>
            </div>
            <MdOutlineExpandLess className="rotate-90 w-5 h-5 sm:w-6 sm:h-6" />
          </Link>
        </div>
        <h2 className="text-gray-800 text-base sm:text-lg font-semibold mt-3 sm:mt-4 mb-3 sm:mb-4">
          Support
        </h2>

        <div className="space-y-2">
          <Link
            to="/settings/help_center"
            className="flex items-center justify-between bg-blue-100 rounded-lg p-2.5 sm:p-3 hover:bg-blue-200 transition duration-200"
          >
            <div className="flex items-center">
              <FaQuestionCircle className="text-blue-600 mr-2 w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-gray-700 text-sm sm:text-base">Help Center</span>
            </div>
            <MdOutlineExpandLess className="rotate-90 w-5 h-5 sm:w-6 sm:h-6" />
          </Link>
        </div>
        <button
          onClick={onClose}
          className="mt-3 sm:mt-4 bg-gray-300 py-1.5 sm:py-2 px-3 sm:px-4 rounded hover:bg-gray-400 transition duration-200 cursor-pointer text-sm sm:text-base"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default Modal;
