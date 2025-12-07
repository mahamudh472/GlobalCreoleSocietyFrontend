/**
 * WebRTC Service for handling audio/video calls
 * Manages peer connections, media streams, and signaling
 */

// STUN servers for NAT traversal
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ]
};

class WebRTCService {
  constructor() {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.callSocket = null;
    this.onRemoteStreamCallback = null;
    this.onCallEndCallback = null;
    this.pendingIceCandidates = [];
    this.targetUserId = null; // Store the target user ID for signaling
  }

  /**
   * Initialize WebSocket connection for call signaling
   */
  initializeCallSocket(conversationId, token) {
    return new Promise((resolve, reject) => {
      const wsUrl = `ws/call/${conversationId}/?token=${token}`;
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

      this.callSocket.onmessage = (event) => {
        this.handleSignalingMessage(JSON.parse(event.data));
      };
    });
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
   * Initialize local media stream (audio/video)
   */
  async getLocalStream(isVideo = false) {
    try {
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

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('[WebRTC] Local stream obtained:', this.localStream.id);
      return this.localStream;
    } catch (error) {
      console.error('[WebRTC] Error getting local stream:', error);
      throw error;
    }
  }

  /**
   * Create peer connection
   */
  createPeerConnection() {
    if (this.peerConnection) {
      console.log('[WebRTC] Peer connection already exists');
      return this.peerConnection;
    }

    this.peerConnection = new RTCPeerConnection(ICE_SERVERS);
    console.log('[WebRTC] Peer connection created');

    // Add local stream tracks to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
        console.log('[WebRTC] Added track to peer connection:', track.kind);
      });
    }

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('[WebRTC] Sending ICE candidate');
        this.sendSignalingMessage('webrtc_ice_candidate', event.candidate, this.targetUserId);
      }
    };

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      console.log('[WebRTC] Received remote track:', event.track.kind);
      console.log('[WebRTC] onRemoteStreamCallback exists:', !!this.onRemoteStreamCallback);
      if (!this.remoteStream) {
        this.remoteStream = new MediaStream();
        console.log('[WebRTC] Created new remote MediaStream');
      }
      this.remoteStream.addTrack(event.track);
      console.log('[WebRTC] Remote stream track count:', this.remoteStream.getTracks().length);
      
      if (this.onRemoteStreamCallback) {
        console.log('[WebRTC] Calling onRemoteStreamCallback');
        this.onRemoteStreamCallback(this.remoteStream);
      } else {
        console.warn('[WebRTC] No onRemoteStreamCallback registered!');
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', this.peerConnection.connectionState);
      
      if (this.peerConnection.connectionState === 'failed' || 
          this.peerConnection.connectionState === 'disconnected' ||
          this.peerConnection.connectionState === 'closed') {
        if (this.onCallEndCallback) {
          this.onCallEndCallback('connection_failed');
        }
      }
    };

    // Handle ICE connection state changes
    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE connection state:', this.peerConnection.iceConnectionState);
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
  }

  /**
   * Set callback for remote stream
   */
  onRemoteStream(callback) {
    this.onRemoteStreamCallback = callback;
  }

  /**
   * Set callback for call end
   */
  onCallEnd(callback) {
    this.onCallEndCallback = callback;
  }
}

export default new WebRTCService();
