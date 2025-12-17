import React from "react";
import { Link } from "react-router-dom";

const GoLivePage = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex justify-center py-10">
      <div className="w-full max-w-md  rounded-xl  overflow-hidden">
        {/* Header */}

        {/* Post Content */}
        <div className="p-4 bg-white mb-6 rounded-xl">
          <div className="p-4 ">
            <h2 className="text-sm font-semibold text-gray-800">
              Add live post details
            </h2>
          </div>
          {/* Title */}
          <input
            type="text"
            placeholder="Title (optional)"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-none border-gray-200"
          />

          {/* User */}
          <div className="flex items-center mt-4">
            <img
              src="https://api.dicebear.com/7.x/initials/svg?seed=Ahmad"
              alt="User"
              className="w-9 h-9 rounded-full"
            />
            <span className="ml-3 text-sm font-semibold text-gray-800">
              Ahmad Nur Fawaid
            </span>
          </div>

          {/* What's on your mind */}
          <textarea
            placeholder="What's on your mind?"
            className="w-full mt-3 text-sm resize-none border-none focus:outline-none"
            rows={3}
          />

          {/* Share button */}
          <div className="flex justify-end mt-4">
            <button className="bg-blue-500 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700">
              Share now
            </button>
          </div>
        </div>

        {/* Camera Controls */}
        <div className=" p-4 bg-white  rounded-xl pb-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-1">
            Camera controls
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Check that your camera and microphone inputs are properly working
            before going live.
          </p>

          {/* Camera Select */}
          <select className="w-full mb-3 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>Select a media source</option>
            <option>Front Camera</option>
            <option>Back Camera</option>
          </select>

          {/* Microphone Select */}
          <select className="w-full mb-3 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>Select a media source</option>
            <option>Default Microphone</option>
          </select>

          {/* Screen Share */}
          <button className="w-full mb-4 border-gray-200 bg-gray-100 text-sm py-2 rounded-lg border hover:bg-gray-100">
            Start screen share
          </button>
          <Link to="/feed/livestream">
            <button className="w-full bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-700">
              Go Live
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default GoLivePage;
