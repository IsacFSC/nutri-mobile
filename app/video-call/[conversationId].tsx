import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, Text, TouchableOpacity, BackHandler } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { VideoCallService } from '@/src/services/videoCall.service';
import { useAuthStore } from '@/src/store/authStore';
import { Colors, Spacing } from '@/src/constants';

export default function VideoCallScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [videoCall, setVideoCall] = useState<any>(null);
  const [jitsiUrl, setJitsiUrl] = useState<string>('');
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    initVideoCall();
    
    // Interceptar botão voltar do Android
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleEndCall();
      return true;
    });
    
    return () => {
      backHandler.remove();
      if (videoCall) {
        endCall();
      }
    };
  }, []);

  const initVideoCall = async () => {
    try {
      setLoading(true);

      // Verificar se já existe chamada ativa
      const { videoCall: activeCall } = await VideoCallService.getActiveVideoCall(conversationId);

      let call = activeCall;

      if (!call) {
        // Criar nova chamada
        const response = await VideoCallService.startVideoCall(conversationId);
        call = response.videoCall;
      } else {
        // Entrar na chamada existente
        const response = await VideoCallService.joinVideoCall(call.id);
        call = response.videoCall;
      }

      setVideoCall(call);

      // Construir URL do Jitsi com configurações para entrar direto na sala
      const userName = encodeURIComponent(user?.name || 'Usuário');
      const roomName = call.roomName; // Sem encode para manter caracteres especiais
      
      // Configurações via hash para garantir entrada direta
      const config = {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        prejoinPageEnabled: false,
        disableDeepLinking: true,
        requireDisplayName: false,
        enableWelcomePage: false,
        enableClosePage: false,
        hideConferenceSubject: false,
        hideConferenceTimer: false,
        startAudioOnly: false,
        startScreenSharing: false,
        enableLayerSuspension: true,
        liveStreamingEnabled: false,
        fileRecordingsEnabled: false,
        disableInviteFunctions: true,
      };
      
      const configString = Object.entries(config)
        .map(([key, value]) => `config.${key}=${value}`)
        .join('&');
      
      const url = `https://meet.jit.si/${roomName}#userInfo.displayName="${userName}"&${configString}`;
      
      setJitsiUrl(url);
      console.log('[VideoCall] Sala criada:', call.roomName);
      console.log('[VideoCall] URL:', url);

    } catch (error: any) {
      console.error('Erro ao iniciar videochamada:', error);
      Alert.alert(
        'Erro',
        'Não foi possível iniciar a videochamada',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEndCall = () => {
    Alert.alert(
      'Encerrar Chamada',
      'Deseja realmente sair da videochamada?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await endCall();
            router.back();
          },
        },
      ]
    );
  };

  const endCall = async () => {
    if (videoCall) {
      try {
        await VideoCallService.endVideoCall(videoCall.id);
        console.log('[VideoCall] Chamada encerrada no servidor');
      } catch (error) {
        console.error('Erro ao encerrar chamada no servidor:', error);
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Iniciando videochamada...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header com botão de sair */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Videochamada</Text>
        <TouchableOpacity onPress={handleEndCall} style={styles.endButton}>
          <Ionicons name="close-circle" size={32} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* WebView com Jitsi */}
      <WebView
        ref={webViewRef}
        source={{ uri: jitsiUrl }}
        style={styles.webview}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        mixedContentMode="always"
        setSupportMultipleWindows={false}
        allowsFullscreenVideo={true}
        cacheEnabled={false}
        onLoadStart={() => console.log('[VideoCall] WebView: Iniciando carregamento...')}
        onLoad={() => console.log('[VideoCall] WebView: Carregado!')}
        onLoadEnd={() => console.log('[VideoCall] WebView: Carregamento finalizado')}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('[VideoCall] WebView Error:', nativeEvent);
          Alert.alert('Erro', 'Não foi possível carregar a videochamada');
        }}
        onShouldStartLoadWithRequest={(request) => {
          console.log('[VideoCall] Carregando URL:', request.url);
          // Permitir apenas Jitsi
          if (request.url.includes('meet.jit.si') || request.url.includes('8x8.vc')) {
            return true;
          }
          return false;
        }}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Conectando...</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingTop: 40,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  endButton: {
    padding: Spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#fff',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
});
