import React, { useState, useEffect } from 'react';
import { ref, onValue, set, get } from 'firebase/database';
import { database, auth } from '../../config/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { toast } from 'react-hot-toast';
import { Save, Store, MapPin, Phone, Mail, Globe, Lock, Key, ShieldCheck, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const AdminSettings = () => {
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const { user, role } = useAuthStore(); // Get user and role from auth store
  const [lastPasswordResetAttempt, setLastPasswordResetAttempt] = useState(0); // Rate limiting
  const [settings, setSettings] = useState({
    storeName: 'MS Special',
    storeEmail: 'info@msspecial.com',
    storePhone: '+233 XX XXX XXXX',
    storeAddress: 'Accra, Ghana',
    deliveryFee: 10,
    pickupLocations: 'accra,tema,kumasi',
    whatsappNumber: '+233 XX XXX XXXX',
    customerServicePhone: '+233 XX XXX XXXX',
    customerServicePhone2: '',
    facebookUrl: '',
    instagramUrl: '',
    twitterUrl: '',
    socialMediaLinks: [],
    maxUploadSizeMB: 2, // Maximum upload size in MB
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  // Password visibility state
  const [showPassword, setShowPassword] = useState({
    new: false,
    confirm: false,
  });

  useEffect(() => {
    const settingsRef = ref(database, 'settings');
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const dbSettings = snapshot.val();
        // Merge with default values to ensure all fields exist
        setSettings({
          storeName: dbSettings.storeName || 'MS Special',
          storeEmail: dbSettings.storeEmail || 'info@msspecial.com',
          storePhone: dbSettings.storePhone || '+233 XX XXX XXXX',
          storeAddress: dbSettings.storeAddress || 'Accra, Ghana',
          deliveryFee: dbSettings.deliveryFee || 10,
          pickupLocations: dbSettings.pickupLocations || 'accra,tema,kumasi',
          whatsappNumber: dbSettings.whatsappNumber || '+233 XX XXX XXXX',
          customerServicePhone: dbSettings.customerServicePhone || '+233 XX XXX XXXX',
          customerServicePhone2: dbSettings.customerServicePhone2 || '',
          facebookUrl: dbSettings.facebookUrl || '',
          instagramUrl: dbSettings.instagramUrl || '',
          twitterUrl: dbSettings.twitterUrl || '',
          socialMediaLinks: dbSettings.socialMediaLinks || [],
          maxUploadSizeMB: dbSettings.maxUploadSizeMB || 2,
        });
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

  const handleAddSocialMedia = () => {
    setSettings({
      ...settings,
      socialMediaLinks: [
        ...settings.socialMediaLinks,
        { platform: '', url: '', icon: 'link' }
      ]
    });
  };

  const handleSocialMediaChange = (index, field, value) => {
    const updatedLinks = [...settings.socialMediaLinks];
    updatedLinks[index][field] = value;
    setSettings({
      ...settings,
      socialMediaLinks: updatedLinks
    });
  };

  const handleRemoveSocialMedia = (index) => {
    const updatedLinks = settings.socialMediaLinks.filter((_, i) => i !== index);
    setSettings({
      ...settings,
      socialMediaLinks: updatedLinks
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const settingsRef = ref(database, 'settings');
      
      // Prepare settings data with proper type conversions
      const settingsData = {
        storeName: settings.storeName || 'MS Special',
        storeEmail: settings.storeEmail || '',
        storePhone: settings.storePhone || '',
        storeAddress: settings.storeAddress || '',
        deliveryFee: parseFloat(settings.deliveryFee) || 0,
        pickupLocations: settings.pickupLocations || '',
        whatsappNumber: settings.whatsappNumber || '',
        customerServicePhone: settings.customerServicePhone || '',
        customerServicePhone2: settings.customerServicePhone2 || '',
        facebookUrl: settings.facebookUrl || '',
        instagramUrl: settings.instagramUrl || '',
        twitterUrl: settings.twitterUrl || '',
        socialMediaLinks: settings.socialMediaLinks || [],
        maxUploadSizeMB: parseFloat(settings.maxUploadSizeMB) || 2,
        updatedAt: Date.now(),
      };
      
      await set(settingsRef, settingsData);
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      console.error('Error details:', error.message);
      toast.error(`Failed to save settings: ${error.message}`);
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
    
    // ===== SECURITY CHECKS =====
    
    // 1. Check if user is authenticated
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) {
      toast.error('❌ Authentication required. Please log in again.');
      return;
    }

    // 2. Verify user role is admin (server-side check)
    if (role !== 'admin') {
      toast.error('❌ Unauthorized: Only admins can change their password here.');
      console.error('Security Alert: Non-admin user attempted password change');
      return;
    }

    // 3. Verify the authenticated user matches the stored user
    if (user && currentUser.uid !== user.uid) {
      toast.error('❌ Security error: User mismatch detected.');
      console.error('Security Alert: User UID mismatch');
      return;
    }

    // 4. Rate limiting: Prevent spam (max 1 request per 60 seconds)
    const now = Date.now();
    const timeSinceLastAttempt = now - lastPasswordResetAttempt;
    if (timeSinceLastAttempt < 60000) { // 60 seconds
      const waitTime = Math.ceil((60000 - timeSinceLastAttempt) / 1000);
      toast.error(`⏳ Please wait ${waitTime} seconds before trying again.`);
      return;
    }

    // 5. Verify admin role from database (double-check)
    try {
      const userRef = ref(database, `users/${currentUser.uid}`);
      const snapshot = await get(userRef);
      
      if (!snapshot.exists()) {
        toast.error('❌ User data not found in database.');
        return;
      }

      const userData = snapshot.val();
      if (userData.role !== 'admin') {
        toast.error('❌ Unauthorized: Admin role required.');
        console.error('Security Alert: Role verification failed');
        return;
      }
    } catch (error) {
      console.error('Error verifying user role:', error);
      toast.error('❌ Failed to verify user permissions.');
      return;
    }

    // ===== VALIDATION =====
    
    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setPasswordLoading(true);
    setLastPasswordResetAttempt(now); // Update rate limit timestamp

    try {
      console.log('Sending password reset email for admin:', currentUser.email);

      // Send password reset email
      await sendPasswordResetEmail(auth, currentUser.email);
      
      // Log the password reset request for audit trail
      const activityLogRef = ref(database, `activityLogs/${Date.now()}`);
      await set(activityLogRef, {
        action: 'password_reset_requested',
        userId: currentUser.uid,
        userEmail: currentUser.email,
        role: 'admin',
        timestamp: Date.now(),
        ipAddress: 'client-initiated', // You can enhance this with actual IP detection
      });
      
      toast.success('✅ Password reset email sent! Please check your inbox.');
      toast.info('🔒 You will be logged out in 3 seconds to complete the password reset...');
      
      // Log out user after 3 seconds
      setTimeout(async () => {
        await auth.signOut();
        window.location.href = '/login';
      }, 3000);

      // Reset form
      setPasswordData({
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Error sending password reset email:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Log failed attempt
      try {
        const failedLogRef = ref(database, `activityLogs/${Date.now()}`);
        await set(failedLogRef, {
          action: 'password_reset_failed',
          userId: currentUser.uid,
          userEmail: currentUser.email,
          role: 'admin',
          error: error.code,
          timestamp: Date.now(),
        });
      } catch (logError) {
        console.error('Failed to log error:', logError);
      }
      
      if (error.code === 'auth/invalid-email') {
        toast.error('Invalid email address');
      } else if (error.code === 'auth/user-not-found') {
        toast.error('User account not found');
      } else if (error.code === 'auth/too-many-requests') {
        toast.error('Too many requests. Please try again later.');
      } else {
        toast.error(`Failed to send password reset email: ${error.message}`);
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Phone className="w-4 h-4 inline mr-2" />
                Customer Service Phone (Primary)
              </label>
              <input
                type="tel"
                name="customerServicePhone"
                value={settings.customerServicePhone}
                onChange={handleInputChange}
                className="input"
                placeholder="+233 XX XXX XXXX"
              />
              <p className="text-xs text-gray-500 mt-1">
                Primary phone number for customer orders and inquiries
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Phone className="w-4 h-4 inline mr-2" />
                Customer Service Phone (Secondary)
              </label>
              <input
                type="tel"
                name="customerServicePhone2"
                value={settings.customerServicePhone2}
                onChange={handleInputChange}
                className="input"
                placeholder="+233 XX XXX XXXX (Optional)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Secondary phone number for backup contact (optional)
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
            {/* Default Social Media */}
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

            {/* Divider */}
            <div className="border-t border-gray-200 pt-4 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-md font-semibold text-gray-800">Additional Social Media</h3>
                <button
                  type="button"
                  onClick={handleAddSocialMedia}
                  className="btn-outline flex items-center space-x-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Platform</span>
                </button>
              </div>

              {settings.socialMediaLinks && settings.socialMediaLinks.length > 0 && (
                <div className="space-y-3">
                  {settings.socialMediaLinks.map((link, index) => (
                    <div key={index} className="flex gap-3 items-start p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Platform Name
                          </label>
                          <input
                            type="text"
                            value={link.platform}
                            onChange={(e) => handleSocialMediaChange(index, 'platform', e.target.value)}
                            className="input text-sm"
                            placeholder="e.g., LinkedIn, TikTok, YouTube"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Profile URL
                          </label>
                          <input
                            type="url"
                            value={link.url}
                            onChange={(e) => handleSocialMediaChange(index, 'url', e.target.value)}
                            className="input text-sm"
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSocialMedia(index)}
                        className="mt-6 p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {(!settings.socialMediaLinks || settings.socialMediaLinks.length === 0) && (
                <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  No additional social media links added. Click "Add Platform" to get started.
                </p>
              )}
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
                <p className="text-sm text-blue-800 mb-2">
                  💡 <strong>How it works:</strong> Click "Change Password" to receive a password reset email. Follow the link in the email to set your new password. You'll be logged out after clicking the button.
                </p>
                <p className="text-xs text-blue-700">
                  🔒 <strong>Security:</strong> Your identity is verified through multiple checks (role verification, rate limiting, activity logging) before the email is sent.
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
