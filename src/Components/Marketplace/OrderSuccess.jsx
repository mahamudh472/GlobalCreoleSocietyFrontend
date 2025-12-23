import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../Navbar";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../utils/queryKeys";

const OrderSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const sessionId = searchParams.get('session_id');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Invalidate cart and orders cache
    queryClient.invalidateQueries({ queryKey: queryKeys.cart.items() });
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['checkoutPreview'] });
    
    // Auto redirect countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/marketplace/cart');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [navigate, queryClient]);

  return (
    <div className="bg-[#F3F4F6] min-h-screen">
      <Navbar />
      
      <div className="container mx-auto mt-10 px-4">
        <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Payment Successful!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for your purchase. Your order has been placed successfully.
          </p>
          
          {sessionId && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500">Transaction ID</p>
              <p className="text-sm font-mono text-gray-700 truncate">{sessionId}</p>
            </div>
          )}
          
          <div className="space-y-3">
            <button
              onClick={() => navigate('/marketplace/cart')}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              View My Orders
            </button>
            <button
              onClick={() => navigate('/marketplace')}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg transition-colors"
            >
              Continue Shopping
            </button>
          </div>
          
          <p className="text-sm text-gray-400 mt-6">
            Redirecting to orders in {countdown} seconds...
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
