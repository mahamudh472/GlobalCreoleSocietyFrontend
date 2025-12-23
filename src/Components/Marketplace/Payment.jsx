import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../Navbar";
import Swal from "sweetalert2";
import { useCheckoutPreview } from "../../hooks/queries/useCart";
import { 
  useCheckoutMutation, 
  useCreateCheckoutSessionMutation,
  useAddDeliveryAddressMutation 
} from "../../hooks/mutations/useCart";

const Payment = () => {
  const navigate = useNavigate();
  
  // Get checkout preview data
  const { data: checkoutData, isLoading, error } = useCheckoutPreview();
  
  // Mutations
  const checkoutMutation = useCheckoutMutation();
  const createCheckoutSessionMutation = useCreateCheckoutSessionMutation();
  const addAddressMutation = useAddDeliveryAddressMutation();
  
  const [formData, setFormData] = useState({
    deliveryType: "toAddress",
    paymentMethod: "creditCard",
    isPopupOpen: false,
  });
  
  const [addressForm, setAddressForm] = useState({
    receiver_name: "",
    phone: "",
    city: "",
    address: "",
  });

  // Pre-fill address if available from checkout data
  useEffect(() => {
    if (checkoutData?.delivery_address) {
      const addr = checkoutData.delivery_address;
      setAddressForm({
        receiver_name: addr.receiver_name || "",
        phone: addr.phone || "",
        city: addr.city || "",
        address: addr.address || "",
      });
    }
  }, [checkoutData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddressForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate address for delivery to address
    const hasAddress = checkoutData?.delivery_address || addressForm.address;
    if (formData.deliveryType === "toAddress" && !hasAddress) {
      Swal.fire({
        title: "Address Required",
        text: "Please add a delivery address before proceeding.",
        icon: "warning",
      });
      return;
    }
    
    if (formData.paymentMethod === "cashOnDelivery") {
      // Cash on delivery - create order directly
      Swal.fire({
        title: "Confirm Order",
        text: "Please check your order details before you proceed with Cash on Delivery.",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Confirm Order",
      }).then((result) => {
        if (result.isConfirmed) {
          checkoutMutation.mutate({
            delivery_type: formData.deliveryType,
            payment_method: "cash_on_delivery",
          }, {
            onSuccess: () => {
              Swal.fire({
                title: "Order Placed!",
                text: "Your order has been placed successfully.",
                icon: "success",
              }).then(() => {
                navigate('/marketplace/orders');
              });
            }
          });
        }
      });
    } else if (formData.paymentMethod === "creditCard") {
      // Credit card - create Stripe checkout session
      const frontendUrl = window.location.origin;
      createCheckoutSessionMutation.mutate({
        frontend_url: frontendUrl,
        delivery_type: formData.deliveryType,
      });
    } else if (formData.paymentMethod === "bankTransfer") {
      Swal.fire({
        title: "Bank Transfer",
        text: "Bank transfer option is coming soon!",
        icon: "info",
      });
    }
  };

  const togglePopup = () => {
    setFormData((prev) => ({ ...prev, isPopupOpen: !prev.isPopupOpen }));
  };

  const saveAddress = () => {
    if (!addressForm.receiver_name || !addressForm.phone || !addressForm.address || !addressForm.city) {
      Swal.fire({
        title: "Missing Fields",
        text: "Please fill in all required fields.",
        icon: "warning",
      });
      return;
    }
    
    addAddressMutation.mutate(addressForm, {
      onSuccess: () => {
        setFormData((prev) => ({ ...prev, isPopupOpen: false }));
      }
    });
  };

  if (isLoading) {
    return (
      <div className="bg-[#F3F4F6] min-h-screen">
        <Navbar />
        <div className="container mx-auto mt-10 px-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#F3F4F6] min-h-screen">
        <Navbar />
        <div className="container mx-auto mt-10 px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Unable to load checkout</h3>
            <p className="text-red-600">{error.message || "Something went wrong"}</p>
            <button
              onClick={() => navigate('/marketplace/cart')}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Return to Cart
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!checkoutData || checkoutData.item_count === 0) {
    return (
      <div className="bg-[#F3F4F6] min-h-screen">
        <Navbar />
        <div className="container mx-auto mt-10 px-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Your cart is empty</h3>
            <p className="text-gray-500 mb-4">Add some products before checking out.</p>
            <button
              onClick={() => navigate('/marketplace')}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Browse Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasAddress = checkoutData?.delivery_address || addressForm.address_line;

  return (
    <div className="bg-[#F3F4F6] min-h-screen">
      <Navbar />

      <div className="container mx-auto mt-10 px-4 pb-10">
        <h2 className="text-xl font-bold mb-6">Payment & Delivery</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Section - Product and Delivery Details */}
          <div className="bg-white p-6 shadow-xl rounded-2xl">
            <h3 className="text-lg font-semibold mb-4">Products ({checkoutData.item_count} items)</h3>
            
            {/* Products List */}
            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
              {checkoutData.products?.map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <img
                    src={item.image || 'https://via.placeholder.com/60'}
                    alt={item.name}
                    className="w-14 h-14 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm line-clamp-1">{item.name}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-sm">${parseFloat(item.subtotal).toFixed(2)}</p>
                </div>
              ))}
            </div>

            <h3 className="text-lg font-semibold mt-4 mb-2">Delivery Detail</h3>
            
            {/* Address Section */}
            {!hasAddress ? (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-blue-700">
                  Please complete your address information first.
                </p>
                <button
                  onClick={togglePopup}
                  className="mt-2 text-blue-500 hover:underline font-medium"
                >
                  + Add Address
                </button>
              </div>
            ) : (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-green-800">
                      {checkoutData?.delivery_address?.receiver_name || addressForm.receiver_name}
                    </p>
                    <p className="text-green-700 text-sm">
                      {checkoutData?.delivery_address?.phone || addressForm.phone}
                    </p>
                    <p className="text-green-600 text-sm mt-1">
                      {checkoutData?.delivery_address?.address || addressForm.address}, {checkoutData?.delivery_address?.city || addressForm.city}
                    </p>
                  </div>
                  <button
                    onClick={togglePopup}
                    className="text-blue-500 hover:underline text-sm"
                  >
                    Edit
                  </button>
                </div>
              </div>
            )}

            <div className="mb-4">
              <p className="font-semibold mb-2">Delivery Type</p>
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center space-x-2 border border-[#E0E0E0] rounded-lg px-3 py-2 cursor-pointer hover:border-green-400">
                  <input
                    type="radio"
                    name="deliveryType"
                    value="toAddress"
                    checked={formData.deliveryType === "toAddress"}
                    onChange={handleChange}
                    className="text-green-500 focus:ring-green-500"
                  />
                  <span className={formData.deliveryType === "toAddress" ? "text-green-700" : ""}>
                    Send to my Address
                  </span>
                </label>
                <label className="flex items-center space-x-2 border border-[#E0E0E0] rounded-lg px-3 py-2 cursor-pointer hover:border-green-400">
                  <input
                    type="radio"
                    name="deliveryType"
                    value="pickUp"
                    checked={formData.deliveryType === "pickUp"}
                    onChange={handleChange}
                    className="text-green-500 focus:ring-green-500"
                  />
                  <span className={formData.deliveryType === "pickUp" ? "text-green-700" : ""}>
                    Pick up in the Outlet
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Right Section - Order Details and Payment Methods */}
          <div className="bg-white shadow-xl p-6 rounded-2xl h-fit">
            <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">${parseFloat(checkoutData.subtotal).toFixed(2)}</span>
              </div>
              {checkoutData.delivery_fee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="font-medium">${parseFloat(checkoutData.delivery_fee).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium">${parseFloat(checkoutData.tax_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium">${parseFloat(checkoutData.shipping_cost).toFixed(2)}</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between text-lg">
                <span className="font-bold">Total</span>
                <span className="font-bold text-green-600">
                  ${parseFloat(checkoutData.total_amount).toFixed(2)}
                </span>
              </div>
            </div>

            <h3 className="text-lg font-semibold mt-6 mb-2">Payment Method</h3>
            <p className="text-gray-500 text-sm mb-3">Choose your preferred payment method.</p>
            
            <div className="space-y-2">
              <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:border-blue-400 transition-colors">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="creditCard"
                  checked={formData.paymentMethod === "creditCard"}
                  onChange={handleChange}
                  className="text-blue-500 focus:ring-blue-500"
                />
                <div className="flex items-center gap-2">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <span className="font-medium">Credit/Debit Card</span>
                </div>
              </label>
              
              <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:border-green-400 transition-colors">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cashOnDelivery"
                  checked={formData.paymentMethod === "cashOnDelivery"}
                  onChange={handleChange}
                  className="text-green-500 focus:ring-green-500"
                />
                <div className="flex items-center gap-2">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="font-medium">Cash on Delivery</span>
                </div>
              </label>
            </div>
            
            <button
              type="button"
              onClick={handleSubmit}
              disabled={checkoutMutation.isPending || createCheckoutSessionMutation.isPending || (formData.deliveryType === "toAddress" && !hasAddress)}
              className="w-full mt-6 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {checkoutMutation.isPending || createCheckoutSessionMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : formData.paymentMethod === "creditCard" ? (
                "Pay with Card"
              ) : (
                "Place Order"
              )}
            </button>
            
            {formData.deliveryType === "toAddress" && !hasAddress && (
              <p className="text-center text-sm text-red-500 mt-2">Please add a delivery address to continue</p>
            )}
          </div>
        </div>

        {/* Popup for Address */}
        {formData.isPopupOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md">
              <h3 className="text-lg font-semibold mb-2">Delivery Address</h3>
              <p className="text-gray-500 text-sm mb-4">
                Please fill in your delivery details.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Receiver Name *</label>
                  <input
                    type="text"
                    name="receiver_name"
                    value={addressForm.receiver_name}
                    onChange={handleAddressChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    name="phone"
                    value={addressForm.phone}
                    onChange={handleAddressChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+1 234 567 8900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                  <input
                    type="text"
                    name="address"
                    value={addressForm.address}
                    onChange={handleAddressChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Street address"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                    <input
                      type="text"
                      name="city"
                      value={addressForm.city}
                      onChange={handleAddressChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="City"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={togglePopup}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveAddress}
                    disabled={addAddressMutation.isPending}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 font-medium"
                  >
                    {addAddressMutation.isPending ? 'Saving...' : 'Save Address'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payment;
