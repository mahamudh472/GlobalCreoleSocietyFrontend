import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../Navbar";
import { useOrderDetail } from "../../hooks/queries/useCart";

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: order, isLoading, error } = useOrderDetail(id);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </>
    );
  }

  if (error || !order) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-100 py-6 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Order not found</h3>
              <p className="text-gray-500 mb-4">The order you're looking for doesn't exist or you don't have access to it.</p>
              <button
                onClick={() => navigate('/marketplace/orders')}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Back to Orders
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gray-100 py-6 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Back Button */}
          <button
            onClick={() => navigate('/marketplace/orders')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Orders
          </button>

          {/* Order ID & Status */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Order Details</h2>
                <p className="text-sm text-gray-500">Order #{String(order.id).slice(0, 8)}</p>
              </div>
              <div className="flex gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(order.payment_status)}`}>
                  {order.payment_status || 'Pending'}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Placed on {new Date(order.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          {/* Products */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-800 mb-4">Products</h3>
            <div className="space-y-4">
              {order.items?.map((item, index) => (
                <div key={index} className="flex gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={item.product_image || 'https://via.placeholder.com/80'}
                      alt={item.product_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{item.product_name}</h4>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    <p className="font-semibold text-gray-900">
                      ${parseFloat(item.product_price).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ${(parseFloat(item.product_price) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Order Summary</h3>
            <div className="text-sm text-gray-600 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${parseFloat(order.total_price || order.total_amount || 0).toFixed(2)}</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between font-semibold text-lg text-gray-900">
                <span>Total</span>
                <span>${parseFloat(order.total_price || order.total_amount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment & Delivery Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Payment Method</h3>
              <p className="text-gray-600">
                {order.payment_method === 'card' ? 'Credit/Debit Card' : 
                 order.payment_method === 'cash_on_delivery' ? 'Cash on Delivery' : 
                 order.payment_method}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Delivery Type</h3>
              <p className="text-gray-600">
                {order.delivery_type === 'home' ? 'Home Delivery' : 
                 order.delivery_type === 'outlet' ? 'Pickup at Outlet' : 
                 order.delivery_type}
              </p>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Order Notes</h3>
              <p className="text-gray-600">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
