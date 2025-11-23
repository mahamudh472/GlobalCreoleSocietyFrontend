"use client"

import { useState, useEffect } from "react"
import { FaImage, FaTimes } from "react-icons/fa"
import { useNavigate } from "react-router-dom"
import Navbar from "../Navbar"
import { useCreateProductMutation } from "../../hooks/mutations/useProducts"
import { useCurrentUser } from "../../hooks/queries/useUser"
import { useProductCategories } from "../../hooks/queries/useProducts"

function CreateProduct() {
  const navigate = useNavigate()
  const { data: user } = useCurrentUser()
  const { data: categoriesData = [], isLoading: loadingCategories } = useProductCategories()
  const createProductMutation = useCreateProductMutation()
  
  // Ensure categories is always an array
  const categories = Array.isArray(categoriesData) ? categoriesData : []
  
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    description: "",
    category: "",
    stock: "0",
  })
  const [mediaFiles, setMediaFiles] = useState([])
  
  // Set first category as default when categories load
  useEffect(() => {
    if (categories.length > 0 && !formData.category) {
      setFormData(prev => ({ ...prev, category: categories[0].id.toString() }))
    }
  }, [categories])

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Handle media upload
  const handleMediaUpload = (e) => {
    const files = Array.from(e.target.files)
    const newMedia = files.map((file) => ({
      id: Date.now() + Math.random(),
      file,
      preview: URL.createObjectURL(file),
    }))
    setMediaFiles((prev) => [...prev, ...newMedia])
  }

  // Remove media file
  const removeMedia = (id) => {
    setMediaFiles((prev) => prev.filter((media) => media.id !== id))
    // Revoke object URL to free memory
    const media = mediaFiles.find(m => m.id === id)
    if (media?.preview) {
      URL.revokeObjectURL(media.preview)
    }
  }

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault()

    const productData = {
      ...formData,
      media: mediaFiles,
    }

    createProductMutation.mutate(productData, {
      onSuccess: () => {
        // Reset form
        setFormData({ 
          title: "", 
          price: "", 
          description: "",
          category: "",
          stock: "",
        })
        setMediaFiles([])
        
        // Navigate back to product list
        navigate('/marketplace/myproduct')
      }
    })
  }

  return (
    <div>
      <div>
        <Navbar></Navbar>
      </div>


      <div className="min-h-[calc(100vh-100px)] bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6">
            {/* Header */}
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Item for sale</h1>

            {/* Seller Info */}
            <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-gray-200">
              <img
                src={user?.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.profile_name || 'User')}&size=150&background=3b82f6&color=fff`}
                alt={user?.profile_name || 'User'}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <h3 className="font-semibold text-gray-900">{user?.profile_name || user?.email || 'User'}</h3>
                <p className="text-sm text-gray-500">Sell in this shop</p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Media Upload Section */}
              <div className="mb-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    id="media-upload"
                    multiple
                    accept="image/*"
                    onChange={handleMediaUpload}
                    className="hidden"
                  />
                  <label htmlFor="media-upload" className="cursor-pointer flex flex-col items-center">
                    <FaImage className="text-4xl text-blue-500 mb-2" />
                    <span className="text-gray-600 font-medium">Add Media</span>
                  </label>
                </div>

                {/* Media Preview */}
                {mediaFiles.length > 0 && (
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    {mediaFiles.map((media) => (
                      <div key={media.id} className="relative group">
                        <img
                          src={media.preview || "/placeholder.svg"}
                          alt="Preview"
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeMedia(media.id)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <FaTimes className="text-xs" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Required Section */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Required</h2>
                <p className="text-sm text-gray-500 mb-4">Be as descriptive as possible.</p>

                {/* Title Input */}
                <div className="mb-4">
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Title"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Price Input */}
                <div className="mb-4">
                  <input
                    type="number"
                    step="0.01"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="Price"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                {/* Category Select */}
                <div className="mb-4">
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    disabled={loadingCategories}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {loadingCategories ? (
                      <option value="">Loading categories...</option>
                    ) : categories.length === 0 ? (
                      <option value="">No categories available</option>
                    ) : (
                      <>
                        <option value="">Select a category</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
                
                {/* Stock Input */}
                <div className="mb-4">
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    placeholder="Stock quantity"
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Description Textarea */}
                <div>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Description"
                    required
                    rows="6"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={createProductMutation.isPending}
                className="cursor-pointer w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
              >
                {createProductMutation.isPending ? 'Creating Product...' : 'Post Product'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateProduct
