import navlogo from "../../assets/Logo.png";
import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const LandingPageNavbar = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in by checking for access token
    const token = localStorage.getItem('access_token');
    setIsLoggedIn(!!token);
  }, []);

  return (
    <div className="flex justify-between items-center bg-[#0F172A] p-3 xl:p-4 rounded-full">
      {/* Left Section: Logo and Title */}
      <div className="flex items-center">
        <figure className="mr-3">
          <img src={navlogo} alt="Navlogo" className="w-10 h-auto" />
        </figure>
        <h1
          onClick={() => navigate("/", { replace: true })}
          className="text-white text-2xl font-bold cursor-pointer"
        >
          Socialcrea
        </h1>
      </div>
      <div className="text-white space-x-5 text-lg">
        <NavLink to="/marketplace">Shop</NavLink>
        <NavLink to="/advertisement-request">Advertisement</NavLink>
      </div>

      {/* Right Section: Sign In or Feed Button */}
      <div className="flex items-center">
        {isLoggedIn ? (
          <button
            onClick={() => navigate("/feed")}
            className="cursor-pointer bg-white text-[#0f0f1f] py-2 px-6 rounded-full text-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Feed
          </button>
        ) : (
          <button
            onClick={() => navigate("/signin")}
            className="cursor-pointer bg-white text-[#0f0f1f] py-2 px-6 rounded-full text-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Sign In
          </button>
        )}
      </div>
    </div>
  );
};

export default LandingPageNavbar;
