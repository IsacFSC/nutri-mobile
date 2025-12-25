import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, Text, ActivityIndicator, BackHandler, Animated } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { webrtcService } from '@/src/services/webrtc.service';
import { VideoCallService } from '@/src/services/videoCall.service';
import soundService from '@/src/services/sound.service';
import { useAuthStore } from '@/src/store/authStore';
import { Colors, Spacing } from '@/src/constants';
import api from '@/src/config/api';

// Importação dinâmica para detectar se WebRTC está disponível
let MediaStream: any;
let RTCView: any;
let webrtcAvailable = false;

try {
  const webrtc = require('react-native-webrtc');
  MediaStream = webrtc.MediaStream;
  RTCView = webrtc.RTCView;
  webrtcAvailable = true;
} catch (error) {
  console.warn('[WebRTC] Native module not available - requires native build');
  webrtcAvailable = false;
}

type CallStatus = 'connecting' | 'ringing' | 'connected' | 'ended';

export default function WebRTCVideoCallScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { user, token } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [callStatus, setCallStatus] = useState<CallStatus>('connecting');
  const [localStream, setLocalStream] = useState<any | null>(null);
  const [remoteStream, setRemoteStream] = useState<any | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [videoCall, setVideoCall] = useState<any>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [otherUserName, setOtherUserName] = useState('');
  
  const isInitialized = useRef(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const callStartTime = useRef<Date | null>(null);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);

  // Animação de pulso para estado de "tocando"
  useEffect(() => {
    if (callStatus === 'ringing') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [callStatus]);

  // Timer de duração da chamada
  useEffect(() => {
    if (callStatus === 'connected' && !callStartTime.current) {
      callStartTime.current = new Date();
      durationInterval.current = setInterval(() => {
        if (callStartTime.current) {
          const seconds = Math.floor((new Date().getTime() - callStartTime.current.getTime()) / 1000);
          setCallDuration(seconds);
        }
      }, 1000);
    }
    
    return () => {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
  }, [callStatus]);

  useEffect(() => {
    if (!webrtcAvailable) {
      Alert.alert(
        'Módulo Nativo Necessário',
        'A videochamada WebRTC requer módulos nativos e não funciona com Expo Go.\n\nExecute: npx expo run:android',
        [{ text: 'Voltar', onPress: () => router.back() }]
      );
      return;
    }

    if (!isInitialized.current) {
      isInitialized.current = true;
      initVideoCall();
    }

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleEndCall();
      return true;
    });

    return () => {
      backHandler.remove();
      cleanup();
    };
  }, []);

  // Detectar quando o outro usuário atende
  useEffect(() => {
    if (remoteStream && callStatus !== 'connected') {
      console.log('[WebRTC] 🎉 Chamada conectada - outro usuário atendeu!');
      setCallStatus('connected');
      // Iniciar contagem de duração
      if (!callStartTime.current) {
        callStartTime.current = new Date();
      }
    }
  }, [remoteStream, callStatus]);

  // Gerenciar sons baseado no status da chamada
  useEffect(() => {
    const initSound = async () => {
      await soundService.initialize();
    };
    initSound();

    return () => {
      soundService.cleanup();
    };
  }, []);

  useEffect(() => {
    if (callStatus === 'ringing') {
      // Tocar som de chamada saindo
      console.log('[WebRTC] Tocando som de chamada saindo...');
      soundService.playOutgoingCallSound();
    } else if (callStatus === 'connected') {
      // Parar sons quando conectar
      console.log('[WebRTC] Parando sons - chamada conectada');
      soundService.stopAllSounds();
    } else if (callStatus === 'ended') {
      // Parar todos os sons
      soundService.stopAllSounds();
    }

    return () => {
      if (callStatus === 'ringing') {
        soundService.stopOutgoingCallSound();
      }
    };
  }, [callStatus]);

  const initVideoCall = async () => {
    try {
      console.log('[WebRTC Screen] Initializing video call...');
      setLoading(true);
      setCallStatus('connecting');

      if (!conversationId || !user || !token) {
        throw new Error('Dados faltando');
      }

      console.log('[WebRTC] Buscando dados da conversa...');
      // Buscar nome do outro usuário da conversa
      try {
        const conversationResponse = await api.get(`/conversations/${conversationId}`);
        const conversationData = conversationResponse.data;
        console.log('[WebRTC] Dados da conversa recebidos');
        const otherUser = user.role === 'NUTRITIONIST' 
          ? conversationData.patient?.user 
          : conversationData.nutritionist?.user;
        setOtherUserName(otherUser?.name || 'Usuário');
      } catch (error) {
        console.error('[WebRTC] Erro ao buscar nome do usuário:', error);
        setOtherUserName('Usuário');
      }

      console.log('[WebRTC] Verificando chamada ativa...');
      // Verificar ou criar chamada
      let callResponse = await VideoCallService.getActiveVideoCall(conversationId);
      let call = callResponse?.videoCall;
      
      const isInitiator = !call;
      
      if (!call) {
        console.log('[WebRTC] Criando nova chamada...');
        const createResponse = await VideoCallService.startVideoCall(conversationId);
        call = createResponse.videoCall;
        console.log('[WebRTC] 📞 Nova chamada criada, ID:', call.id);
        setCallStatus('ringing');
      } else {
        console.log('[WebRTC] Entrando em chamada existente, ID:', call.id);
        const joinResponse = await VideoCallService.joinVideoCall(call.id);
        call = joinResponse.videoCall;
        console.log('[WebRTC] 📲 Entrou na chamada - STATUS AGORA É ACTIVE');
        setCallStatus('connecting');
      }

      setVideoCall(call);

      console.log('[WebRTC] Conectando ao servidor WebRTC...');
      // Conectar ao servidor e iniciar WebRTC
      await webrtcService.connect(token);
      
      // Configurar callbacks para eventos de chamada
      webrtcService.setOnCallAccepted(() => {
        console.log('[WebRTC] 🎉 CALLBACK: Chamada aceita pelo outro usuário!');
        setCallStatus('connected');
      });
      
      webrtcService.setOnCallRejected(() => {
        console.log('[WebRTC] ❌ CALLBACK: Chamada rejeitada pelo outro usuário');
        Alert.alert(
          'Chamada Rejeitada',
          'O outro usuário rejeitou a chamada.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      });

      webrtcService.setOnCallEnded(() => {
        console.log('[WebRTC] 📴 CALLBACK: Chamada encerrada pelo outro usuário');
        
        // Limpar apenas localmente, SEM enviar outro evento call-ended
        if (videoCall) {
          VideoCallService.endVideoCall(videoCall.id).catch(console.error);
        }
        
        // Limpar conexão local sem notificar novamente
        if (localStream) {
          localStream.getTracks().forEach((track: any) => track.stop());
          setLocalStream(null);
        }
        if (remoteStream) {
          setRemoteStream(null);
        }
        
        // Mudar status e mostrar alert
        setCallStatus('ended');
        
        // Usar setTimeout para garantir que o estado seja atualizado antes do alert
        setTimeout(() => {
          Alert.alert(
            'Chamada Encerrada',
            'O outro usuário encerrou a chamada.',
            [{ 
              text: 'OK', 
              onPress: () => {
                webrtcService.disconnect();
                router.back();
              }
            }],
            { cancelable: false }
          );
        }, 100);
      });
      
      console.log('[WebRTC] Iniciando streams...');
      await webrtcService.startCall(
        conversationId,
        user.id,
        (stream) => {
          console.log('[WebRTC] 📹 Stream local iniciado');
          setLocalStream(stream);
          setLoading(false);
          
          // Se não é o iniciador (está aceitando), notificar
          if (!isInitiator) {
            console.log('[WebRTC] 📢 Notificando que aceitei a chamada');
            webrtcService.notifyCallAccepted();
          }
        },
        (stream) => {
          console.log('[WebRTC] 🎥 Stream remoto conectado - CHAMADA ATENDIDA!');
          setRemoteStream(stream);
          setCallStatus('connected');
        }
      );

    } catch (error: any) {
      console.error('[WebRTC Screen] Failed to initialize:', error);
      console.error('[WebRTC Screen] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      Alert.alert(
        'Erro ao Iniciar',
        error.message || 'Não foi possível iniciar a videochamada',
        [{ text: 'OK', onPress: () => router.back() }]
      );
      setLoading(false);
    }
  };

  const handleToggleMute = () => {
    const muted = webrtcService.toggleMute();
    setIsMuted(muted);
  };

  const handleToggleCamera = () => {
    const cameraOff = webrtcService.toggleCamera();
    setIsCameraOff(cameraOff);
  };

  const handleSwitchCamera = () => {
    webrtcService.switchCamera();
  };

  const handleEndCall = () => {
    endCall();
  };

  const endCall = async () => {
    try {
      console.log('[WebRTC] 📴 Encerrando chamada...');
      setCallStatus('ended');
      
      if (videoCall) {
        try {
          await VideoCallService.endVideoCall(videoCall.id);
        } catch (error) {
          console.error('[WebRTC] Erro ao encerrar no servidor:', error);
        }
      }
      
      webrtcService.endCall();
      
      // Aguardar um pouco antes de voltar
      setTimeout(() => {
        router.back();
      }, 500);
    } catch (error) {
      console.error('[WebRTC] Erro ao encerrar:', error);
      router.back();
    }
  };

  const cleanup = () => {
    try {
      // Limpar callbacks
      webrtcService.setOnCallAccepted(() => {});
      webrtcService.setOnCallRejected(() => {});
      webrtcService.setOnCallEnded(() => {});
      
      webrtcService.disconnect();
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    } catch (error) {
      console.error('[WebRTC] Erro durante cleanup:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Conectando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Vídeo remoto ou estado de espera */}
      {remoteStream ? (
        <RTCView
          streamURL={remoteStream.toURL()}
          style={styles.remoteVideo}
          objectFit="cover"
          mirror={false}
        />
      ) : (
        <View style={styles.waitingContainer}>
          {callStatus === 'ringing' && (
            <>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={80} color="#fff" />
                </View>
              </Animated.View>
              <Text style={styles.callingText}>Chamando...</Text>
              <Text style={styles.nameText}>{otherUserName}</Text>
              <ActivityIndicator size="large" color="#fff" style={{ marginTop: 20 }} />
            </>
          )}
          {callStatus === 'connecting' && (
            <>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.waitingText}>Conectando com {otherUserName}...</Text>
            </>
          )}
          {callStatus === 'ended' && (
            <>
              <Ionicons name="call-outline" size={80} color="#fff" />
              <Text style={styles.waitingText}>Chamada Encerrada</Text>
            </>
          )}
        </View>
      )}

      {/* Vídeo local (miniatura) */}
      {localStream && (
        <View style={styles.localVideoContainer}>
          {!isCameraOff ? (
            <RTCView
              streamURL={localStream.toURL()}
              style={styles.localVideo}
              objectFit="cover"
              mirror={true}
            />
          ) : (
            <View style={[styles.localVideo, styles.cameraOffView]}>
              <Ionicons name="videocam-off" size={32} color="#fff" />
            </View>
          )}
        </View>
      )}

      {/* Header com status e duração */}
      <View style={styles.header}>
        {callStatus === 'connected' ? (
          <View style={styles.headerContent}>
            <View style={styles.connectedIndicator} />
            <Text style={styles.headerText}>{formatDuration(callDuration)}</Text>
          </View>
        ) : (
          <Text style={styles.headerText}>
            {callStatus === 'ringing' ? 'Chamando...' : 'Conectando...'}
          </Text>
        )}
      </View>

      {/* Controles */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, isMuted && styles.controlButtonActive]}
          onPress={handleToggleMute}
        >
          <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={28} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.endCallButton]}
          onPress={handleEndCall}
        >
          <Ionicons name="call" size={32} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, isCameraOff && styles.controlButtonActive]}
          onPress={handleToggleCamera}
        >
          <Ionicons name={isCameraOff ? 'videocam-off' : 'videocam'} size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Botão de trocar câmera (canto inferior esquerdo) */}
      <TouchableOpacity style={styles.switchCameraButton} onPress={handleSwitchCamera}>
        <Ionicons name="camera-reverse" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: Spacing.lg,
  },
  remoteVideo: {
    flex: 1,
    backgroundColor: '#000',
  },
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  callingText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  nameText: {
    color: '#aaa',
    fontSize: 18,
  },
  waitingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: Spacing.lg,
  },
  localVideoContainer: {
    position: 'absolute',
    top: 80,
    right: 16,
    width: 100,
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  localVideo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  cameraOffView: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connectedIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  headerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonActive: {
    backgroundColor: 'rgba(244, 67, 54, 0.8)',
  },
  endCallButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F44336',
    transform: [{ rotate: '135deg' }],
  },
  switchCameraButton: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
