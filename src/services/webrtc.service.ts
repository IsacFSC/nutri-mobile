import { io, Socket } from 'socket.io-client';
import {
  MediaStream,
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
} from 'react-native-webrtc';
import { API_URL } from '@/src/config/api';

// Types para sinalização
type RTCSessionDescriptionInit = {
  type: 'offer' | 'answer' | 'pranswer' | 'rollback';
  sdp: string;
};

type RTCIceCandidateInit = {
  candidate: string;
  sdpMid: string | null;
  sdpMLineIndex: number | null;
};

// Configuração STUN/TURN (servidores públicos gratuitos do Google)
const ICE_SERVERS = {
  iceServers: [
    // STUN servers (gratuito - Google)
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    
    // TURN servers (opcional - Xirsys gratuito para desenvolvimento)
    // Para produção, considere criar conta no Xirsys ou Twilio
    // {
    //   urls: 'turn:your-turn-server.com:3478',
    //   username: 'user',
    //   credential: 'password'
    // }
  ],
};

export class WebRTCService {
  private socket: Socket | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private roomId: string = '';
  private userId: string = '';
  private onCallAcceptedCallback: (() => void) | null = null;
  private onCallRejectedCallback: (() => void) | null = null;

  constructor() {
  }

  /**
   * Conectar ao servidor de sinalização
   */
  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(API_URL, {
          auth: { token },
          transports: ['websocket'],
        });

        this.socket.on('connect', () => {
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          console.error('[WebRTC] ❌ Connection error:', error);
          reject(error);
        });

