import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../Navbar";
import { toast } from 'react-toastify';
import { FaUserPlus } from 'react-icons/fa';
import { useFriendRequests, useFriendSuggestions } from '../../hooks/queries/useFriends';
import { useRespondToRequestMutation, useSendFriendRequestMutation } from '../../hooks/mutations/useFriends';
import { DEFAULT_AVATAR } from '../../utils/defaultAvatar';

const FriendCardGrid = () => {
    const navigate = useNavigate();
    const [sendingRequests, setSendingRequests] = useState({});
    
    // Fetch friend requests and suggestions using TanStack Query
    const { data: allFriendRequests = [], isLoading: loadingRequests } = useFriendRequests();
    const { data: allSuggestions = [], isLoading: loadingSuggestions } = useFriendSuggestions();
    const respondMutation = useRespondToRequestMutation();
    const sendRequestMutation = useSendFriendRequestMutation();
    
    // Limit to first 4 items for grid view
    const friendRequests = allFriendRequests.slice(0, 4);
    const suggestions = allSuggestions.slice(0, 4);
    const loading = loadingRequests || loadingSuggestions;

    const handleAccept = (userId) => {
        respondMutation.mutate({ userId, action: 'accept' });
    };

    const handleReject = (userId) => {
        respondMutation.mutate({ userId, action: 'reject' });
    };

    const handleSendRequest = (userId) => {
        setSendingRequests(prev => ({ ...prev, [userId]: true }));
        sendRequestMutation.mutate(userId, {
            onSettled: () => {
                setSendingRequests(prev => ({ ...prev, [userId]: false }));
            }
        });
    };

    // Helper for rendering friend cards
    const renderFriendCard = (friend) => {
        const userData = friend.requester;
        
        return (
            <div
                key={friend.id}
                className="bg-white rounded-2xl shadow-md p-3 sm:p-4 flex flex-col items-center text-center"
            >
                <Link to={`/profile/${userData.id}`} className="flex justify-center items-start w-full mb-2">
                    <img
                        src={userData.profile_image || DEFAULT_AVATAR}
                        alt={userData.profile_name}
                        className="w-14 h-14 sm:w-18 sm:h-18 rounded-full hover:opacity-80 transition"
                    />
                </Link>

                <Link to={`/profile/${userData.id}`} className="hover:text-blue-500 transition">
                    <h3 className="text-sm sm:text-lg font-semibold truncate max-w-full">
                        {userData.profile_name}
                    </h3>
                </Link>
                <p className="text-gray-600 text-xs sm:text-sm truncate max-w-full">{userData.email}</p>

                <div className="flex flex-wrap justify-center gap-1 sm:gap-2 mt-2">
                    <button
                        onClick={() => handleReject(userData.id)}
                        className="bg-gray-300 text-gray-700 px-2 sm:px-4 py-1 sm:py-2 rounded hover:bg-gray-400 text-xs sm:text-sm"
                    >
                        Reject
                    </button>
                    <button
                        onClick={() => handleAccept(userData.id)}
                        className="bg-blue-500 text-white px-2 sm:px-4 py-1 sm:py-2 rounded hover:bg-blue-600 text-xs sm:text-sm"
                    >
                        Accept
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-gray-100 min-h-screen">
             <div className='py-7'>
                <Navbar></Navbar>
            </div>

            <section className=" 2xl:px-44 xl:px-36 lg:px-28 md:px-20 sm:px-14 px-4">
                {loading ? (
                    <div className="flex justify-center items-center h-40 sm:h-64">
                        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <>
                        {/* Friend Requests Section */}
                        <div className="flex justify-between items-center mb-3 sm:mb-4">
                            <div>
                                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold my-1 sm:my-2">Friend Requests</h1>
                                <p className="text-blue-500 text-xs sm:text-sm md:text-base">
                                    {friendRequests.length} Friend Requests
                                </p>
                            </div>
                            {friendRequests.length > 0 && (
                                <button
                                    onClick={() => {
                                        navigate('/friends/requests');
                                    }}
                                    className="text-blue-500 cursor-pointer px-2 sm:px-4 py-1 sm:py-2 rounded font-semibold text-sm sm:text-base">
                                    See All
                                </button>
                            )}
                        </div>

                        {friendRequests.length === 0 ? (
                            <div className="text-center py-6 sm:py-8">
                                <p className="text-gray-500 text-sm sm:text-base">No pending friend requests</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                                {friendRequests.map((friend) => renderFriendCard(friend))}
                            </div>
                        )}

                        {/* Friend Suggestions Section */}
                        <div className="flex items-center justify-between mt-6 sm:mt-10">
                            <div>
                                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mt-4 sm:mt-6 my-2 sm:my-3">People You May Know</h2>
                                <p className="text-gray-600 text-xs sm:text-sm">Connect with people who share your interests</p>
                            </div>
                            {suggestions.length > 4 && (
                                <button
                                    onClick={() => {
                                        navigate('/friends/suggestions/all');
                                    }}
                                    className="text-blue-500 cursor-pointer px-2 sm:px-4 py-1 sm:py-2 rounded font-semibold text-sm sm:text-base">
                                    View All
                                </button>
                            )}
                        </div>
                        
                        {suggestions.length === 0 ? (
                            <div className="text-center py-6 sm:py-8 bg-white rounded-lg shadow mt-4">
                                <FaUserPlus className="text-4xl sm:text-6xl text-gray-300 mx-auto mb-3 sm:mb-4" />
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">
                                    No Suggestions Available
                                </h3>
                                <p className="text-gray-500 text-sm sm:text-base">
                                    Check back later for new friend suggestions
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mt-4">
                                {suggestions.map((user) => (
                                    <div key={user.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                                        <div className="p-3 sm:p-4 text-center">
                                            <Link to={`/profile/${user.id}`} className="mb-2 sm:mb-3 block">
                                                {user.profile_image ? (
                                                    <img
                                                        src={user.profile_image}
                                                        alt={user.profile_name || 'User'}
                                                        className="w-14 h-14 sm:w-20 sm:h-20 rounded-full mx-auto object-cover hover:opacity-80 transition"
                                                    />
                                                ) : (
                                                    <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full mx-auto bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xl sm:text-2xl font-bold hover:opacity-80 transition">
                                                        {user.profile_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                )}
                                            </Link>
                                            <Link to={`/profile/${user.id}`} className="hover:text-blue-500 transition">
                                                <h3 className="text-sm sm:text-lg font-semibold mb-1 truncate">
                                                    {user.profile_name || 'Anonymous User'}
                                                </h3>
                                            </Link>
                                            {user.email && (
                                                <p className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3 truncate">
                                                    {user.email}
                                                </p>
                                            )}
                                            <button
                                                onClick={() => handleSendRequest(user.id)}
                                                disabled={sendingRequests[user.id]}
                                                className="w-full flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm"
                                            >
                                                <FaUserPlus className="w-3 h-3 sm:w-4 sm:h-4" />
                                                {sendingRequests[user.id] ? 'Sending...' : 'Add Friend'}
                                            </button>
                                        </div>
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

export default FriendCardGrid;
