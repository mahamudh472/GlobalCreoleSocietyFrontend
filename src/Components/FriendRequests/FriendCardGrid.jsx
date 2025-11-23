import React, { useState, useEffect } from "react";
import Navbar from "../Navbar";
import { useNavigate } from "react-router-dom";
import { apiMethods } from '../../utils/api';
import { ENDPOINTS } from '../../config/apiConfig';
import { toast } from 'react-toastify';
import { FaUserPlus } from 'react-icons/fa';

const FriendCardGrid = () => {
    const navigate = useNavigate();
    const [friendRequests, setFriendRequests] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sendingRequests, setSendingRequests] = useState({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            // Fetch friend requests
            const requestsResponse = await apiMethods.get(ENDPOINTS.FRIENDS.REQUESTS);
            
            // Handle paginated response (results) or plain array
            const requestsData = requestsResponse.data.results || requestsResponse.data;
            setFriendRequests(Array.isArray(requestsData) ? requestsData.slice(0, 4) : []);

            // Fetch friend suggestions
            const suggestionsResponse = await apiMethods.get(ENDPOINTS.FRIENDS.SUGGESTIONS);
            
            // Handle paginated response or plain array
            const suggestionsData = suggestionsResponse.data.results || suggestionsResponse.data;
            setSuggestions(Array.isArray(suggestionsData) ? suggestionsData.slice(0, 4) : []);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (userId) => {
        try {
            await apiMethods.post(ENDPOINTS.FRIENDS.RESPOND_REQUEST(userId), {
                action: 'accept'
            });
            toast.success('Friend request accepted!');
            setFriendRequests(friendRequests.filter(req => req.requester.id !== userId));
        } catch (error) {
            console.error('Error accepting friend request:', error);
            toast.error('Failed to accept friend request');
        }
    };

    const handleReject = async (userId) => {
        try {
            await apiMethods.post(ENDPOINTS.FRIENDS.RESPOND_REQUEST(userId), {
                action: 'reject'
            });
            toast.success('Friend request rejected');
            setFriendRequests(friendRequests.filter(req => req.requester.id !== userId));
        } catch (error) {
            console.error('Error rejecting friend request:', error);
            toast.error('Failed to reject friend request');
        }
    };

    const handleSendRequest = async (userId) => {
        try {
            setSendingRequests(prev => ({ ...prev, [userId]: true }));
            await apiMethods.post(ENDPOINTS.FRIENDS.SEND_REQUEST, {
                receiver_id: userId
            });
            toast.success('Friend request sent!');
            
            // Remove the user from suggestions after sending request
            setSuggestions(prev => prev.filter(user => user.id !== userId));
        } catch (error) {
            console.error('Error sending friend request:', error);
            toast.error(error.response?.data?.error || 'Failed to send friend request');
        } finally {
            setSendingRequests(prev => ({ ...prev, [userId]: false }));
        }
    };

    // Helper function for default profile image
    const getDefaultProfileImage = (name, email) => {
        const displayName = name || email || 'User';
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&size=128`;
    };

    // Helper for rendering friend cards
    const renderFriendCard = (friend) => {
        const userData = friend.requester;
        
        return (
            <div
                key={friend.id}
                className="bg-white rounded-2xl shadow-md p-4 flex flex-col items-center text-center"
            >
                <div className="flex justify-center items-start w-full mb-2">
                    <img
                        src={userData.profile_image || getDefaultProfileImage(userData.profile_name, userData.email)}
                        alt={userData.profile_name}
                        className="w-18 h-18 rounded-full"
                    />
                </div>

                <h3 className="text-lg font-semibold">
                    {userData.profile_name}
                </h3>
                <p className="text-gray-600">{userData.email}</p>

                <div className="flex space-x-2 mt-2">
                    <button
                        onClick={() => handleReject(userData.id)}
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                    >
                        Reject
                    </button>
                    <button
                        onClick={() => handleAccept(userData.id)}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
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

            <section className=" 2xl:px-44 xl:px-36 lg:px-28 md:px-20 sm:px-14 px-8">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <>
                        {/* Friend Requests Section */}
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold my-2">Friend Requests</h1>
                                <p className="text-blue-500 text-sm sm:text-base">
                                    {friendRequests.length} Friend Requests
                                </p>
                            </div>
                            {friendRequests.length > 0 && (
                                <button
                                    onClick={() => {
                                        navigate('/friends/requests');
                                    }}
                                    className="text-blue-500 cursor-pointer px-4 py-2 rounded font-semibold">
                                    See All
                                </button>
                            )}
                        </div>

                        {friendRequests.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-gray-500">No pending friend requests</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {friendRequests.map((friend) => renderFriendCard(friend))}
                            </div>
                        )}

                        {/* Friend Suggestions Section */}
                        <div className="flex items-center justify-between mt-10">
                            <div>
                                <h2 className="text-2xl sm:text-3xl font-bold mt-6 my-3">People You May Know</h2>
                                <p className="text-gray-600 text-sm">Connect with people who share your interests</p>
                            </div>
                            {suggestions.length > 4 && (
                                <button
                                    onClick={() => {
                                        navigate('/friends/suggestions/all');
                                    }}
                                    className="text-blue-500 cursor-pointer px-4 py-2 rounded font-semibold">
                                    View All
                                </button>
                            )}
                        </div>
                        
                        {suggestions.length === 0 ? (
                            <div className="text-center py-8 bg-white rounded-lg shadow mt-4">
                                <FaUserPlus className="text-6xl text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                                    No Suggestions Available
                                </h3>
                                <p className="text-gray-500">
                                    Check back later for new friend suggestions
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                                {suggestions.map((user) => (
                                    <div key={user.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                                        <div className="p-4 text-center">
                                            <div className="mb-3">
                                                {user.profile_image ? (
                                                    <img
                                                        src={user.profile_image}
                                                        alt={user.profile_name || 'User'}
                                                        className="w-20 h-20 rounded-full mx-auto object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-20 h-20 rounded-full mx-auto bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                                                        {user.profile_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                )}
                                            </div>
                                            <h3 className="text-lg font-semibold mb-1 truncate">
                                                {user.profile_name || 'Anonymous User'}
                                            </h3>
                                            {user.email && (
                                                <p className="text-sm text-gray-500 mb-3 truncate">
                                                    {user.email}
                                                </p>
                                            )}
                                            <button
                                                onClick={() => handleSendRequest(user.id)}
                                                disabled={sendingRequests[user.id]}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <FaUserPlus />
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
