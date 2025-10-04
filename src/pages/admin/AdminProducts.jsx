import React, { useState, useEffect } from 'react';
import { ref, onValue, update, remove } from 'firebase/database';
import { database } from '../../config/firebase';
import { toast } from 'react-hot-toast';
import { Package, Edit, Trash2, Eye, Search, Filter, CheckCircle, XCircle, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { logActivity } from '../../utils/activityLogger';
import { useAuthStore } from '../../store/authStore';

const AdminProducts = () => {
  const { user } = useAuthStore();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState('all'); // all, in-stock, low-stock, out-of-stock

  useEffect(() => {
    // Fetch products
    const productsRef = ref(database, 'products');
    const unsubscribeProducts = onValue(productsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const productsArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setProducts(productsArray);
      } else {
        setProducts([]);
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

    return () => {
      unsubscribeProducts();
      unsubscribeCategories();
    };
  }, []);

  const getCategoryName = (categoryId) => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  const handleToggleFeatured = async (productId, currentStatus) => {
    try {
      const product = products.find(p => p.id === productId);
      const productRef = ref(database, `products/${productId}`);
      await update(productRef, {
        featured: !currentStatus,
        updatedAt: Date.now(),
      });
      
      // Log the activity
      await logActivity(
        user.uid,
        user.displayName || user.email || 'Admin',
        'update',
        'product',
        `${!currentStatus ? 'Featured' : 'Unfeatured'} product: ${product?.name || 'Unknown'}`
      );
      
      toast.success(`Product ${!currentStatus ? 'featured' : 'unfeatured'} successfully!`);
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    }
  };

  const handleDelete = async (productId, productName) => {
    if (window.confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      try {
        const productRef = ref(database, `products/${productId}`);
        await remove(productRef);
        
        // Log the activity
        await logActivity(
          user.uid,
          user.displayName || user.email || 'Admin',
          'delete',
          'product',
          `Deleted product: ${productName}`
        );
        
        toast.success('Product deleted successfully!');
      } catch (error) {
        console.error('Error deleting product:', error);
        toast.error('Failed to delete product');
      }
    }
  };

  const handleBulkDelete = async () => {
    const outOfStockProducts = filteredProducts.filter(p => p.stock === 0);
    if (outOfStockProducts.length === 0) {
      toast.error('No out-of-stock products to delete');
      return;
    }

    if (window.confirm(`Delete ${outOfStockProducts.length} out-of-stock products?`)) {
      try {
        const deletePromises = outOfStockProducts.map(product => {
          const productRef = ref(database, `products/${product.id}`);
          return remove(productRef);
        });
        await Promise.all(deletePromises);
        toast.success(`${outOfStockProducts.length} products deleted successfully!`);
      } catch (error) {
        console.error('Error bulk deleting:', error);
        toast.error('Failed to delete products');
      }
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.categoryId === selectedCategory;
    
    let matchesStock = true;
    if (stockFilter === 'in-stock') matchesStock = product.stock > 10;
    else if (stockFilter === 'low-stock') matchesStock = product.stock > 0 && product.stock <= 10;
    else if (stockFilter === 'out-of-stock') matchesStock = product.stock === 0;

    return matchesSearch && matchesCategory && matchesStock;
  });

  const stats = {
    total: products.length,
    inStock: products.filter(p => p.stock > 10).length,
    lowStock: products.filter(p => p.stock > 0 && p.stock <= 10).length,
    outOfStock: products.filter(p => p.stock === 0).length,
    featured: products.filter(p => p.featured).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold">All Products</h1>
        <div className="flex gap-2">
          <button
            onClick={handleBulkDelete}
            className="btn-outline text-red-600 border-red-600 hover:bg-red-50"
          >
            Delete Out of Stock
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-sm text-gray-600 mb-1">Total Products</p>
          <p className="text-2xl font-bold text-primary-600">{stats.total}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-600 mb-1">In Stock</p>
          <p className="text-2xl font-bold text-green-600">{stats.inStock}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-600 mb-1">Low Stock</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.lowStock}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-600 mb-1">Out of Stock</p>
          <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-600 mb-1">Featured</p>
          <p className="text-2xl font-bold text-blue-600">{stats.featured}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Search className="w-4 h-4 inline mr-2" />
              Search Products
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name..."
              className="input"
            />
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Filter className="w-4 h-4 inline mr-2" />
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Package className="w-4 h-4 inline mr-2" />
              Stock Status
            </label>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="input"
            >
              <option value="all">All Stock Levels</option>
              <option value="in-stock">In Stock (&gt;10)</option>
              <option value="low-stock">Low Stock (1-10)</option>
              <option value="out-of-stock">Out of Stock (0)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      {filteredProducts.length > 0 ? (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Product</th>
                <th className="text-left py-3 px-4">Category</th>
                <th className="text-left py-3 px-4">Price</th>
                <th className="text-center py-3 px-4">Stock</th>
                <th className="text-center py-3 px-4">Status</th>
                <th className="text-center py-3 px-4">Featured</th>
                <th className="text-right py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {product.images && product.images[0] && (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-gray-500">
                          Added by: {product.agentId ? 'Agent' : 'Admin'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">{getCategoryName(product.categoryId)}</td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-semibold">GH₵ {product.price.toFixed(2)}</p>
                      {product.comparePrice && (
                        <p className="text-sm text-gray-500 line-through">
                          GH₵ {product.comparePrice.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`font-semibold ${
                      product.stock === 0 ? 'text-red-600' :
                      product.stock <= 10 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {product.stock > 10 ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                        In Stock
                      </span>
                    ) : product.stock > 0 ? (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                        Low Stock
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                        Out of Stock
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleToggleFeatured(product.id, product.featured)}
                      className={`p-2 rounded-lg transition ${
                        product.featured
                          ? 'text-yellow-600 hover:bg-yellow-50'
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                      title={product.featured ? 'Remove from featured' : 'Add to featured'}
                    >
                      <Star className={`w-5 h-5 ${product.featured ? 'fill-current' : ''}`} />
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/product/${product.id}`}
                        className="text-blue-600 hover:text-blue-800 p-2"
                        title="View product"
                      >
                        <Eye className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        className="text-red-600 hover:text-red-800 p-2"
                        title="Delete product"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredProducts.length} of {products.length} products
          </div>
        </div>
      ) : (
        <div className="card text-center py-16">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-2">No products found</p>
          <p className="text-gray-500 text-sm">
            {searchTerm || selectedCategory !== 'all' || stockFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Products will appear here once agents add them'}
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
