/**
 * WebRTC Service for handling audio/video calls
 * Manages peer connections, media streams, and signaling
 */

import { WS_ENDPOINTS } from '../config/apiConfig';

// ICE servers for NAT traversal
// Using multiple STUN servers and free TURN servers for better connectivity
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    // OpenRelay TURN servers (free, for development/testing)
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ],
  iceCandidatePoolSize: 10
};

class WebRTCService {
  constructor() {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.callSocket = null;
    this.onRemoteStreamCallback = null;
    this.onCallEndCallback = null;
    this.onSignalingMessageCallback = null; // New callback for forwarding messages
    this.pendingIceCandidates = [];
    this.targetUserId = null; // Store the target user ID for signaling
    this.isCallbackRegistered = false; // Track if callbacks are registered
  }

  /**
   * Initialize WebSocket connection for call signaling
   */
  initializeCallSocket(conversationId, token) {
    return new Promise((resolve, reject) => {
      const wsUrl = `${WS_ENDPOINTS.CALL(conversationId)}?token=${token}`;
      console.log('[WebRTC] Connecting to WebSocket:', wsUrl);
      this.callSocket = new WebSocket(wsUrl);

      this.callSocket.onopen = () => {
        console.log('[WebRTC] Call signaling socket connected');
        resolve();
      };

      this.callSocket.onerror = (error) => {
        console.error('[WebRTC] Socket error:', error);
        reject(error);
      };

      this.callSocket.onclose = (event) => {
        console.log('[WebRTC] Socket closed:', event.code, event.reason);
      };

      // Single message handler that forwards to callbacks
      this.callSocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('[WebRTC] Raw message received:', data.type);
        
        // Forward to external callback first (CallContext)
        if (this.onSignalingMessageCallback) {
          this.onSignalingMessageCallback(data);
        }
      };
    });
  }

  /**
   * Set callback for signaling messages (used by CallContext)
   */
  onSignalingMessage(callback) {
    this.onSignalingMessageCallback = callback;
  }

  /**
   * Handle incoming signaling messages
   */
  async handleSignalingMessage(data) {
    console.log('[WebRTC] Received signaling message:', data.type, data);

    switch (data.type) {
      case 'webrtc_offer':
        await this.handleOffer(data.signal_data, data.from_user_id || data.sender_id);
        break;
      case 'webrtc_answer':
        await this.handleAnswer(data.signal_data);
        break;
      case 'webrtc_ice_candidate':
        await this.handleIceCandidate(data.signal_data);
        break;
      case 'call_ended':
        this.handleCallEnded();
        break;
      case 'call_rejected':
        this.handleCallRejected();
        break;
      case 'error':
        console.error('[WebRTC] Error from backend:', data.message);
        break;
      default:
        console.log('[WebRTC] Unhandled message type:', data.type);
    }
  }

  /**
   * Check if media devices are available
   */
  isMediaDevicesSupported() {
    // Check if we're in a secure context (HTTPS or localhost)
    const isSecureContext = window.isSecureContext || 
      window.location.protocol === 'https:' || 
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';
    
    // Check if mediaDevices API is available
    const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    
    console.log('[WebRTC] Secure context:', isSecureContext);
    console.log('[WebRTC] MediaDevices available:', hasMediaDevices);
    
    return hasMediaDevices;
  }

  /**
   * Get getUserMedia function with fallback for older browsers
   */
  getGetUserMedia() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      return (constraints) => navigator.mediaDevices.getUserMedia(constraints);
    }
    
    // Fallback for older browsers
    const getUserMedia = navigator.getUserMedia || 
                         navigator.webkitGetUserMedia || 
                         navigator.mozGetUserMedia ||
                         navigator.msGetUserMedia;
    
    if (getUserMedia) {
      return (constraints) => new Promise((resolve, reject) => {
        getUserMedia.call(navigator, constraints, resolve, reject);
      });
    }
    
    return null;
  }

  /**
   * Initialize local media stream (audio/video)
   */
  async getLocalStream(isVideo = false) {
    try {
      // Check if we're in a secure context
      if (!window.isSecureContext && 
          window.location.protocol !== 'https:' && 
          window.location.hostname !== 'localhost' &&
          window.location.hostname !== '127.0.0.1') {
        const error = new Error(
          'Media devices require a secure context (HTTPS). ' +
          'Please access the application over HTTPS or use localhost.'
        );
        error.name = 'InsecureContextError';
        throw error;
      }

      // Get the getUserMedia function
      const getUserMedia = this.getGetUserMedia();
      
      if (!getUserMedia) {
        const error = new Error(
          'Your browser does not support media devices. ' +
          'Please try using a modern browser like Chrome, Firefox, Safari, or Edge. ' +
          'If you are in incognito/private mode, some browsers may restrict camera and microphone access.'
        );
        error.name = 'MediaDevicesNotSupportedError';
        throw error;
      }

      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: isVideo ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } : false
      };

      console.log('[WebRTC] Requesting media with constraints:', constraints);
      this.localStream = await getUserMedia(constraints);
      console.log('[WebRTC] Local stream obtained:', this.localStream.id);
      return this.localStream;
    } catch (error) {
      console.error('[WebRTC] Error getting local stream:', error);
      
      // Provide more helpful error messages
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        error.userMessage = 'Camera/microphone access was denied. Please allow access in your browser settings and try again.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        error.userMessage = 'No camera or microphone found. Please connect a device and try again.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        error.userMessage = 'Your camera or microphone is already in use by another application.';
      } else if (error.name === 'OverconstrainedError') {
        error.userMessage = 'The requested media settings are not supported by your device.';
      } else if (error.name === 'InsecureContextError' || error.name === 'MediaDevicesNotSupportedError') {
        error.userMessage = error.message;
      } else {
        error.userMessage = 'Unable to access camera/microphone. Please check your browser permissions and try again.';
      }
      
      throw error;
    }
  }

  /**
   * Create peer connection
   * IMPORTANT: Call onRemoteStream() to register callback BEFORE calling this method
   */
  createPeerConnection() {
    if (this.peerConnection) {
      console.log('[WebRTC] Peer connection already exists');
      return this.peerConnection;
    }

    console.log('[WebRTC] Creating peer connection with ICE servers:', ICE_SERVERS);
    this.peerConnection = new RTCPeerConnection(ICE_SERVERS);
    console.log('[WebRTC] Peer connection created');

    // Add local stream tracks to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
        console.log('[WebRTC] Added track to peer connection:', track.kind, 'enabled:', track.enabled);
      });
    } else {
      console.warn('[WebRTC] No local stream available when creating peer connection!');
    }

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('[WebRTC] Sending ICE candidate:', event.candidate.type);
        this.sendSignalingMessage('webrtc_ice_candidate', event.candidate, this.targetUserId);
      } else {
        console.log('[WebRTC] ICE gathering complete');
      }
    };

    // Handle ICE gathering state changes
    this.peerConnection.onicegatheringstatechange = () => {
      console.log('[WebRTC] ICE gathering state:', this.peerConnection.iceGatheringState);
    };

    // Handle remote stream - create fresh MediaStream for React state detection
    this.peerConnection.ontrack = (event) => {
      console.log('[WebRTC] Received remote track:', event.track.kind, 'readyState:', event.track.readyState);
      console.log('[WebRTC] onRemoteStreamCallback registered:', !!this.onRemoteStreamCallback);
      
      // Always create a new MediaStream to trigger React state update
      if (!this.remoteStream) {
        this.remoteStream = new MediaStream();
        console.log('[WebRTC] Created new remote MediaStream');
      }
      
      // Check if track already exists to avoid duplicates
      const existingTrack = this.remoteStream.getTracks().find(t => t.id === event.track.id);
      if (!existingTrack) {
        this.remoteStream.addTrack(event.track);
        console.log('[WebRTC] Added track to remote stream. Track count:', this.remoteStream.getTracks().length);
      }
      
      // Create a new MediaStream reference to force React to detect the change
      const newRemoteStream = new MediaStream(this.remoteStream.getTracks());
      this.remoteStream = newRemoteStream;
      
      if (this.onRemoteStreamCallback) {
        console.log('[WebRTC] Calling onRemoteStreamCallback with new stream');
        this.onRemoteStreamCallback(newRemoteStream);
      } else {
        console.error('[WebRTC] ERROR: No onRemoteStreamCallback registered! Remote video will not display.');
      }

      // Track state changes
      event.track.onmute = () => {
        console.log('[WebRTC] Remote track muted:', event.track.kind);
      };
      event.track.onunmute = () => {
        console.log('[WebRTC] Remote track unmuted:', event.track.kind);
      };
      event.track.onended = () => {
        console.log('[WebRTC] Remote track ended:', event.track.kind);
      };
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', this.peerConnection.connectionState);
      
      if (this.peerConnection.connectionState === 'failed') {
        console.error('[WebRTC] Connection failed - may need TURN server');
        if (this.onCallEndCallback) {
          this.onCallEndCallback('connection_failed');
        }
      } else if (this.peerConnection.connectionState === 'disconnected') {
        console.warn('[WebRTC] Connection disconnected - attempting to recover');
        // Give some time to recover before ending
        setTimeout(() => {
          if (this.peerConnection && this.peerConnection.connectionState === 'disconnected') {
            console.error('[WebRTC] Connection did not recover');
            if (this.onCallEndCallback) {
              this.onCallEndCallback('connection_failed');
            }
          }
        }, 5000);
      } else if (this.peerConnection.connectionState === 'closed') {
        if (this.onCallEndCallback) {
          this.onCallEndCallback('connection_closed');
        }
      } else if (this.peerConnection.connectionState === 'connected') {
        console.log('[WebRTC] Connection established successfully!');
      }
    };

    // Handle ICE connection state changes
    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE connection state:', this.peerConnection.iceConnectionState);
      
      if (this.peerConnection.iceConnectionState === 'failed') {
        console.error('[WebRTC] ICE connection failed - retrying...');
        // Try to restart ICE
        this.peerConnection.restartIce();
      }
    };

    // Handle signaling state changes
    this.peerConnection.onsignalingstatechange = () => {
      console.log('[WebRTC] Signaling state:', this.peerConnection.signalingState);
    };

    return this.peerConnection;
  }

  /**
   * Create and send offer (caller side)
   */
  async createOffer(targetUserId) {
    try {
      // Store target user ID for subsequent signaling messages
      this.targetUserId = targetUserId;
      
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: this.localStream?.getVideoTracks().length > 0,
      });

      await this.peerConnection.setLocalDescription(offer);
      console.log('[WebRTC] Offer created and set as local description');

      this.sendSignalingMessage('webrtc_offer', offer, targetUserId);
    } catch (error) {
      console.error('[WebRTC] Error creating offer:', error);
      throw error;
    }
  }

  /**
   * Handle incoming offer (receiver side)
   */
  async handleOffer(offer, senderId) {
    try {
      // Store the sender ID as our target for responses
      this.targetUserId = senderId;
      
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      console.log('[WebRTC] Remote description set from offer');

      // Process any pending ICE candidates
      await this.processPendingIceCandidates();

      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      console.log('[WebRTC] Answer created and set as local description');

      this.sendSignalingMessage('webrtc_answer', answer, senderId);
    } catch (error) {
      console.error('[WebRTC] Error handling offer:', error);
      throw error;
    }
  }

  /**
   * Handle incoming answer (caller side)
   */
  async handleAnswer(answer) {
    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      console.log('[WebRTC] Remote description set from answer');

      // Process any pending ICE candidates
      await this.processPendingIceCandidates();
    } catch (error) {
      console.error('[WebRTC] Error handling answer:', error);
      throw error;
    }
  }

  /**
   * Handle incoming ICE candidate
   */
  async handleIceCandidate(candidate) {
    try {
      if (this.peerConnection.remoteDescription) {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('[WebRTC] ICE candidate added');
      } else {
        // Queue ICE candidates if remote description not set yet
        this.pendingIceCandidates.push(candidate);
        console.log('[WebRTC] ICE candidate queued');
      }
    } catch (error) {
      console.error('[WebRTC] Error handling ICE candidate:', error);
    }
  }

  /**
   * Process pending ICE candidates
   */
  async processPendingIceCandidates() {
    if (this.pendingIceCandidates.length > 0) {
      console.log(`[WebRTC] Processing ${this.pendingIceCandidates.length} pending ICE candidates`);
      for (const candidate of this.pendingIceCandidates) {
        try {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
          console.error('[WebRTC] Error adding pending ICE candidate:', error);
        }
      }
      this.pendingIceCandidates = [];
    }
  }

  /**
   * Send signaling message through WebSocket
   */
  sendSignalingMessage(type, signalData, targetUserId) {
    if (!this.callSocket || this.callSocket.readyState !== WebSocket.OPEN) {
      console.error('[WebRTC] Socket not connected');
      return;
    }

    const message = {
      type,
      signal_data: signalData,
      target_user_id: targetUserId
    };

    this.callSocket.send(JSON.stringify(message));
    console.log('[WebRTC] Sent signaling message:', type);
  }

  /**
   * Toggle microphone
   */
  toggleMicrophone() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        console.log('[WebRTC] Microphone:', audioTrack.enabled ? 'enabled' : 'muted');
        return audioTrack.enabled;
      }
    }
    return false;
  }

  /**
   * Toggle camera
   */
  toggleCamera() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        console.log('[WebRTC] Camera:', videoTrack.enabled ? 'enabled' : 'disabled');
        return videoTrack.enabled;
      }
    }
    return false;
  }

  /**
   * Handle call ended
   */
  handleCallEnded() {
    console.log('[WebRTC] Call ended by remote peer');
    if (this.onCallEndCallback) {
      this.onCallEndCallback('ended');
    }
  }

  /**
   * Handle call rejected
   */
  handleCallRejected() {
    console.log('[WebRTC] Call rejected by remote peer');
    if (this.onCallEndCallback) {
      this.onCallEndCallback('rejected');
    }
  }

  /**
   * Clean up resources
   */
  cleanup() {
    console.log('[WebRTC] Cleaning up resources');

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
        console.log('[WebRTC] Stopped track:', track.kind);
      });
      this.localStream = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Close WebSocket
    if (this.callSocket) {
      this.callSocket.close();
      this.callSocket = null;
    }

    this.remoteStream = null;
    this.pendingIceCandidates = [];
    this.targetUserId = null;
    this.onRemoteStreamCallback = null;
    this.onCallEndCallback = null;
    this.onSignalingMessageCallback = null;
    this.isCallbackRegistered = false;
  }

  /**
   * Set callback for remote stream
   * IMPORTANT: Call this BEFORE createPeerConnection()
   */
  onRemoteStream(callback) {
    console.log('[WebRTC] Registering onRemoteStream callback');
    this.onRemoteStreamCallback = callback;
    this.isCallbackRegistered = true;
  }

  /**
   * Set callback for call end
   */
  onCallEnd(callback) {
    this.onCallEndCallback = callback;
  }
}

export default new WebRTCService();
