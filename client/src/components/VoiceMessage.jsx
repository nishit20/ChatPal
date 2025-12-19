import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';

const VoiceMessage = ({ duration = 0, url, isPlaying, onPlay, onPause }) => {
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handlePlay = () => {
    if (audioRef.current) {
      audioRef.current.play();
      onPlay?.();
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      onPause?.();
    }
  };

  return (
    <div className="flex items-center gap-3 bg-gradient-to-r from-blue-400 to-blue-500 dark:from-blue-600 dark:to-blue-700 rounded-full px-4 py-2">
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
      />

      {/* Play/Pause Button */}
      <button
        onClick={isPlaying ? handlePause : handlePlay}
        className="flex-shrink-0 text-white hover:scale-110 transition"
      >
        {isPlaying ? '⏸️' : '▶️'}
      </button>

      {/* Progress Bar */}
      <div className="flex-1 flex items-center gap-2">
        <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-white"
            style={{ width: `${(currentTime / duration) * 100}%` }}
            layoutId="voice-progress"
          />
        </div>
        <span className="text-xs text-white font-semibold min-w-fit">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      {/* Download Button */}
      <a
        href={url}
        download
        className="flex-shrink-0 text-white hover:scale-110 transition"
        title="Download"
      >
        ⬇️
      </a>
    </div>
  );
};

export default VoiceMessage;
