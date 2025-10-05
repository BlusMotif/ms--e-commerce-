import React from 'react';
import { Link } from 'react-router-dom';
import { useWishlistStore } from '../store/wishlistStore';
import { useCartStore } from '../store/cartStore';
import { Heart, ShoppingCart, Trash2, Package } from 'lucide-react';
import toast from 'react-hot-toast';

const WishlistPage = () => {
  const { items, removeFromWishlist, clearWishlist } = useWishlistStore();
  const { addItem } = useCartStore();

  const handleAddToCart = (item) => {
    // Convert wishlist item to product format for cart
    const product = {
      id: item.id,
      name: item.name,
      price: item.price,
      salePrice: item.salePrice,
      images: [item.image],
      stock: item.stock,
      categoryId: item.categoryId,
    };

    addItem(product, 1);
    toast.success('Added to cart!');
  };

  const handleMoveToCart = (item) => {
    handleAddToCart(item);
    removeFromWishlist(item.id);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-20 h-20 mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Your Wishlist is Empty
          </h2>
          <p className="text-gray-600 mb-6">
            Save items you love to buy them later!
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            <Package className="w-5 h-5" />
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            My Wishlist
          </h1>
          <p className="text-gray-600 mt-1">
            {items.length} {items.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>
        
        {items.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to clear your wishlist?')) {
                clearWishlist();
              }
            }}
            className="text-red-600 hover:text-red-700 font-medium flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear Wishlist
          </button>
        )}
      </div>

      {/* Wishlist Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow group"
          >
            {/* Product Image */}
            <Link to={`/products/${item.id}`} className="block relative">
              <div className="aspect-square bg-gray-100">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Package className="w-12 h-12" />
                  </div>
                )}
              </div>
              
              {/* Stock Badge */}
              {item.stock <= 0 && (
                <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
                  Out of Stock
                </div>
              )}
            </Link>

            {/* Product Info */}
            <div className="p-4">
              <Link 
                to={`/products/${item.id}`}
                className="text-sm font-medium text-gray-900 hover:text-primary-600 line-clamp-2 mb-2 block"
              >
                {item.name}
              </Link>

              {/* Price */}
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-lg font-bold text-primary-600">
                  GH₵{item.salePrice || item.price}
                </span>
                {item.salePrice && (
                  <span className="text-sm text-gray-500 line-through">
                    GH₵{item.price}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleMoveToCart(item)}
                  disabled={item.stock <= 0}
                  className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                    item.stock <= 0
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  {item.stock <= 0 ? 'Out of Stock' : 'Move to Cart'}
                </button>

                <button
                  onClick={() => removeFromWishlist(item.id)}
                  className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:border-red-500 hover:text-red-600 hover:bg-red-50 transition"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
              </div>

              {/* Added Date */}
              <p className="text-xs text-gray-500 mt-2">
                Added {new Date(item.addedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Continue Shopping */}
      <div className="mt-8 text-center">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
        >
          <Package className="w-5 h-5" />
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};

export default WishlistPage;
