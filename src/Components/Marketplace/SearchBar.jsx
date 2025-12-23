// SearchBar.jsx
import React, { useState } from 'react';
import { AiOutlineSearch } from 'react-icons/ai';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const SearchBar = ({ onSearch }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [searchValue, setSearchValue] = useState('');

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(searchValue);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex items-center justify-between">
      <div className="relative flex-grow mr-4">
        <input
          type="text"
          value={searchValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Search products..."
          className="w-full pl-4 pr-10 py-2 border border-gray-300 bg-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <AiOutlineSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={28} />
      </div>
      {isAuthenticated ? (
        <>
          <button
            onClick={() => {
              navigate("/marketplace/orderlist")
            }}
            className="px-6 py-2 border border-gray-300 rounded-lg text-white bg-[#3B82F6] hover:bg-blue-700 transition cursor-pointer">
            Order List
          </button>
          <button
            onClick={() => [
              navigate("/marketplace/myproduct")
            ]}
            className="ml-2 px-6 py-2 bg-[#3B82F6] text-white rounded-lg hover:bg-blue-700 transition cursor-pointer">
            My Product
          </button>
        </>
      ) : (
        <button
          onClick={() => navigate("/signin")}
          className="px-6 py-2 bg-[#3B82F6] text-white rounded-lg hover:bg-blue-700 transition cursor-pointer">
          Sign In
        </button>
      )}
    </div>
  );
};

export default SearchBar;