"use client"

import { useState } from "react"
import { FiSearch, FiMenu } from "react-icons/fi"
import Navbar from "../Components/Navbar"
import { RiMenuAddLine } from "react-icons/ri"
import { toast } from 'react-toastify';
import { useCurrentUser } from '../hooks/queries/useUser';
import { useFriends } from '../hooks/queries/useFriends';
import { useUnfriendMutation } from '../hooks/mutations/useFriends';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_AVATAR } from '../utils/defaultAvatar';

function FriendsList() {
  const { data: currentUser } = useCurrentUser();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("")
  const [showMenu, setShowMenu] = useState(false)
  
  // Fetch friends using TanStack Query
  const { data: friendshipsData = [], isLoading: loading } = useFriends();
  const unfriendMutation = useUnfriendMutation();
  
  // Transform the friendship data to get friend details
  const friends = friendshipsData.map(friendship => {
    // Determine which user is the friend (not the current user)
    const friend = friendship.requester?.id === currentUser?.id 
      ? friendship.receiver 
      : friendship.requester;
    return {
      ...friend,
      friendshipId: friendship.id
    };
  });

  // Handle search
  const handleSearch = (e) => {
    const query = e.target.value
    setSearchQuery(query)
    console.log("Search query:", query)
  }

  // Handle menu toggle
  const handleMenuToggle = () => {
    setShowMenu(!showMenu)
    console.log("Menu toggled:", !showMenu)
  }

  // Handle unfriend
  const handleUnfriend = (friendId, friendName) => {
    unfriendMutation.mutate(friendId, {
      onSuccess: () => {
        toast.success(`Unfriended ${friendName}`);
      }
    });
  };

  // Filter friends based on search
  const filteredFriends = friends.filter((friend) => {
    const profileName = (friend.profile_name || '').toLowerCase();
    const email = (friend.email || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return profileName.includes(query) || email.includes(query);
  });

  return (
    <div>

      <div>
        <Navbar></Navbar>
      </div>

      {/* Main part.................... */}

      <div className="min-h-[calc(100vh-100px)] bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          {/* Search Bar */}
          <div className='bg-white px-4 py-3 rounded-xl flex items-center justify-between gap-5'>
            <input type="search"
              placeholder='Search post'
              className='bg-black/10 font-semibold px-4 py-3 rounded-xl text-[#92929D] w-full' />
            <RiMenuAddLine 
            onClick={handleMenuToggle}
            size={40} className='bg-[#3B82F6] cursor-pointer p-2 rounded-lg' color='white' />


          </div>
          <h3 className="my-5 text-3xl font-bold">Friends</h3>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* Friends Grid - Two Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredFriends.map((friend) => (
                  <div
                    key={friend.id}
                    className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between"
                  >
                    <div 
                      className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                      onClick={() => navigate(`/profile/${friend.id}`)}
                    >
                      <img
                        src={friend.profile_image || DEFAULT_AVATAR}
                        alt={friend.profile_name || friend.email}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 text-sm truncate">
                          {friend.profile_name || friend.email}
                        </h3>
                        <p className="text-xs text-gray-500 truncate">{friend.email}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleUnfriend(friend.id, friend.profile_name || friend.email)}
                      className="ml-3 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                    >
                      Unfriend
                    </button>
                  </div>
                ))}
              </div>

              {/* No Results Message */}
              {filteredFriends.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-sm">No friends found</p>
                </div>
              )}

              {/* Results Count */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  Showing {filteredFriends.length} of {friends.length} friends
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default FriendsList
