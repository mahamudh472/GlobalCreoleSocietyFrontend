"use client"

import Navbar from "../Navbar"
import { useCart, useOrders } from "../../hooks/queries/useCart"
import { useRemoveCartItemMutation } from "../../hooks/mutations/useCart"

function OrderCart() {
    const { data: cartData, isLoading: loadingCart } = useCart()
    const { data: orders = [], isLoading: loadingOrders } = useOrders()
    
    const removeItemMutation = useRemoveCartItemMutation()
    
    const cartItems = cartData?.items || []
    
    const handleViewDetails = (order) => {
        console.log("View order details:", order)
    }
    
    const handleRemoveItem = (itemId) => {
        if (window.confirm('Remove this item from cart?')) {
            removeItemMutation.mutate(itemId)
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
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">My Orders</h2>
                        {orders.length === 0 ? (
                            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                                <p className="text-gray-500">No orders yet</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {orders.map((order) => (
                                    <div key={order.id} className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex-1">
                                                <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-1">
                                                    Order #{order.id}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    Status: <span className="font-medium">{order.status}</span>
                                                </p>
                                                <p className="text-lg sm:text-xl font-bold text-gray-900 mt-2">
                                                    ${order.total_price || 0}
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

                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                            Your Cart ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
                        </h2>

                        {cartItems.length === 0 ? (
                            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                                <p className="text-gray-500">Your cart is empty</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {cartItems.map((item) => (
                                    <div key={item.id} className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                                <img
                                                    src={item.product_image?.image_url || "https://via.placeholder.com/150"}
                                                    alt={item.product_name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-1">
                                                    {item.product_name}
                                                </h3>
                                                <div className="flex items-center gap-4">
                                                    <p className="text-lg font-bold text-gray-900">
                                                        ${item.product_price}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        Quantity: {item.quantity}
                                                    </p>
                                                    <p className="text-base font-medium text-gray-900">
                                                        Subtotal: ${item.subtotal}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveItem(item.id)}
                                                disabled={removeItemMutation.isPending}
                                                className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0"
                                            >
                                                {removeItemMutation.isPending ? 'Removing...' : 'Remove'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                
                                <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-lg font-medium">Total:</span>
                                        <span className="text-2xl font-bold text-gray-900">
                                            ${cartData?.total_price || 0}
                                        </span>
                                    </div>
                                    <button className="w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
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
