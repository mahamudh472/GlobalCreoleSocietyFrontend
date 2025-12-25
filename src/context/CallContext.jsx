import { createContext, useContext, useState, useEffect, useRef } from 'react';
import webrtcService from '../services/webrtcService';
import { WS_ENDPOINTS } from '../config/apiConfig';
import { useCurrentUser } from '../hooks/queries/useUser';

const CallContext = createContext();

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within CallProvider');
  }
  return context;
};

export const CallProvider = ({ children }) => {
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [callStatus, setCallStatus] = useState(null); // 'calling', 'ringing', 'connected', 'ended'
  const callStatusRef = useRef(null); // Ref to access status inside callbacks

  // Keep ref in sync
  useEffect(() => {
    callStatusRef.current = callStatus;
  }, [callStatus]);

  const [callError, setCallError] = useState(null); // Error message for UI display
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const callSocketRef = useRef(null);
  const globalCallSocketRef = useRef(null);

  /**
   * Check if media devices are supported before initiating/accepting calls
   */
  const checkMediaSupport = () => {
    if (!webrtcService.isMediaDevicesSupported()) {
      const errorMessage = !window.isSecureContext &&
        window.location.protocol !== 'https:' &&
        window.location.hostname !== 'localhost'
        ? 'Calls require a secure connection (HTTPS). Please access the application over HTTPS.'
        : 'Your browser does not support audio/video calls. Please use a modern browser like Chrome, Firefox, Safari, or Edge.';

      const error = new Error(errorMessage);
      error.userMessage = errorMessage;
      setCallError(errorMessage);
      setCallStatus('failed');
      throw error;
    }
    return true;
  };

  /**
   * Clear call error
   */
  const clearCallError = () => {
    setCallError(null);
  };

  /**
   * Initialize global call listener for receiving calls anywhere in the app
   */
  const initializeGlobalCallListener = (userId, token) => {
    if (globalCallSocketRef.current) {
      console.log('[CallContext] Global call listener already initialized');
      return;
    }

    // Connect to global call WebSocket
    const wsUrl = `${WS_ENDPOINTS.CALL('global')}?token=${token}`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('[CallContext] Global call listener connected');
      globalCallSocketRef.current = socket;
    };

    socket.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      console.log('[CallContext] Global listener received:', data.type);

      if (data.type === 'incoming_call') {
        const callData = {
          ...data.call_data,
          conversation_id: data.conversation_id,
          other_user: {
            id: data.caller_id,
            name: data.caller_name
          },
          call_type: data.call_type,
          is_caller: false
        };
        setIncomingCall(callData);
        setCallStatus('incoming');
      }
    };

    socket.onerror = (error) => {
      console.error('[CallContext] Global listener error:', error);
    };

    socket.onclose = () => {
      console.log('[CallContext] Global listener disconnected');
      globalCallSocketRef.current = null;
    };
  };

  /**
   * Initiate a call
   */
  const initiateCall = async (conversationId, otherUser, callType = 'audio', token) => {
    try {
      console.log('[CallContext] Initiating call:', { conversationId, otherUser, callType });

      // Clear any previous errors
      setCallError(null);

      // Check if media devices are supported (throws if not supported)
      checkMediaSupport();

      setCallStatus('initiating');

      // Get local media stream FIRST
      const stream = await webrtcService.getLocalStream(callType === 'video');
      setLocalStream(stream);
      console.log('[CallContext] Local stream obtained');

      // Set up WebRTC callbacks BEFORE initializing socket and creating peer connection
      // This ensures callbacks are ready before any events can fire
      webrtcService.onRemoteStream((remoteStream) => {
        console.log('[CallContext] Remote stream received, setting state');
        setRemoteStream(remoteStream);
        setCallStatus('connected');
      });

      webrtcService.onCallEnd((reason) => {
        console.log('[CallContext] Call ended:', reason);
        handleCallEnd();
      });

      // Initialize call WebSocket
      await webrtcService.initializeCallSocket(conversationId, token);

      // Use single callback for signaling messages
      webrtcService.onSignalingMessage(async (data) => {
        console.log('[CallContext] Received:', data.type, data);

        if (data.type === 'connection_established') {
          console.log('[CallContext] WebSocket connected for call');
        } else if (data.type === 'call_initiated') {
          // Store call data but DON'T create offer yet
          // Wait for receiver to accept first
          const callData = {
            ...data.call_data,
            conversation_id: conversationId,
            other_user: otherUser,
            call_type: callType,
            is_caller: true
          };
          setActiveCall(callData);
          setCallStatus('ringing');

          console.log('[CallContext] Call initiated, waiting for acceptance...');
        } else if (data.type === 'incoming_call') {
          // Handle incoming call from another user
          console.log('[CallContext] Incoming call:', data);
          const callData = {
            ...data.call_data,
            conversation_id: data.conversation_id,
            other_user: {
              id: data.caller_id,
              name: data.caller_name
            },
            call_type: data.call_type,
            is_caller: false
          };
          setActiveCall(callData);
          setCallStatus('incoming');

          // Get local media stream for the incoming call
          const incomingStream = await webrtcService.getLocalStream(data.call_type === 'video');
          setLocalStream(incomingStream);

          // Create peer connection (callbacks already registered)
          webrtcService.createPeerConnection();
        } else if (data.type === 'call_accepted') {
          console.log('[CallContext] Call accepted by receiver');
          setCallStatus('connecting');

          // Now create peer connection and send offer (receiver is ready now)
          // Callbacks are already registered above
          webrtcService.createPeerConnection();
          await webrtcService.createOffer(otherUser.id);
        } else if (data.type === 'call_rejected') {
          console.log('[CallContext] Call rejected');
          handleCallEnd();
        } else if (data.type === 'webrtc_offer' || data.type === 'webrtc_answer' || data.type === 'webrtc_ice_candidate') {
          // Handle WebRTC signaling
          await webrtcService.handleSignalingMessage(data);
        } else if (data.type === 'call_ended') {
          console.log('[CallContext] Call ended by other party');
          handleCallEnd();
        }
      });

      // Send call initiate request
      webrtcService.callSocket.send(JSON.stringify({
        type: 'call_initiate',
        call_type: callType,
        receiver_id: otherUser.id
      }));

    } catch (error) {
      console.error('[CallContext] Error initiating call:', error);
      setCallStatus('failed');
      setCallError(error.userMessage || error.message || 'Failed to initiate call');
      cleanupCall();
      throw error; // Re-throw to allow callers to handle navigation
    }
  };

  /**
   * Accept incoming call
   */
  const acceptCall = async () => {
    try {
      if (!incomingCall) {
        console.error('[CallContext] No incoming call to accept');
        return;
      }

      console.log('[CallContext] Accepting call:', incomingCall.id);

      // Clear any previous errors
      setCallError(null);

      // Check if media devices are supported (throws if not supported)
      try {
        checkMediaSupport();
      } catch (error) {
        rejectCall();
        throw error;
      }

      setCallStatus('accepting');

      // Get local media stream FIRST
      const stream = await webrtcService.getLocalStream(incomingCall.call_type === 'video');
      setLocalStream(stream);
      console.log('[CallContext] Local stream obtained for accepting call');

      // Set up WebRTC callbacks BEFORE initializing socket and creating peer connection
      // This is critical - callbacks must be ready before ontrack fires
      webrtcService.onRemoteStream((remoteStream) => {
        console.log('[CallContext] Remote stream received in acceptCall');
        setRemoteStream(remoteStream);
        setCallStatus('connected');
      });

      webrtcService.onCallEnd((reason) => {
        console.log('[CallContext] Call ended:', reason);
        handleCallEnd();
      });

      // Initialize call WebSocket
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error('[CallContext] No access token found');
        throw new Error('Authentication token not found');
      }

      // Use conversation_id from the call data
      const conversationId = incomingCall.conversation_id || incomingCall.conversation;
      console.log('[CallContext] Connecting to conversation:', conversationId);
      await webrtcService.initializeCallSocket(conversationId, token);

      // Create peer connection AFTER callbacks are set but BEFORE signaling begins
      webrtcService.createPeerConnection();
      console.log('[CallContext] Peer connection created, ready to receive offer');

      // Use single callback for signaling messages
      webrtcService.onSignalingMessage(async (data) => {
        console.log('[CallContext] Receiver got message:', data.type);

        // Handle call-specific messages
        if (data.type === 'connection_established') {
          console.log('[CallContext] WebSocket connected for call');
        } else if (data.type === 'call_accepted') {
          // This message is for the caller, receiver doesn't need to handle it
          console.log('[CallContext] Call accepted (ignored by receiver)');
        } else if (data.type === 'call_rejected') {
          console.log('[CallContext] Call was rejected');
          handleCallEnd();
        } else if (data.type === 'call_ended') {
          console.log('[CallContext] Call ended by other party');
          handleCallEnd();
        } else if (data.type === 'webrtc_offer' || data.type === 'webrtc_answer' || data.type === 'webrtc_ice_candidate') {
          // Handle WebRTC signaling messages
          await webrtcService.handleSignalingMessage(data);
        }
      });

      // Send accept message AFTER everything is set up
      webrtcService.callSocket.send(JSON.stringify({
        type: 'call_accept',
        call_id: incomingCall.id
      }));
      console.log('[CallContext] Sent call_accept message');

      // Move incoming call to active call
      setActiveCall(incomingCall);
      setIncomingCall(null);
      setCallStatus('connecting');

    } catch (error) {
      console.error('[CallContext] Error accepting call:', error);
      setCallError(error.userMessage || error.message || 'Failed to accept call');
      setCallStatus('failed');
      rejectCall();
    }
  };

  /**
   * Reject incoming call
   */
  const rejectCall = () => {
    if (!incomingCall) {
      console.error('[CallContext] No incoming call to reject');
      return;
    }

    console.log('[CallContext] Rejecting call:', incomingCall.id);

    // Send reject message if socket is available
    if (webrtcService.callSocket && webrtcService.callSocket.readyState === WebSocket.OPEN) {
      webrtcService.callSocket.send(JSON.stringify({
        type: 'call_reject',
        call_id: incomingCall.id
      }));
    }

    setIncomingCall(null);
    cleanupCall();
  };

  /**
   * End active call
   * @param {boolean} isManual - Must be true to end call (prevents automatic teardown)
   */
  const endCall = (isManual = false) => {
    if (!activeCall) {
      console.error('[CallContext] No active call to end');
      return;
    }

    if (!isManual) {
      console.warn('[CallContext] Blocked automatic endCall attempt. Call end must be user-initiated.');
      console.trace('[CallContext] Automatic endCall trace:');
      return;
    }

    console.log('[CallContext] Ending call:', activeCall.id);

    // Send end message
    if (webrtcService.callSocket && webrtcService.callSocket.readyState === WebSocket.OPEN) {
      webrtcService.callSocket.send(JSON.stringify({
        type: 'call_end',
        call_id: activeCall.id
      }));
    }

    handleCallEnd();
  };

  /**
   * Handle call end (cleanup)
   */
  const handleCallEnd = () => {
    setActiveCall(null);
    setCallStatus('ended');
    cleanupCall();

    // Reset status after a delay
    setTimeout(() => {
      setCallStatus(null);
    }, 2000);
  };

  /**
   * Cleanup call resources
   */
  const cleanupCall = () => {
    console.log('[CallContext] Cleaning up call resources');

    webrtcService.cleanup();
    setLocalStream(null);
    setRemoteStream(null);
  };

  /**
   * Toggle microphone
   */
  const toggleMicrophone = () => {
    return webrtcService.toggleMicrophone();
  };

  /**
   * Toggle camera
   */
  const toggleCamera = () => {
    return webrtcService.toggleCamera();
  };

  /**
   * Handle incoming call notification
   * This would be called when receiving a call through WebSocket
   */
  const handleIncomingCall = (callData) => {
    console.log('[CallContext] Incoming call:', callData);
    setIncomingCall(callData);
    setCallStatus('incoming');
  };

  // Use React Query to get current user - this will update when auth changes
  const { data: currentUser } = useCurrentUser();

  // Initialize global call listener when user changes (login/logout/switch account)
  useEffect(() => {
    // Always close existing connection first when user changes
    if (globalCallSocketRef.current) {
      console.log('[CallContext] Closing existing global call listener due to user change');
      globalCallSocketRef.current.close();
      globalCallSocketRef.current = null;
    }

    const token = localStorage.getItem('access_token');

    if (token && currentUser?.id) {
      console.log('[CallContext] Initializing global call listener for user:', currentUser.id);
      initializeGlobalCallListener(currentUser.id, token);
    }

    // Cleanup on unmount or user change
    return () => {
      if (globalCallSocketRef.current) {
        globalCallSocketRef.current.close();
        globalCallSocketRef.current = null;
      }
    };
  }, [currentUser?.id]); // Re-run when user ID changes

  const value = {
    incomingCall,
    activeCall,
    callStatus,
    callError,
    localStream,
    remoteStream,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMicrophone,
    toggleCamera,
    handleIncomingCall,
    initializeGlobalCallListener,
    clearCallError,
    checkMediaSupport,
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};
