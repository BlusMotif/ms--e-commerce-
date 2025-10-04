import React, { useState, useEffect } from 'react';
import { ref, onValue, push, update, remove } from 'firebase/database';
import { database } from '../../config/firebase';
import { toast } from 'react-hot-toast';
import { Megaphone, Plus, Edit, Trash2, X, Save, Eye, EyeOff } from 'lucide-react';

const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    targetAudience: 'all',
    active: true,
  });

  useEffect(() => {
    const announcementsRef = ref(database, 'announcements');
    const unsubscribe = onValue(announcementsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const announcementsArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        // Sort by createdAt descending
        announcementsArray.sort((a, b) => b.createdAt - a.createdAt);
        setAnnouncements(announcementsArray);
      } else {
        setAnnouncements([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      type: 'info',
      targetAudience: 'all',
      active: true,
    });
    setEditingAnnouncement(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const announcementData = {
        title: formData.title,
        message: formData.message,
        type: formData.type,
        targetAudience: formData.targetAudience,
        active: formData.active,
        updatedAt: Date.now(),
      };

      if (editingAnnouncement) {
        // Update existing announcement
        const announcementRef = ref(database, `announcements/${editingAnnouncement.id}`);
        await update(announcementRef, announcementData);
        toast.success('Announcement updated successfully!');
      } else {
        // Create new announcement
        announcementData.createdAt = Date.now();
        const announcementsRef = ref(database, 'announcements');
        await push(announcementsRef, announcementData);
        toast.success('Announcement created successfully!');
      }

      resetForm();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving announcement:', error);
      toast.error('Failed to save announcement');
    }
  };

  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      message: announcement.message,
      type: announcement.type || 'info',
      targetAudience: announcement.targetAudience || 'all',
      active: announcement.active !== false,
    });
    setShowModal(true);
  };

  const handleToggleActive = async (announcementId, currentStatus) => {
    try {
      const announcementRef = ref(database, `announcements/${announcementId}`);
      await update(announcementRef, {
        active: !currentStatus,
        updatedAt: Date.now(),
      });
      toast.success(`Announcement ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('Error toggling announcement:', error);
      toast.error('Failed to update announcement');
    }
  };

  const handleDelete = async (announcementId) => {
    if (window.confirm('Are you sure you want to delete this announcement? This action cannot be undone.')) {
      try {
        const announcementRef = ref(database, `announcements/${announcementId}`);
        await remove(announcementRef);
        toast.success('Announcement deleted successfully!');
      } catch (error) {
        console.error('Error deleting announcement:', error);
        toast.error('Failed to delete announcement');
      }
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'announcement':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAudienceLabel = (audience) => {
    switch (audience) {
      case 'all':
        return 'All Users';
      case 'customers':
        return 'Customers Only';
      case 'agents':
        return 'Agents Only';
      case 'admins':
        return 'Admins Only';
      default:
        return audience;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center space-x-3">
            <Megaphone className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
            <span>Announcements</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Create and manage system-wide announcements for users
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center justify-center space-x-2 w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          <span>New Announcement</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-sm text-gray-600 mb-1">Total Announcements</p>
          <p className="text-2xl sm:text-3xl font-bold text-primary-600">{announcements.length}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-600 mb-1">Active</p>
          <p className="text-2xl sm:text-3xl font-bold text-green-600">
            {announcements.filter((a) => a.active).length}
          </p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-600 mb-1">Inactive</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-600">
            {announcements.filter((a) => !a.active).length}
          </p>
        </div>
      </div>

      {/* Announcements List */}
      {announcements.length > 0 ? (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div key={announcement.id} className="card">
              <div className="flex flex-col space-y-3">
                {/* Title and Badges */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{announcement.title}</h3>
                    
                    {/* Badges - Stack on mobile, inline on desktop */}
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTypeColor(announcement.type)}`}>
                        {announcement.type}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                        {getAudienceLabel(announcement.targetAudience)}
                      </span>
                      {announcement.active ? (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 flex items-center space-x-1">
                          <Eye className="w-3 h-3" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 flex items-center space-x-1">
                          <EyeOff className="w-3 h-3" />
                          <span>Inactive</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions - Horizontal on mobile and desktop */}
                  <div className="flex space-x-2 sm:ml-4 justify-end">
                    <button
                      onClick={() => handleToggleActive(announcement.id, announcement.active)}
                      className={`p-2 rounded-lg transition flex-shrink-0 ${
                        announcement.active
                          ? 'text-gray-600 hover:bg-gray-100'
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                      title={announcement.active ? 'Deactivate' : 'Activate'}
                    >
                      {announcement.active ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => handleEdit(announcement)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition flex-shrink-0"
                      title="Edit"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(announcement.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition flex-shrink-0"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Message */}
                <p className="text-gray-700 text-sm sm:text-base">{announcement.message}</p>
                
                {/* Timestamp */}
                <p className="text-xs sm:text-sm text-gray-500">
                  Created: {new Date(announcement.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-16">
          <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Announcements</h3>
          <p className="text-gray-500 mb-6">
            Create your first announcement to notify users
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary inline-flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Create Announcement</span>
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full p-4 sm:p-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold">
                {editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700 flex-shrink-0"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="input text-sm sm:text-base"
                  placeholder="Announcement title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  className="input text-sm sm:text-base"
                  rows="4"
                  placeholder="Announcement message"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="input text-sm sm:text-base"
                  >
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                    <option value="announcement">Announcement</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Audience
                  </label>
                  <select
                    name="targetAudience"
                    value={formData.targetAudience}
                    onChange={handleInputChange}
                    className="input text-sm sm:text-base"
                  >
                    <option value="all">All Users</option>
                    <option value="customers">Customers Only</option>
                    <option value="agents">Agents Only</option>
                    <option value="admins">Admins Only</option>
                  </select>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="active"
                  name="active"
                  checked={formData.active}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-primary-600 rounded mt-0.5 flex-shrink-0"
                />
                <label htmlFor="active" className="text-xs sm:text-sm font-medium text-gray-700">
                  Active (users will see this announcement immediately)
                </label>
              </div>

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="btn-outline flex-1 text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 flex items-center justify-center space-x-2 text-sm sm:text-base"
                >
                  <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>{editingAnnouncement ? 'Update' : 'Create'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnnouncements;
