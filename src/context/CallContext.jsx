import { createContext, useContext, useState, useEffect, useRef } from 'react';
import webrtcService from '../services/webrtcService';
import { WS_ENDPOINTS } from '../config/apiConfig';

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
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const callSocketRef = useRef(null);
  const globalCallSocketRef = useRef(null);
  
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
      
      setCallStatus('initiating');
      
      // Get local media stream
      const stream = await webrtcService.getLocalStream(callType === 'video');
      setLocalStream(stream);
      
      // Initialize call WebSocket
      await webrtcService.initializeCallSocket(conversationId, token);
      
      // Set up WebRTC callbacks
      webrtcService.onRemoteStream((remoteStream) => {
        console.log('[CallContext] Remote stream received');
        setRemoteStream(remoteStream);
        setCallStatus('connected');
      });
      
      webrtcService.onCallEnd((reason) => {
        console.log('[CallContext] Call ended:', reason);
        handleCallEnd();
      });
      
      // Listen for signaling messages
      webrtcService.callSocket.onmessage = async (event) => {
        const data = JSON.parse(event.data);
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
          const stream = await webrtcService.getLocalStream(data.call_type === 'video');
          setLocalStream(stream);
          
          // Create peer connection ready to receive offer
          webrtcService.createPeerConnection();
        } else if (data.type === 'call_accepted') {
          console.log('[CallContext] Call accepted by receiver');
          setCallStatus('connecting');
          
          // Now create peer connection and send offer (receiver is ready now)
          webrtcService.createPeerConnection();
          await webrtcService.createOffer(otherUser.id);
        } else if (data.type === 'call_rejected') {
          console.log('[CallContext] Call rejected');
          handleCallEnd();
        } else {
          // Handle other WebRTC signaling
          await webrtcService.handleSignalingMessage(data);
        }
      };
      
      // Send call initiate request
      webrtcService.callSocket.send(JSON.stringify({
        type: 'call_initiate',
        call_type: callType,
        receiver_id: otherUser.id
      }));
      
    } catch (error) {
      console.error('[CallContext] Error initiating call:', error);
      setCallStatus('failed');
      cleanupCall();
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
      setCallStatus('accepting');
      
      // Get local media stream
      const stream = await webrtcService.getLocalStream(incomingCall.call_type === 'video');
      setLocalStream(stream);
      
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
      
      // Set up WebRTC callbacks
      webrtcService.onRemoteStream((remoteStream) => {
        console.log('[CallContext] Remote stream received');
        setRemoteStream(remoteStream);
        setCallStatus('connected');
      });
      
      webrtcService.onCallEnd((reason) => {
        console.log('[CallContext] Call ended:', reason);
        handleCallEnd();
      });
      
      // Create peer connection
      webrtcService.createPeerConnection();
      
      // Listen for WebRTC signaling
      webrtcService.callSocket.onmessage = async (event) => {
        const data = JSON.parse(event.data);
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
        } else {
          // Handle WebRTC signaling messages
          await webrtcService.handleSignalingMessage(data);
        }
      };
      
      // Send accept message
      webrtcService.callSocket.send(JSON.stringify({
        type: 'call_accept',
        call_id: incomingCall.id
      }));
      
      // Move incoming call to active call
      setActiveCall(incomingCall);
      setIncomingCall(null);
      setCallStatus('connecting');
      
    } catch (error) {
      console.error('[CallContext] Error accepting call:', error);
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
   */
  const endCall = () => {
    if (!activeCall) {
      console.error('[CallContext] No active call to end');
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
  
  // Initialize global call listener when component mounts
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (token && user.id) {
      console.log('[CallContext] Initializing global call listener for user:', user.id);
      initializeGlobalCallListener(user.id, token);
    }
    
    // Cleanup on unmount
    return () => {
      if (globalCallSocketRef.current) {
        globalCallSocketRef.current.close();
        globalCallSocketRef.current = null;
      }
    };
  }, []);

  const value = {
    incomingCall,
    activeCall,
    callStatus,
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
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};
