import { io, Socket } from 'socket.io-client';
import { API_URL } from '@/src/config/api';

// Importação condicional do react-native-webrtc
let MediaStream: any;
let RTCPeerConnection: any;
let RTCIceCandidate: any;
let RTCSessionDescription: any;
let mediaDevices: any;
let webrtcAvailable = false;

try {
  const webrtc = require('react-native-webrtc');
  MediaStream = webrtc.MediaStream;
  RTCPeerConnection = webrtc.RTCPeerConnection;
  RTCIceCandidate = webrtc.RTCIceCandidate;
  RTCSessionDescription = webrtc.RTCSessionDescription;
  mediaDevices = webrtc.mediaDevices;
  webrtcAvailable = true;
} catch (error) {
  console.warn('[WebRTC] Native module not available - requires native build');
  webrtcAvailable = false;
}

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
  private onCallEndedCallback: (() => void) | null = null;
  
  // Fila de ICE candidates recebidos antes do setRemoteDescription
  private pendingIceCandidates: RTCIceCandidateInit[] = [];
  private isRemoteDescriptionSet: boolean = false;
  
  // Fila de ICE candidates locais para enviar DEPOIS da troca de offer/answer
  private localIceCandidatesQueue: RTCIceCandidateInit[] = [];
  private canSendIceCandidates: boolean = false;

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
      console.log('[WebRTC] 👤 User connected:', userId, 'socketId:', socketId);
      // Se já temos stream local, criar oferta
      if (this.localStream && this.peerConnection) {
        console.log('[WebRTC] 📞 Creating offer because another user joined...');
        await this.createOffer();
      } else {
        console.log('[WebRTC] ⏳ Waiting for local stream before creating offer...');
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
      // Tratar como se a chamada tivesse sido encerrada
      if (this.onCallEndedCallback) {
        this.onCallEndedCallback();
      }
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

    // Chamada encerrada pelo outro usuário
    this.socket.on('call-ended', (userId: string) => {
      console.log('[WebRTC] 📴 Call ended by other user:', userId);
      if (this.onCallEndedCallback) {
        this.onCallEndedCallback();
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
   * Definir callback para quando chamada é encerrada pelo outro usuário
   */
  setOnCallEnded(callback: () => void) {
    this.onCallEndedCallback = callback;
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
   * Notificar que a chamada foi encerrada
   */
  notifyCallEnded() {
    if (this.socket && this.roomId && this.userId) {
      console.log('[WebRTC] 📢 Notifying call ended');
      this.socket.emit('call-ended', this.roomId, this.userId);
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
    if (!webrtcAvailable) {
      throw new Error('WebRTC não disponível. É necessário um development build.');
    }

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
        console.log('[WebRTC] Adding track to peer connection:', track.kind, 'enabled:', track.enabled);
        this.peerConnection?.addTrack(track, this.localStream!);
      });

      // 4. Entrar na sala
      this.socket?.emit('join-room', roomId, userId);

      // 5. Se já houver outro usuário na sala, criar oferta imediatamente
      // O evento user-connected vai disparar createOffer quando outro usuário entrar
      console.log('[WebRTC] Waiting for other user or ready to receive offer...');
    } catch (error) {
      console.error('[WebRTC] ❌ Failed to start call:', error);
      throw error;
    }
  }

  /**
   * Obter stream local (câmera + microfone)
   */
  private async getLocalStream(): Promise<MediaStream> {
    if (!webrtcAvailable) {
      throw new Error('WebRTC não disponível. É necessário um development build.');
    }

    try {
      const stream = await mediaDevices.getUserMedia({
        video: {
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 },
          frameRate: { min: 15, ideal: 30, max: 30 },
          facingMode: 'user', // Câmera frontal
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      console.log('[WebRTC] 📹 Local stream obtained with tracks:', stream.getTracks().map(t => `${t.kind}: ${t.enabled}`));
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

    // ICE candidate gerado - IMPORTANTE: acumular até offer/answer completos
    // @ts-ignore - react-native-webrtc usa onicecandidate
    pc.onicecandidate = (event: any) => {
      if (event.candidate) {
        console.log('[WebRTC] 🧊 ICE candidate generated');
        console.log('[WebRTC] 🧊 Candidate type:', event.candidate.type);
        
        if (!this.socket || !this.roomId) {
          console.error('[WebRTC] ❌ Cannot send ICE candidate: socket or roomId missing');
          return;
        }
        
        const candidateData = {
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid,
          sdpMLineIndex: event.candidate.sdpMLineIndex,
        };
        
        // Se já podemos enviar (offer/answer trocados), enviar imediatamente
        if (this.canSendIceCandidates) {
          console.log('[WebRTC] ✅ Sending ICE candidate immediately (negotiation complete)');
          this.socket.emit('ice-candidate', this.roomId, candidateData);
        } else {
          // Se offer/answer ainda não trocados, acumular
          console.log('[WebRTC] 📦 Queueing ICE candidate (waiting for negotiation to complete)');
          this.localIceCandidatesQueue.push(candidateData);
        }
      } else {
        // Null candidate significa que a coleta de candidates terminou
        console.log('[WebRTC] 🧊 ICE candidate gathering completed');
        
        // Se ainda temos candidates na fila, enviar todos agora
        if (this.localIceCandidatesQueue.length > 0 && this.canSendIceCandidates) {
          this.flushLocalIceCandidates();
        }
      }
    };

    // Stream remoto recebido
    // @ts-ignore - react-native-webrtc usa onaddstream
    pc.onaddstream = (event: any) => {
      console.log('[WebRTC] 📹 Remote stream received!');
      if (event.stream) {
        console.log('[WebRTC] 📹 Remote stream tracks:', event.stream.getTracks().map((t: any) => t.kind));
        this.remoteStream = event.stream;
        onRemoteStream(this.remoteStream);
      }
    };

    // Estado da conexão ICE - monitora a conectividade
    // @ts-ignore - react-native-webrtc usa oniceconnectionstatechange
    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      console.log('[WebRTC] 🔗 ICE connection state changed:', state);
      
      switch (state) {
        case 'checking':
          console.log('[WebRTC] 🔍 Checking connectivity...');
          break;
        case 'connected':
          console.log('[WebRTC] ✅ Peers connected successfully!');
          break;
        case 'completed':
          console.log('[WebRTC] ✅ ICE gathering completed!');
          break;
        case 'failed':
          console.error('[WebRTC] ❌ ICE connection failed!');
          break;
        case 'disconnected':
          console.warn('[WebRTC] ⚠️ ICE connection disconnected');
          break;
        case 'closed':
          console.log('[WebRTC] 📴 ICE connection closed');
          break;
      }
    };

    // Estado de sinalização
    // @ts-ignore
    pc.onsignalingstatechange = () => {
      console.log('[WebRTC] 📡 Signaling state:', pc.signalingState);
    };

    // Estado geral da conexão
    // @ts-ignore  
    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] 🔌 Connection state:', pc.connectionState);
    };
  }

  /**
   * Enviar todos os ICE candidates locais acumulados
   */
  private flushLocalIceCandidates() {
    if (this.localIceCandidatesQueue.length === 0) {
      return;
    }
    
    console.log(`[WebRTC] 📤 Sending ${this.localIceCandidatesQueue.length} queued local ICE candidates...`);
    
    this.localIceCandidatesQueue.forEach((candidate) => {
      if (this.socket && this.roomId) {
        this.socket.emit('ice-candidate', this.roomId, candidate);
      }
    });
    
    console.log('[WebRTC] ✅ All queued ICE candidates sent');
    this.localIceCandidatesQueue = [];
  }

  /**
   * Criar oferta (caller)
   */
  private async createOffer() {
    try {
      if (!this.peerConnection) {
        console.error('[WebRTC] ❌ Cannot create offer: no peer connection');
        return;
      }

      console.log('[WebRTC] 📝 Creating offer with offerToReceiveVideo and offerToReceiveAudio...');
      const offer = await this.peerConnection.createOffer({
        offerToReceiveVideo: true,
        offerToReceiveAudio: true,
      });

      console.log('[WebRTC] 📝 Offer created, setting as local description...');
      await this.peerConnection.setLocalDescription(offer);
      
      console.log('[WebRTC] 📤 Sending offer to room:', this.roomId);
      this.socket?.emit('offer', this.roomId, offer);
      
      // CRÍTICO: Após enviar offer, pode começar a enviar ICE candidates
      // Os candidates gerados ANTES deste ponto já foram acumulados na fila
      console.log('[WebRTC] ✅ Offer sent, now can send ICE candidates');
      this.canSendIceCandidates = true;
      
      // Enviar todos os ICE candidates que foram acumulados
      this.flushLocalIceCandidates();
    } catch (error) {
      console.error('[WebRTC] ❌ Failed to create offer:', error);
    }
  }

  /**
   * Lidar com oferta recebida (callee)
   */
  private async handleOffer(offer: RTCSessionDescriptionInit) {
    try {
      if (!this.peerConnection) {
        console.error('[WebRTC] ❌ Cannot handle offer: no peer connection');
        return;
      }

      console.log('[WebRTC] 📥 Received offer, setting as remote description...');
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      
      // Marcar que remote description foi definida
      this.isRemoteDescriptionSet = true;
      console.log('[WebRTC] ✅ Remote description set, processing pending ICE candidates...');
      
      // Adicionar ICE candidates que chegaram antes
      await this.processPendingIceCandidates();

      console.log('[WebRTC] 📝 Creating answer...');
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      console.log('[WebRTC] 📤 Sending answer to room:', this.roomId);
      this.socket?.emit('answer', this.roomId, answer);
      
      // CRÍTICO: Após enviar answer, pode começar a enviar ICE candidates
      console.log('[WebRTC] ✅ Answer sent, now can send ICE candidates');
      this.canSendIceCandidates = true;
      
      // Enviar todos os ICE candidates que foram acumulados
      this.flushLocalIceCandidates();
    } catch (error) {
      console.error('[WebRTC] ❌ Failed to handle offer:', error);
    }
  }

  /**
   * Lidar com resposta recebida
   */
  private async handleAnswer(answer: RTCSessionDescriptionInit) {
    try {
      if (!this.peerConnection) {
        console.error('[WebRTC] ❌ Cannot handle answer: no peer connection');
        return;
      }
      console.log('[WebRTC] 📥 Received answer, setting as remote description...');
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      
      // Marcar que remote description foi definida
      this.isRemoteDescriptionSet = true;
      console.log('[WebRTC] ✅ Answer set as remote description, processing pending ICE candidates...');
      
      // Adicionar ICE candidates que chegaram antes
      await this.processPendingIceCandidates();
      
      // CRÍTICO: Após receber answer, a negociação está completa
      // Agora podemos enviar quaisquer ICE candidates que foram acumulados
      console.log('[WebRTC] ✅ Answer received, negotiation complete, can send ICE candidates');
      this.canSendIceCandidates = true;
      
      // Enviar todos os ICE candidates que foram acumulados
      this.flushLocalIceCandidates();
      
      console.log('[WebRTC] ✅ Connection should establish soon');
    } catch (error) {
      console.error('[WebRTC] ❌ Failed to handle answer:', error);
    }
  }

  /**
   * Processar ICE candidates que estavam na fila
   */
  private async processPendingIceCandidates() {
    if (this.pendingIceCandidates.length === 0) {
      console.log('[WebRTC] No pending ICE candidates');
      return;
    }

    console.log(`[WebRTC] Processing ${this.pendingIceCandidates.length} pending ICE candidates...`);
    
    for (const candidate of this.pendingIceCandidates) {
      try {
        if (this.peerConnection) {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          console.log('[WebRTC] ✅ Pending ICE candidate added');
        }
      } catch (error) {
        console.error('[WebRTC] ❌ Failed to add pending ICE candidate:', error);
      }
    }
    
    // Limpar a fila
    this.pendingIceCandidates = [];
  }

  /**
   * Lidar com ICE candidate recebido
   */
  private async handleIceCandidate(candidate: RTCIceCandidateInit) {
    try {
      if (!this.peerConnection) {
        console.warn('[WebRTC] ⚠️ No peer connection, ignoring ICE candidate');
        return;
      }

      // Se remote description ainda não foi definida, adicionar à fila
      if (!this.isRemoteDescriptionSet) {
        console.log('[WebRTC] 📦 Queueing ICE candidate (remote description not set yet)');
        this.pendingIceCandidates.push(candidate);
        return;
      }

      // Remote description já definida, adicionar imediatamente
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      console.log('[WebRTC] ✅ ICE candidate added immediately');
    } catch (error) {
      console.error('[WebRTC] ❌ Failed to add ICE candidate:', error);
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
      console.log('[WebRTC] 📴 Ending call...');

      // PRIMEIRO: Notificar o outro usuário ANTES de destruir conexões
      if (this.socket && this.roomId && this.userId) {
        console.log('[WebRTC] 📢 Notifying other user that call ended');
        this.socket.emit('call-ended', this.roomId, this.userId);
      }

      // Parar tracks locais
      if (this.localStream) {
        try {
          this.localStream.getTracks().forEach((track) => {
            try {
              track.stop();
              console.log('[WebRTC] ⏹️ Stopped track:', track.kind);
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
          console.log('[WebRTC] 📴 Peer connection closed');
        } catch (error) {
          console.error('[WebRTC] Error closing peer connection:', error);
        }
        this.peerConnection = null;
      }

      // Sair da sala
      if (this.socket && this.roomId) {
        try {
          this.socket.emit('leave-room', this.roomId, this.userId);
          console.log('[WebRTC] 👋 Left room:', this.roomId);
        } catch (error) {
          console.error('[WebRTC] Error leaving room:', error);
        }
      }

      // Limpar estado
      this.remoteStream = null;
      this.roomId = '';
      this.userId = '';
      this.isRemoteDescriptionSet = false;
      this.pendingIceCandidates = [];
      this.canSendIceCandidates = false;
      this.localIceCandidatesQueue = [];

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
      console.log('[WebRTC] 🔌 Disconnecting...');
      
      this.endCall();
      
      if (this.socket) {
        try {
          this.socket.disconnect();
        } catch (error) {
          console.error('[WebRTC] Error disconnecting socket:', error);
        }
        this.socket = null;
      }
      
      // Reset completo do estado
      this.onCallAcceptedCallback = null;
      this.onCallRejectedCallback = null;
      this.onCallEndedCallback = null;
      
      console.log('[WebRTC] 🔌 Disconnected successfully');
    } catch (error) {
      console.error('[WebRTC] ❌ Error during disconnect:', error);
    }
  }
}

// Singleton
export const webrtcService = new WebRTCService();
