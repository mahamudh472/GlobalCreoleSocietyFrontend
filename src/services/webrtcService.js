/**
 * WebRTC Service for handling audio/video calls
 * Manages peer connections, media streams, and signaling
 */

import { WS_ENDPOINTS } from '../config/apiConfig';

// ICE servers for NAT traversal
// Using multiple STUN servers and TURN servers for better connectivity
const ICE_SERVERS = {
  iceServers: [
    {
      urls: [
        "turn:turn.globalcreolesociety.com:3478?transport=udp",
        "turn:turn.globalcreolesociety.com:3478?transport=tcp"
      ],
      username: "user",
      credential: "password"
    },
    // Google STUN servers
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    // Additional public STUN servers
    { urls: 'stun:stun.stunprotocol.org:3478' },
    { urls: 'stun:stun.voip.blackberry.com:3478' }
  ],
  iceCandidatePoolSize: 10,
  iceTransportPolicy: 'all', // FORCED RELAY: Ensure usage of TURN server always
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require'
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
    this.processedIceCandidates = new Set(); // START: Deduplication set
    this.targetUserId = null; // Store the target user ID for signaling
    this.isCallbackRegistered = false; // Track if callbacks are registered
    this.pingInterval = null; // Store the ping interval ID
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

        // Start keepalive
        this.startKeepAlive();

        resolve();
      };

      this.callSocket.onerror = (error) => {
        console.error('[WebRTC] Socket error:', error);
        reject(error);
      };

      this.callSocket.onclose = (event) => {
        console.log('[WebRTC] Socket closed:', event.code, event.reason);
        this.stopKeepAlive();
      };

      // Single message handler that forwards to callbacks
      this.callSocket.onmessage = (event) => {
        // Ignore empty messages or pongs if backend sends them
        if (!event.data) return;

        try {
          const data = JSON.parse(event.data);
          console.log('[WebRTC] Raw message received:', data.type);

          // Forward to external callback first (CallContext)
          if (this.onSignalingMessageCallback) {
            this.onSignalingMessageCallback(data);
          }
        } catch (e) {
          console.error('[WebRTC] Error parsing message:', e);
        }
      };
    });
  }

  /**
   * Start sending ping messages to keep connection alive
   */
  startKeepAlive() {
    this.stopKeepAlive(); // Clear existing if any

    // Send ping every 30 seconds
    this.pingInterval = setInterval(() => {
      if (this.callSocket && this.callSocket.readyState === WebSocket.OPEN) {
        // console.log('[WebRTC] Sending keepalive ping');
        // Sending a small JSON object as ping
        this.callSocket.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
  }

  /**
   * Stop keepalive interval
   */
  stopKeepAlive() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
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

      try {
        this.localStream = await getUserMedia(constraints);
        console.log('[WebRTC] Local stream obtained:', this.localStream.id);
        return this.localStream;
      } catch (mediaError) {
        // If video was requested but device not found, try audio-only fallback
        if (isVideo && (mediaError.name === 'NotFoundError' || mediaError.name === 'DevicesNotFoundError')) {
          console.warn('[WebRTC] Video device not found, falling back to audio-only');
          const audioOnlyConstraints = {
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
            video: false
          };

          try {
            this.localStream = await getUserMedia(audioOnlyConstraints);
            console.log('[WebRTC] Audio-only stream obtained (video fallback):', this.localStream.id);
            return this.localStream;
          } catch (audioError) {
            console.error('[WebRTC] Audio-only fallback also failed:', audioError);
            throw audioError;
          }
        }
        throw mediaError;
      }
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
      console.log('[WebRTC] Peer connection already exists - reusing instance. (Preventing duplicate)');
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
        // Do NOT end the call here. Tracks can end during renegotiation or mute.
      };
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', this.peerConnection.connectionState);

      if (this.peerConnection.connectionState === 'failed') {
        console.error('[WebRTC] Connection failed - attempting ICE restart or waiting for manual end');
        // Do NOT automatically end the call. Let the user decide or ICE restart handle it.
      } else if (this.peerConnection.connectionState === 'disconnected') {
        console.warn('[WebRTC] Connection disconnected - waiting for recovery or ICE restart');
        // Do NOT automatically end the call here. ICE restart might handle it.
        // The user can manually end the call if it doesn't recover.
      } else if (this.peerConnection.connectionState === 'closed') {
        console.log('[WebRTC] Connection closed');
      } else if (this.peerConnection.connectionState === 'connected') {
        console.log('[WebRTC] Connection established successfully!');
      }
    };

    // Handle ICE connection state changes
    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE connection state:', this.peerConnection.iceConnectionState);

      if (this.peerConnection.iceConnectionState === 'failed') {
        console.error('[WebRTC] ICE connection failed - restarting ICE...');
        // Try to restart ICE
        try {
          this.peerConnection.restartIce();
          console.log('[WebRTC] ICE restart initiated');
        } catch (e) {
          console.error('[WebRTC] Failed to restart ICE:', e);
        }
      } else if (this.peerConnection.iceConnectionState === 'connected') {
        console.log('[WebRTC] ICE connected - audio/video should flow now');
        // Log connection stats for debugging
        this.logConnectionStats();
      } else if (this.peerConnection.iceConnectionState === 'completed') {
        console.log('[WebRTC] ICE completed - optimal route found');
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
      // Guard: Check if we are in a state to accept an offer
      if (this.peerConnection.signalingState !== 'stable' && this.peerConnection.signalingState !== 'have-local-offer') {
        console.warn('[WebRTC] Signal state not stable, ignoring duplicate/conflicting offer. State:', this.peerConnection.signalingState);
        return;
      }

      // If we already have a remote offer pending (glare), we might need to handle it, but for now duplicate guard:
      if (this.peerConnection.signalingState === 'have-remote-offer') {
        console.warn('[WebRTC] already have remote offer, ignoring duplicate');
        return;
      }

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
      // Don't throw, just log, so we don't crash the socket handler
    }
  }

  /**
   * Handle incoming answer (caller side)
   */
  async handleAnswer(answer) {
    try {
      // Guard: Only accept answer if we actually sent an offer
      if (this.peerConnection.signalingState === 'stable') {
        console.warn('[WebRTC] Received answer but state is already stable. Ignoring duplicate answer.');
        return;
      }

      if (this.peerConnection.signalingState !== 'have-local-offer') {
        console.warn('[WebRTC] Received answer but state is', this.peerConnection.signalingState, '- ignoring.');
        return;
      }

      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      console.log('[WebRTC] Remote description set from answer');

      // Process any pending ICE candidates
      await this.processPendingIceCandidates();
    } catch (error) {
      console.error('[WebRTC] Error handling answer:', error);
    }
  }

  /**
   * Handle incoming ICE candidate
   */
  async handleIceCandidate(candidate) {
    try {
      if (!candidate || !candidate.candidate) {
        console.warn('[WebRTC] Received invalid ICE candidate:', candidate);
        return;
      }

      // 1. Deduplication check
      if (this.processedIceCandidates.has(candidate.candidate)) {
        // console.log('[WebRTC] Ignoring duplicate ICE candidate'); 
        return;
      }
      this.processedIceCandidates.add(candidate.candidate);

      // 2. Check complete state (Prevent flooding)
      if (this.peerConnection &&
        (this.peerConnection.iceConnectionState === 'connected' ||
          this.peerConnection.iceConnectionState === 'completed')) {
        // console.log('[WebRTC] Ignoring ICE candidate - Connection already stable');
        return;
      }

      // Safe queueing: Only add if remote description is SET
      if (this.peerConnection && this.peerConnection.remoteDescription && this.peerConnection.remoteDescription.type) {
        try {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          console.log('[WebRTC] ICE candidate added. Total unique:', this.processedIceCandidates.size);
        } catch (e) {
          console.error('[WebRTC] Error adding ICE candidate:', e);
        }
      } else {
        // Queue ICE candidates if remote description not set yet
        this.pendingIceCandidates.push(candidate);
        console.log('[WebRTC] ICE candidate queued (remote description not set)');
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
      // Clone and clear queue immediately to prevent loops if errored
      const candidatesRaw = [...this.pendingIceCandidates];
      this.pendingIceCandidates = [];

      for (const candidate of candidatesRaw) {
        try {
          if (this.peerConnection && this.peerConnection.remoteDescription) {
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          }
        } catch (error) {
          console.error('[WebRTC] Error adding pending ICE candidate:', error);
        }
      }
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
   * Log connection statistics for debugging
   */
  async logConnectionStats() {
    if (!this.peerConnection) return;

    try {
      const stats = await this.peerConnection.getStats();
      stats.forEach(report => {
        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          console.log('[WebRTC] Active candidate pair:', {
            localCandidateType: report.localCandidateType,
            remoteCandidateType: report.remoteCandidateType,
            bytesSent: report.bytesSent,
            bytesReceived: report.bytesReceived
          });
        }
        if (report.type === 'local-candidate' || report.type === 'remote-candidate') {
          console.log(`[WebRTC] ${report.type}:`, {
            candidateType: report.candidateType,
            protocol: report.protocol,
            address: report.address,
            port: report.port
          });
        }
      });
    } catch (e) {
      console.error('[WebRTC] Failed to get connection stats:', e);
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

    this.stopKeepAlive();

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
