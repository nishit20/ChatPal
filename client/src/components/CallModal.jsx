import React, { useContext, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CallContext } from '../context/CallContext';
import { getSocket } from '../services/socket';

const CallModal = () => {
  const {
    incomingCall,
    activeCall,
    acceptCall,
    declineCall,
    endCall,
    callDuration,
    isMuted,
    isVideoEnabled,
    toggleAudio,
    toggleVideo,
    localStream,
    remoteStream,
    peerConnectionRef,
    setSocket,
  } = useContext(CallContext);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Set socket
  useEffect(() => {
    const socket = getSocket();
    setSocket(socket);

    if (socket) {
      socket.on('receive_offer', async ({ from, offer }) => {
        try {
          if (peerConnectionRef.current) {
            await peerConnectionRef.current.setRemoteDescription(
              new RTCSessionDescription({ type: 'offer', sdp: offer })
            );

            const answer = await peerConnectionRef.current.createAnswer();
            await peerConnectionRef.current.setLocalDescription(answer);

            socket.emit('send_answer', {
              to: from,
              answer: answer.sdp,
            });
          }
        } catch (error) {
          console.error('Error handling offer:', error);
        }
      });

      socket.on('receive_answer', async ({ from, answer }) => {
        try {
          if (peerConnectionRef.current) {
            await peerConnectionRef.current.setRemoteDescription(
              new RTCSessionDescription({ type: 'answer', sdp: answer })
            );
          }
        } catch (error) {
          console.error('Error handling answer:', error);
        }
      });

      socket.on('receive_ice_candidate', async ({ from, candidate }) => {
        try {
          if (peerConnectionRef.current && candidate) {
            await peerConnectionRef.current.addIceCandidate(
              new RTCIceCandidate(candidate)
            );
          }
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      });

      socket.on('call_ended', () => {
        endCall();
      });
    }

    return () => {
      if (socket) {
        socket.off('receive_offer');
        socket.off('receive_answer');
        socket.off('receive_ice_candidate');
        socket.off('call_ended');
      }
    };
  }, [peerConnectionRef, endCall, setSocket]);

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Format duration
  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Incoming call modal
  if (incomingCall && !activeCall) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
        >
          <motion.div
            className="bg-gradient-to-b from-gray-900 to-black rounded-3xl p-8 w-96 text-center shadow-2xl"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {/* Caller Avatar */}
            <motion.div
              className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 mx-auto mb-4 flex items-center justify-center text-white text-4xl font-bold"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              👤
            </motion.div>

            {/* Call Type */}
            <h2 className="text-white text-2xl font-bold mb-2">
              Incoming {incomingCall.callType === 'video' ? 'Video' : 'Audio'} Call
            </h2>
            <p className="text-gray-400 mb-8">Caller ID: {incomingCall.callerId}</p>

            {/* Ringing animation */}
            <div className="flex justify-center gap-2 mb-8">
              <motion.div
                className="w-2 h-2 rounded-full bg-blue-500"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
              <motion.div
                className="w-2 h-2 rounded-full bg-blue-500"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: 0.1 }}
              />
              <motion.div
                className="w-2 h-2 rounded-full bg-blue-500"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={declineCall}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-full transition"
              >
                ❌ Decline
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={acceptCall}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-full transition"
              >
                ✓ Accept
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Active call modal
  if (activeCall) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black z-50 flex flex-col"
        >
          {/* Remote Video (Full screen) */}
          {activeCall.callType === 'video' && remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex-1 bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center">
              <div className="text-center">
                <div className="w-40 h-40 rounded-full bg-white/10 mx-auto mb-6 flex items-center justify-center text-white text-7xl">
                  🎤
                </div>
                <h2 className="text-white text-2xl font-bold mb-2">
                  {activeCall.callType === 'video' ? 'Video' : 'Audio'} Call
                </h2>
                <p className="text-white/60 text-lg">Connected</p>
              </div>
            </div>
          )}

          {/* Local Video (Picture-in-Picture) */}
          {activeCall.callType === 'video' && localStream && (
            <div className="absolute bottom-24 right-4 w-32 h-40 bg-black rounded-lg overflow-hidden border-2 border-white shadow-lg">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Call Duration */}
          <motion.div
            className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-6 py-2 rounded-full text-xl font-bold"
            animate={{ opacity: [1, 0.8, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            {formatDuration(callDuration)}
          </motion.div>

          {/* Controls */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4">
            {/* Mute Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleAudio}
              className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition ${
                isMuted
                  ? 'bg-red-500 text-white'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? '🔇' : '🎤'}
            </motion.button>

            {/* Video Button (only for video calls) */}
            {activeCall.callType === 'video' && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleVideo}
                className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition ${
                  !isVideoEnabled
                    ? 'bg-red-500 text-white'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
                title={isVideoEnabled ? 'Stop video' : 'Start video'}
              >
                {isVideoEnabled ? '📹' : '📹‍🚫'}
              </motion.button>
            )}

            {/* End Call Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={endCall}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white text-2xl flex items-center justify-center transition"
              title="End call"
            >
              ☎️
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return null;
};

export default CallModal;
