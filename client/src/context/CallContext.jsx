import React, { createContext, useState, useCallback, useRef, useEffect } from 'react';

export const CallContext = createContext();

export const CallProvider = ({ children }) => {
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [remoteStream, setRemoteStream] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [iceCandidates, setIceCandidates] = useState([]);

  const peerConnectionRef = useRef(null);
  const callTimerRef = useRef(null);
  const socket = useRef(null);

  // Get WebRTC configuration
  const getIceServers = () => ({
    iceServers: [
      { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
    ],
  });

  // Initialize peer connection
  const initializePeerConnection = useCallback(async () => {
    try {
      const peerConnection = new RTCPeerConnection({
        iceServers: getIceServers().iceServers,
      });

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && socket.current) {
          socket.current.emit('send_ice_candidate', {
            to: activeCall?.recipientId || incomingCall?.callerId,
            candidate: event.candidate,
          });
        }
      };

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };

      // Handle connection state
      peerConnection.onconnectionstatechange = () => {
        if (
          peerConnection.connectionState === 'failed' ||
          peerConnection.connectionState === 'disconnected'
        ) {
          endCall();
        }
      };

      peerConnectionRef.current = peerConnection;
      return peerConnection;
    } catch (error) {
      console.error('Error initializing peer connection:', error);
      return null;
    }
  }, [activeCall, incomingCall]);

  // Get local media stream
  const getLocalStream = useCallback(async (callType = 'audio') => {
    try {
      const constraints = {
        audio: true,
        video: callType === 'video',
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      alert('Please allow microphone/camera access');
      return null;
    }
  }, []);

  // Start call
  const startCall = useCallback(async (recipientId, callType = 'audio') => {
    try {
      const stream = await getLocalStream(callType);
      if (!stream) return;

      const peerConnection = await initializePeerConnection();
      if (!peerConnection) return;

      // Add local stream tracks
      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream);
      });

      // Create and send offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      if (socket.current) {
        socket.current.emit('initiate_call', {
          callerId: localStorage.getItem('userId'),
          recipientId,
          callType,
        });

        // Send offer after a short delay to ensure recipient is listening
        setTimeout(() => {
          socket.current.emit('send_offer', {
            to: recipientId,
            offer: offer.sdp,
          });
        }, 500);
      }

      setActiveCall({
        callId: `${Date.now()}`,
        callerId: localStorage.getItem('userId'),
        recipientId,
        callType,
        status: 'ringing',
      });

      // Start call timer
      startCallTimer();
    } catch (error) {
      console.error('Error starting call:', error);
    }
  }, [getLocalStream, initializePeerConnection]);

  // Accept call
  const acceptCall = useCallback(async () => {
    try {
      const stream = await getLocalStream(incomingCall?.callType || 'audio');
      if (!stream) return;

      const peerConnection = await initializePeerConnection();
      if (!peerConnection) return;

      // Add local stream tracks
      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream);
      });

      // Emit acceptance
      if (socket.current) {
        socket.current.emit('accept_call', {
          callId: incomingCall?.callId,
          callerId: incomingCall?.callerId,
          recipientId: localStorage.getItem('userId'),
        });
      }

      setActiveCall({
        callId: incomingCall?.callId,
        callerId: incomingCall?.callerId,
        recipientId: localStorage.getItem('userId'),
        callType: incomingCall?.callType,
        status: 'active',
      });

      setIncomingCall(null);
      startCallTimer();
    } catch (error) {
      console.error('Error accepting call:', error);
    }
  }, [incomingCall, getLocalStream, initializePeerConnection]);

  // Decline call
  const declineCall = useCallback(() => {
    if (socket.current && incomingCall) {
      socket.current.emit('decline_call', {
        callId: incomingCall?.callId,
        callerId: incomingCall?.callerId,
        recipientId: localStorage.getItem('userId'),
      });
    }
    setIncomingCall(null);
  }, [incomingCall]);

  // End call
  const endCall = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => track.stop());
      setRemoteStream(null);
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }

    if (socket.current && activeCall) {
      socket.current.emit('end_call', {
        callId: activeCall?.callId,
        callerId: activeCall?.callerId,
        recipientId: activeCall?.recipientId,
        duration: callDuration,
      });
    }

    setActiveCall(null);
    setCallDuration(0);
    setIsMuted(false);
    setIsVideoEnabled(true);
  }, [localStream, remoteStream, activeCall, callDuration]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  }, [localStream, isMuted]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  }, [localStream, isVideoEnabled]);

  // Start call timer
  const startCallTimer = useCallback(() => {
    if (callTimerRef.current) clearInterval(callTimerRef.current);

    callTimerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [localStream]);

  const value = {
    incomingCall,
    setIncomingCall,
    activeCall,
    setActiveCall,
    callDuration,
    isMuted,
    isVideoEnabled,
    remoteStream,
    localStream,
    startCall,
    acceptCall,
    declineCall,
    endCall,
    toggleAudio,
    toggleVideo,
    peerConnectionRef,
    setSocket: (s) => (socket.current = s),
    socket: socket.current,
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};
