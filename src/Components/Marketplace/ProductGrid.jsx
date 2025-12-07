// ProductGrid.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProductGrid = ({ products = [] }) => {
    const { user } = useAuth();
    const navigate = useNavigate()
    
    const handleClick = (id) => {
        console.log(id)
    }
    
    if (!products || products.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg shadow-md">
                <p className="text-gray-500 text-lg">No products available right now 🚫</p>
            </div>
        );
    }

    return (

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {products?.map((product) => {
                const isOwnProduct = user && product.seller === user.id;
                
                return (
                    <div
                        key={product?.id}
                        onClick={() => {
                            handleClick(product?.id)
                            navigate(`/marketplace/product/${product?.id}`)
                        }}
                        className="bg-gray-50 rounded-lg shadow-md overflow-hidden hover:scale-103 transform transition-transform duration-700 ease-in-out cursor-pointer relative">
                        {isOwnProduct && (
                            <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full z-10">
                                Your Product
                            </div>
                        )}
                        {product?.primary_image?.image ? (
                            <img
                                src={product.primary_image.image}
                                alt={product?.name}
                                className="w-full h-48 object-cover"
                                onError={(e) => {
                                    e.target.onerror = null; // Prevent infinite loop
                                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect fill='%23f3f4f6' width='300' height='200'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='18' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
                                }}
                            />
                        ) : (
                            <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        )}
                        <div className="">
                            <p className="text-sm text-gray-500 mb-1 bg-[#DBEAFE] p-3 rounded-br-[100px]">{product.category_name}</p>
                            <div className='px-4 py-1'>
                                <p className="text-lg font-semibold text-green-600 mb-1">${product.price}</p>
                                <p className="text-base text-gray-800 mb-1">{product?.name}</p>
                                <p className="text-sm text-gray-500">{product?.sold}</p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ProductGrid;