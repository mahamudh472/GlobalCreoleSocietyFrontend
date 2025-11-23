import React, { useState, useEffect } from 'react';
import Navbar from '../Navbar';
import { useNavigate } from 'react-router-dom';
import { apiMethods } from '../../utils/api';
import { ENDPOINTS } from '../../config/apiConfig';
import { toast } from 'react-toastify';

const MySocietyList = () => {
  const navigate = useNavigate();
  const [yourSocieties, setYourSocieties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMySocieties();
  }, []);

  const fetchMySocieties = async () => {
    try {
      setLoading(true);
      // Fetch only user's societies
      const response = await apiMethods.get(`${ENDPOINTS.SOCIETIES.LIST}?my_societies=true`);
      
      // Handle paginated response or plain array
      const societiesData = response.data.results || response.data;
      const societies = Array.isArray(societiesData) ? societiesData : [];
      
      setYourSocieties(societies);
    } catch (error) {
      console.error('Error fetching your societies:', error);
      toast.error('Failed to load your societies');
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async (e, societyId, societyName) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to leave ${societyName}?`)) {
      return;
    }
    
    try {
      await apiMethods.post(ENDPOINTS.SOCIETIES.LEAVE(societyId));
      toast.success(`Left ${societyName}`);
      // Remove from list
      setYourSocieties(yourSocieties.filter(soc => soc.id !== societyId));
    } catch (error) {
      console.error('Error leaving society:', error);
      toast.error('Failed to leave society');
    }
  };

  const handleView = (societyId) => {
    navigate(`/society/${societyId}`);
  };

  return (
    <div className='bg-gray-100 min-h-screen'>
      <section className='py-7'>
        <Navbar />
      </section>

      <section className='2xl:px-44 xl:px-36 lg:px-28 md:px-20 sm:px-14 px-8'>
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold">Society</h1>
        </div>

        {/* Your Societies */}
        <div className='flex items-center justify-between mt-5'>
          <h2 className="text-xl sm:text-2xl font-bold mb-2">Your Societies</h2>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : yourSocieties.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">You haven't joined any societies yet</p>
            <button 
              onClick={() => navigate('/society')}
              className="mt-4 bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
            >
              Discover Societies
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {yourSocieties.map((society) => (
              <div
                key={society.id}
                className="bg-gray-50 rounded-lg shadow-md p-4 flex flex-col items-center text-center cursor-pointer hover:scale-103 transform transition-transform duration-300"
                onClick={() => handleView(society.id)}
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
                <div className="flex justify-between space-x-2 mt-2">
                  <button 
                    onClick={(e) => handleLeave(e, society.id, society.name)}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm sm:text-base"
                  >
                    Leave
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleView(society.id);
                    }}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm sm:text-base"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default MySocietyList;