        this.setupSocketListeners();
      } catch (error) {
        console.error('[WebRTC] Failed to connect:', error);
        reject(error);
      }
    });
  }

  /**
   * Configurar listeners do Socket.IO
   */
  private setupSocketListeners() {
    if (!this.socket) return;

    // Usuário conectado
    this.socket.on('user-connected', async (userId: string, socketId: string) => {
      // Se já temos stream local, criar oferta
      if (this.localStream) {
        await this.createOffer();
      }
    });

    // Receber oferta
    this.socket.on('offer', async (offer: RTCSessionDescriptionInit, socketId: string) => {
      await this.handleOffer(offer);
    });

    // Receber resposta
    this.socket.on('answer', async (answer: RTCSessionDescriptionInit, socketId: string) => {
      await this.handleAnswer(answer);
    });

    // Receber ICE candidate
    this.socket.on('ice-candidate', async (candidate: RTCIceCandidateInit, socketId: string) => {
      await this.handleIceCandidate(candidate);
    });

    // Usuário desconectado
    this.socket.on('user-disconnected', (socketId: string) => {
      console.log('[WebRTC] 👋 User disconnected:', socketId);
    });

    // Chamada aceita pelo outro usuário
    this.socket.on('call-accepted', (userId: string) => {
      console.log('[WebRTC] ✅ Call accepted by:', userId);
      if (this.onCallAcceptedCallback) {
        this.onCallAcceptedCallback();
      }
    });

    // Chamada rejeitada pelo outro usuário
    this.socket.on('call-rejected', (userId: string) => {
      console.log('[WebRTC] ❌ Call rejected by:', userId);
      if (this.onCallRejectedCallback) {
        this.onCallRejectedCallback();
      }
    });
  }

  /**
   * Definir callback para quando chamada é aceita
   */
  setOnCallAccepted(callback: () => void) {
    this.onCallAcceptedCallback = callback;
  }

  /**
   * Definir callback para quando chamada é rejeitada
   */
  setOnCallRejected(callback: () => void) {
    this.onCallRejectedCallback = callback;
  }

  /**
   * Notificar que a chamada foi aceita
   */
  notifyCallAccepted() {
    if (this.socket && this.roomId && this.userId) {
      console.log('[WebRTC] 📢 Notifying call accepted');
      this.socket.emit('call-accepted', this.roomId, this.userId);
    }
  }

  /**
   * Notificar que a chamada foi rejeitada
   */
  notifyCallRejected() {
    if (this.socket && this.roomId && this.userId) {
      console.log('[WebRTC] 📢 Notifying call rejected');
      this.socket.emit('call-rejected', this.roomId, this.userId);
    }
  }

  /**
   * Iniciar chamada - Obter stream local e criar peer connection
   */
  async startCall(
    roomId: string,
    userId: string,
    onLocalStream: (stream: MediaStream) => void,
    onRemoteStream: (stream: MediaStream) => void
  ): Promise<void> {
    try {
      this.roomId = roomId;
      this.userId = userId;

      // 1. Obter stream local (câmera + microfone)
      this.localStream = await this.getLocalStream();
      onLocalStream(this.localStream);

      // 2. Criar peer connection
      this.peerConnection = new RTCPeerConnection(ICE_SERVERS);
      this.setupPeerConnectionListeners(onRemoteStream);

      // 3. Adicionar tracks locais ao peer connection
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection?.addTrack(track, this.localStream!);
      });

      // 4. Entrar na sala
      this.socket?.emit('join-room', roomId, userId);
    } catch (error) {
      console.error('[WebRTC] ❌ Failed to start call:', error);
      throw error;
    }
  }

  /**
   * Obter stream local (câmera + microfone)
   */
  private async getLocalStream(): Promise<MediaStream> {
    try {
      const stream = await mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
          facingMode: 'user', // Câmera frontal
        },
        audio: true,
      });

      return stream;
    } catch (error) {
      console.error('[WebRTC] ❌ Failed to get local stream:', error);
      throw error;
    }
  }

  /**
   * Configurar listeners do RTCPeerConnection
   */
  private setupPeerConnectionListeners(onRemoteStream: (stream: MediaStream) => void) {
    if (!this.peerConnection) return;

    const pc = this.peerConnection as any; // Cast para any para usar métodos do react-native-webrtc

    // ICE candidate gerado
    // @ts-ignore - react-native-webrtc usa onicecandidate
    pc.onicecandidate = (event: any) => {
      if (event.candidate) {
        console.log('[WebRTC] 🧊 Sending ICE candidate');
        this.socket?.emit('ice-candidate', this.roomId, {
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid,
          sdpMLineIndex: event.candidate.sdpMLineIndex,
        });
      }
    };

    // Stream remoto recebido
    // @ts-ignore - react-native-webrtc usa onaddstream
    pc.onaddstream = (event: any) => {
      console.log('[WebRTC] 📹 Remote stream received');
      if (event.stream) {
        this.remoteStream = event.stream;
        onRemoteStream(this.remoteStream);
      }
    };

    // Estado da conexão ICE
    // @ts-ignore - react-native-webrtc usa oniceconnectionstatechange
    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE state:', pc.iceConnectionState);
      
      if (pc.iceConnectionState === 'connected') {
        console.log('[WebRTC] ✅ Peers connected!');
      } else if (pc.iceConnectionState === 'failed') {
        console.error('[WebRTC] ❌ Connection failed');
      }
    };
  }

  /**
   * Criar oferta (caller)
   */
  private async createOffer() {
    try {
      if (!this.peerConnection) return;

      const offer = await this.peerConnection.createOffer({
        offerToReceiveVideo: true,
        offerToReceiveAudio: true,
      });

      await this.peerConnection.setLocalDescription(offer);
      console.log('[WebRTC] 📤 Sending offer');
      this.socket?.emit('offer', this.roomId, offer);
    } catch (error) {
      console.error('[WebRTC] Failed to create offer:', error);
    }
  }

  /**
   * Lidar com oferta recebida (callee)
   */
  private async handleOffer(offer: RTCSessionDescriptionInit) {
    try {
      if (!this.peerConnection) return;

      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      console.log('[WebRTC] 📤 Sending answer');
      this.socket?.emit('answer', this.roomId, answer);
    } catch (error) {
      console.error('[WebRTC] Failed to handle offer:', error);
    }
  }

  /**
   * Lidar com resposta recebida
   */
  private async handleAnswer(answer: RTCSessionDescriptionInit) {
    try {
      if (!this.peerConnection) return;
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      console.log('[WebRTC] ✅ Answer set as remote description');
    } catch (error) {
      console.error('[WebRTC] Failed to handle answer:', error);
    }
  }

  /**
   * Lidar com ICE candidate recebido
   */
  private async handleIceCandidate(candidate: RTCIceCandidateInit) {
    try {
      if (!this.peerConnection) return;
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      console.log('[WebRTC] ✅ ICE candidate added');
    } catch (error) {
      console.error('[WebRTC] Failed to add ICE candidate:', error);
    }
  }

  /**
   * Alternar câmera (frontal/traseira)
   */
  async switchCamera() {
    try {
      if (!this.localStream) {
        console.warn('[WebRTC] No local stream available');
        return;
      }
      
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (!videoTrack) {
        console.warn('[WebRTC] No video track available');
        return;
      }
      
      // @ts-ignore - método específico do react-native-webrtc
      videoTrack._switchCamera();
      console.log('[WebRTC] 📷 Camera switched');
    } catch (error) {
      console.error('[WebRTC] ❌ Failed to switch camera:', error);
      throw error;
    }
  }

  /**
   * Mutar/desmutar microfone
   */
  toggleMute(): boolean {
    try {
      if (!this.localStream) {
        console.warn('[WebRTC] No local stream available');
        return false;
      }
      
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (!audioTrack) {
        console.warn('[WebRTC] No audio track available');
        return false;
      }
      
      audioTrack.enabled = !audioTrack.enabled;
      console.log('[WebRTC] 🎤 Microphone:', audioTrack.enabled ? 'ON' : 'OFF');
      return !audioTrack.enabled; // Retorna true se mutado
    } catch (error) {
      console.error('[WebRTC] ❌ Failed to toggle mute:', error);
      return false;
    }
  }

  /**
   * Ligar/desligar câmera
   */
  toggleCamera(): boolean {
    try {
      if (!this.localStream) {
        console.warn('[WebRTC] No local stream available');
        return false;
      }
      
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (!videoTrack) {
        console.warn('[WebRTC] No video track available');
        return false;
      }
      
      videoTrack.enabled = !videoTrack.enabled;
      console.log('[WebRTC] 📹 Camera:', videoTrack.enabled ? 'ON' : 'OFF');
      return !videoTrack.enabled; // Retorna true se desligado
    } catch (error) {
      console.error('[WebRTC] ❌ Failed to toggle camera:', error);
      return false;
    }
  }

  /**
   * Encerrar chamada
   */
  endCall() {
    try {
      console.log('[WebRTC] 📴 Ending call');

      // Parar tracks locais
      if (this.localStream) {
        try {
          this.localStream.getTracks().forEach((track) => {
            try {
              track.stop();
            } catch (error) {
              console.error('[WebRTC] Error stopping track:', error);
            }
          });
        } catch (error) {
          console.error('[WebRTC] Error stopping local stream:', error);
        }
        this.localStream = null;
      }

      // Fechar peer connection
      if (this.peerConnection) {
        try {
          this.peerConnection.close();
        } catch (error) {
          console.error('[WebRTC] Error closing peer connection:', error);
        }
        this.peerConnection = null;
      }

      // Sair da sala
      if (this.socket && this.roomId) {
        try {
          this.socket.emit('leave-room', this.roomId);
        } catch (error) {
          console.error('[WebRTC] Error leaving room:', error);
        }
      }

      this.remoteStream = null;
      this.roomId = '';
      this.userId = '';

      console.log('[WebRTC] ✅ Call ended successfully');
    } catch (error) {
      console.error('[WebRTC] ❌ Error ending call:', error);
    }
  }

  /**
   * Desconectar completamente
   */
  disconnect() {
    try {
      this.endCall();
      
      if (this.socket) {
        try {
          this.socket.disconnect();
        } catch (error) {
          console.error('[WebRTC] Error disconnecting socket:', error);
        }
        this.socket = null;
      }
      
      console.log('[WebRTC] 🔌 Disconnected');
    } catch (error) {
      console.error('[WebRTC] ❌ Error during disconnect:', error);
    }
  }
}

// Singleton
export const webrtcService = new WebRTCService();
