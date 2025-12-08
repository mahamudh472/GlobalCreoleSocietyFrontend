import React, { useState } from 'react'
import Navbar from '../Navbar'
import { FaPlus, FaSearch, FaEdit } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import { useMyProducts } from '../../hooks/queries/useProducts'

const MyProductList = () => {
    const navigate = useNavigate()
    const [searchQuery, setSearchQuery] = useState("")
    
    // Use TanStack Query to fetch user's products
    const { data: products = [], isLoading, error } = useMyProducts()
    
    // Filter products based on search query
    const filteredProducts = products.filter(product => 
        product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Handle search
    const handleSearch = (e) => {
        setSearchQuery(e.target.value)
    }
    
    const handleViewDetails = (product) => {
        navigate(`/marketplace/product/${product.id}`)
    }

    const handleEditProduct = (product) => {
        navigate(`/marketplace/myproduct/edit/${product.id}`)
    }

    return (
        <div className='bg-[#F3F4F6] min-h-screen'>
            <div className='py-7'>
                <Navbar></Navbar>
            </div>

            <div className='2xl:px-44 xl:px-36 lg:px-28 md:px-20 sm:px-14 px-8'>
                {/* Search and Actions Bar */}
                <div className="my-10 flex flex-col sm:flex-row gap-3 w-f">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={handleSearch}
                            placeholder="search your product"
                            className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate("/marketplace/orderlist")}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer"
                        >
                            Other List
                        </button>
                        <button
                            onClick={() => navigate('/marketplace/myproduct/addproduct')}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer"
                        >
                            <FaPlus className="text-sm" />
                            Add Product
                        </button>
                    </div>
                </div>



                {/* Product list based on categories */}
                <div className='space-y-5'>
                    {isLoading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                        </div>
                    ) : error ? (
                        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                            <p className="text-red-500">Failed to load products</p>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                            <p className="text-gray-500">
                                {searchQuery ? 'No products match your search' : 'No products yet. Create your first product!'}
                            </p>
                        </div>
                    ) : (
                        filteredProducts.map(product => (
                            <div key={product.id} className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <img
                                        src={product.primary_image?.image || product.primary_image?.image_url || "https://via.placeholder.com/150"}
                                        alt={product.name}
                                        className="w-16 h-16 object-cover rounded-lg bg-gray-100"
                                    />
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1 capitalize">{product.status}</p>
                                        <h3 className="font-semibold text-gray-900">{product.name}</h3>
                                        <p className="text-lg font-bold text-gray-900">${product.price}</p>
                                        {product.stock !== undefined && (
                                            <p className="text-sm text-gray-500">Stock: {product.stock}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEditProduct(product)}
                                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center gap-2"
                                    >
                                        <FaEdit />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleViewDetails(product)}
                                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>





            </div>



        </div>
    )
}

export default MyProductList