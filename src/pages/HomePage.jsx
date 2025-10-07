import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { database } from '../config/firebase';
import { useAuthStore } from '../store/authStore';
import { ChevronLeft, ChevronRight, ArrowRight, ShoppingBag, Package, Phone, MessageCircle } from 'lucide-react';

const HomePage = () => {
  const { user, role } = useAuthStore();
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({});

  // Redirect admin/agent away from home page - they shouldn't make purchases
  useEffect(() => {
    if (role === 'admin') {
      navigate('/admin', { replace: true });
    } else if (role === 'agent') {
      navigate('/agent', { replace: true });
    }
  }, [role, navigate]);

  useEffect(() => {
    let bannersLoaded = false;
    let productsLoaded = false;
    let categoriesLoaded = false;
    let settingsLoaded = false;

    const checkAllLoaded = () => {
      if (bannersLoaded && productsLoaded && categoriesLoaded && settingsLoaded) {
        setLoading(false);
      }
    };

    // Fetch banners
    const bannersRef = ref(database, 'banners');
    const unsubscribeBanners = onValue(bannersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const bannersArray = Object.keys(data)
          .map((key) => ({ id: key, ...data[key] }))
          .filter((banner) => banner.active);
        setBanners(bannersArray);
      }
      bannersLoaded = true;
      checkAllLoaded();
    });

    // Fetch featured products
    const productsRef = ref(database, 'products');
    const unsubscribeProducts = onValue(productsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const productsArray = Object.keys(data)
          .map((key) => ({ id: key, ...data[key] }))
          .filter((product) => product.featured && product.stock > 0)
          .slice(0, 8);
        setFeaturedProducts(productsArray);
      }
      productsLoaded = true;
      checkAllLoaded();
    });

    // Fetch categories
    const categoriesRef = ref(database, 'categories');
    const unsubscribeCategories = onValue(categoriesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const categoriesArray = Object.keys(data)
          .map((key) => ({ id: key, ...data[key] }))
          .slice(0, 6); // Show up to 6 categories
        setCategories(categoriesArray);
      }
      categoriesLoaded = true;
      checkAllLoaded();
    });

    // Fetch settings for call numbers
    const settingsRef = ref(database, 'settings');
    const unsubscribeSettings = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.val());
      }
      settingsLoaded = true;
      checkAllLoaded();
    });

    return () => {
      unsubscribeBanners();
      unsubscribeProducts();
      unsubscribeCategories();
      unsubscribeSettings();
    };
  }, []);

  // Auto-rotate banners
  useEffect(() => {
    if (banners.length === 0) return;
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners]);

  const nextBanner = () => {
    setCurrentBanner((prev) => (prev + 1) % banners.length);
  };

  const prevBanner = () => {
    setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length);
  };

  // Show loading spinner while data is being fetched
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Loading MS Special...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">{/* Hero Banner Slider */}
      <section className="relative h-[500px] bg-gray-200 overflow-hidden">
        {banners.length > 0 ? (
          <>
            {banners.map((banner, index) => (
              <div
                key={banner.id}
                className={`absolute inset-0 transition-opacity duration-500 ${
                  currentBanner === index ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30 flex items-center justify-center">
                  <div className="text-center text-white px-4">
                    <h1 className="text-5xl md:text-6xl font-bold mb-4 animate-fade-in">
                      {banner.title}
                    </h1>
                    <p className="text-xl md:text-2xl mb-8 animate-fade-in">
                      {banner.subtitle}
                    </p>
                    {banner.buttonText && (
                      <div className="animate-fade-in">
                        <Link
                          to={
                            banner.buttonLink 
                              ? banner.buttonLink 
                              : banner.categoryId 
                                ? `/products?category=${banner.categoryId}` 
                                : '/products'
                          }
                          className="inline-flex items-center space-x-2 bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition"
                        >
                          <span>{banner.buttonText}</span>
                          <ArrowRight className="w-5 h-5" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Banner Controls */}
            <button
              onClick={prevBanner}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-50 hover:bg-opacity-75 p-2 rounded-full transition"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextBanner}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-50 hover:bg-opacity-75 p-2 rounded-full transition"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Banner Indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentBanner(index)}
                  className={`w-3 h-3 rounded-full transition ${
                    currentBanner === index ? 'bg-white' : 'bg-white bg-opacity-50'
                  }`}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
            <div className="text-center text-gray-800 px-4">
              <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-400 animate-pulse" />
              <h1 className="text-5xl md:text-6xl font-bold mb-4">Welcome to MS Special</h1>
              <p className="text-xl md:text-2xl mb-8 text-gray-600">
                Premium Shito, Stylish Dresses & Quality Bags
              </p>
              <Link
                to="/products"
                className="inline-flex items-center space-x-2 bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition"
              >
                <span>Shop Now</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold mb-6 text-center">Shop by Category</h2>
        <div className="flex justify-center items-center">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 place-items-center">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/products?category=${category.slug}`}
                className="group animate-fade-in w-full max-w-[180px]"
              >
                <div className="bg-white rounded-lg border border-gray-200 hover:border-primary-500 hover:shadow-md transition-all duration-200 overflow-hidden">
                  {/* Image/Icon Section - Compact */}
                  <div className="aspect-square bg-gray-50 flex items-center justify-center relative overflow-hidden">
                    {category.image ? (
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="text-primary-500">
                        <Package className="w-12 h-12" />
                      </div>
                    )}
                  </div>
                  
                  {/* Text Section - Minimal */}
                  <div className="p-2 text-center">
                    <h3 className="font-medium text-sm text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                      {category.name}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {categories.length === 0 && (
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No categories available yet</p>
            <p className="text-gray-400 text-sm mt-2">Check back soon for our product categories!</p>
          </div>
        )}
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Featured Products</h2>
              <Link to="/products" className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {featuredProducts.map((product) => (
                <Link 
                  key={product.id} 
                  to={`/products/${product.id}`} 
                  className="bg-white rounded-lg border border-gray-200 hover:border-primary-500 hover:shadow-md transition-all duration-200 overflow-hidden group animate-fade-in"
                >
                  {/* Product Image */}
                  <div className="aspect-square bg-gray-100 overflow-hidden">
                    {product.images && product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Package className="w-12 h-12" />
                      </div>
                    )}
                  </div>
                  
                  {/* Product Info */}
                  <div className="p-3">
                    <h3 className="text-sm text-gray-800 line-clamp-2 mb-2 h-10 group-hover:text-primary-600 transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <p className="text-primary-600 font-bold text-base">
                        GH₵ {product.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            
            {/* Innovative View All Button */}
            <div className="mt-8 text-center">
              <Link 
                to="/products" 
                className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-primary-700 hover:to-primary-800 transform hover:-translate-y-1 transition-all duration-300 group"
              >
                <ShoppingBag className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                <span>Explore All Products</span>
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <p className="text-gray-600 text-sm mt-3">
                Discover our complete collection of premium products
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Call to Order Section */}
      {(settings.customerServicePhone || settings.customerServicePhone2 || settings.whatsappNumber) && (
        <section className="bg-gradient-to-br from-primary-50 to-primary-100 py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Need Help? Call to Order
              </h2>
              <p className="text-lg text-gray-700 max-w-2xl mx-auto">
                Speak directly with our customer service team. We're here to help you place orders, 
                answer questions, and provide personalized assistance.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {/* Primary Phone */}
              {settings.customerServicePhone && (
                <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                  <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6">
                    <div className="flex items-center justify-center mb-2">
                      <div className="bg-white bg-opacity-20 p-3 rounded-full">
                        <Phone className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-white text-center">Primary Line</h3>
                  </div>
                  <div className="p-6">
                    <p className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-4 break-all">
                      {settings.customerServicePhone}
                    </p>
                    <a
                      href={`tel:${settings.customerServicePhone}`}
                      className="block w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 text-center"
                    >
                      <Phone className="w-5 h-5 inline mr-2" />
                      Call Now
                    </a>
                    <p className="text-sm text-gray-600 text-center mt-3">
                      Available 24/7 for your convenience
                    </p>
                  </div>
                </div>
              )}

              {/* Secondary Phone */}
              {settings.customerServicePhone2 && (
                <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
                    <div className="flex items-center justify-center mb-2">
                      <div className="bg-white bg-opacity-20 p-3 rounded-full">
                        <Phone className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-white text-center">Secondary Line</h3>
                  </div>
                  <div className="p-6">
                    <p className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-4 break-all">
                      {settings.customerServicePhone2}
                    </p>
                    <a
                      href={`tel:${settings.customerServicePhone2}`}
                      className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 text-center"
                    >
                      <Phone className="w-5 h-5 inline mr-2" />
                      Call Now
                    </a>
                    <p className="text-sm text-gray-600 text-center mt-3">
                      Alternative contact line
                    </p>
                  </div>
                </div>
              )}

              {/* WhatsApp */}
              {settings.whatsappNumber && (
                <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                  <div className="bg-gradient-to-r from-green-600 to-green-700 p-6">
                    <div className="flex items-center justify-center mb-2">
                      <div className="bg-white bg-opacity-20 p-3 rounded-full">
                        <MessageCircle className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-white text-center">WhatsApp</h3>
                  </div>
                  <div className="p-6">
                    <p className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-4 break-all">
                      {settings.whatsappNumber}
                    </p>
                    <a
                      href={`https://wa.me/${settings.whatsappNumber.replace(/\s+/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 text-center"
                    >
                      <MessageCircle className="w-5 h-5 inline mr-2" />
                      Chat on WhatsApp
                    </a>
                    <p className="text-sm text-gray-600 text-center mt-3">
                      Quick response via WhatsApp
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Additional Info */}
            <div className="mt-10 text-center">
              <div className="inline-flex items-center justify-center space-x-2 bg-white bg-opacity-80 px-6 py-3 rounded-full shadow">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-700">Online Now</span>
                </div>
                <span className="text-gray-400">|</span>
                <span className="text-sm text-gray-600">Fast response guaranteed</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Call to Action - Only show when user is not logged in */}
      {!user && (
        <section className="bg-primary-600 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Shop?</h2>
            <p className="text-xl mb-8">
              Create an account today and enjoy fast delivery or convenient pickup options!
            </p>
            <Link to="/signup" className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition inline-block">
              Get Started
            </Link>
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;
