import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ref, onValue, push, set } from 'firebase/database';
import { database } from '../config/firebase';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { ShoppingCart, Star, Heart, Share2, ArrowLeft, Minus, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addItem } = useCartStore();
  
  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);

  useEffect(() => {
    // Fetch product
    const productRef = ref(database, `products/${id}`);
    const unsubscribeProduct = onValue(productRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setProduct({ id, ...data });
        if (data.sizes && data.sizes.length > 0) {
          setSelectedSize(data.sizes[0]);
        }
      } else {
        toast.error('Product not found');
        navigate('/products');
      }
      setLoading(false);
    });

    // Fetch categories
    const categoriesRef = ref(database, 'categories');
    const unsubscribeCategories = onValue(categoriesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const categoriesArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setCategories(categoriesArray);
      }
    });

    // Fetch reviews
    const reviewsRef = ref(database, `reviews/${id}`);
    const unsubscribeReviews = onValue(reviewsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const reviewsArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setReviews(reviewsArray);
      }
    });

    return () => {
      unsubscribeProduct();
      unsubscribeCategories();
      unsubscribeReviews();
    };
  }, [id, navigate]);

  const handleAddToCart = () => {
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      toast.error('Please select a size');
      return;
    }

    if (product.stock <= 0) {
      toast.error('Product is out of stock');
      return;
    }

    addItem(product, quantity, selectedSize);
    toast.success('Added to cart!');
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/cart');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please login to leave a review');
      navigate('/login');
      return;
    }

    try {
      const reviewsRef = ref(database, `reviews/${id}`);
      const newReviewRef = push(reviewsRef);
      
      await set(newReviewRef, {
        userId: user.uid,
        userName: user.displayName || user.email,
        rating,
        comment: reviewText,
        createdAt: Date.now(),
      });

      setReviewText('');
      setRating(5);
      toast.success('Review submitted!');
    } catch (error) {
      toast.error('Failed to submit review');
    }
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
        <Link to="/" className="hover:text-primary-600">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-primary-600">Products</Link>
        <span>/</span>
        <span className="text-gray-900">{product.name}</span>
      </div>

      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        {/* Images - Jumia Style Layout */}
        <div className="lg:col-span-1">
          <div className="flex gap-2">
            {/* Vertical Thumbnail Strip - Left Side */}
            {product.images && product.images.length > 1 && (
              <div className="flex flex-col gap-2 w-16">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square rounded border transition-all ${
                      selectedImage === index
                        ? 'border-2 border-orange-500'
                        : 'border border-gray-300 hover:border-orange-300'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`View ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Main Image - Right Side */}
            <div className="flex-1">
              <div className="aspect-square bg-white border border-gray-300 rounded overflow-hidden">
                {product.images && product.images[selectedImage] ? (
                  <img
                    src={product.images[selectedImage]}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
              </div>
              
              {/* Share & Wishlist Buttons - Jumia Style */}
              <div className="flex gap-2 mt-3">
                <button className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-300 rounded text-sm hover:border-orange-500 transition">
                  <Share2 className="w-4 h-4" />
                  SHARE
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-300 rounded text-sm hover:border-orange-500 transition">
                  <Heart className="w-4 h-4" />
                  WISHLIST
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Product Info - Jumia Style Cards */}
        <div className="lg:col-span-2 space-y-4">
          {/* Main Product Card */}
          <div className="bg-white border border-gray-300 rounded p-4">
            <h1 className="text-2xl font-semibold mb-3">{product.name}</h1>

            {/* Brand/Category */}
            <div className="text-sm text-gray-600 mb-3">
              <span>Brand: </span>
              <Link to={`/products?category=${product.categoryId}`} className="text-orange-500 hover:underline">
                {categories.find(c => c.id === product.categoryId)?.name || 'View Category'}
              </Link>
            </div>

            {/* Rating */}
            {reviews.length > 0 && (
              <div className="flex items-center gap-2 mb-4 pb-4 border-b">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= averageRating
                          ? 'fill-orange-400 text-orange-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  ({reviews.length} verified ratings)
                </span>
              </div>
            )}

            {/* Price Section */}
            <div className="py-4 border-b">
              <div className="flex items-baseline gap-3 mb-2">
                <p className="text-3xl font-bold">
                  GH₵ {product.price?.toFixed(2) || '0.00'}
                </p>
                {product.comparePrice && product.comparePrice > product.price && (
                  <p className="text-lg text-gray-400 line-through">
                    GH₵ {product.comparePrice.toFixed(2)}
                  </p>
                )}
              </div>
              {product.comparePrice && product.comparePrice > product.price && (
                <p className="text-sm text-gray-600">
                  Save GH₵ {(product.comparePrice - product.price).toFixed(2)}
                </p>
              )}
            </div>

            {/* Stock Status */}
            <div className="py-3 border-b">
              {product.stock > 0 ? (
                <p className="text-green-600 text-sm">
                  ✓ In Stock - {product.stock} units available
                </p>
              ) : (
                <p className="text-red-600 text-sm font-semibold">Out of Stock</p>
              )}
            </div>

            {/* Size Selection */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="py-4 border-b">
                <h3 className="text-sm font-semibold mb-3">SIZE:</h3>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 border text-sm font-medium transition ${
                        selectedSize === size
                          ? 'border-orange-500 bg-orange-50 text-orange-600'
                          : 'border-gray-300 hover:border-orange-500'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="py-4">
              <h3 className="text-sm font-semibold mb-3">QUANTITY:</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-gray-300">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-6 py-2 border-x border-gray-300 font-semibold">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                    className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons - Jumia Style */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className="flex-1 bg-orange-500 text-white py-3 rounded font-semibold hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                ADD TO CART
              </button>
              <button
                onClick={handleBuyNow}
                disabled={product.stock <= 0}
                className="flex-1 bg-green-600 text-white py-3 rounded font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                BUY NOW
              </button>
            </div>
          </div>

          {/* Product Details Card */}
          <div className="bg-white border border-gray-300 rounded p-4">
            <h3 className="font-semibold text-lg mb-3">Product Details</h3>
            <p className="text-gray-700 text-sm leading-relaxed">{product.description}</p>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="border-t pt-8">
        <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>

        {/* Write Review */}
        {user && (
          <div className="card mb-8">
            <h3 className="font-semibold mb-4">Write a Review</h3>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="hover:scale-110 transition"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Review
                </label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="input-field"
                  rows="4"
                  placeholder="Share your experience with this product..."
                  required
                />
              </div>

              <button type="submit" className="btn-primary">
                Submit Review
              </button>
            </form>
          </div>
        )}

        {/* Reviews List */}
        {reviews.length > 0 ? (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="card">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold">{review.userName}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-600">{review.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-600 py-8">
            No reviews yet. Be the first to review this product!
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;
