import React from 'react'
import logo from '../../assets/Image.png'

const LangdingPageHeader = () => {
    return (
        <div className="px-4 sm:px-8 md:px-12 pt-10 sm:pt-16 md:pt-20">
            {/* Main Section */}
            <div className="text-center">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-4 leading-tight">
                    <span className='text-blue-600'>Elevate</span> Your Social Reach with <span className="text-blue-600">Global Creole Society</span>
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-gray-700 mb-6 sm:mb-8 max-w-3xl mx-auto px-2">
                    Manage all your social media channels effortlessly with our intuitive tools, comprehensive analytics, and expert support, ensuring you stay ahead in the ever-evolving digital landscape.
                </p>
                <a href="#learn-more" className="inline-block bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm sm:text-base md:text-lg font-medium hover:bg-blue-700 transition-all">
                    Learn more →
                </a>
            </div>

            {/* Notifications Section */}
            <div>
                <div>
                    <h3></h3>
                    <div></div>
                </div>
                <div>
                    <figure className=''>
                        <img src={logo} alt="Notification Images" className="mx-auto mt-6 sm:mt-8 border-b-0 max-w-full" />
                    </figure>
                </div>
                <div></div>
            </div>
        </div>
    )
}

export default LangdingPageHeader