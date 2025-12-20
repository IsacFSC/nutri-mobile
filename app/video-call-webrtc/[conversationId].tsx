import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, Text, ActivityIndicator, BackHandler } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { webrtcService } from '@/src/services/webrtc.service';
import { VideoCallService } from '@/src/services/videoCall.service';
import { useAuthStore } from '@/src/store/authStore';
import { Colors, Spacing } from '@/src/constants';

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

export default function WebRTCVideoCallScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { user, token } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [localStream, setLocalStream] = useState<any | null>(null);
  const [remoteStream, setRemoteStream] = useState<any | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [videoCall, setVideoCall] = useState<any>(null);
  
  const isInitialized = useRef(false);

  useEffect(() => {
    // Verificar se WebRTC está disponível
    if (!webrtcAvailable) {
      Alert.alert(
        'Módulo Nativo Necessário',
        'A videochamada WebRTC requer módulos nativos e não funciona com Expo Go.\n\nExecute: npx expo run:android',
        [
          {
            text: 'Voltar',
            onPress: () => router.replace('/'),
          }
        ]
      );
      return;
    }

    if (!isInitialized.current) {
      isInitialized.current = true;
      initVideoCall();
    }

    // Impedir botão voltar do Android
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleEndCall();
      return true;
    });

    return () => {
      backHandler.remove();
      cleanup();
    };
  }, []);

  const initVideoCall = async () => {
    try {
      console.log('[WebRTC Screen] Initializing video call...');
      setLoading(true);
      setConnecting(true);

      if (!conversationId) {
        throw new Error('Missing conversationId');
      }
      if (!user) {
        throw new Error('Missing user - not logged in');
      }
      if (!token) {
        throw new Error('Missing auth token');
      }

      // 1. Verificar se há chamada ativa ou criar nova
      let callResponse = await VideoCallService.getActiveVideoCall(conversationId);
      let call = callResponse?.videoCall;
      
      if (!call) {
        const createResponse = await VideoCallService.startVideoCall(conversationId);
        call = createResponse.videoCall;
      } else {
        // Marcar como ativa ao entrar
        const joinResponse = await VideoCallService.joinVideoCall(call.id);
        call = joinResponse.videoCall;
      }

      setVideoCall(call);

      // 2. Conectar ao servidor de sinalização
      await webrtcService.connect(token);

      // 3. Iniciar a chamada WebRTC
      await webrtcService.startCall(
        conversationId,
        user.id,
        (stream) => {
          setLocalStream(stream);
          setLoading(false);
        },
        (stream) => {
          setRemoteStream(stream);
          setConnecting(false);
        }
      );
    } catch (error: any) {
      console.error('[WebRTC Screen] Failed to initialize:', error);
      Alert.alert(
        'Erro ao Iniciar',
        error.message || 'Não foi possível iniciar a videochamada',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
      setLoading(false);
      setConnecting(false);
    }
  };

  const handleToggleMute = () => {
    try {
      const muted = webrtcService.toggleMute();
      setIsMuted(muted);
    } catch (error) {
      console.error('[WebRTC Screen] Failed to toggle mute:', error);
      Alert.alert('Erro', 'Não foi possível mutar/desmutar o microfone');
    }
  };

  const handleToggleCamera = () => {
    try {
      const cameraOff = webrtcService.toggleCamera();
      setIsCameraOff(cameraOff);
    } catch (error) {
      console.error('[WebRTC Screen] Failed to toggle camera:', error);
      Alert.alert('Erro', 'Não foi possível ligar/desligar a câmera');
    }
  };

  const handleSwitchCamera = () => {
    try {
      webrtcService.switchCamera();
    } catch (error) {
      console.error('[WebRTC Screen] Failed to switch camera:', error);
      Alert.alert('Erro', 'Não foi possível alternar a câmera');
    }
  };

  const handleEndCall = () => {
    Alert.alert(
      'Encerrar Chamada',
      'Deseja realmente encerrar a videochamada?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Encerrar',
          style: 'destructive',
          onPress: async () => {
            await endCall();
            router.back();
          }
        }
      ]
    );
  };

  const endCall = async () => {
    try {
      // Encerrar no servidor primeiro
      if (videoCall) {
        try {
          await VideoCallService.endVideoCall(videoCall.id);
        } catch (serverError) {
          console.error('[WebRTC Screen] ❌ Failed to end call on server:', serverError);
          // Continua mesmo se falhar no servidor
        }
      }
      
      // Encerrar localmente
      try {
        webrtcService.endCall();
      } catch (localError) {
        console.error('[WebRTC Screen] ❌ Failed to end local call:', localError);
      }
    } catch (error) {
      console.error('[WebRTC Screen] ❌ Error in endCall:', error);
    }
  };

  const cleanup = () => {
    try {
      webrtcService.disconnect();
    } catch (error) {
      console.error('[WebRTC Screen] ❌ Error during cleanup:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Iniciando videochamada...</Text>
        <Text style={styles.loadingSubtext}>Obtendo permissões de câmera e microfone</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Vídeo remoto (tela cheia) */}
      {remoteStream ? (
        <RTCView
          streamURL={remoteStream.toURL()}
          style={styles.remoteVideo}
          objectFit="cover"
          mirror={false}
        />
      ) : (
        <View style={styles.waitingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.waitingText}>
            {connecting ? 'Conectando...' : 'Aguardando outro participante...'}
          </Text>
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
              <Ionicons name="videocam-off" size={40} color="#fff" />
            </View>
          )}
        </View>
      )}

      {/* Controles */}
      <View style={styles.controls}>
        {/* Mutar/Desmutar */}
        <TouchableOpacity
          style={[styles.controlButton, isMuted && styles.controlButtonActive]}
          onPress={handleToggleMute}
        >
          <Ionicons
            name={isMuted ? 'mic-off' : 'mic'}
            size={28}
            color="#fff"
          />
        </TouchableOpacity>

        {/* Desligar/Ligar Câmera */}
        <TouchableOpacity
          style={[styles.controlButton, isCameraOff && styles.controlButtonActive]}
          onPress={handleToggleCamera}
        >
          <Ionicons
            name={isCameraOff ? 'videocam-off' : 'videocam'}
            size={28}
            color="#fff"
          />
        </TouchableOpacity>

        {/* Trocar Câmera */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleSwitchCamera}
        >
          <Ionicons name="camera-reverse" size={28} color="#fff" />
        </TouchableOpacity>

        {/* Encerrar */}
        <TouchableOpacity
          style={[styles.controlButton, styles.endCallButton]}
          onPress={handleEndCall}
        >
          <Ionicons name="call" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Informações da chamada */}
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {remoteStream ? 'Em chamada' : 'Aguardando...'}
        </Text>
      </View>
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
  loadingSubtext: {
    color: '#aaa',
    fontSize: 14,
    marginTop: Spacing.sm,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
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
  waitingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: Spacing.lg,
  },
  localVideoContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
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
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  controlButtonActive: {
    backgroundColor: Colors.error,
    borderColor: Colors.error,
  },
  endCallButton: {
    backgroundColor: Colors.error,
    borderColor: Colors.error,
    transform: [{ rotate: '135deg' }],
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
  },
  headerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
