import React, { useState, useEffect, useRef } from 'react'
import SearchBar from './SearchBar';
import ProductGrid from './ProductGrid';
import Navbar from '../Navbar';
import { apiMethods, publicApiMethods } from '../../utils/api';
import { ENDPOINTS } from '../../config/apiConfig';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const MarketPlace = () => {
    const { isAuthenticated, loading: authLoading, user } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    
    // Track the user ID to detect account switches
    const prevUserIdRef = useRef(user?.id);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            let url = ENDPOINTS.SHOP.PRODUCTS;
            const params = [];
            
            if (searchQuery) params.push(`search=${searchQuery}`);
            if (categoryFilter) params.push(`category=${categoryFilter}`);
            
            if (params.length > 0) {
                url += '?' + params.join('&');
            }
            
            // Use apiMethods for authenticated users, publicApiMethods for guests
            // Check localStorage directly to avoid race condition with AuthContext
            const hasToken = !!localStorage.getItem('access_token');
            const api = hasToken ? apiMethods : publicApiMethods;
            const response = await api.get(url);
            
            // Handle paginated response or plain array
            const productsData = response.data.results || response.data;
            setProducts(Array.isArray(productsData) ? productsData : []);
        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
    };

    // CRITICAL: Refetch products when user changes (login/logout/account switch)
    useEffect(() => {
        const currentUserId = user?.id;
        const prevUserId = prevUserIdRef.current;
        
        // Detect user change (including logout where user becomes null)
        if (currentUserId !== prevUserId) {
            console.log('User changed, refetching products...', { prevUserId, currentUserId });
            prevUserIdRef.current = currentUserId;
            fetchProducts();
        }
    }, [user?.id]);

    // Single useEffect for all product fetching - debounced for search/filter changes
    useEffect(() => {
        // On initial load, fetch immediately
        if (isInitialLoad) {
            fetchProducts();
            setIsInitialLoad(false);
            return;
        }
        
        // For subsequent changes (search/filter), debounce the request
        const delayDebounceFn = setTimeout(() => {
            fetchProducts();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, categoryFilter]);

    return (
        <div className='bg-gray-100 min-h-screen'>

            <section className='py-7'>
                <Navbar />
            </section>
            <div className='2xl:px-44 xl:px-36 lg:px-28 md:px-20 sm:px-14 px-8'>
                <section>
                    <SearchBar onSearch={handleSearch} />
                </section>
                <section>
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                            <p className="text-gray-500">No products found</p>
                        </div>
                    ) : (
                        <ProductGrid products={products} />
                    )}
                </section>
            </div>

        </div>
    )
}

export default MarketPlace