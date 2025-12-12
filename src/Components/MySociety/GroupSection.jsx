import React from "react";
import { FaUserCircle } from "react-icons/fa";
import MySocietyCoverpicUpload from "./MySocietyCoverpicUpload";
import { useParams } from "react-router-dom";
import { useSocietyMembers } from "../../hooks/queries/useSocieties";

const GroupSection = ({ society }) => {
  const { id: societyId } = useParams();

  // Use TanStack Query for fetching members
  const { data: membersData = [], isLoading: loading } =
    useSocietyMembers(societyId);

  // Show first 8 members
  const members = membersData.slice(0, 8);
  const membersCount = society?.members_count || society?.member_count || 0;

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden mx-auto ">
      {/* Cover Image Section */}
      <div className="relative">
        <button className="absolute top-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-full font-medium hover:bg-gray-700 transition duration-200 z-10">
          Edit Cover
        </button>

        <MySocietyCoverpicUpload
          coverImage={society?.cover_image || society?.cover_image}
        />
      </div>

      {/* Profile Row Section */}
      <div className="p-4 flex flex-col items-start">
        <div className="flex items-center justify-between w-full mb-4">
          <span className="text-gray-600 font-medium">
            Members · {membersCount.toLocaleString()}
          </span>
          <a
            href="#"
            className="text-blue-600 text-sm hover:text-blue-800 hover:underline"
          >
            SEE ALL
          </a>
        </div>
        {loading ? (
          <div className="flex space-x-2">
            {[...Array(8)].map((_, index) => (
              <div
                key={index}
                className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"
              ></div>
            ))}
          </div>
        ) : members.length > 0 ? (
          <div className="flex overflow-x-auto space-x-2 pb-2 scrollbar-hide">
            {members.map((member, index) => (
              <img
                key={index}
                src={
                  member.user?.profile_image ||
                  "https://thumbs.dreamstime.com/b/profile-picture-caucasian-male-employee-posing-office-happy-young-worker-look-camera-workplace-headshot-portrait-smiling-190186649.jpg"
                }
                alt={member.user?.profile_name || "Member"}
                className="w-10 h-10 rounded-full object-cover transition-transform duration-200 hover:scale-110"
                title={member.user?.profile_name || member.user?.email}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No members to display</p>
        )}
      </div>
    </div>
  );
};

export default GroupSection;
