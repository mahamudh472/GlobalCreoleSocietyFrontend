"use client"

import { useState, useMemo } from "react"
import { FaSearch, FaPlus, FaEdit } from "react-icons/fa"
import Navbar from "../Navbar"
import { useNavigate } from "react-router-dom"
import { useMyProducts } from "../../hooks/queries/useProducts"

function ProductManagement() {
    const [searchQuery, setSearchQuery] = useState("")
    const navigate = useNavigate();

    // Fetch real product data from backend
    const { data: allProducts = [], isLoading, error } = useMyProducts()
    
    // Group products by status and filter by search query
    const products = useMemo(() => {
        const filtered = allProducts.filter(product => 
            product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        
        return {
            pending: filtered.filter(p => p.status === 'pending'),
            accepted: filtered.filter(p => p.status === 'approved'),
            rejected: filtered.filter(p => p.status === 'rejected'),
        }
    }, [allProducts, searchQuery])

    // Handle search
    const handleSearch = (e) => {
        setSearchQuery(e.target.value)
        console.log("[v0] Search query:", e.target.value)
    }

    // Handle view details
    const handleViewDetails = (product, section) => {
        console.log(`[v0] View details clicked for ${section}:`, product)
    }

    // Handle sell all
    const handleSellAll = (section) => {
        console.log(`[v0] Sell all clicked for section:`, section)
    }

    // Handle other list
    const handleOtherList = () => {
        console.log("[v0] Other List clicked")
    }

    // Handle add product
    const handleAddProduct = () => {
        console.log("[v0] Add Product clicked")
    }

    // Handle edit product
    const handleEditProduct = (product) => {
        navigate(`/marketplace/myproduct/edit/${product.id}`)
    }

    // Product Card Component
    const ProductCard = ({ product, section }) => (
        <div className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
                <img
                    src={product.primary_image?.image_url || "https://via.placeholder.com/150"}
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
                    className="cursor-pointer bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                    <FaEdit />
                    Edit
                </button>
                <button
                    onClick={() => {
                        handleViewDetails(product, section)
                        navigate(`/marketplace/product/${product.id}`)
                    }}
                    className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                    View Details
                </button>
            </div>
        </div>
    )

    // Section Component
    const ProductSection = ({ title, products, sectionKey }) => (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                    {title} ({products.length})
                </h2>
                <button
                    onClick={() => {
                        handleSellAll(sectionKey)
                        navigate("/marketplace/myproduct/list")
                    }}
                    className="cursor-pointer text-blue-500 hover:text-blue-600 text-sm font-medium"
                >
                    View All
                </button>
            </div>
            {products.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                    <p className="text-gray-500">No {sectionKey} products</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} section={sectionKey} />
                    ))}
                </div>
            )}
        </div>
    )

    if (isLoading) {
        return (
            <div>
                <div className="py-7">
                    <Navbar></Navbar>
                </div>
                <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div>
                <div className="py-7">
                    <Navbar></Navbar>
                </div>
                <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <p className="text-red-500">Failed to load products</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div>

            <div className="py-7">
                <Navbar></Navbar>
            </div>



            <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
                <div className="2xl:px-44 xl:px-36 lg:px-28 md:px-20 sm:px-14 px-8 mt-10">
                    {/* Search and Actions Bar */}
                    <div className="mb-6 flex flex-col sm:flex-row gap-3">
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
                                onClick={()=>{
                                    handleOtherList()
                                    navigate("/marketplace/orderlist")
                                }}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer"
                            >
                                Other List
                            </button>
                            <button
                                onClick={() => {
                                    handleAddProduct()
                                    navigate('/marketplace/myproduct/addproduct')
                                }}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer"
                            >
                                <FaPlus className="text-sm" />
                                Add Product
                            </button>
                        </div>
                    </div>

                    {/* Product Sections */}
                    <ProductSection title="Pending Products" products={products.pending} sectionKey="pending" />
                    <ProductSection title="Approved Products" products={products.accepted} sectionKey="accepted" />
                    <ProductSection title="Rejected Products" products={products.rejected} sectionKey="rejected" />
                </div>
            </div>
        </div>
    )
}

export default ProductManagement
