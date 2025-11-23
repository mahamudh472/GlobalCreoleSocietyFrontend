import { useNavigate } from "react-router-dom"
import { useFriends } from "../hooks/queries/useFriends"
import { useCurrentUser } from "../hooks/queries/useUser"

const FriendsGrid = ({ userId }) => {
  const navigate = useNavigate()
  const { data: currentUser } = useCurrentUser()
  const { data: friendsData = [], isLoading: loading } = useFriends()
  
  // Take only first 6 friends for grid display
  const friends = friendsData.slice(0, 6)

  const getDefaultProfileImage = (friend) => {
    const name = friend.profile_name || friend.email || "User";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=150&background=3b82f6&color=fff`;
  };

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
              navigate("/profile/friendslist")
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
            const friendData = friend.requester?.id === currentUser?.id ? friend.receiver : friend.requester
            return (
              <div key={friend.id} className="flex flex-col items-center">
                <div 
                  className="w-17 h-17 rounded-xl overflow-hidden transform transition-transform duration-700 ease-in-out hover:scale-105 cursor-pointer"
                  onClick={() => navigate(`/profile/${friendData.id}`)}
                >
                  <img
                    src={friendData.profile_image || getDefaultProfileImage(friendData)}
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
