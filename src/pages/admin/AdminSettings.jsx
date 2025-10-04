import React, { useState, useEffect } from 'react';
import { ref, onValue, update, set } from 'firebase/database';
import { database } from '../../config/firebase';
import { toast } from 'react-hot-toast';
import { Save, Store, MapPin, Phone, Mail, Globe } from 'lucide-react';

const AdminSettings = () => {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    storeName: 'MS Special',
    storeEmail: 'info@msspecial.com',
    storePhone: '+233 XX XXX XXXX',
    storeAddress: 'Accra, Ghana',
    deliveryFee: 10,
    pickupLocations: 'accra,tema,kumasi',
    whatsappNumber: '+233 XX XXX XXXX',
    facebookUrl: '',
    instagramUrl: '',
    twitterUrl: '',
  });

  useEffect(() => {
    const settingsRef = ref(database, 'settings');
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.val());
      }
    });

    return () => unsubscribe();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings({
      ...settings,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const settingsRef = ref(database, 'settings');
      await set(settingsRef, {
        ...settings,
        deliveryFee: parseFloat(settings.deliveryFee),
        updatedAt: Date.now(),
      });
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Store Settings</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl">
        {/* Store Information */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Store className="w-5 h-5 mr-2 text-primary-600" />
            Store Information
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Store Name *
              </label>
              <input
                type="text"
                name="storeName"
                value={settings.storeName}
                onChange={handleInputChange}
                className="input"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Store Email *
                </label>
                <input
                  type="email"
                  name="storeEmail"
                  value={settings.storeEmail}
                  onChange={handleInputChange}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Store Phone *
                </label>
                <input
                  type="tel"
                  name="storePhone"
                  value={settings.storePhone}
                  onChange={handleInputChange}
                  className="input"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MapPin className="w-4 h-4 inline mr-2" />
                Store Address *
              </label>
              <textarea
                name="storeAddress"
                value={settings.storeAddress}
                onChange={handleInputChange}
                rows="2"
                className="input"
                required
              />
            </div>
          </div>
        </div>

        {/* Delivery Settings */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">Delivery Settings</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Fee (GH₵) *
              </label>
              <input
                type="number"
                name="deliveryFee"
                value={settings.deliveryFee}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="input"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Standard delivery fee for home delivery orders
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pickup Locations *
              </label>
              <input
                type="text"
                name="pickupLocations"
                value={settings.pickupLocations}
                onChange={handleInputChange}
                className="input"
                placeholder="e.g., accra,tema,kumasi"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Comma-separated list of pickup locations (lowercase, no spaces)
              </p>
            </div>
          </div>
        </div>

        {/* Contact Settings */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">Contact Settings</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Phone className="w-4 h-4 inline mr-2" />
                WhatsApp Number
              </label>
              <input
                type="tel"
                name="whatsappNumber"
                value={settings.whatsappNumber}
                onChange={handleInputChange}
                className="input"
                placeholder="+233 XX XXX XXXX"
              />
              <p className="text-xs text-gray-500 mt-1">
                Used for customer support and order inquiries
              </p>
            </div>
          </div>
        </div>

        {/* Social Media Settings */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Globe className="w-5 h-5 mr-2 text-primary-600" />
            Social Media Links
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Facebook URL
              </label>
              <input
                type="url"
                name="facebookUrl"
                value={settings.facebookUrl}
                onChange={handleInputChange}
                className="input"
                placeholder="https://facebook.com/yourpage"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instagram URL
              </label>
              <input
                type="url"
                name="instagramUrl"
                value={settings.instagramUrl}
                onChange={handleInputChange}
                className="input"
                placeholder="https://instagram.com/yourpage"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Twitter URL
              </label>
              <input
                type="url"
                name="twitterUrl"
                value={settings.twitterUrl}
                onChange={handleInputChange}
                className="input"
                placeholder="https://twitter.com/yourpage"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="card">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
          <p className="text-sm text-gray-600 mt-3">
            Changes will be applied immediately across the store
          </p>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;
