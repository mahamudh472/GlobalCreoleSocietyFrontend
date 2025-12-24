import React from "react";
import { FaUserCircle } from "react-icons/fa";
import MySocietyCoverpicUpload from "./MySocietyCoverpicUpload";
import { useUpdateSocietyMutation } from "../../hooks/mutations/useSocieties";
import { useParams, useNavigate } from "react-router-dom";
import { useSocietyMembers } from "../../hooks/queries/useSocieties";
import { DEFAULT_AVATAR } from "../../utils/defaultAvatar";

const GroupSection = ({ society, isCreator = false }) => {
  const { id: societyId } = useParams();
  const navigate = useNavigate();
  const updateMutation = useUpdateSocietyMutation();

  // Use TanStack Query for fetching members
  const { data: membersData = [], isLoading: loading } =
    useSocietyMembers(societyId);
    
  const handleCoverChange = (file) => {
    if (!file || !societyId) return;
    const formData = new FormData();
    formData.append("cover_image", file);
    updateMutation.mutate({ societyId, societyData: formData });
  };

  // Show first 8 members
  const displayMembers = membersData.slice(0, 8);
  const membersCount = society?.members_count || society?.member_count || 0;

  const handleSeeAll = () => {
    navigate(`/society/${societyId}/members`);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden mx-auto ">
      {/* Cover Image Section */}
      <div className="relative">
        <MySocietyCoverpicUpload
          coverImage={society?.cover_image_url}
          onChangeImage={handleCoverChange}
          isUploading={updateMutation.isPending}
          isCreator={isCreator}
        />
      </div>

      {/* Profile Row Section */}
      <div className="p-4 flex flex-col items-start">
        <div className="flex items-center justify-between w-full mb-4">
          <span className="text-gray-600 font-medium">
            Members · {membersCount.toLocaleString()}
          </span>
          {membersData.length > 0 && (
            <button
              onClick={handleSeeAll}
              className="text-blue-600 text-sm hover:text-blue-800 hover:underline"
            >
              SEE ALL
            </button>
          )}
        </div>
        {loading ? (
          <div className="flex -space-x-2">
            {[...Array(8)].map((_, index) => (
              <div
                key={index}
                className="w-10 h-10 rounded-full bg-gray-200 animate-pulse border-2 border-white"
              ></div>
            ))}
          </div>
        ) : displayMembers.length > 0 ? (
          <div className="flex flex-wrap -space-x-2 w-full">
            {displayMembers.map((member, index) => (
              <div key={index} className="flex flex-col items-center group relative">
                <div className="relative">
                  <img
                    src={
                      member.user?.profile_image ||
                      DEFAULT_AVATAR
                    }
                    alt={member.user?.profile_name || "Member"}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white transition-all duration-200 group-hover:scale-110 group-hover:border-blue-500 group-hover:z-10 cursor-pointer shadow-sm"
                    title={member.user?.profile_name || member.user?.email}
                  />
                </div>
              </div>
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
