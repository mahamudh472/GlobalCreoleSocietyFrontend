import React, { useState } from "react";
import Navbar from "../Navbar";
import { useNavigate } from "react-router-dom";
import { FaPlus } from "react-icons/fa";
import CreateSocietyForm from "./CreateSocietyForm";
import { toast } from "react-toastify";
import { useSocieties, useUserSocieties } from "../../hooks/queries/useSocieties";
import {
  useJoinSocietyMutation,
  useLeaveSocietyMutation,
} from "../../hooks/mutations/useSocieties";
import { useCurrentUser } from "../../hooks/queries/useUser";
import { DEFAULT_GROUP_AVATAR } from "../../utils/defaultAvatar";

const SocietyCardGrid = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch user's societies separately
  const { data: yourSocieties = [], isLoading: loadingYours } = useUserSocieties();
  // Fetch available societies (not member of)
  const { data: availableSocieties = [], isLoading: loadingAvailable } = useSocieties({ available: true });
  const { data: currentUser } = useCurrentUser();

  // Use mutations
  const joinMutation = useJoinSocietyMutation();
  const leaveMutation = useLeaveSocietyMutation();

  // Show first 4 of each
  const yourSocietiesSlice = yourSocieties.slice(0, 4);
  const joinSocietiesSlice = availableSocieties.slice(0, 4);
  
  const loading = loadingYours || loadingAvailable;

  const handleLeave = (e, societyId, societyName) => {
    e.stopPropagation(); // Prevent navigation when clicking leave
    if (!window.confirm(`Are you sure you want to leave ${societyName}?`)) {
      return;
    }

    leaveMutation.mutate(societyId, {
      onSuccess: () => {
        toast.success(`Left ${societyName}`);
        // Cache will be automatically updated by the mutation
      },
      onError: (error) => {
        console.error("Error leaving society:", error);
        toast.error("Failed to leave society");
      },
    });
  };

  const handleJoin = (e, societyId, societyName) => {
    e.stopPropagation(); // Prevent navigation when clicking join

    joinMutation.mutate(societyId, {
      onSuccess: () => {
        toast.success(`Joined ${societyName}`);
        // Cache will be automatically updated by the mutation
      },
      onError: (error) => {
        console.error("Error joining society:", error);
        toast.error("Failed to join society");
      },
    });
  };

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  return (
    <div className="bg-gray-100 min-h-screen">
      <Navbar />

      <section className="2xl:px-44 xl:px-36 lg:px-28 md:px-20 sm:px-14 px-8 pt-7">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Society</h1>
          <div className="space-x-2">
            <button
              onClick={handleOpenModal}
              className="flex items-center gap-2 text-[#3B82F6] border border-[#3B82F6] px-3 sm:px-4 py-1.5 sm:py-2 rounded hover:bg-blue-600 hover:text-white font-semibold cursor-pointer text-sm sm:text-base"
            >
              <FaPlus className="w-3 h-3 sm:w-4 sm:h-4" /> <span className="hidden xs:inline">Create New</span> Society
            </button>
          </div>
        </div>

        <CreateSocietyForm
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        ></CreateSocietyForm>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Your Societies */}
            <div className="flex items-center justify-between mt-4 sm:mt-5">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3">
                Your Societies
              </h2>
              {yourSocietiesSlice.length > 0 && (
                <p
                  onClick={() => navigate("/society/my_society_list")}
                  className="text-[#3B82F6] font-semibold cursor-pointer text-sm sm:text-base"
                >
                  See All
                </p>
              )}
            </div>

            {yourSocietiesSlice.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <p className="text-gray-500 text-sm sm:text-base">
                  You haven't joined any societies yet
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {yourSocietiesSlice.map((society) => (
                  <div
                    onClick={() => {
                      navigate(`/society/${society?.id}`);
                    }}
                    key={society.id}
                    className="bg-gray-50 rounded-lg shadow-md p-3 sm:p-4 flex flex-col items-center text-center hover:scale-103 transform transition-transform duration-700 ease-in-out cursor-pointer"
                  >
                    <img
                      src={
                        society.profile_image_url ||
                        DEFAULT_GROUP_AVATAR
                      }
                      alt={society.name}
                      className="w-16 h-16 sm:w-24 sm:h-24 mb-2 rounded-full object-cover"
                    />
                    <h3 className="text-sm sm:text-lg md:text-xl font-semibold truncate w-full">
                      {society.name}
                    </h3>
                    <p className="text-gray-600 text-xs sm:text-sm md:text-base">
                      {society.members_count} members
                    </p>
                    <div className="flex flex-wrap justify-center gap-1 sm:gap-2 mt-2">
                      {/* Only show Leave button if user is not the creator */}
                      {currentUser &&
                        society.creator &&
                        currentUser.id !== society.creator.id && (
                          <button
                            onClick={(e) =>
                              handleLeave(e, society.id, society.name)
                            }
                            className="bg-red-500 text-white px-2 sm:px-4 py-1 sm:py-2 rounded hover:bg-red-600 text-xs sm:text-sm md:text-base"
                          >
                            Leave
                          </button>
                        )}
                      <button className="bg-blue-500 text-white px-2 sm:px-4 py-1 sm:py-2 rounded hover:bg-blue-600 text-xs sm:text-sm md:text-base">
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Join Societies */}
            <div className="flex items-center justify-between mt-8 sm:mt-15">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3">
                Join Societies
              </h2>
              {joinSocietiesSlice.length > 0 && (
                <p
                  onClick={() => navigate("/society/join_society_list")}
                  className="text-[#3B82F6] font-semibold cursor-pointer text-sm sm:text-base"
                >
                  See All
                </p>
              )}
            </div>

            {joinSocietiesSlice.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <p className="text-gray-500 text-sm sm:text-base">No societies available to join</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {joinSocietiesSlice.map((society) => (
                  <div
                    onClick={() => {
                      navigate(`/society/${society?.id}`);
                    }}
                    key={society.id}
                    className="bg-white rounded-lg shadow-md p-3 sm:p-4 flex flex-col items-center text-center hover:scale-103 transform transition-transform duration-700 ease-in-out cursor-pointer"
                  >
                    <img
                      src={
                        society.profile_image_url ||
                        DEFAULT_GROUP_AVATAR
                      }
                      alt={society.name}
                      className="w-16 h-16 sm:w-24 sm:h-24 mb-2 rounded-full object-cover"
                    />
                    <h3 className="text-sm sm:text-lg md:text-xl font-semibold truncate w-full">
                      {society.name}
                    </h3>
                    <p className="text-gray-600 text-xs sm:text-sm md:text-base">
                      {society.members_count} members
                    </p>
                    <button
                      onClick={(e) => handleJoin(e, society.id, society.name)}
                      className="mt-2 bg-blue-500 text-white px-2 sm:px-4 py-1 sm:py-2 rounded hover:bg-blue-600 text-xs sm:text-sm md:text-base"
                    >
                      {society.privacy === "private"
                        ? "Request to Join"
                        : "Join"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default SocietyCardGrid;
