import React, { useState } from "react";
import { Heart, MessageCircle } from "lucide-react";
import { FaShareFromSquare } from "react-icons/fa6";

const PendingPostCard = ({ post,  onShare, onApprove,onreject}) => {
  // Normalize incoming API shape to UI fields
  const username =
    post?.user?.username ||
    post?.author?.name ||
    post?.author_name ||
    "Unknown";
  const avatar =
    post?.user?.avatar ||
    post?.author?.avatar ||
    post?.author_avatar ||
    "/placeholder.svg";
  const timestamp =
    post?.user?.timestamp || post?.created_at || post?.timestamp || "";
  const content = post?.content || post?.text || post?.body || "";
  const image = post?.image || post?.image_url || post?.media?.url || null;

  return (
    <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <img
            src={avatar}
            alt={username}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h3 className="font-semibold text-gray-900">{username}</h3>
            <p className="text-sm text-gray-500">{timestamp}</p>
          </div>
        </div>
        <button
          onClick={onShare}
          className="p-2 hover:bg-gray-100 rounded-full cursor-pointer"
        ></button>
      </div>

      <div className="mb-3">
        <p className="text-gray-800 mb-3">{content}</p>
        {image && (
          <img
            src={image || "/placeholder.svg"}
            alt="Post content"
            className="w-full rounded-lg object-cover max-h-96"
          />
        )}
      </div>

      <div className="flex items-center justify-between gap-5  pt-3 border-t border-gray-100 ">
        <button
        onClick={onreject}
        className="border border-[#1E75FF] w-1/2 rounded-lg text-black py-1 hover:shadow-2xl cursor-pointer">
          Decline
        </button>
        <button
          onClick={onApprove}
          className="border border-[#1E75FF] bg-[#1E75FF] w-1/2 rounded-lg text-white py-1 hover:shadow-2xl cursor-pointer"
        >
          Approve
        </button>
      </div>
    </div>
  );
};

export default PendingPostCard;
