import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth, googleProvider } from '../../config/firebase';
import toast from 'react-hot-toast';
import { Mail, Lock, Phone, Chrome } from 'lucide-react';

const LoginPage = () => {
  const [loginMethod, setLoginMethod] = useState('email'); // 'email', 'phone'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Logged in successfully');
      navigate('/');
    } catch (error) {
      toast.error(error.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        },
      });
    }
  };

  const handlePhoneSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, phone, appVerifier);
      setConfirmationResult(confirmation);
      toast.success('OTP sent successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await confirmationResult.confirm(otp);
      toast.success('Logged in successfully');
      navigate('/');
    } catch (error) {
      toast.error('Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);

    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Logged in successfully');
      navigate('/');
    } catch (error) {
      toast.error(error.message || 'Failed to login with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
          <p className="mt-2 text-gray-600">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Login Method Tabs */}
          <div className="flex space-x-2 mb-6">
            <button
              onClick={() => setLoginMethod('email')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                loginMethod === 'email'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Email
            </button>
            <button
              onClick={() => setLoginMethod('phone')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                loginMethod === 'phone'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Phone
            </button>
          </div>

          {/* Email Login Form */}
          {loginMethod === 'email' && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-10"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-10"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          )}

          {/* Phone Login Form */}
          {loginMethod === 'phone' && (
            <div className="space-y-4">
              {!confirmationResult ? (
                <form onSubmit={handlePhoneSendOTP} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="input-field pl-10"
                        placeholder="+233 20 000 0000"
                        required
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Include country code (e.g., +233)</p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full"
                  >
                    {loading ? 'Sending OTP...' : 'Send OTP'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handlePhoneVerifyOTP} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enter OTP
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="input-field"
                      placeholder="123456"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full"
                  >
                    {loading ? 'Verifying...' : 'Verify OTP'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setConfirmationResult(null);
                      setOtp('');
                    }}
                    className="btn-secondary w-full"
                  >
                    Use Different Number
                  </button>
                </form>
              )}
            </div>
          )}

          <div id="recaptcha-container"></div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Google Sign In */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition"
          >
            <Chrome className="w-5 h-5" />
            <span>Sign in with Google</span>
          </button>

          {/* Sign Up Link */}
          <p className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
