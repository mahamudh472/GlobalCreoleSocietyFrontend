import React from 'react';
import img2 from '../../assets/Image (6).png';
import img1 from '../../assets/Image (7).png';

const LandingPagePersonalized = () => {
  return (
    <div className="py-8 sm:py-12 px-4 sm:px-6 md:px-16 space-y-12 sm:space-y-16">
      <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8 justify-between">
        <div className="md:w-1/2 xl:md:w-[70%] text-center md:text-left">
          <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight">
            A Personalized and Intelligent News Feed for Seamless Social Interaction
          </h3>
          <p className="pt-4 sm:pt-6 text-sm sm:text-base text-gray-700">
            At Global Creole Society, we create digital spaces that deliver the most relevant content, updates, and connections helping individuals and businesses engage with what truly matters
          </p>
          <button className="mt-4 sm:mt-6 bg-[#3660F9] rounded-full px-5 sm:px-6 py-2 sm:py-3 text-sm sm:text-base text-white font-semibold hover:bg-[#2b4cd9] transition">
            Learn More
          </button>
        </div>
        <figure className="md:w-1/2 max-w-[500px] lg:max-w-[600px] mx-auto md:mx-0">
          <img
            src={img2}
            alt="Illustration of personalized news feed"
            className="w-full h-auto object-contain"
          />
        </figure>
      </div>
      {/* Second Part Div */}
      <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8 justify-between">
        <figure className="md:w-1/2 max-w-[500px] lg:max-w-[600px] mx-auto md:mx-0 order-2 md:order-1">
          <img
            src={img1}
            alt="Illustration of personalized news feed"
            className="w-full h-auto object-contain"
          />
        </figure>
        <div className="md:w-1/2 xl:md:w-[70%] text-center md:text-left order-1 md:order-2">
          <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight">
            A Personalized and Intelligent News Feed for Seamless Social Interaction
          </h3>
          <p className="pt-4 sm:pt-6 text-sm sm:text-base text-gray-700">
            At Global Creole Society, we create digital spaces that deliver the most relevant content, updates, and connections helping individuals and businesses engage with what truly matters
          </p>
          <button className="mt-4 sm:mt-6 bg-[#3660F9] rounded-full px-5 sm:px-6 py-2 sm:py-3 text-sm sm:text-base text-white font-semibold hover:bg-[#2b4cd9] transition">
            Learn More
          </button>
        </div>

      </div>
    </div>
  );
};

export default LandingPagePersonalized;
