import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import apiWrapper from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function LoginPage() {
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login');
  const [authMode, setAuthMode] = useState('email'); // 'email' or 'phone'
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);

  const doLogin = async () => {
    if (!credential || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { instance } = apiWrapper;
      // Use 'identifier' field as per API requirements
      const res = await instance.post('/auth/login', { identifier: credential, password });
      if (res.data.success) {
        // Extract token and user from response
        const { token, user } = res.data.data || res.data;
        login({ token, user });
      } else {
        setError(res.data.message || 'Login failed');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed. Please check your credentials.';
      setError(msg);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const doRegister = async () => {
    if (!name || !username || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (authMode === 'email' && !email) {
      setError('Please enter your email');
      return;
    }

    if (authMode === 'phone' && !phone) {
      setError('Please enter your phone number');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { instance } = apiWrapper;
      const payload = {
        fullName: name,
        username,
        password,
        ...(authMode === 'email' ? { email } : { phoneNumber: phone })
      };
      const res = await instance.post('/auth/register', payload);
      if (res.data.success) {
        login(res.data);
      } else {
        setError(res.data.message || 'Registration failed');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      setError(msg);
      console.error('Register error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-main)' }}>
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute w-96 h-96 bg-white/10 rounded-full -top-48 -right-48"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute w-80 h-80 bg-white/5 rounded-full -bottom-40 -left-40"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="p-8 rounded-2xl shadow-lg border"
          style={{
            backgroundColor: 'var(--bg-main)',
            borderColor: 'var(--border-color)'
          }}
        >
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="inline-block p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
              <span className="text-4xl">💬</span>
            </div>
            <h1 className="text-3xl font-semibold mb-2" style={{ color: 'var(--primary)' }}>
              ChatPal
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>Connect with friends instantly</p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2"
            >
              <span>⚠️</span>
              {error}
            </motion.div>
          )}

          {mode === 'login' ? (
            <>
              {/* Login Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email / Phone number / Username
                  </label>
                  <input
                    className="w-full p-3 rounded-lg focus:outline-none transition"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)'
                    }}
                    placeholder="Email, phone number, or username"
                    value={credential}
                    onChange={e => setCredential(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && doLogin()}
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    className="w-full p-3 rounded-lg focus:outline-none transition"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)'
                    }}
                    placeholder="••••••••"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && doLogin()}
                    disabled={loading}
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full text-white font-semibold p-3 rounded-lg transition btn-primary"
                  style={{
                    backgroundColor: loading ? 'var(--text-secondary)' : 'var(--primary)'
                  }}
                  onClick={doLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="inline-block mr-2"
                      >
                        ⏳
                      </motion.span>
                      Logging in...
                    </>
                  ) : (
                    '🔓 Login'
                  )}
                </motion.button>
              </div>

              {/* Switch to Register */}
              <div className="mt-6 text-center">
                <p className="text-gray-600 text-sm mb-3">Don't have an account?</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-blue-600 hover:text-blue-800 font-semibold transition"
                  onClick={() => {
                    setMode('register');
                    setError('');
                    setAuthMode('email');
                  }}
                >
                  Create a new account →
                </motion.button>
              </div>
            </>
          ) : (
            <>
              {/* Register Form */}
              <div className="space-y-4">
                {/* Auth Mode Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Sign up with:
                  </label>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setAuthMode('email')}
                      className={`flex-1 py-2 rounded-lg font-medium transition ${
                        authMode === 'email'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      📧 Email
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setAuthMode('phone')}
                      className={`flex-1 py-2 rounded-lg font-medium transition ${
                        authMode === 'phone'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      📱 Phone
                    </motion.button>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                    placeholder="John Doe"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    disabled={loading}
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                    placeholder="johndoe123"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    disabled={loading}
                  />
                </div>

                {/* Email or Phone */}
                {authMode === 'email' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                      placeholder="john@example.com"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                      placeholder="+1 234 567 8900"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                )}

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                    placeholder="••••••••"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 text-white font-bold p-3 rounded-lg transition"
                  onClick={doRegister}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="inline-block mr-2"
                      >
                        ⏳
                      </motion.span>
                      Creating account...
                    </>
                  ) : (
                    '✨ Create Account'
                  )}
                </motion.button>
              </div>

              {/* Switch to Login */}
              <div className="mt-6 text-center">
                <p className="text-gray-600 text-sm mb-3">Already have an account?</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-blue-600 hover:text-blue-800 font-semibold transition"
                  onClick={() => {
                    setMode('login');
                    setError('');
                  }}
                >
                  ← Login instead
                </motion.button>
              </div>
            </>
          )}

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-gray-500">
            <p>By continuing, you agree to our Terms of Service and Privacy Policy</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
