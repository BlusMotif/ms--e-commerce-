import React, { useState } from 'react';
import { ref, update } from 'firebase/database';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth, database } from '../../config/firebase';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'react-hot-toast';
import { User, Mail, Phone, MapPin, Lock, Save } from 'lucide-react';

const CustomerProfile = () => {
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [profile, setProfile] = useState({
    fullName: user?.displayName || '',
    phone: user?.phoneNumber || '',
    address: user?.address || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleProfileChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userRef = ref(database, `users/${user.uid}`);
      await update(userRef, {
        fullName: profile.fullName,
        phone: profile.phone,
        address: profile.address,
        updatedAt: Date.now(),
      });

      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // Re-authenticate user before changing password
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        passwordData.currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);

      // Update password
      await updatePassword(auth.currentUser, passwordData.newPassword);

      toast.success('Password updated successfully!');
      setChangingPassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Error updating password:', error);
      if (error.code === 'auth/wrong-password') {
        toast.error('Current password is incorrect');
      } else {
        toast.error('Failed to update password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info Card */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Profile Information</h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-outline"
                >
                  Edit Profile
                </button>
              )}
            </div>

            <form onSubmit={handleUpdateProfile}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <User className="w-4 h-4 inline mr-2" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={profile.fullName}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="input bg-gray-100 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={profile.phone}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={profile.address}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                    rows="3"
                    className="input"
                  />
                </div>
              </div>

              {isEditing && (
                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex items-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setProfile({
                        fullName: user?.displayName || '',
                        phone: user?.phoneNumber || '',
                        address: user?.address || '',
                      });
                    }}
                    className="btn-outline"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Change Password Card */}
          <div className="card mt-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Change Password</h2>
              {!changingPassword && (
                <button
                  onClick={() => setChangingPassword(true)}
                  className="btn-outline"
                >
                  <Lock className="w-4 h-4 mr-2 inline" />
                  Change Password
                </button>
              )}
            </div>

            {changingPassword ? (
              <form onSubmit={handleUpdatePassword}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="input"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="input"
                      required
                      minLength="6"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="input"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary"
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setChangingPassword(false);
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                      });
                    }}
                    className="btn-outline"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-gray-600">
                Keep your account secure by using a strong password.
              </p>
            )}
          </div>
        </div>

        {/* Account Summary Card */}
        <div>
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Account Summary</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Account Type</p>
                <p className="font-semibold capitalize">{user?.role || 'Customer'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Member Since</p>
                <p className="font-semibold">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Account Status</p>
                <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;
