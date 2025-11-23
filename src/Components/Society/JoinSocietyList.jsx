import React, { useState, useEffect } from 'react';
import Navbar from '../Navbar';
import { useNavigate } from 'react-router-dom';
import { apiMethods } from '../../utils/api';
import { ENDPOINTS } from '../../config/apiConfig';
import { toast } from 'react-toastify';

const JoinSocietyList = () => {
    const navigate = useNavigate();
    const [joinSocieties, setJoinSocieties] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAvailableSocieties();
    }, []);

    const fetchAvailableSocieties = async () => {
        try {
            setLoading(true);
            // Fetch only societies available to join (not a member of)
            const response = await apiMethods.get(`${ENDPOINTS.SOCIETIES.LIST}?available=true`);
            
            // Handle paginated response or plain array
            const societiesData = response.data.results || response.data;
            const societies = Array.isArray(societiesData) ? societiesData : [];
            
            setJoinSocieties(societies);
        } catch (error) {
            console.error('Error fetching available societies:', error);
            toast.error('Failed to load available societies');
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async (e, societyId, societyName, privacy) => {
        e.stopPropagation();
        
        try {
            await apiMethods.post(ENDPOINTS.SOCIETIES.JOIN(societyId));
            
            if (privacy === 'private') {
                toast.success(`Join request sent to ${societyName}`);
                // Remove from list after request sent
                setJoinSocieties(joinSocieties.filter(soc => soc.id !== societyId));
            } else {
                toast.success(`Joined ${societyName}`);
                // Remove from list after joining
                setJoinSocieties(joinSocieties.filter(soc => soc.id !== societyId));
            }
        } catch (error) {
            console.error('Error joining society:', error);
            toast.error(error.response?.data?.error || 'Failed to join society');
        }
    };

    const handleView = (societyId) => {
        navigate(`/society/${societyId}`);
    };

    return (
        <div className="bg-gray-100 min-h-screen">
            <section className='py-7'>
                <Navbar />
            </section>

            <section className='2xl:px-44 xl:px-36 lg:px-28 md:px-20 sm:px-14 px-8 mt-10'>
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl sm:text-3xl font-bold">Society</h1>
                </div>

                {/* Join Societies */}
                <div className='flex items-center justify-between mt-5'>
                    <h2 className="text-xl sm:text-2xl font-bold mb-2">Available Societies</h2>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                ) : joinSocieties.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500">No societies available to join at the moment</p>
                        <button 
                            onClick={() => navigate('/society')}
                            className="mt-4 bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
                        >
                            Back to Societies
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {joinSocieties.map((society) => (
                            <div
                                key={society.id}
                                onClick={() => handleView(society.id)}
                                className="bg-white rounded-lg shadow-md p-4 flex flex-col items-center text-center cursor-pointer hover:scale-103 transform transition-transform duration-300"
                            >
                                <img
                                    src={society.cover_picture || society.cover_image || "https://www.shutterstock.com/image-vector/eagle-logo-fierce-vibrant-soaring-260nw-2494369867.jpg"}
                                    alt={society.name}
                                    className="w-24 h-24 mb-2 object-cover rounded-full"
                                />
                                <h3 className="text-lg sm:text-xl font-semibold">{society.name}</h3>
                                <p className="text-gray-600 text-sm sm:text-base">
                                    {society.members_count || society.member_count || 0} members
                                </p>
                                {society.privacy === 'private' && (
                                    <span className="text-xs text-gray-500 mt-1">🔒 Private</span>
                                )}
                                <button 
                                    onClick={(e) => handleJoin(e, society.id, society.name, society.privacy)}
                                    className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm sm:text-base"
                                >
                                    {society.privacy === 'private' ? 'Request to Join' : 'Join'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default JoinSocietyList;
