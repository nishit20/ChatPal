import React, { useState, useRef, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const ProfilePictureUpload = ({ currentPicture, userName, onClose, onUpload }) => {
  const { user, login } = useContext(AuthContext);
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(currentPicture);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, WebP, or GIF)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB');
      return;
    }

    setSelectedFile(file);
    setError('');

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError('');
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Verify API configuration before upload
      const baseURL = api.instance.defaults.baseURL || '/api';
      const endpoint = '/upload/profile-picture';
      const fullPath = baseURL + endpoint;
      
      console.log('📤 Starting profile picture upload');
      console.log('  Base URL:', baseURL);
      console.log('  Endpoint:', endpoint);
      console.log('  Full Path:', fullPath);
      console.log('  File:', selectedFile.name, `(${selectedFile.size} bytes, ${selectedFile.type})`);
      console.log('  Auth Token:', api.instance.defaults.headers.common['Authorization'] ? 'Present' : 'Missing');
      
      // Don't set Content-Type header - let axios set it automatically with boundary
      const response = await api.instance.post(endpoint, formData, {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        },
      }).catch((error) => {
        console.error('❌ Upload error details:');
        console.error('  Status:', error.response?.status);
        console.error('  Status Text:', error.response?.statusText);
        console.error('  Response Data:', error.response?.data);
        console.error('  Request URL:', error.config?.url);
        console.error('  Request BaseURL:', error.config?.baseURL);
        console.error('  Full URL:', (error.config?.baseURL || '') + (error.config?.url || ''));
        console.error('  Error Message:', error.message);
        
        if (error.response?.status === 404) {
          setError(`Endpoint not found (404). Full URL: ${(error.config?.baseURL || '') + (error.config?.url || '')}. Please ensure the backend server is running and restarted.`);
        } else if (error.response?.status === 401) {
          setError('Authentication failed. Please log in again.');
        } else if (error.response?.status === 400) {
          setError(error.response?.data?.message || 'Invalid request. Please check the file format and size.');
        } else {
          const errorMessage = error.response?.data?.message || error.message || 'Failed to upload image';
          setError(errorMessage);
        }
        throw error;
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.data.success) {
        // Update user context if available
        if (user && response.data.user) {
          const authData = JSON.parse(localStorage.getItem('chat_auth') || '{}');
          if (authData.token) {
            login({
              token: authData.token,
              user: { ...user, ...response.data.user, avatar: response.data.url, profilePicture: response.data.url }
            });
          }
        }
        
        // Simulate upload completion delay
        setTimeout(() => {
          onUpload?.(response.data.url);
          onClose?.();
        }, 500);
      } else {
        throw new Error(response.data.message || 'Failed to upload image');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Upload failed';
      setError(errorMessage);
      setUploadProgress(0);
      console.error('Upload error details:', {
        message: errorMessage,
        status: err.response?.status,
        statusText: err.response?.statusText,
        url: err.config?.url,
        fullError: err
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePhoto = async () => {
    setLoading(true);
    try {
      const response = await api.instance.delete('/users/profile-picture');

      if (response.data.success) {
        // Update user context if available
        if (user && response.data.user) {
          const authData = JSON.parse(localStorage.getItem('chat_auth') || '{}');
          if (authData.token) {
            login({
              token: authData.token,
              user: { ...user, ...response.data.user, avatar: '', profilePicture: '' }
            });
          }
        }
        
        setPreview('');
        setSelectedFile(null);
        onUpload?.('');
        onClose?.();
      } else {
        throw new Error(response.data.message || 'Failed to remove photo');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove photo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        exit={{ y: 20 }}
        className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              🖼️ Profile Picture
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition text-white"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Current/Preview Picture */}
          <div className="flex flex-col items-center gap-4">
            <motion.div
              layout
              className="relative w-32 h-32 rounded-2xl overflow-hidden shadow-lg border-4 border-purple-200 dark:border-purple-900"
            >
              {preview ? (
                <motion.img
                  layoutId="profile-pic"
                  src={preview}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-5xl font-bold">
                  {userName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}

              {/* Upload Indicator */}
              <AnimatePresence>
                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/50 flex items-center justify-center"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Upload Progress */}
            <AnimatePresence>
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full space-y-2"
                >
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-600"
                    />
                  </div>
                  <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                    Uploading... {uploadProgress}%
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400"
              >
                ⚠️ {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* File Input Hidden */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Buttons */}
          <div className="space-y-3">
            {/* Choose Photo Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              📁 {selectedFile ? 'Choose Another' : 'Choose Photo'}
            </motion.button>

            {/* Upload Button */}
            {selectedFile && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleUpload}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Uploading...' : '✓ Upload Photo'}
              </motion.button>
            )}

            {/* Remove Photo Button */}
            {(preview || currentPicture) && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRemovePhoto}
                disabled={loading}
                className="w-full py-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg font-medium transition disabled:opacity-50"
              >
                🗑️ Remove Photo
              </motion.button>
            )}

            {/* Cancel Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              disabled={loading}
              className="w-full py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-medium transition disabled:opacity-50"
            >
              Cancel
            </motion.button>
          </div>

          {/* File Requirements */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-2"
          >
            <p className="text-sm font-medium text-blue-900 dark:text-blue-300">📋 Requirements:</p>
            <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1">
              <li>✓ Formats: JPEG, PNG, WebP, GIF</li>
              <li>✓ Maximum size: 5MB</li>
              <li>✓ Recommended: Square image (1:1)</li>
              <li>✓ Minimum: 400x400 pixels</li>
            </ul>
          </motion.div>

          {/* Tips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg"
          >
            <p className="text-sm text-purple-900 dark:text-purple-300">
              💡 Pro tip: Use a clear, well-lit photo of your face for better recognition
            </p>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProfilePictureUpload;
