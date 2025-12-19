import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSocket } from '../services/socket';

const MessageInput = ({ onSend, chatId, disabled = false }) => {
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const chunksRef = useRef([]);

  const socket = getSocket();

  // Handle typing indicator
  const handleTextChange = (e) => {
    const value = e.target.value;
    setText(value);

    // Emit typing event
    if (!isTyping && value.length > 0) {
      setIsTyping(true);
      socket?.emit('typing', { chatId });
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket?.emit('stop_typing', { chatId });
    }, 3000);
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    // Generate preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target?.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview({
        name: selectedFile.name,
        size: (selectedFile.size / 1024).toFixed(2),
        type: selectedFile.type,
      });
    }
  };

  const handleSend = async () => {
    if (!text.trim() && !file) return;

    // Stop typing indicator
    setIsTyping(false);
    socket?.emit('stop_typing', { chatId });

    let content = text;
    let type = 'text';
    let formData = null;

    if (file) {
      type = file.type.startsWith('image/') ? 'image' : 'file';
      formData = new FormData();
      formData.append('file', file);
      formData.append('chatId', chatId);
    }

    await onSend({ content, type, formData });

    // Reset state
    setFile(null);
    setPreview(null);
    setText('');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Voice message recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const voiceFile = new File([blob], `voice-${Date.now()}.webm`, {
          type: 'audio/webm',
        });
        setFile(voiceFile);
        setPreview({
          name: 'Voice Message',
          size: (voiceFile.size / 1024).toFixed(2),
          type: 'audio',
          duration: recordingTime,
        });
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="border-t p-4 space-y-3" style={{ 
      backgroundColor: 'var(--bg-main)',
      borderColor: 'var(--border-color)'
    }}>
      {/* Recording Indicator */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center gap-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="text-red-500 text-lg"
            >
              🎤
            </motion.div>
            <span className="text-sm font-semibold text-red-600 dark:text-red-400">
              Recording: {formatRecordingTime(recordingTime)}
            </span>
            <button
              onClick={stopRecording}
              className="ml-auto px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm transition"
            >
              Stop
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File Preview */}
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="relative bg-gray-100 dark:bg-gray-800 rounded-lg p-3"
          >
            {preview.type === 'audio' ? (
              <div className="flex items-center gap-3">
                <div className="text-2xl">🎤</div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{preview.name}</p>
                  <p className="text-xs text-gray-500">
                    {preview.size} KB • {formatRecordingTime(preview.duration)}
                  </p>
                </div>
              </div>
            ) : typeof preview === 'string' ? (
              <img
                src={preview}
                alt="preview"
                className="max-h-48 rounded max-w-full"
              />
            ) : (
              <div className="flex items-center gap-3">
                <div className="text-2xl">📎</div>
                <div className="flex-1">
                  <p className="font-semibold text-sm truncate">{preview.name}</p>
                  <p className="text-xs text-gray-500">{preview.size} KB</p>
                </div>
              </div>
            )}
            <button
              onClick={removeFile}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="flex gap-3 items-end">
        {/* Attachment button */}
        <button
          onClick={() => !isRecording && fileInputRef.current?.click()}
          className="p-2 rounded-lg transition text-xl"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--hover-bg)'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          title="Attach file"
          disabled={disabled || isRecording}
        >
          📎
        </button>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || isRecording}
        />

        {/* Voice Message button */}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className="p-2 rounded-lg transition text-xl"
          style={{ 
            color: isRecording ? '#ef4444' : 'var(--text-secondary)',
            backgroundColor: isRecording ? 'rgba(239, 68, 68, 0.1)' : 'transparent'
          }}
          onMouseEnter={(e) => !isRecording && (e.target.style.backgroundColor = 'var(--hover-bg)')}
          onMouseLeave={(e) => !isRecording && (e.target.style.backgroundColor = 'transparent')}
          title={isRecording ? 'Stop recording' : 'Record voice message'}
          disabled={disabled}
        >
          🎤
        </button>

        {/* Text Input */}
        <textarea
          value={text}
          onChange={handleTextChange}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="flex-1 resize-none rounded-lg p-3 focus:outline-none max-h-24"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            fontSize: '14px',
            lineHeight: '1.4'
          }}
          rows={1}
          disabled={disabled || isRecording}
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={(!text.trim() && !file) || disabled || isRecording}
          className="p-2 text-white rounded-lg transition text-xl"
          style={{
            backgroundColor: (!text.trim() && !file) || disabled || isRecording ? 'var(--text-secondary)' : 'var(--primary)'
          }}
          onMouseEnter={(e) => {
            if (!e.target.disabled) e.target.style.backgroundColor = 'var(--primary-dark)';
          }}
          onMouseLeave={(e) => {
            if (!e.target.disabled) e.target.style.backgroundColor = 'var(--primary)';
          }}
          title="Send message"
        >
          📤
        </button>

        {/* Emoji button */}
        <button
          className="p-2 rounded-lg transition text-xl"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--hover-bg)'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          title="Emoji picker (coming soon)"
          disabled={disabled || isRecording}
        >
          😊
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
