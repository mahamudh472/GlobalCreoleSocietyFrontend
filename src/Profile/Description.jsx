import React, { useState, useEffect } from 'react'
import '../assets/styles/Description.css'

const Description = ({ profile, onUpdate, isOwnProfile = true }) => {
    const [isEdit, setIsEdit] = useState(false)
    const [description, setDescription] = useState('')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (profile?.description) {
            setDescription(profile.description)
        }
    }, [profile])

    const handleEditToggle = () => {
        setIsEdit(!isEdit)
        // Reset description if canceling
        if (isEdit) {
            setDescription(profile?.description || '')
        }
    }

    const handleSave = async () => {
        setSaving(true)
        const result = await onUpdate({ description })
        setSaving(false)
        
        if (result.success) {
            setIsEdit(false)
        } else {
            alert('Failed to update description')
        }
    }

    return (
        <div className="flex flex-col gap-5 max-h-[260px] truncate ">
            <div className="flex justify-between items-start">
                <h3 className="text-[#364045] font-bold text-xl">Description</h3>
                {isOwnProfile && (
                    <button
                        onClick={handleEditToggle}
                        disabled={saving}
                        className="border-2 border-gray-200 cursor-pointer transform transition-transform duration-300 ease-in-out hover:scale-105 px-3 py-1 rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                        {isEdit ? 'Cancel' : 'Edit'}
                    </button>
                )}
            </div>

            {isEdit ? (
                <div className="flex flex-col gap-3 p-1">
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-1 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent scrollbar-red"
                        rows={6}
                        placeholder="Write something about yourself..."
                    />
                    <div className="flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium cursor-pointer disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            ) : (
                <p className="text-[#48555C] whitespace-pre-line truncate overflow-auto scrollbar-red">
                    {description || 'No description yet'}
                </p>
            )}
        </div>
    )
}

export default Description
