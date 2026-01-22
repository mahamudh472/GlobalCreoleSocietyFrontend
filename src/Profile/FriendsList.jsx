"use client"

import { useEffect, useMemo, useState } from "react"
import { FiSearch, FiMenu, FiChevronLeft, FiChevronRight } from "react-icons/fi"
import Navbar from "../Components/Navbar"
import { RiMenuAddLine } from "react-icons/ri"
import { toast } from 'react-toastify';
import { useCurrentUser } from '../hooks/queries/useUser';
import { useFriendsPaginated } from '../hooks/queries/useFriends';
import { useUnfriendMutation } from '../hooks/mutations/useFriends';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_AVATAR } from '../utils/defaultAvatar';

function FriendsList() {
  const { data: currentUser } = useCurrentUser();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("")
  const [showMenu, setShowMenu] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  
  // Fetch friends using TanStack Query with server-side pagination
  const { data: pagedData = { results: [], count: 0 }, isLoading: loading } = useFriendsPaginated(currentPage, pageSize <= 0 ? 1000 : pageSize);
  const unfriendMutation = useUnfriendMutation();
  
  // Transform the friendship data to get friend details
  const friends = (pagedData.results || []).map(friendship => {
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
  const filteredFriends = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return friends.filter((friend) => {
      const profileName = (friend.profile_name || '').toLowerCase();
      const email = (friend.email || '').toLowerCase();
      return profileName.includes(query) || email.includes(query);
    });
  }, [friends, searchQuery]);

  const totalPages = useMemo(() => {
    // Prefer server-reported count when available
    const total = typeof pagedData.count === 'number' ? pagedData.count : filteredFriends.length;
    return pageSize > 0 ? Math.ceil(total / pageSize) : 1;
  }, [pagedData.count, filteredFriends.length, pageSize]);

  // Use server-paginated results directly; avoid double client-side slicing
  const paginatedFriends = filteredFriends;

  useEffect(() => {
    // Reset to first page when filters or page size change
    setCurrentPage(1);
  }, [searchQuery, pageSize]);

  useEffect(() => {
    // Clamp current page to valid range if data changes
    if (currentPage > totalPages) {
      setCurrentPage(totalPages || 1);
    }
  }, [currentPage, totalPages]);

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
              placeholder='Search friends'
              value={searchQuery}
              onChange={handleSearch}
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
                {paginatedFriends.map((friend) => (
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

              {/* Pagination Controls */}
              {filteredFriends.length > 0 && (
                <div className="mt-6 flex items-center justify-center">
                  {/* Pager */}
                  <div className="flex items-center gap-3">
                    <button
                      aria-label="Previous page"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className={`h-10 w-10 rounded-xl border flex items-center justify-center text-base shadow-sm ${currentPage === 1 ? 'text-gray-300 border-gray-200 bg-gray-50 cursor-not-allowed' : 'text-gray-700 border-gray-300 bg-white hover:border-gray-400'}`}
                    >
                      <FiChevronLeft />
                    </button>
                    <div className="flex items-center gap-2">
                      {(() => {
                        // Show up to 3 page buttons centered around current page
                        const maxButtons = 3;
                        const half = Math.floor(maxButtons / 2);
                        let start = Math.max(1, currentPage - half);
                        let end = Math.min(totalPages, start + (maxButtons - 1));
                        start = Math.max(1, end - (maxButtons - 1));
                        const buttons = [];
                        for (let pageNum = start; pageNum <= end; pageNum++) {
                          const isActive = pageNum === currentPage;
                          buttons.push(
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`h-10 w-10 rounded-xl border text-base shadow-sm flex items-center justify-center ${isActive ? 'bg-white text-gray-900 border-orange-400 ring-2 ring-orange-400' : 'bg-white text-gray-900 border-gray-300 hover:border-gray-400'}`}
                            >
                              {pageNum}
                            </button>
                          );
                        }
                        return buttons;
                      })()}
                    </div>
                    <button
                      aria-label="Next page"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className={`h-10 w-10 rounded-xl border flex items-center justify-center text-base shadow-sm ${currentPage === totalPages ? 'text-gray-300 border-gray-200 bg-gray-50 cursor-not-allowed' : 'text-gray-700 border-gray-300 bg-white hover:border-gray-400'}`}
                    >
                      <FiChevronRight />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default FriendsList
