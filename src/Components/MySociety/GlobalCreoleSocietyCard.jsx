import React from "react";
import { FaPencilAlt } from "react-icons/fa";
import SocietyImgUpload from "./SocietyImgUpload";
import { useNavigate, useParams } from "react-router-dom";
import { useCurrentUser } from "../../hooks/queries/useUser";
import {
  useJoinSocietyMutation,
  useLeaveSocietyMutation,
} from "../../hooks/mutations/useSocieties";
import { toast } from "react-toastify";
import { usePendingMembers, usePendingPosts } from "../../hooks/queries/useSocieties";

const GlobalCreoleSocietyCard = ({ society, postsCount = 0 }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: currentUser } = useCurrentUser();
  const joinMutation = useJoinSocietyMutation();
  const leaveMutation = useLeaveSocietyMutation();
  const { data: pending = [], isLoading: loadingPending } = usePendingPosts(id);
  const { data: pendingMembers = [], isLoading: loadingPendingMembers } = usePendingMembers(id);  

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

  return (
    <div className=" rounded-xl mx-auto flex flex-col items-center text-center">
      <div className=" relative bg-white w-full p rounded-xl p-4 mt-20 lg:mt-36 pt-15">
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
        <button className="mt-6 w-full bg-blue-600 text-white py-2 rounded-xl font-medium hover:bg-blue-700 transition duration-200">
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

        <section className="absolute -top-15 lg:-top-36 left-1/2 -translate-x-1/2 ">
          <SocietyImgUpload
            societyImage={society.cover_picture || society.cover_image}
          />
        </section>
      </div>

      <div className="rounded-lg  mt-5  mx-auto">
        <div className="flex items-center mb-4 bg-white rounded-lg p-2 px-4">
          <img
            src={
              society.creator?.profile_image ||
              "https://www.shutterstock.com/image-photo/happy-handsome-young-business-leader-260nw-2375039955.jpg"
            }
            alt="Creator"
            className="w-10 h-10 rounded-full mr-2 object-cover"
          />
          <div>
            <p className="text-gray-600 text-sm">Society Created by</p>
            <p className="font-semibold">
              {society.creator?.profile_name ||
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
        <div
          onClick={() => {
            navigate(`/society/${id}/pending_posts`);
          }}
          className="mb-4 bg-white rounded-lg p-2 px-4 flex justify-between cursor-pointer transform transition-transform duration-700 ease-in-out hover:scale-101"
        >
          <p className="text-gray-600 font-semibold">Pending Posts</p>
          <p className="text-lg font-bold">
            {loadingPending
              ? "…"
              // : Array.isArray(pending)
              : pending.length
              // : pending?.results?.length ?? 80}
            }
          </p>
        </div>

        <div
          onClick={() => {
            navigate(`/society/${id}/pending_members`);
          }}
          className="mb-4 flex justify-between bg-white rounded-lg p-2 px-4 cursor-pointer transform transition-transform duration-700 ease-in-out hover:scale-101"
        >
          <p className="text-gray-600 font-semibold">Pending Members</p>
          <p className="text-lg font-bold">{loadingPendingMembers ? "…" : pendingMembers.length}</p>
        </div>
        <div className="mb-4 bg-white rounded-lg p-2 px-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-gray-600 font-semibold">About Group</p>
            <button className=" text-sm hover:underline border border-[#E2E8F0]  p-1 px-6 rounded-lg cursor-pointer">
              Edit
            </button>
          </div>
          <hr className=" border border-[#F0F0F0] my-3" />
          <p className="text-gray-800">UI/UX Designers group</p>
          <p className="text-gray-600 text-sm mt-1">
            This group is meant for designers - a place to learn and share - to
            ask questions, network, and improve.
          </p>
          <p className="text-gray-600 text-sm mt-1">
            Hashtag your posts to help others easily navigate. Avoid using more
            than a single hashtag per post.
          </p>
          <p className="text-gray-600 text-sm mt-1">
            Suggested tags include: #job #blog #dribbble #learn #discuss
            #contest #portfolio
          </p>
        </div>
      </div>
    </div>
  );
};

export default GlobalCreoleSocietyCard;
