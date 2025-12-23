import React, { useMemo, useState } from "react";
import { useSociety } from "../../hooks/queries/useSocieties";
import { useUpdateSocietyMutation } from "../../hooks/mutations/useSocieties";
import { toast } from "react-toastify";

const GroupInfo = ({ societyId }) => {
  const { data: society, isLoading, isError } = useSociety(societyId);
  const updateMutation = useUpdateSocietyMutation();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const handleEditClick = () => {
    setEditName(society?.name || "");
    setEditDescription(society?.description || "");
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!societyId || !society) return;

    const formData = new FormData();
    let hasChanges = false;

    if (editName !== society.name && editName.trim()) {
      formData.append("name", editName);
      hasChanges = true;
    }
    if (editDescription !== society.description) {
      formData.append("description", editDescription);
      hasChanges = true;
    }

    if (!hasChanges) {
      setIsEditing(false);
      return;
    }

    updateMutation.mutate(
      { societyId, societyData: formData },
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
              <p className="text-gray-600 text-sm ">Society Created by</p>
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
          <div className="mb-4 bg-white rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <p className="text-gray-700 font-semibold text-lg">About Group</p>
              {!isEditing ? (
                <button
                  onClick={handleEditClick}
                  className="text-sm hover:bg-gray-100 border border-gray-300 px-4 py-1.5 rounded-lg cursor-pointer transition-colors"
                >
                  Edit
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleCancelEdit}
                    className="text-sm bg-gray-200 hover:bg-gray-300 px-4 py-1.5 rounded-lg cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={updateMutation.isPending}
                    className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg cursor-pointer transition-colors disabled:opacity-50"
                  >
                    {updateMutation.isPending ? "Saving..." : "Save"}
                  </button>
                </div>
              )}
            </div>
            <hr className="border border-gray-200 mb-3" />
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter group name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Enter group description"
                  />
                </div>
              </div>
            ) : (
              <>
                <p className="text-gray-900 font-medium mb-2">{society.name}</p>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {society.description || "No description available"}
                </p>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default GroupInfo;
