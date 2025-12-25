import React, { useState, useEffect, useRef } from 'react';
import { AiOutlinePlus, AiOutlineMinus } from 'react-icons/ai';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Navigation, Pagination } from 'swiper/modules';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { apiMethods, publicApiMethods } from '../../utils/api';
import { ENDPOINTS } from '../../config/apiConfig';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../Navbar';
import ProductGrid from './ProductGrid';

const ProductCard = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [suggestedProducts, setSuggestedProducts] = useState([]);
  const [addingToCart, setAddingToCart] = useState(false);
  const [swiperReady, setSwiperReady] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Track user ID to detect account switches
  const prevUserIdRef = useRef(user?.id);

  // Fetch product first, then check ownership
  useEffect(() => {
    if (id) {
      // Reset states when navigating to a new product
      setQuantity(1);
      setSwiperReady(false);
      fetchProduct();
    }
  }, [id]);

  // CRITICAL: Refetch product when user changes to update ownership badge
  useEffect(() => {
    const currentUserId = user?.id;
    const prevUserId = prevUserIdRef.current;
    
    if (currentUserId !== prevUserId && id) {
      console.log('User changed on ProductCard, refetching...', { prevUserId, currentUserId });
      prevUserIdRef.current = currentUserId;
      fetchProduct();
    }
  }, [user?.id, id]);

  // Check if current user is the seller (with type-safe comparison)
  // Compare as strings since backend returns UUID as string
  // Only check ownership if user is authenticated and auth is done loading
  const isOwnProduct = !authLoading && isAuthenticated && product && user && (
    String(product.seller) === String(user.id)
  );
  
  // Debug logging
  useEffect(() => {
    if (product && user) {
      console.log('=== Product Ownership Debug ===');
      console.log('Product data:', product);
      console.log('Product seller:', product.seller, typeof product.seller);
      console.log('Current user:', user);
      console.log('Current user ID:', user.id, typeof user.id);
      console.log('Seller string:', String(product.seller));
      console.log('User ID string:', String(user.id));
      console.log('Are they equal?:', String(product.seller) === String(user.id));
      console.log('Is own product?:', isOwnProduct);
      console.log('==============================');
    }
  }, [product, user]);

  // Delay Swiper mount until product is loaded
  useEffect(() => {
    if (product && !loading) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        setSwiperReady(true);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [product, loading]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      // Use apiMethods for authenticated users, publicApiMethods for guests
      // Check localStorage directly to avoid race condition with AuthContext
      const hasToken = !!localStorage.getItem('access_token');
      const api = hasToken ? apiMethods : publicApiMethods;
      const response = await api.get(ENDPOINTS.SHOP.PRODUCT_DETAIL(id));
      console.log('=== Raw Product Response ===');
      console.log('Full response:', response.data);
      console.log('Seller field:', response.data.seller);
      console.log('Seller type:', typeof response.data.seller);
      console.log('===========================');
      setProduct(response.data);
      
      // Fetch suggested products using the new endpoint
      fetchSuggestedProducts(response.data.id);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestedProducts = async (productId) => {
    try {
      // Use apiMethods for authenticated users, publicApiMethods for guests
      const hasToken = !!localStorage.getItem('access_token');
      const api = hasToken ? apiMethods : publicApiMethods;
      const response = await api.get(
        ENDPOINTS.SHOP.SUGGESTED_PRODUCTS(productId)
      );
      setSuggestedProducts(response.data);
    } catch (error) {
      console.error('Error fetching suggested products:', error);
    }
  };

  const handleAddToCart = async () => {
    // Double-check authentication
    if (!localStorage.getItem('access_token')) {
      toast.error('Please sign in to add items to cart');
      navigate('/signin', { state: { from: `/marketplace/product/${id}` } });
      return;
    }
    
    if (isOwnProduct) {
      toast.error('You cannot add your own product to cart');
      return;
    }
    
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
    // Double-check authentication
    if (!localStorage.getItem('access_token')) {
      toast.error('Please sign in to make a purchase');
      navigate('/signin', { state: { from: `/marketplace/product/${id}` } });
      return;
    }
    
    if (isOwnProduct) {
      toast.error('You cannot buy your own product');
      return;
    }
    
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
      <>
        <Navbar />
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center items-center min-h-screen">
          <p className="text-gray-500">Product not found</p>
        </div>
      </>
    );
  }

  const unitPrice = parseFloat(product.price);
  const totalPrice = (unitPrice * quantity).toFixed(2);
  const productImages = product.images?.length > 0 
    ? product.images.map(img => img.image || img.image_url)
    : (product.primary_image ? [product.primary_image.image || product.primary_image.image_url] : []);

  const hasImages = productImages.length > 0;

  return (
    <>
      <Navbar />
      <div className="flex flex-col lg:flex-row items-start rounded-lg p-4 lg:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-0 lg:space-x-8">

      {/* Product Images */}
      <div className="w-full lg:w-[60%]">
        {hasImages && productImages.every(img => img) && swiperReady ? (
          <div className="swiper-container-wrapper">
            {/* Main Swiper - Simplified without thumbs */}
            <Swiper
              spaceBetween={10}
              navigation={productImages.length > 1}
              pagination={{ clickable: true }}
              modules={[Navigation, Pagination]}
              className="rounded-xl overflow-hidden"
              style={{ '--swiper-navigation-size': '30px' }}
            >
              {productImages.map((img, idx) => (
                <SwiperSlide key={`slide-${id}-${idx}`}>
                  <img
                    src={img}
                    alt={`${product.name}-${idx}`}
                    className="w-full h-[300px] sm:h-[400px] md:h-[450px] object-cover rounded-xl"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                    }}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        ) : hasImages && !swiperReady ? (
          <div className="w-full h-[400px] bg-gray-100 rounded-xl flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="w-full h-[400px] bg-gray-200 rounded-xl flex items-center justify-center">
            <p className="text-gray-500">No image available</p>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="w-full lg:w-[40%] space-y-4 sm:space-y-6 px-1 sm:px-4">
        {/* Product Info */}
        <div>
          <p className="text-xl sm:text-2xl font-bold text-green-600">${product.price}</p>
          <p className="text-lg sm:text-xl font-semibold mt-2">{product.name}</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">{product.category_name}</p>
          <p className="text-xs sm:text-sm text-gray-600 mt-2 sm:mt-3">{product.description}</p>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 sm:mt-3">
            <p className="text-xs sm:text-sm text-gray-500">Stock: {product.stock} available</p>
            <span className="text-gray-300 hidden sm:inline">|</span>
            <p className="text-xs sm:text-sm text-gray-700 font-medium">
              Seller: <span className="text-blue-600">{product.seller_name || 'Unknown'}</span>
            </p>
          </div>
        </div>

        {/* Quantity Section */}
        <div className="p-3 sm:p-4 rounded-lg shadow-inner bg-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-base sm:text-lg font-medium text-gray-700">Set Amount and Notes</span>
          </div>
          <div className="flex flex-col justify-start ">
            <span className="text-xs sm:text-sm text-gray-600">
              Available: {product.stock} units
            </span>

            <hr className='bg-[#E2E2E2] border-[#E2E2E2] mt-2' />

            <div className="flex items-center justify-center border border-gray-300 rounded-full overflow-hidden my-2 sm:my-3 w-28 sm:w-30">
              <button
                onClick={handleDecrease}
                className="px-2 sm:px-3 py-1 text-gray-600 hover:text-gray-800 cursor-pointer"
                disabled={quantity <= 1}
              >
                <AiOutlineMinus className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
              <span className="px-3 sm:px-4 text-sm sm:text-base">{quantity}</span>
              <button
                onClick={handleIncrease}
                className="px-2 sm:px-3 py-1 text-gray-600 hover:text-gray-800 cursor-pointer"
                disabled={quantity >= product.stock}
              >
                <AiOutlinePlus className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>

            <p className="text-base sm:text-lg font-semibold">Total: ${totalPrice}</p>
          </div>

          {/* Action Buttons */}
          {authLoading ? (
            <div className="mt-5 sm:mt-7 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : !isAuthenticated ? (
            <div className="mt-5 sm:mt-7 p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-gray-700 font-medium text-center text-sm sm:text-base">
                Sign in to purchase
              </p>
              <p className="text-gray-500 text-xs sm:text-sm text-center mt-1 sm:mt-2">
                Create an account or sign in to add items to cart and make purchases
              </p>
              <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0 mt-3 sm:mt-4">
                <button
                  onClick={() => navigate('/signin', { state: { from: `/marketplace/product/${id}` } })}
                  className="w-full px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm sm:text-base"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="w-full px-4 sm:px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm sm:text-base"
                >
                  Sign Up
                </button>
              </div>
            </div>
          ) : isOwnProduct ? (
            <div className="mt-5 sm:mt-7 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 font-medium text-center text-sm sm:text-base">
                This is your product
              </p>
              <p className="text-blue-600 text-xs sm:text-sm text-center mt-1 sm:mt-2">
                You cannot purchase your own products
              </p>
              <button
                onClick={() => navigate(`/marketplace/myproduct/edit/${id}`)}
                className="w-full mt-2 sm:mt-3 px-4 sm:px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm sm:text-base"
              >
                Edit Product
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0 mt-5 sm:mt-7">
              <button 
                onClick={handleAddToCart}
                disabled={addingToCart || product.stock === 0}
                className="w-full px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {addingToCart ? 'Adding...' : 'Add to Cart'}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={product.stock === 0}
                className="w-full px-4 sm:px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                Buy Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Suggested Products Section */}
    {suggestedProducts.length > 0 && (
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">
          Suggested Products
        </h2>
        <ProductGrid products={suggestedProducts} />
      </div>
    )}
    </>
  );
};

export default ProductCard;
