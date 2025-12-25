import navlogo from "../../assets/Logo.png";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";

const LandingPageNavbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="bg-[#0F172A] p-2 sm:p-3 xl:p-4 rounded-full relative">
      <div className="flex justify-between items-center">
        {/* Left Section: Logo and Title */}
        <div className="flex items-center">
          <figure className="mr-2 sm:mr-3">
            <img src={navlogo} alt="Navlogo" className="w-8 h-auto sm:w-10" />
          </figure>
          <h1
            onClick={() => navigate("/", { replace: true })}
            className="text-white text-lg sm:text-xl md:text-2xl font-bold cursor-pointer"
          >
            Socialcrea
          </h1>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex text-white space-x-5 text-base lg:text-lg">
          <NavLink to="/marketplace">Shop</NavLink>
          <NavLink to="/advertisement-request">Advertisement</NavLink>
        </div>

        {/* Right Section: Sign In or Feed Button */}
        <div className="hidden md:flex items-center">
          {loading ? (
            <div className="w-20 h-10 bg-gray-300 animate-pulse rounded-full"></div>
          ) : isAuthenticated ? (
            <button
              onClick={() => navigate("/feed")}
              className="cursor-pointer bg-white text-[#0f0f1f] py-2 px-4 lg:px-6 rounded-full text-base lg:text-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Feed
            </button>
          ) : (
            <button
              onClick={() => navigate("/signin")}
              className="cursor-pointer bg-white text-[#0f0f1f] py-2 px-4 lg:px-6 rounded-full text-base lg:text-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Sign In
            </button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-white p-2"
        >
          {mobileMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 mt-2 bg-[#0F172A] rounded-2xl p-4 z-50 shadow-lg">
          <div className="flex flex-col space-y-3">
            <NavLink 
              to="/marketplace" 
              className="text-white text-base py-2 px-4 hover:bg-white/10 rounded-lg"
              onClick={() => setMobileMenuOpen(false)}
            >
              Shop
            </NavLink>
            <NavLink 
              to="/advertisement-request" 
              className="text-white text-base py-2 px-4 hover:bg-white/10 rounded-lg"
              onClick={() => setMobileMenuOpen(false)}
            >
              Advertisement
            </NavLink>
            <div className="border-t border-white/20 pt-3">
              {loading ? (
                <div className="w-full h-10 bg-gray-300 animate-pulse rounded-full"></div>
              ) : isAuthenticated ? (
                <button
                  onClick={() => {
                    navigate("/feed");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full cursor-pointer bg-white text-[#0f0f1f] py-2 px-6 rounded-full text-base font-medium hover:bg-gray-200 transition-colors"
                >
                  Feed
                </button>
              ) : (
                <button
                  onClick={() => {
                    navigate("/signin");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full cursor-pointer bg-white text-[#0f0f1f] py-2 px-6 rounded-full text-base font-medium hover:bg-gray-200 transition-colors"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPageNavbar;
