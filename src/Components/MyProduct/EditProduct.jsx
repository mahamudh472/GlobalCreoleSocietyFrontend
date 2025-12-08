import React, { useState, useEffect } from 'react'
import Navbar from '../Navbar'
import { FaArrowLeft } from 'react-icons/fa'
import { useNavigate, useParams } from 'react-router-dom'
import { useProductDetail } from '../../hooks/queries/useProducts'
import { useProductCategories } from '../../hooks/queries/useProducts'
import { useUpdateProductMutation, useDeleteProductMutation } from '../../hooks/mutations/useProducts'
import { toast } from 'react-toastify'

const EditProduct = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    
    // Fetch product details
    const { data: product, isLoading: loadingProduct } = useProductDetail(id)
    const { data: categories = [], isLoading: loadingCategories } = useProductCategories()
    const updateProductMutation = useUpdateProductMutation()
    const deleteProductMutation = useDeleteProductMutation()
    
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        stock: '',
        category: ''
    })
    const [existingImages, setExistingImages] = useState([])
    const [newImages, setNewImages] = useState([])

    // Load product data when fetched
    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name || '',
                description: product.description || '',
                price: product.price || '',
                stock: product.stock || '',
                category: product.category || ''
            })
            setExistingImages(product.images || [])
        }
    }, [product])

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files)
        setNewImages(files)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!formData.name || !formData.price || !formData.stock || !formData.category) {
            toast.error('Please fill in all required fields')
            return
        }

        const submitData = new FormData()
        submitData.append('name', formData.name)
        submitData.append('description', formData.description)
        submitData.append('price', formData.price)
        submitData.append('stock', formData.stock)
        submitData.append('category', formData.category)
        
        // Add new images if any
        newImages.forEach((image) => {
            submitData.append('uploaded_images', image)
        })

        updateProductMutation.mutate(
            { productId: id, productData: submitData },
            {
                onSuccess: () => {
                    toast.success('Product updated successfully!')
                    navigate('/marketplace/myproduct/list')
                },
                onError: (error) => {
                    console.error('Error updating product:', error)
                    toast.error(error.response?.data?.message || 'Failed to update product')
                }
            }
        )
    }

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
            deleteProductMutation.mutate(id, {
                onSuccess: () => {
                    toast.success('Product deleted successfully!')
                    navigate('/marketplace/myproduct/list')
                },
                onError: (error) => {
                    console.error('Error deleting product:', error)
                    toast.error('Failed to delete product')
                }
            })
        }
    }

    if (loadingProduct || loadingCategories) {
        return (
            <div>
                <Navbar />
                <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            </div>
        )
    }

    if (!product) {
        return (
            <div>
                <Navbar />
                <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <p className="text-red-500">Product not found</p>
                        <button
                            onClick={() => navigate('/marketplace/myproduct/list')}
                            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
                        >
                            Back to Products
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className='bg-gray-100 min-h-screen'>
            <div className='py-7'>
                <Navbar />
            </div>

            <div className='2xl:px-44 xl:px-36 lg:px-28 md:px-20 sm:px-14 px-8'>
                <div className='my-10'>
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                        <button
                            onClick={() => navigate('/marketplace/myproduct/list')}
                            className="text-gray-600 hover:text-gray-900 cursor-pointer"
                        >
                            <FaArrowLeft size={24} />
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
                    </div>

                    {/* Form */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Product Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Product Name *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter product name"
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows="4"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter product description"
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Category *
                                </label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Select a category</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Price and Stock */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Price ($) *
                                    </label>
                                    <input
                                        type="number"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        step="0.01"
                                        min="0"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Stock Quantity *
                                    </label>
                                    <input
                                        type="number"
                                        name="stock"
                                        value={formData.stock}
                                        onChange={handleInputChange}
                                        min="0"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="0"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Existing Images */}
                            {existingImages.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Current Images
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {existingImages.map((img, index) => (
                                            <div key={index} className="relative">
                                                <img
                                                    src={img.image || img.image_url}
                                                    alt={`Product ${index + 1}`}
                                                    className="w-full h-32 object-cover rounded-lg"
                                                />
                                                {img.is_primary && (
                                                    <span className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                                                        Primary
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* New Images */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Add New Images
                                </label>
                                <input
                                    type="file"
                                    onChange={handleImageChange}
                                    multiple
                                    accept="image/*"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                {newImages.length > 0 && (
                                    <p className="text-sm text-gray-500 mt-2">
                                        {newImages.length} new image(s) selected
                                    </p>
                                )}
                            </div>

                            {/* Product Status Info */}
                            {product.status && (
                                <div className={`p-4 rounded-lg ${
                                    product.status === 'approved' ? 'bg-green-50 text-green-800' :
                                    product.status === 'rejected' ? 'bg-red-50 text-red-800' :
                                    'bg-yellow-50 text-yellow-800'
                                }`}>
                                    <p className="font-medium">Status: <span className="capitalize">{product.status}</span></p>
                                    {product.rejection_reason && (
                                        <p className="text-sm mt-1">Reason: {product.rejection_reason}</p>
                                    )}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="submit"
                                    disabled={updateProductMutation.isPending}
                                    className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                                >
                                    {updateProductMutation.isPending ? 'Updating...' : 'Update Product'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={deleteProductMutation.isPending}
                                    className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                                >
                                    {deleteProductMutation.isPending ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default EditProduct
