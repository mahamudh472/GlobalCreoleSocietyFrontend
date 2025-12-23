"use client"

import { useNavigate } from "react-router-dom"
import Navbar from "../Navbar"
import { useCart, useOrders } from "../../hooks/queries/useCart"
import { useRemoveCartItemMutation, useUpdateCartItemMutation, useClearCartMutation } from "../../hooks/mutations/useCart"

function OrderCart() {
    const navigate = useNavigate()
    const { data: cartData, isLoading: loadingCart } = useCart()
    const { data: orders = [], isLoading: loadingOrders } = useOrders()
    
    const removeItemMutation = useRemoveCartItemMutation()
    const updateItemMutation = useUpdateCartItemMutation()
    const clearCartMutation = useClearCartMutation()
    
    const cartItems = cartData?.items || []
    
    const handleViewDetails = (order) => {
        navigate(`/marketplace/orders/${order.id}`)
    }
    
    const handleRemoveItem = (itemId) => {
        if (window.confirm('Remove this item from cart?')) {
            removeItemMutation.mutate(itemId)
        }
    }
    
    const handleUpdateQuantity = (itemId, newQuantity) => {
        if (newQuantity < 1) return
        updateItemMutation.mutate({ itemId, quantity: newQuantity })
    }
    
    const handleClearCart = () => {
        if (window.confirm('Clear all items from cart?')) {
            clearCartMutation.mutate()
        }
    }
    
    const handleCheckout = () => {
        navigate('/marketplace/payment')
    }
    
    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending': return 'bg-yellow-100 text-yellow-800'
            case 'processing': return 'bg-blue-100 text-blue-800'
            case 'shipped': return 'bg-purple-100 text-purple-800'
            case 'delivered': return 'bg-green-100 text-green-800'
            case 'cancelled': return 'bg-red-100 text-red-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    if (loadingCart || loadingOrders) {
        return (
            <div>
                <Navbar />
                <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            </div>
        )
    }

    return (
        <div>
            <Navbar></Navbar>

            <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
                <div className="2xl:px-44 xl:px-36 lg:px-28 md:px-20 sm:px-14 px-8 space-y-6">
                    {/* Orders Section */}
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">My Orders</h2>
                        {orders.length === 0 ? (
                            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <p className="text-gray-500">No orders yet</p>
                                <button 
                                    onClick={() => navigate('/marketplace')}
                                    className="mt-4 text-blue-500 hover:underline"
                                >
                                    Start shopping
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {orders.map((order) => (
                                    <div key={order.id} className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-sm sm:text-base font-medium text-gray-900">
                                                        Order #{order.id}
                                                    </h3>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                                        {order.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500 mb-1">
                                                    {order.items?.length || 0} item(s) • {new Date(order.created_at).toLocaleDateString()}
                                                </p>
                                                <p className="text-lg sm:text-xl font-bold text-gray-900">
                                                    ${parseFloat(order.total_price || 0).toFixed(2)}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleViewDetails(order)}
                                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0"
                                            >
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Cart Section */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                                Your Cart ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
                            </h2>
                            {cartItems.length > 0 && (
                                <button
                                    onClick={handleClearCart}
                                    disabled={clearCartMutation.isPending}
                                    className="text-red-500 hover:text-red-600 text-sm font-medium"
                                >
                                    {clearCartMutation.isPending ? 'Clearing...' : 'Clear Cart'}
                                </button>
                            )}
                        </div>

                        {cartItems.length === 0 ? (
                            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <p className="text-gray-500">Your cart is empty</p>
                                <button 
                                    onClick={() => navigate('/marketplace')}
                                    className="mt-4 text-blue-500 hover:underline"
                                >
                                    Browse products
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {cartItems.map((item) => (
                                    <div key={item.id} className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                                <img
                                                    src={item.product_image?.image || item.product_image?.image_url || "https://via.placeholder.com/150"}
                                                    alt={item.product_name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-2">
                                                    {item.product_name}
                                                </h3>
                                                <p className="text-lg font-bold text-gray-900 mb-2">
                                                    ${parseFloat(item.product_price).toFixed(2)}
                                                </p>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center border rounded-lg">
                                                        <button
                                                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                                            disabled={item.quantity <= 1 || updateItemMutation.isPending}
                                                            className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="px-3 py-1 border-x">{item.quantity}</span>
                                                        <button
                                                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                                            disabled={updateItemMutation.isPending}
                                                            className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                    <span className="text-sm text-gray-500">
                                                        Subtotal: <span className="font-semibold text-gray-900">${parseFloat(item.subtotal).toFixed(2)}</span>
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveItem(item.id)}
                                                disabled={removeItemMutation.isPending}
                                                className="text-red-500 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors"
                                                title="Remove item"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                
                                {/* Cart Summary */}
                                <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-lg font-medium">Cart Total:</span>
                                        <span className="text-2xl font-bold text-gray-900">
                                            ${parseFloat(cartData?.total_price || 0).toFixed(2)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-4">
                                        Tax and shipping will be calculated at checkout
                                    </p>
                                    <button 
                                        onClick={handleCheckout}
                                        className="w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                                    >
                                        Proceed to Checkout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default OrderCart
