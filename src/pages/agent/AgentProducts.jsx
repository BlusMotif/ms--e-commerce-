import React, { useState, useEffect } from 'react';
import { ref, onValue, push, update, remove } from 'firebase/database';
import { database } from '../../config/firebase';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Trash2, X, Image as ImageIcon, Save, Upload } from 'lucide-react';

const AgentProducts = () => {
  const { user } = useAuthStore();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    comparePrice: '',
    categoryId: '',
    stock: '',
    sizes: '',
    featured: false,
  });

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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Limit to 6 images total
    const currentCount = imagePreviews.length;
    const newCount = files.length;
    if (currentCount + newCount > 6) {
      toast.error('You can upload maximum 6 images per product');
      return;
    }
    
    // Check file sizes
    const oversizedFiles = files.filter(file => file.size > 500 * 1024); // 500KB limit
    if (oversizedFiles.length > 0) {
      toast.error('Each image should be less than 500KB');
      return;
    }
    
    setImageFiles([...imageFiles, ...files]);

    // Create previews
    const previewPromises = files.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(previewPromises).then(previews => {
      setImagePreviews([...imagePreviews, ...previews]);
    });
  };

  const removeImage = (index) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  const convertImagesToBase64 = async (files) => {
    const promises = files.map((file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    return Promise.all(promises);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      // Convert images to base64
      let imageUrls = [];
      if (imageFiles.length > 0) {
        console.log('Converting images to base64...');
        toast.loading('Processing images...');
        imageUrls = await convertImagesToBase64(imageFiles);
        toast.dismiss();
      } else if (editingProduct) {
        imageUrls = editingProduct.images || [];
      }

      if (imageUrls.length === 0 && !editingProduct) {
        toast.error('Please upload at least one product image');
        setUploading(false);
        return;
      }

      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        comparePrice: formData.comparePrice ? parseFloat(formData.comparePrice) : null,
        categoryId: formData.categoryId,
        stock: parseInt(formData.stock),
        sizes: formData.sizes ? formData.sizes.split(',').map(s => s.trim()) : [],
        featured: formData.featured,
        images: imageUrls,
        agentId: user.uid,
        updatedAt: Date.now(),
      };

      if (editingProduct) {
        // Update existing product
        const productRef = ref(database, `products/${editingProduct.id}`);
        await update(productRef, productData);
        toast.success('Product updated successfully!');
      } else {
        // Create new product
        productData.createdAt = Date.now();
        const productsRef = ref(database, 'products');
        await push(productsRef, productData);
        toast.success('Product created successfully!');
      }

      resetForm();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving product:', error);
      toast.dismiss();
      toast.error('Failed to save product');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      comparePrice: product.comparePrice ? product.comparePrice.toString() : '',
      categoryId: product.categoryId,
      stock: product.stock.toString(),
      sizes: product.sizes ? product.sizes.join(', ') : '',
      featured: product.featured || false,
    });
    setImagePreviews(product.images || []);
    setShowModal(true);
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const productRef = ref(database, `products/${productId}`);
        await remove(productRef);
        toast.success('Product deleted successfully!');
      } catch (error) {
        console.error('Error deleting product:', error);
        toast.error('Failed to delete product');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      comparePrice: '',
      categoryId: '',
      stock: '',
      sizes: '',
      featured: false,
    });
    setImageFiles([]);
    setImagePreviews([]);
    setEditingProduct(null);
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.name : 'Unknown';
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Products</h1>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn-primary flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Product
        </button>
      </div>

      {/* Products Table */}
      {products.length > 0 ? (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Product</th>
                <th className="text-left py-3 px-4">Category</th>
                <th className="text-left py-3 px-4">Price</th>
                <th className="text-left py-3 px-4">Stock</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-right py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
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
                        {product.featured && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            Featured
                          </span>
                        )}
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
                  <td className="py-3 px-4">{product.stock}</td>
                  <td className="py-3 px-4">
                    {product.stock > 0 ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                        In Stock
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                        Out of Stock
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-blue-600 hover:text-blue-800 p-2"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-800 p-2"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card text-center py-16">
          <p className="text-gray-600 text-lg mb-4">No products yet</p>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="btn-primary"
          >
            <Plus className="w-5 h-5 inline mr-2" />
            Add Your First Product
          </button>
        </div>
      )}

      {/* Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <h2 className="text-2xl font-bold">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Product Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Images * (Max 6 images, 500KB each)
                </label>
                
                {/* Image Previews Grid */}
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      {index === 0 && (
                        <span className="absolute bottom-1 left-1 bg-primary-600 text-white text-xs px-2 py-0.5 rounded">
                          Main
                        </span>
                      )}
                    </div>
                  ))}
                  
                  {/* Upload Button */}
                  {imagePreviews.length < 6 && (
                    <label className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 hover:bg-gray-50 transition-colors">
                      <Upload className="w-8 h-8 text-gray-400 mb-1" />
                      <span className="text-xs text-gray-500 text-center px-2">
                        {imagePreviews.length === 0 ? 'Upload Images' : 'Add More'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {imagePreviews.length}/6
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                
                <p className="text-xs text-gray-500">
                  First image will be used as the main product image. You can upload up to 6 images.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleInputChange}
                  className="input"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (GH₵) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Compare Price (GH₵)
                  </label>
                  <input
                    type="number"
                    name="comparePrice"
                    value={formData.comparePrice}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  min="0"
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sizes (comma-separated, e.g., S, M, L, XL)
                </label>
                <input
                  type="text"
                  name="sizes"
                  value={formData.sizes}
                  onChange={handleInputChange}
                  placeholder="S, M, L, XL"
                  className="input"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <label className="text-sm font-medium text-gray-700">
                  Feature this product on homepage
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  disabled={uploading}
                  className="btn-primary flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {uploading ? 'Saving...' : 'Save Product'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="btn-outline"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentProducts;
