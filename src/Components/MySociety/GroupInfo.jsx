import React, { useMemo } from "react";
import { useSociety } from "../../hooks/queries/useSocieties";

const GroupInfo = () => {
  const societyId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("society");
  }, []);

  const { data: society, isLoading, isError } = useSociety(societyId);

  return (
    <div className="rounded-lg  p-4 max-w-md mx-auto">
      {isLoading && (
        <div className="bg-white rounded-lg p-4">Loading society info...</div>
      )}
      {isError && (
        <div className="bg-white rounded-lg p-4 text-red-600">
          Failed to load society info.
        </div>
      )}
      {society && (
        <>
          <div className="flex items-center mb-4 bg-white rounded-lg p-2 px-4">
            <img
              src={
                society.creator?.profile_image ||
                "https://www.shutterstock.com/image-photo/happy-handsome-young-business-leader-260nw-2375039955.jpg"
              }
              alt="Creator"
              className="w-10 h-10 rounded-full mr-2"
            />
            <div>
              <p className="text-gray-600 text-sm">Society Created by</p>
              <p className="font-semibold">
                {society.creator?.profile_name ||
                  society.creator_name ||
                  "Unknown"}
              </p>
              <p className="text-gray-500 text-xs">
                {society.created_at
                  ? new Date(society.created_at).toLocaleString()
                  : ""}
              </p>
            </div>
          </div>
          <div className="mb-4 bg-white rounded-lg p-2 px-4 flex justify-between cursor-pointer transform transition-transform duration-700 ease-in-out hover:scale-101">
            <p className="text-gray-600 font-semibold">Pending Posts</p>
            <p className="text-lg font-bold">
              {society.pending_posts_count ?? 0}
            </p>
          </div>
          <div className="mb-4 flex justify-between bg-white rounded-lg p-2 px-4 cursor-pointer transform transition-transform duration-700 ease-in-out hover:scale-101">
            <p className="text-gray-600 font-semibold">Pending Members</p>
            <p className="text-lg font-bold">
              {society.pending_members_count ?? 0}
            </p>
          </div>
          <div className="mb-4 bg-white rounded-lg p-2 px-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-gray-600 font-semibold">About Group</p>
              <button className=" text-sm hover:underline border border-[#E2E8F0]  p-1 px-6 rounded-lg cursor-pointer">
                Edit
              </button>
            </div>
            <hr className=" border border-[#F0F0F0] my-3" />
            <p className="text-gray-800">{society.name}</p>
            <p className="text-gray-600 text-sm mt-1">{society.description}</p>
          </div>
        </>
      )}
    </div>
  );
};

export default GroupInfo;
