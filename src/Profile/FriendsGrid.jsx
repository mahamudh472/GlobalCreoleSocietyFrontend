import { useNavigate } from "react-router-dom"
import { useFriends, useUserFriendsQuery } from "../hooks/queries/useFriends"
import { useCurrentUser } from "../hooks/queries/useUser"
import { DEFAULT_AVATAR } from "../utils/defaultAvatar"

const FriendsGrid = ({ userId }) => {
  const navigate = useNavigate()
  const { data: currentUser } = useCurrentUser()
  
  // Determine if viewing another user's profile or own profile
  const isViewingOtherUser = userId && userId !== currentUser?.id
  
  // Fetch own friends or other user's friends based on userId
  const { data: ownFriendsData, isLoading: loadingOwnFriends } = useFriends({
    enabled: !isViewingOtherUser,
  })
  const { data: otherUserFriendsData, isLoading: loadingOtherFriends } = useUserFriendsQuery(userId, {
    enabled: isViewingOtherUser,
  })
  
  // Extract results array from response data (handle both paginated and array formats)
  const getResultsArray = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.results)) return data.results;
    return [];
  };
  
  // Use the appropriate friends list
  const friendsData = isViewingOtherUser ? getResultsArray(otherUserFriendsData) : getResultsArray(ownFriendsData);
  const loading = isViewingOtherUser ? loadingOtherFriends : loadingOwnFriends
  
  // Take only first 6 friends for grid display
  const friends = friendsData.slice(0, 6)

  if (loading) {
    return (
      <div className="text-[#3D3D3D]">
        <div className="flex justify-between items-center mb-3 border-b border-[#F0F0F0]">
          <h2 className="text-lg font-semibold">Friends</h2>
        </div>
        <div className="text-center text-gray-500 py-4">Loading friends...</div>
      </div>
    )
  }

  return (
    <div className=" text-[#3D3D3D]">
      <div className="flex justify-between items-center mb-3 border-b border-[#F0F0F0]">
        <h2 className="text-lg font-semibold">Friends</h2>
        {friends.length > 0 && (
          <button
            onClick={() => {
              navigate(`/profile/${userId}/friendslist`)
            }}
            className="text-sm cursor-pointer text-blue-500 hover:underline"
          >
            See All
          </button>
        )}
      </div>

      {friends.length === 0 ? (
        <div className="text-center text-gray-500 py-4">No friends yet</div>
      ) : (
        <div className="grid grid-cols-4 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {friends.map(friend => {
            // Show the user who is NOT the profile owner (userId)
            const friendData = String(friend.requester?.id) === String(userId) ? friend.receiver : friend.requester
            return (
              <div key={friend.id} className="flex flex-col items-center">
                <div 
                  className="w-17 h-17 rounded-xl overflow-hidden cursor-pointer"
                  onClick={() => navigate(`/profile/${friendData.id}`)}
                >
                  <img
                    src={friendData.profile_image || DEFAULT_AVATAR}
                    alt={friendData.profile_name || friendData.email}
                    className="w-full h-full object-cover "
                  />
                </div>
                <p className="mt-2 text-sm text-center truncate w-full">
                  {friendData.profile_name || friendData.email}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default FriendsGrid
