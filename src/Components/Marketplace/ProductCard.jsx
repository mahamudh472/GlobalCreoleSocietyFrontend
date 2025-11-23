import React, { useState, useEffect } from 'react';
import { AiOutlinePlus, AiOutlineMinus } from 'react-icons/ai';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import { FreeMode, Navigation, Thumbs } from 'swiper/modules';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { apiMethods } from '../../utils/api';
import { ENDPOINTS } from '../../config/apiConfig';
import { toast } from 'react-toastify';

const ProductCard = () => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await apiMethods.get(ENDPOINTS.SHOP.PRODUCT_DETAIL(id));
      setProduct(response.data);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    try {
      setAddingToCart(true);
      await apiMethods.post(ENDPOINTS.SHOP.ADD_TO_CART, {
        product_id: id,
        quantity: quantity
      });
      toast.success('Added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error(error.response?.data?.error || 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = () => {
    // Store product and quantity in state and navigate to payment
    navigate(`/marketplace/${id}/payment`, { 
      state: { 
        product, 
        quantity,
        isBuyNow: true 
      } 
    });
  };

  const handleIncrease = () => {
    if (product && quantity < product.stock) {
      setQuantity((prev) => prev + 1);
    } else {
      toast.warning('Cannot exceed available stock');
    }
  };

  const handleDecrease = () => setQuantity((prev) => (prev > 1 ? prev - 1 : prev));

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-500">Product not found</p>
      </div>
    );
  }

  const unitPrice = parseFloat(product.price);
  const totalPrice = (unitPrice * quantity).toFixed(2);
  const productImages = product.images?.length > 0 
    ? product.images.map(img => img.image_url || img.image)
    : (product.primary_image ? [product.primary_image.image_url || product.primary_image.image] : []);

  return (
    <div className="flex flex-col lg:flex-row items-start rounded-lg p-4 lg:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-0 lg:space-x-8">

      {/* Product Images */}
      <div className="w-full lg:w-[60%]">
        {productImages.length > 0 ? (
          <>
            {/* Main Swiper */}
            <Swiper
              loop={productImages.length > 1}
              spaceBetween={10}
              navigation={true}
              thumbs={{ swiper: thumbsSwiper }}
              modules={[FreeMode, Navigation, Thumbs]}
              className="rounded-xl overflow-hidden"
            >
              {productImages.map((img, idx) => (
                <SwiperSlide key={idx}>
                  <img
                    src={img}
                    alt={`${product.name}-${idx}`}
                    className="w-full h-[300px] sm:h-[400px] md:h-[450px] object-cover rounded-xl"
                  />
                </SwiperSlide>
              ))}
            </Swiper>

            {/* Thumbnail Swiper */}
            {productImages.length > 1 && (
              <Swiper
                onSwiper={setThumbsSwiper}
                loop={true}
                spaceBetween={10}
                slidesPerView={3}
                breakpoints={{
                  640: { slidesPerView: 4 },
                  768: { slidesPerView: 5 },
                }}
                freeMode={true}
                watchSlidesProgress={true}
                modules={[FreeMode, Navigation, Thumbs]}
                className="mt-4"
              >
                {productImages.map((img, idx) => (
                  <SwiperSlide key={idx}>
                    <img
                      src={img}
                      alt={`thumb-${idx}`}
                      className="w-full h-16 sm:h-20 object-cover rounded-lg opacity-60 hover:opacity-100 transition"
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
            )}
          </>
        ) : (
          <div className="w-full h-[400px] bg-gray-200 rounded-xl flex items-center justify-center">
            <p className="text-gray-500">No image available</p>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="w-full lg:w-[40%] space-y-6 px-2 sm:px-4">
        {/* Product Info */}
        <div>
          <p className="text-2xl font-bold text-green-600">${product.price}</p>
          <p className="text-xl font-semibold mt-2">{product.name}</p>
          <p className="text-sm text-gray-500 mt-1">{product.category_name}</p>
          <p className="text-sm text-gray-600 mt-3">{product.description}</p>
          <p className="text-sm text-gray-500 mt-2">Stock: {product.stock} available</p>
          <p className="text-sm text-gray-500">
            Seller: {product.seller_name}
          </p>
        </div>

        {/* Quantity Section */}
        <div className="p-4 rounded-lg shadow-inner bg-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-medium text-gray-700">Set Amount and Notes</span>
          </div>
          <div className="flex flex-col justify-start ">
            <span className="text-sm text-gray-600">
              Available: {product.stock} units
            </span>

            <hr className='bg-[#E2E2E2] border-[#E2E2E2] mt-2' />

            <div className="flex items-center justify-center border border-gray-300 rounded-full overflow-hidden my-3 w-30">
              <button
                onClick={handleDecrease}
                className="px-3 py-1 text-gray-600 hover:text-gray-800 cursor-pointer"
                disabled={quantity <= 1}
              >
                <AiOutlineMinus />
              </button>
              <span className="px-4">{quantity}</span>
              <button
                onClick={handleIncrease}
                className="px-3 py-1 text-gray-600 hover:text-gray-800 cursor-pointer"
                disabled={quantity >= product.stock}
              >
                <AiOutlinePlus />
              </button>
            </div>

            <p className="text-lg font-semibold">Total: ${totalPrice}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0 mt-7">
            <button 
              onClick={handleAddToCart}
              disabled={addingToCart || product.stock === 0}
              className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addingToCart ? 'Adding...' : 'Add to Cart'}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={product.stock === 0}
              className="w-full px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
