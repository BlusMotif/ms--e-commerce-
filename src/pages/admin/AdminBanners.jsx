import React, { useState, useEffect } from 'react';
import { ref, onValue, push, update, remove } from 'firebase/database';
import { database } from '../../config/firebase';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Trash2, X, Save, Image as ImageIcon, ArrowUp, ArrowDown } from 'lucide-react';

const AdminBanners = () => {
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState({ maxUploadSizeMB: 2 }); // Default 2MB
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    buttonText: '',
    buttonLink: '',
    categoryId: '', // Add category selection
    active: true,
    order: 0,
  });

  useEffect(() => {
    const bannersRef = ref(database, 'banners');
    const unsubscribe = onValue(bannersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const bannersArray = Object.keys(data)
          .map((key) => ({
            id: key,
            ...data[key],
          }))
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        setBanners(bannersArray);
      } else {
        setBanners([]);
      }
      setLoading(false);
    });

    // Fetch categories for category selector
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

    // Fetch settings
    const settingsRef = ref(database, 'settings');
    const unsubscribeSettings = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.val());
      }
    });

    return () => {
      unsubscribe();
      unsubscribeCategories();
      unsubscribeSettings();
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
    const file = e.target.files[0];
    if (file) {
      // Check file size using dynamic limit from settings
      const maxSizeBytes = (settings.maxUploadSizeMB || 2) * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        toast.error(`Image size should be less than ${settings.maxUploadSizeMB || 2}MB`);
        return;
      }
      
      setImageFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      let imageUrl = editingBanner?.image || '';

      if (imageFile) {
        console.log('Converting image to base64...');
        toast.loading('Processing image...');
        imageUrl = await convertImageToBase64(imageFile);
        toast.dismiss();
        console.log('Image converted successfully');
      }

      if (!imageUrl && !editingBanner) {
        toast.error('Please upload a banner image');
        setUploading(false);
        return;
      }

      console.log('Saving banner data...');
      const bannerData = {
        title: formData.title,
        subtitle: formData.subtitle,
        buttonText: formData.buttonText,
        buttonLink: formData.buttonLink,
        categoryId: formData.categoryId, // Save category ID
        active: formData.active,
        order: parseInt(formData.order),
        image: imageUrl,
        updatedAt: Date.now(),
      };

      if (editingBanner) {
        const bannerRef = ref(database, `banners/${editingBanner.id}`);
        await update(bannerRef, bannerData);
        toast.success('Banner updated successfully!');
      } else {
        bannerData.createdAt = Date.now();
        const bannersRef = ref(database, 'banners');
        await push(bannersRef, bannerData);
        toast.success('Banner created successfully!');
      }

      resetForm();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving banner:', error);
      toast.dismiss();
      toast.error(`Failed to save banner: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || '',
      buttonText: banner.buttonText || '',
      buttonLink: banner.buttonLink || '',
      categoryId: banner.categoryId || '', // Load category ID
      active: banner.active !== false,
      order: banner.order || 0,
    });
    setImagePreview(banner.image);
    setShowModal(true);
  };

  const handleDelete = async (bannerId) => {
    if (window.confirm('Are you sure you want to delete this banner?')) {
      try {
        const bannerRef = ref(database, `banners/${bannerId}`);
        await remove(bannerRef);
        toast.success('Banner deleted successfully!');
      } catch (error) {
        console.error('Error deleting banner:', error);
        toast.error('Failed to delete banner');
      }
    }
  };

  const handleReorder = async (bannerId, currentOrder, direction) => {
    const newOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1;
    const swapBanner = banners.find((b) => b.order === newOrder);

    try {
      const bannerRef = ref(database, `banners/${bannerId}`);
      await update(bannerRef, { order: newOrder });

      if (swapBanner) {
        const swapBannerRef = ref(database, `banners/${swapBanner.id}`);
        await update(swapBannerRef, { order: currentOrder });
      }

      toast.success('Banner order updated!');
    } catch (error) {
      console.error('Error reordering banner:', error);
      toast.error('Failed to update order');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      buttonText: '',
      buttonLink: '',
      categoryId: '', // Reset category ID
      active: true,
      order: banners.length,
    });
    setImageFile(null);
    setImagePreview('');
    setEditingBanner(null);
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
        <h1 className="text-3xl font-bold">Manage Banners</h1>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn-primary flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Banner
        </button>
      </div>

      {/* Banners List */}
      {banners.length > 0 ? (
        <div className="space-y-4">
          {banners.map((banner, index) => (
            <div key={banner.id} className="card">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Banner Image */}
                <div className="w-full md:w-64 h-40 flex-shrink-0">
                  <img
                    src={banner.image}
                    alt={banner.title}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>

                {/* Banner Details */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{banner.title}</h3>
                      {banner.subtitle && (
                        <p className="text-gray-600 text-sm">{banner.subtitle}</p>
                      )}
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        banner.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {banner.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {banner.buttonText && (
                    <div className="mb-3">
                      <span className="text-sm text-gray-600">Button: </span>
                      <span className="text-sm font-medium">{banner.buttonText}</span>
                      {banner.buttonLink && (
                        <span className="text-sm text-gray-500 ml-2">→ {banner.buttonLink}</span>
                      )}
                      {!banner.buttonLink && banner.categoryId && (
                        <span className="text-sm text-gray-500 ml-2">
                          → Category: {categories.find(c => c.id === banner.categoryId)?.name || 'Unknown'}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mt-4">
                    {/* Reorder Buttons */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleReorder(banner.id, banner.order || 0, 'up')}
                        disabled={index === 0}
                        className="p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Move up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleReorder(banner.id, banner.order || 0, 'down')}
                        disabled={index === banners.length - 1}
                        className="p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Move down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Edit & Delete Buttons */}
                    <button
                      onClick={() => handleEdit(banner)}
                      className="btn-outline flex items-center"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(banner.id)}
                      className="btn-outline text-red-600 border-red-600 hover:bg-red-50 flex items-center"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-16">
          <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-4">No banners yet</p>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="btn-primary"
          >
            <Plus className="w-5 h-5 inline mr-2" />
            Create Your First Banner
          </button>
        </div>
      )}

      {/* Banner Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full my-8">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <h2 className="text-2xl font-bold">
                {editingBanner ? 'Edit Banner' : 'Add New Banner'}
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
              {/* Banner Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Banner Image * (Max 1MB, Recommended: 1920x600px)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="input"
                />
                {imagePreview && (
                  <div className="mt-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Banner Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="input"
                  required
                  placeholder="e.g., Summer Sale 2024"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subtitle
                </label>
                <input
                  type="text"
                  name="subtitle"
                  value={formData.subtitle}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="e.g., Up to 50% off on selected items"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Button Text
                  </label>
                  <input
                    type="text"
                    name="buttonText"
                    value={formData.buttonText}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="e.g., Shop Now"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category (Optional)
                  </label>
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    className="input"
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Button will redirect to this category when clicked
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Link (Optional)
                </label>
                <input
                  type="text"
                  name="buttonLink"
                  value={formData.buttonLink}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="e.g., /products or leave empty to use category"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Custom link overrides category selection
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  name="order"
                  value={formData.order}
                  onChange={handleInputChange}
                  className="input"
                  min="0"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="active"
                  checked={formData.active}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <label className="text-sm font-medium text-gray-700">
                  Active (Show on homepage)
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  disabled={uploading}
                  className="btn-primary flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {uploading ? 'Saving...' : 'Save Banner'}
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

export default AdminBanners;
