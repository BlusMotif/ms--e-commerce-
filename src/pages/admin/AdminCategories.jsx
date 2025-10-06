import React, { useState, useEffect } from 'react';
import { ref, onValue, push, update, remove } from 'firebase/database';
import { database } from '../../config/firebase';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Trash2, X, Save, Tag, Upload, Image as ImageIcon } from 'lucide-react';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState({ maxUploadSizeMB: 2 }); // Default 2MB
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image: '',
  });
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    const categoriesRef = ref(database, 'categories');
    const unsubscribe = onValue(categoriesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const categoriesArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setCategories(categoriesArray);
      } else {
        setCategories([]);
      }
      setLoading(false);
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
      unsubscribeSettings();
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
      // Auto-generate slug from name if it's the name field
      ...(name === 'name' && { slug: value.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') }),
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size using dynamic limit from settings
      const maxSizeBytes = (settings.maxUploadSizeMB || 2) * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        toast.error(`Image size should be less than ${settings.maxUploadSizeMB || 2}MB`);
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setFormData({ ...formData, image: base64String });
        setImagePreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, image: '' });
    setImagePreview('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const categoryData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        image: formData.image || '',
        updatedAt: Date.now(),
      };

      if (editingCategory) {
        // Update existing category
        const categoryRef = ref(database, `categories/${editingCategory.id}`);
        await update(categoryRef, categoryData);
        toast.success('Category updated successfully!');
      } else {
        // Create new category
        categoryData.createdAt = Date.now();
        const categoriesRef = ref(database, 'categories');
        await push(categoriesRef, categoryData);
        toast.success('Category created successfully!');
      }

      resetForm();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Failed to save category');
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image: category.image || '',
    });
    setImagePreview(category.image || '');
    setShowModal(true);
  };

  const handleDelete = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      try {
        const categoryRef = ref(database, `categories/${categoryId}`);
        await remove(categoryRef);
        toast.success('Category deleted successfully!');
      } catch (error) {
        console.error('Error deleting category:', error);
        toast.error('Failed to delete category');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      image: '',
    });
    setImagePreview('');
    setEditingCategory(null);
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
        <h1 className="text-3xl font-bold">Manage Categories</h1>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn-primary flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Category
        </button>
      </div>

      {/* Categories Grid */}
      {categories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div key={category.id} className="card">
              {/* Category Image */}
              {category.image ? (
                <div className="mb-4 rounded-lg overflow-hidden">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-40 object-cover"
                  />
                </div>
              ) : (
                <div className="mb-4 h-40 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
                  <Tag className="w-12 h-12 text-white" />
                </div>
              )}
              
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{category.name}</h3>
                  <p className="text-sm text-gray-500">{category.slug}</p>
                </div>
              </div>
              {category.description && (
                <p className="text-gray-600 text-sm mb-4">{category.description}</p>
              )}
              <div className="flex gap-2 pt-3 border-t">
                <button
                  onClick={() => handleEdit(category)}
                  className="btn-outline flex-1 flex items-center justify-center"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="btn-outline text-red-600 border-red-600 hover:bg-red-50 flex-1 flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-16">
          <Tag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-4">No categories yet</p>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="btn-primary"
          >
            <Plus className="w-5 h-5 inline mr-2" />
            Create Your First Category
          </button>
        </div>
      )}

      {/* Category Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-lg w-full my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
              <h2 className="text-2xl font-bold">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
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

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="input"
                  required
                  placeholder="e.g., Dresses, Bags, Shito"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug *
                </label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  className="input"
                  required
                  placeholder="e.g., dresses, bags, shito"
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL-friendly version (lowercase, no spaces)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="input"
                  placeholder="Brief description of this category"
                />
              </div>

              {/* Image Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Image
                </label>
                
                {(imagePreview || formData.image) ? (
                  <div className="relative">
                    <img
                      src={imagePreview || formData.image}
                      alt="Category preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition">
                    <input
                      type="file"
                      id="category-image"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="category-image"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <Upload className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Click to upload image
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG up to 2MB
                      </p>
                    </label>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Optional: Upload an image to represent this category (recommended size: 800x600px)
                </p>
              </div>
              </div>

              {/* Action Buttons - Fixed at bottom */}
              <div className="flex gap-3 p-6 border-t flex-shrink-0 bg-gray-50">
                <button type="submit" className="btn-primary flex items-center">
                  <Save className="w-4 h-4 mr-2" />
                  {editingCategory ? 'Update Category' : 'Create Category'}
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

export default AdminCategories;
