import React, { useState, useEffect } from 'react';
import { ref, onValue, update, set } from 'firebase/database';
import { database, auth } from '../../config/firebase';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential, sendPasswordResetEmail } from 'firebase/auth';
import { toast } from 'react-hot-toast';
import { Save, Store, MapPin, Phone, Mail, Globe, Lock, Key, ShieldCheck, Eye, EyeOff } from 'lucide-react';

const AdminSettings = () => {
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
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
    maxUploadSizeMB: 2, // Maximum upload size in MB
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Password visibility state
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
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
        maxUploadSizeMB: parseFloat(settings.maxUploadSizeMB),
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

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value,
    });
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    // Validation
    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setPasswordLoading(true);

    try {
      const user = auth.currentUser;
      
      if (!user || !user.email) {
        toast.error('No user is currently signed in');
        setPasswordLoading(false);
        return;
      }

      console.log('Attempting to change password for user:', user.email);

      try {
        // Try to re-authenticate and update password
        const credential = EmailAuthProvider.credential(
          user.email,
          passwordData.currentPassword
        );

        console.log('Re-authenticating user...');
        await reauthenticateWithCredential(user, credential);
        console.log('Re-authentication successful');

        // Update password
        console.log('Updating password...');
        await updatePassword(user, passwordData.newPassword);
        console.log('Password updated successfully');

        toast.success('Password changed successfully!');
        
        // Reset form
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } catch (authError) {
        console.log('Re-authentication failed, offering password reset email option');
        console.error('Auth error:', authError);
        
        // If re-authentication fails or requires recent login, offer email reset
        if (authError.code === 'auth/requires-recent-login' || 
            authError.code === 'auth/wrong-password' ||
            authError.code === 'auth/invalid-credential') {
          
          // Ask user if they want to receive password reset email instead
          const useEmailReset = window.confirm(
            'Unable to change password with current credentials. Would you like to receive a password reset email instead? You will be logged out and can reset your password via email.'
          );
          
          if (useEmailReset) {
            await sendPasswordResetEmail(auth, user.email);
            toast.success('Password reset email sent! Please check your inbox.');
            toast.info('You will be logged out in 3 seconds...');
            
            // Log out user after 3 seconds
            setTimeout(async () => {
              await auth.signOut();
              window.location.href = '/login';
            }, 3000);
          } else {
            throw authError; // Re-throw to show error message
          }
        } else {
          throw authError; // Re-throw for other errors
        }
      }
    } catch (error) {
      console.error('Error changing password:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'auth/wrong-password') {
        toast.error('Current password is incorrect');
      } else if (error.code === 'auth/invalid-credential') {
        toast.error('Current password is incorrect');
      } else if (error.code === 'auth/weak-password') {
        toast.error('Password is too weak. Please choose a stronger password');
      } else if (error.code === 'auth/requires-recent-login') {
        toast.error('Session expired. Please try the password reset email option.');
      } else {
        toast.error(`Failed to change password: ${error.message}`);
      }
    } finally {
      setPasswordLoading(false);
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Upload Size (MB) *
              </label>
              <input
                type="number"
                name="maxUploadSizeMB"
                value={settings.maxUploadSizeMB}
                onChange={handleInputChange}
                min="0.5"
                max="10"
                step="0.5"
                className="input"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum file size in MB for image uploads (recommended: 1-5 MB)
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

        {/* Password Change Section */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Lock className="w-5 h-5 mr-2 text-primary-600" />
            Change Password
          </h2>
          
          <form onSubmit={handleChangePassword}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Key className="w-4 h-4 inline mr-2" />
                  Current Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword.current ? "text" : "password"}
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordInputChange}
                    className="input pr-12"
                    placeholder="Enter your current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword({...showPassword, current: !showPassword.current})}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <ShieldCheck className="w-4 h-4 inline mr-2" />
                    New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.new ? "text" : "password"}
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordInputChange}
                      className="input pr-12"
                      placeholder="Enter new password"
                      minLength="6"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword({...showPassword, new: !showPassword.new})}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Must be at least 6 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <ShieldCheck className="w-4 h-4 inline mr-2" />
                    Confirm New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.confirm ? "text" : "password"}
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordInputChange}
                      className="input pr-12"
                      placeholder="Confirm new password"
                      minLength="6"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword({...showPassword, confirm: !showPassword.confirm})}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="btn-primary flex items-center"
              >
                <Lock className="w-4 h-4 mr-2" />
                {passwordLoading ? 'Changing Password...' : 'Change Password'}
              </button>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  💡 <strong>Note:</strong> If password change fails due to session timeout, you'll be offered the option to receive a password reset email instead.
                </p>
              </div>
            </div>
          </form>
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
