import React from 'react'
import { BsThreeDots } from 'react-icons/bs'
import { HiMiniCalendarDateRange } from 'react-icons/hi2'
import { MdOutlineWork } from 'react-icons/md'
import { SlLocationPin } from 'react-icons/sl'

const AboutMe = ({ profile, handleEditAboutPopup, isOwnProfile = true }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  // Get first location, work, and education
  const location = profile?.locations?.[0]?.name || 'Not specified'
  const work = profile?.works?.[0] 
  const workText = work ? `${work.position || 'Working'} at ${work.company || 'Company'}` : 'Not specified'

  return (
    <div className='relative'>
      <section>
        <div className='flex justify-between text-lg font-semibold space-y-3'>
          <h3 className='font-bold text-xl'>About Me </h3>
          {isOwnProfile && (
            <BsThreeDots
              size={20}
              className='cursor-pointer'
              onClick={handleEditAboutPopup} // trigger modal open
            />
          )}
        </div>
        <div className='flex flex-col opacity-70 space-y-1'>
          <div className='flex justify-between items-center gap-2'>
            <SlLocationPin size={20} className="flex-shrink-0" />
            <p className='text-lg flex-1 text-right'>{location}</p>
          </div>
          <div className='flex justify-between items-center gap-2'>
            <HiMiniCalendarDateRange size={20} className="flex-shrink-0" />
            <p className='text-lg flex-1 text-right'>Joined {formatDate(profile?.date_joined)}</p>
          </div>
          <div className='flex justify-between items-center gap-2'>
            <MdOutlineWork size={20} className="flex-shrink-0" />
            <p className='text-lg flex-1 text-right truncate'>{workText}</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default AboutMe
