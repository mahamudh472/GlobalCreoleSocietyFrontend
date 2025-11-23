import React, { useState, useEffect } from 'react';
import Navbar from '../Navbar';
import { apiMethods } from '../../utils/api';
import { ENDPOINTS } from '../../config/apiConfig';
import { toast } from 'react-toastify';
import { FaUserPlus, FaSearch, FaSync } from 'react-icons/fa';

const AddFriendList = () => {
    const [suggestions, setSuggestions] = useState([]);
    const [filteredSuggestions, setFilteredSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sendingRequests, setSendingRequests] = useState({});
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchSuggestions();
    }, []);

    useEffect(() => {
        // Filter suggestions based on search query
        if (!searchQuery.trim()) {
            setFilteredSuggestions(suggestions);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = suggestions.filter(user =>
                user.profile_name?.toLowerCase().includes(query) ||
                user.email?.toLowerCase().includes(query)
            );
            setFilteredSuggestions(filtered);
        }
    }, [searchQuery, suggestions]);

    const fetchSuggestions = async () => {
        try {
            setLoading(true);
            const response = await apiMethods.get(ENDPOINTS.FRIENDS.SUGGESTIONS);
            
            // Handle paginated response or plain array
            const suggestionsData = response.data.results || response.data;
            const suggestionsList = Array.isArray(suggestionsData) ? suggestionsData : [];
            
            setSuggestions(suggestionsList);
            setFilteredSuggestions(suggestionsList);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            toast.error('Failed to load friend suggestions');
        } finally {
            setLoading(false);
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

    return (
        <div>
            <div>
                <Navbar></Navbar>
            </div>
            <div className="2xl:px-44 xl:px-36 lg:px-28 md:px-20 sm:px-14 px-8 py-6">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold my-3">All Friend Suggestions</h1>
                        <p className="text-gray-600 text-sm">Connect with people who share your interests</p>
                    </div>
                    <button
                        onClick={fetchSuggestions}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                    >
                        <FaSync className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>

                {/* Search Bar */}
                <div className="mb-6 bg-white p-4 rounded-lg shadow">
                    <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2">
                        <FaSearch className="text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 outline-none"
                        />
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                        <p className="mt-4 text-gray-600">Loading suggestions...</p>
                    </div>
                )}

                {/* Suggestions Grid */}
                {!loading && filteredSuggestions.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredSuggestions.map((user) => (
                            <div key={user.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                                <div className="p-6 text-center">
                                    <div className="mb-4">
                                        {user.profile_image ? (
                                            <img
                                                src={user.profile_image}
                                                alt={user.profile_name || 'User'}
                                                className="w-24 h-24 rounded-full mx-auto object-cover"
                                            />
                                        ) : (
                                            <div className="w-24 h-24 rounded-full mx-auto bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-3xl font-bold">
                                                {user.profile_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="text-lg font-semibold mb-1 truncate">
                                        {user.profile_name || 'Anonymous User'}
                                    </h3>
                                    {user.email && (
                                        <p className="text-sm text-gray-500 mb-4 truncate">
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

                {/* Empty State */}
                {!loading && filteredSuggestions.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-lg shadow">
                        <FaUserPlus className="text-6xl text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">
                            {searchQuery ? 'No Results Found' : 'No Suggestions Available'}
                        </h3>
                        <p className="text-gray-500">
                            {searchQuery 
                                ? 'Try searching with a different name or email'
                                : 'Check back later for new friend suggestions'
                            }
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddFriendList;
