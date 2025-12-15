import React from "react";
import Navbar from "../Navbar";

export default function OrderDetail() {
  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gray-100 py-6 px-4">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Order ID */}
          <div className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-700">
              Order ID
            </h2>
            <span className="text-sm text-gray-500">
              24121251B0E5HWG
            </span>
          </div>

          {/* Product Card */}
          <div className="bg-white rounded-lg shadow p-4 flex gap-4">
            <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">
              Change to fill
            </div>

            <div className="flex flex-col justify-between">
              <h3 className="font-medium text-gray-800">
                Jaket Trucker Denim
              </h3>
              <p className="font-semibold text-gray-900">$58,01</p>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-800 mb-3">
              Delivery Address
            </h3>

            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <span className="font-medium">Recipients:</span> Ichi Caroline
              </p>
              <p>
                <span className="font-medium">Phone Number:</span> 515-245-5348
              </p>
              <p>
                <span className="font-medium">Address:</span> 88 Jenna Lane,
                Petrolia, California, 95558, United State
              </p>
            </div>
          </div>

          {/* Order Detail */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-800 mb-3">
              Order Detail
            </h3>

            <div className="text-sm text-gray-600 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>$44,11</span>
              </div>

              <div className="flex justify-between">
                <span>Delivery & Shipping</span>
                <span>$4,00</span>
              </div>

              <div className="flex justify-between">
                <span>Tax</span>
                <span>$9,99</span>
              </div>

              <hr className="my-2" />

              <div className="flex justify-between font-semibold text-gray-900">
                <span>Total</span>
                <span>$58,01</span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-lg shadow p-4 flex justify-between">
            <span className="text-sm font-medium text-gray-700">
              Payment Method
            </span>
            <span className="text-sm text-gray-600">
              Cash on Delivery
            </span>
          </div>

        </div>
      </div>
    </>
  );
}
