"use client"

import { useState, useEffect } from "react"
import { FaImage, FaTimes } from "react-icons/fa"
import { useNavigate, useSearchParams } from "react-router-dom"
import Navbar from "../Navbar"
import { useCreateProductMutation } from "../../hooks/mutations/useProducts"
import { useCurrentUser } from "../../hooks/queries/useUser"
import { useProductCategories } from "../../hooks/queries/useProducts"
import { useCreateStripeAccountMutation } from "../../hooks/mutations/useCart"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "react-toastify"
import { DEFAULT_AVATAR } from "../../utils/defaultAvatar"

function CreateProduct() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const { data: user, isLoading: loadingUser, refetch: refetchUser } = useCurrentUser()
  const { data: categoriesData = [], isLoading: loadingCategories } = useProductCategories()
  const createProductMutation = useCreateProductMutation()
  const createStripeAccountMutation = useCreateStripeAccountMutation()
  
  // Check if user has Stripe account set up
  const hasStripeAccount = user?.stripe_account_id && user?.is_onboarding_completed
  
  // Handle Stripe onboarding return
  useEffect(() => {
    const stripeOnboarding = searchParams.get('stripe_onboarding')
    if (stripeOnboarding === 'complete') {
      // Refetch user data to get updated Stripe status
      refetchUser()
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      toast.success('Stripe account setup completed! You can now sell products.')
      // Remove query param from URL
      navigate('/marketplace/myproduct/addproduct', { replace: true })
    }
  }, [searchParams, refetchUser, queryClient, navigate])
  
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
  
  // Handle Stripe account creation with frontend URL
  const handleCreateStripeAccount = () => {
    const frontendUrl = window.location.origin
    createStripeAccountMutation.mutate({ frontend_url: frontendUrl })
  }

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

            {/* Stripe Account Setup Required */}
            {!loadingUser && !hasStripeAccount && (
              <div className="mb-6 p-6 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Set Up Your Seller Account</h3>
                    <p className="text-gray-600 mb-4">
                      To sell products on our marketplace, you need to connect a Stripe account. 
                      This allows you to receive payments directly when customers purchase your products.
                    </p>
                    <ul className="text-sm text-gray-500 mb-4 space-y-1">
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Secure payment processing
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Direct deposits to your bank account
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Only 2% platform fee
                      </li>
                    </ul>
                    <button
                      onClick={handleCreateStripeAccount}
                      disabled={createStripeAccountMutation.isPending}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold rounded-lg transition-colors"
                    >
                      {createStripeAccountMutation.isPending ? (
                        <>
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Setting up...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Connect with Stripe
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Seller Info */}
            <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-gray-200">
              <img
                src={user?.profile_image || DEFAULT_AVATAR}
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
                disabled={createProductMutation.isPending || !hasStripeAccount}
                className="cursor-pointer w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
              >
                {!hasStripeAccount ? 'Set up Stripe account to sell' : createProductMutation.isPending ? 'Creating Product...' : 'Post Product'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateProduct
