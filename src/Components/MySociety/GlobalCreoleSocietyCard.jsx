import React, { useState } from "react";
import { FaPencilAlt } from "react-icons/fa";
import SocietyImgUpload from "./SocietyImgUpload";
import InviteFriendsModal from "./InviteFriendsModal";
import { useNavigate, useParams } from "react-router-dom";
import { useCurrentUser } from "../../hooks/queries/useUser";
import {
  useJoinSocietyMutation,
  useLeaveSocietyMutation,
} from "../../hooks/mutations/useSocieties";
import { toast } from "react-toastify";
import {
  usePendingMembers,
  usePendingPosts,
} from "../../hooks/queries/useSocieties";
import { useUpdateSocietyMutation } from "../../hooks/mutations/useSocieties";
import { API_BASE_URL } from "../../config/apiConfig";

const GlobalCreoleSocietyCard = ({ society, postsCount = 0 }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: currentUser } = useCurrentUser();
  const joinMutation = useJoinSocietyMutation();
  const leaveMutation = useLeaveSocietyMutation();
  const updateMutation = useUpdateSocietyMutation();
  const { data: pending = [], isLoading: loadingPending } = usePendingPosts(id);
  const { data: pendingMembers = [], isLoading: loadingPendingMembers } =
    usePendingMembers(id);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editDescription, setEditDescription] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  if (!society) {
    return (
      <div className="bg-white rounded-xl p-4">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const societyImage = society?.profile_image ?? society?.avatar ?? null;

  const members = society.members_count || society.member_count || 0;
  const media = 0; // TODO: Add media count when available

  // Check if current user is the creator
  const isCreator =
    currentUser && society.creator && currentUser.id === society.creator.id;
  const isMember = society.is_member;

  const handleJoin = () => {
    joinMutation.mutate(id, {
      onSuccess: () => {
        if (society.privacy === "private") {
          toast.success("Join request sent");
        } else {
          toast.success("Joined society successfully");
        }
      },
    });
  };

  const handleLeave = () => {
    if (!window.confirm(`Are you sure you want to leave ${society.name}?`)) {
      return;
    }

    leaveMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Left society successfully");
      },
    });
  };

  const handleEditAbout = () => {
    setEditDescription(society.description || "");
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!id) return;
    
    const formData = new FormData();
    if (editDescription !== (society.description || "")) {
      formData.append("description", editDescription);
    }
    
    if ([...formData.keys()].length === 0) {
      setIsEditing(false);
      return;
    }

    updateMutation.mutate(
      { societyId: id, societyData: formData },
      {
        onSuccess: () => {
          setIsEditing(false);
        }
      }
    );
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleAvatarImageChange = (file) => {
    if (!file || !id) return;
    const formData = new FormData();
    formData.append("profile_image", file);
    updateMutation.mutate({ societyId: id, societyData: formData });
  };

  return (
    <div className="rounded-xl mx-auto flex flex-col items-center text-center">
      {/* Main Society Card */}
      <div className="relative bg-white w-full rounded-xl p-4 mt-20 lg:mt-36 pt-16">
        <h2 className="text-lg font-semibold text-gray-800 mt-4">
          {society.name}
        </h2>
        <div className="flex justify-around w-full mt-4 text-gray-600">
          <div>
            <p className="text-xl font-bold">{postsCount.toLocaleString()}</p>
            <p className="text-sm">Post</p>
          </div>
          <div>
            <p className="text-xl font-bold">{members.toLocaleString()}</p>
            <p className="text-sm">Members</p>
          </div>
          <div>
            <p className="text-xl font-bold">{media.toLocaleString()}</p>
            <p className="text-sm">Media</p>
          </div>
        </div>
        <button 
          onClick={() => setShowInviteModal(true)}
          className="mt-6 w-full bg-blue-600 text-white py-2 rounded-xl font-medium hover:bg-blue-700 transition duration-200"
        >
          Invite
        </button>

        {/* Join/Leave Button - Don't show for creator */}
        {!isCreator &&
          (isMember ? (
            <button
              onClick={handleLeave}
              disabled={leaveMutation.isPending}
              className="mt-3 w-full bg-red-500 text-white py-2 rounded-xl font-medium hover:bg-red-600 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {leaveMutation.isPending ? "Leaving..." : "Leave Society"}
            </button>
          ) : (
            <button
              onClick={handleJoin}
              disabled={joinMutation.isPending}
              className="mt-3 w-full bg-green-500 text-white py-2 rounded-xl font-medium hover:bg-green-600 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {joinMutation.isPending
                ? "Joining..."
                : society.privacy === "private"
                ? "Request to Join"
                : "Join Society"}
            </button>
          ))}

        {/* Society Avatar - Positioned absolutely */}
        <section className="absolute -top-16 lg:-top-36 left-1/2 -translate-x-1/2">{(() => {
            const baseHost = API_BASE_URL.replace(/\/?api\/?$/, "");
            const toAbsolute = (u) => {
              if (!u || typeof u !== "string") return undefined;
              if (/^https?:\/\//i.test(u)) return u;
              if (u.startsWith("/")) return `${baseHost}${u}`;
              return `${baseHost}/${u}`;
            };

            const rawImage =
              society.profile_image ||
              society.profile_image_url ||
              society.avatar ||
              society.image_url ||
              society.image;
            const societyImage = toAbsolute(rawImage);

            return (
              <SocietyImgUpload
                societyId={id}
                societyImage={societyImage}
                onChangeImage={handleAvatarImageChange}
                isUploading={updateMutation.isPending}
                isCreator={isCreator}
              />
            );
          })()}
        </section>
      </div>

      {/* Society Creator Info */}
      <div className="bg-white rounded-xl p-4 w-full mt-4">
        <div className="flex items-center gap-3">
          <img
            src={
              society.creator?.profile_image ||
              "https://via.placeholder.com/50"
            }
            alt="Creator"
            className="w-10 h-10 rounded-full object-cover border border-gray-300"
          />
          <div className="text-left flex-1">
            <p className="text-xs text-gray-600">Society Created by</p>
            <p className="font-semibold text-gray-800">
              {society.creator?.profile_name ||
                society.creator?.username ||
                society.creator?.email ||
                "Unknown"}
            </p>
            <p className="text-gray-500 text-xs">
              {society.created_at
                ? new Date(society.created_at).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Pending Posts */}
      <div
        onClick={() => navigate(`/society/${id}/pending_posts`)}
        className="bg-white rounded-xl p-4 w-full mt-4 flex justify-between items-center cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all duration-200"
      >
        <p className="text-gray-700 font-semibold">Pending Posts</p>
        <p className="text-lg font-bold text-gray-800">
          {loadingPending ? "…" : pending.length}
        </p>
      </div>

      {/* Pending Members */}
      <div
        onClick={() => navigate(`/society/${id}/pending_members`)}
        className="bg-white rounded-xl p-4 w-full mt-4 flex justify-between items-center cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all duration-200"
      >
        <p className="text-gray-700 font-semibold">Pending Members</p>
        <p className="text-lg font-bold text-gray-800">
          {loadingPendingMembers
            ? "…"
            : pendingMembers?.count ??
              (Array.isArray(pendingMembers)
                ? pendingMembers.length
                : pendingMembers?.results?.length ?? 0)}
        </p>
      </div>

      {/* About Group */}
      <div className="bg-white rounded-xl p-4 w-full mt-4">
        <div className="flex justify-between items-center mb-3">
          <p className="text-gray-800 font-semibold">About Group</p>
          {isCreator && !isEditing && (
            <button
              onClick={handleEditAbout}
              className="text-sm text-gray-700 hover:bg-gray-100 border border-gray-300 px-4 py-1.5 rounded-lg transition-colors duration-200"
            >
              Edit
            </button>
          )}
        </div>
        
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows="5"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-800"
              placeholder="Enter group description"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCancelEdit}
                className="flex-1 text-sm text-gray-700 bg-gray-200 hover:bg-gray-300 py-2 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={updateMutation.isPending}
                className="flex-1 text-sm bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateMutation.isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        ) : society.description && society.description.trim().length ? (
          <p className="text-gray-700 whitespace-pre-line text-sm leading-relaxed text-left">
            {society.description}
          </p>
        ) : (
          <p className="text-gray-500 text-sm italic text-left">No description yet.</p>
        )}
      </div>

      {/* Invite Friends Modal */}
      <InviteFriendsModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        societyId={id}
        societyName={society?.name}
      />
    </div>
  );
};

export default GlobalCreoleSocietyCard;
