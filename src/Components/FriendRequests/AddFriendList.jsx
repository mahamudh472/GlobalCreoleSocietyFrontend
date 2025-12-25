import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../Navbar';
import { toast } from 'react-toastify';
import { FaUserPlus, FaSearch, FaSync } from 'react-icons/fa';
import { useFriendSuggestions } from '../../hooks/queries/useFriends';
import { useSendFriendRequestMutation } from '../../hooks/mutations/useFriends';

const AddFriendList = () => {
    const [filteredSuggestions, setFilteredSuggestions] = useState([]);
    const [sendingRequests, setSendingRequests] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    
    const { data: suggestions = [], isLoading: loading, refetch } = useFriendSuggestions();
    const sendRequestMutation = useSendFriendRequestMutation();

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

    const handleSendRequest = (userId) => {
        setSendingRequests(prev => ({ ...prev, [userId]: true }));
        sendRequestMutation.mutate(userId, {
            onSettled: () => {
                setSendingRequests(prev => ({ ...prev, [userId]: false }));
            }
        });
    };

    const handleRefresh = () => {
        refetch();
    };

    return (
        <div>
            <div>
                <Navbar></Navbar>
            </div>
            <div className="2xl:px-44 xl:px-36 lg:px-28 md:px-20 sm:px-14 px-4 py-4 sm:py-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold my-2 sm:my-3">All Friend Suggestions</h1>
                        <p className="text-gray-600 text-xs sm:text-sm">Connect with people who share your interests</p>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 text-sm sm:text-base self-start sm:self-auto"
                    >
                        <FaSync className={`w-3 h-3 sm:w-4 sm:h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* Search Bar */}
                <div className="mb-4 sm:mb-6 bg-white p-3 sm:p-4 rounded-lg shadow">
                    <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2">
                        <FaSearch className="text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 outline-none text-sm sm:text-base"
                        />
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-8 sm:py-12">
                        <div className="inline-block animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-500"></div>
                        <p className="mt-3 sm:mt-4 text-gray-600 text-sm sm:text-base">Loading suggestions...</p>
                    </div>
                )}

                {/* Suggestions Grid */}
                {!loading && filteredSuggestions.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                        {filteredSuggestions.map((user) => (
                            <div key={user.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                                <div className="p-3 sm:p-6 text-center">
                                    <Link to={`/profile/${user.id}`} className="mb-2 sm:mb-4 block">
                                        {user.profile_image ? (
                                            <img
                                                src={user.profile_image}
                                                alt={user.profile_name || 'User'}
                                                className="w-16 h-16 sm:w-24 sm:h-24 rounded-full mx-auto object-cover hover:opacity-80 transition"
                                            />
                                        ) : (
                                            <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full mx-auto bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xl sm:text-3xl font-bold hover:opacity-80 transition hover:opacity-80 transition">
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
                                        <p className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-4 truncate">
                                            {user.email}
                                        </p>
                                    )}
                                    <button
                                        onClick={() => handleSendRequest(user.id)}
                                        disabled={sendingRequests[user.id]}
                                        className="w-full flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm"
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
