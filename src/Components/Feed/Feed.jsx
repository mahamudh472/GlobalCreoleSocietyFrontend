import React from 'react'
import Navbar from '../Navbar'
import SocialFeed from './SocialFeed'
import { useParams } from 'react-router-dom'
import GlobalChatPopUp from './GlobalChatPopUp'


const Feed = () => {

    return (
        <div className='relative bg-gray-100'>
            <Navbar></Navbar>
            <div className='2xl:px-[30rem] xl:px-[24rem] lg:px-[20rem] md:px-[16rem] sm:px-[12rem] px-8 pt-7'>
                <SocialFeed></SocialFeed>
            </div>
            <div className='fixed bottom-5 right-5 z-[9999]'>
                <GlobalChatPopUp></GlobalChatPopUp>

            </div>
        </div>
    )
}

export default Feed