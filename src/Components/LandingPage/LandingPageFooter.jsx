import React from 'react'
import { CiInstagram } from 'react-icons/ci'
import { FaYoutube } from 'react-icons/fa'
import { FaXTwitter } from 'react-icons/fa6'

const LandingPageFooter = () => {
    return (
        <div className="px-2 sm:px-4">
            <footer className="footer flex flex-col md:flex-row md:footer-horizontal text-[#2b2b2b] py-8 sm:py-10 gap-8 md:gap-4">
                <aside className="w-full md:w-auto text-center md:text-left">
                    <p className="text-sm sm:text-base">Your partner in social media success</p>
                    <section className='flex gap-3 sm:gap-4 text-xl sm:text-2xl mt-3 sm:mt-4 justify-center md:justify-start'>
                        <CiInstagram
                            className="p-2 sm:p-3 w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 bg-[#FAFAFA] rounded-full"
                        />
                        <FaXTwitter className="p-2 sm:p-3 w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 bg-[#FAFAFA] rounded-full" />
                        <FaYoutube className="p-2 sm:p-3 w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 bg-[#FAFAFA] rounded-full" />
                    </section>
                </aside>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 w-full md:w-auto md:flex md:flex-row md:gap-12 lg:gap-16">
                    <nav className="flex flex-col gap-1 sm:gap-2">
                        <h6 className="footer-title text-sm sm:text-base font-semibold">About Us</h6>
                        <a className="link link-hover text-xs sm:text-sm">Who We Are</a>
                        <a className="link link-hover text-xs sm:text-sm">What We Do</a>
                        <a className="link link-hover text-xs sm:text-sm">Our Mission</a>
                        <a className="link link-hover text-xs sm:text-sm">Our Vision</a>
                        <a className="link link-hover text-xs sm:text-sm">Our Pricing</a>
                    </nav>

                    <nav className="flex flex-col gap-1 sm:gap-2">
                        <h6 className="footer-title text-sm sm:text-base font-semibold">Our Services</h6>
                        <a className="link link-hover text-xs sm:text-sm">Socmed Management</a>
                        <a className="link link-hover text-xs sm:text-sm">Content Creation</a>
                        <a className="link link-hover text-xs sm:text-sm">Analytics & Reporting</a>
                        <a className="link link-hover text-xs sm:text-sm">Campaign Management</a>
                        <a className="link link-hover text-xs sm:text-sm">Social Listening</a>
                    </nav>

                    <nav className="flex flex-col gap-1 sm:gap-2">
                        <h6 className="footer-title text-sm sm:text-base font-semibold">Support</h6>
                        <a className="link link-hover text-xs sm:text-sm">FAQs</a>
                        <a className="link link-hover text-xs sm:text-sm">Contact Us</a>
                        <a className="link link-hover text-xs sm:text-sm">Terms of Service</a>
                        <a className="link link-hover text-xs sm:text-sm">Privacy Policy</a>
                        <a className="link link-hover text-xs sm:text-sm">Refund Policy</a>
                    </nav>

                    <nav className="flex flex-col gap-1 sm:gap-2">
                        <h6 className="footer-title text-sm sm:text-base font-semibold">Community</h6>
                        <a className="link link-hover text-xs sm:text-sm">Join Our Community</a>
                        <a className="link link-hover text-xs sm:text-sm">Events & Workshops</a>
                        <a className="link link-hover text-xs sm:text-sm">Member Stories</a>
                    </nav>
                </div>
            </footer>
        </div>
    )
}

export default LandingPageFooter
