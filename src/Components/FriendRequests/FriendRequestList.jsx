import React, { useState, useEffect } from 'react';
import Navbar from '../Navbar';
import { apiMethods } from '../../utils/api';
import { ENDPOINTS } from '../../config/apiConfig';
import { toast } from 'react-toastify';

const FriendRequestList = () => {
    const [friendRequests, setFriendRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFriendRequests();
    }, []);

    const fetchFriendRequests = async () => {
        try {
            setLoading(true);
            const response = await apiMethods.get(ENDPOINTS.FRIENDS.REQUESTS);
            
            // Handle paginated response or plain array
            const requestsData = response.data.results || response.data;
            setFriendRequests(Array.isArray(requestsData) ? requestsData : []);
        } catch (error) {
            console.error('Error fetching friend requests:', error);
            toast.error('Failed to load friend requests');
        } finally {
            setLoading(false);
        }
    };

    // Helper function for default profile image
    const getDefaultProfileImage = (name, email) => {
        const displayName = name || email || 'User';
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&size=128`;
    };

    const handleAccept = async (userId) => {
        try {
            await apiMethods.post(ENDPOINTS.FRIENDS.RESPOND_REQUEST(userId), {
                action: 'accept'
            });
            toast.success('Friend request accepted!');
            // Remove from list
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
            // Remove from list
            setFriendRequests(friendRequests.filter(req => req.requester.id !== userId));
        } catch (error) {
            console.error('Error rejecting friend request:', error);
            toast.error('Failed to reject friend request');
        }
    };

    return (
        <div>
            <div>
                <Navbar />
            </div>
            <div className="2xl:px-44 xl:px-36 lg:px-28 md:px-20 sm:px-14 px-8 py-6">
                {/* Friend Requests Section */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold">Friend Requests</h1>
                            <p className="text-blue-500 text-sm sm:text-base">
                                {friendRequests.length} pending request{friendRequests.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                        </div>
                    ) : friendRequests.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-lg shadow">
                            <p className="text-gray-500 text-lg">No pending friend requests</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {friendRequests.map(request => (
                                <div key={request.id} className="bg-white rounded-lg shadow-md p-4 flex flex-col items-center text-center">
                                    <div className="flex justify-center items-start w-full mb-2">
                                        <img
                                            src={request.requester?.profile_image || getDefaultProfileImage(request.requester?.profile_name, request.requester?.email)}
                                            alt={request.requester?.profile_name || 'User'}
                                            className="w-18 h-18 rounded-full"
                                        />
                                    </div>
                                    <h3 className="text-lg sm:text-xl font-semibold">
                                        {request.requester?.profile_name || 'Anonymous User'}
                                    </h3>
                                    <p className="text-gray-600 text-sm sm:text-base">
                                        {request.requester?.email || ''}
                                    </p>
                                    <div className="flex flex-wrap justify-center gap-2 mt-3">
                                        <button
                                            onClick={() => handleReject(request.requester.id)}
                                            className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 w-full sm:w-auto"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => handleAccept(request.requester.id)}
                                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full sm:w-auto"
                                        >
                                            Accept
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FriendRequestList;
