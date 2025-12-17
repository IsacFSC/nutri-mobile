import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, Text, TouchableOpacity, BackHandler, Linking } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { VideoCallService } from '@/src/services/videoCall.service';
import { useAuthStore } from '@/src/store/authStore';
import { Colors, Spacing } from '@/src/constants';
import { generateJitsiUrl, JITSI_CONFIG } from '@/src/config/jitsi.config';

export default function VideoCallScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [videoCall, setVideoCall] = useState<any>(null);
  const [jitsiUrl, setJitsiUrl] = useState<string>('');
  const [loadTimeout, setLoadTimeout] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    initVideoCall();
    
    // Timeout de 15 segundos para detectar travamento
    loadTimeoutRef.current = setTimeout(() => {
      console.warn('[VideoCall] TIMEOUT: WebView não carregou em 15 segundos');
      setLoadTimeout(true);
    }, 15000);
    
    // Interceptar botão voltar do Android
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleEndCall();
      return true;
    });
    
    return () => {
      backHandler.remove();
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
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
        console.log('[VideoCall] Criando nova chamada...');
        const response = await VideoCallService.startVideoCall(conversationId);
        call = response.videoCall;
        console.log('[VideoCall] Chamada criada:', call.roomName);
      } else {
        // Entrar na chamada existente
        console.log('[VideoCall] Entrando na chamada existente, ID:', call.id);
        const response = await VideoCallService.joinVideoCall(call.id);
        call = response.videoCall;
        console.log('[VideoCall] Entrou na chamada, status:', call.status);
      }

      setVideoCall(call);

      // Gerar URL do Jitsi usando configuração centralizada
      const userName = user?.name || 'Usuário';
      const url = generateJitsiUrl(call.roomName, userName);
      
      setJitsiUrl(url);
      console.log('[VideoCall] Sala criada:', call.roomName);
      console.log('[VideoCall] Servidor Jitsi:', JITSI_CONFIG.server);
      console.log('[VideoCall] URL completa:', url);

    } catch (error: any) {
      console.error('[VideoCall] ERRO CRÍTICO ao iniciar:', error);
      console.error('[VideoCall] Error details:', JSON.stringify(error, null, 2));
      console.error('[VideoCall] Error response:', error?.response?.data);
      
      const errorMessage = error?.response?.data?.error || error?.message || 'Erro desconhecido';
      
      Alert.alert(
        'Erro',
        `Não foi possível iniciar a videochamada.\n\nDetalhes: ${errorMessage}`,
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
        {loadTimeout && (
          <>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => {
                setLoadTimeout(false);
                initVideoCall();
              }}
            >
              <Text style={styles.retryButtonText}>Tentar Novamente</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: Colors.secondary, marginTop: 10 }]}
              onPress={() => {
                if (jitsiUrl) {
                  Alert.alert(
                    'Abrir no Navegador',
                    'A videochamada será aberta no navegador do seu dispositivo.',
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      {
                        text: 'Abrir',
                        onPress: () => {
                          Linking.openURL(jitsiUrl);
                          router.back();
                        },
                      },
                    ]
                  );
                }
              }}
            >
              <Text style={styles.retryButtonText}>Abrir no Navegador</Text>
            </TouchableOpacity>
          </>
        )}
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
        {...JITSI_CONFIG.webViewConfig}
        onLoadStart={() => console.log('[VideoCall] WebView: Iniciando carregamento...')}
        injectedJavaScript={JITSI_CONFIG.injectedScript}
        onLoad={() => {
          console.log('[VideoCall] WebView: Carregado!');
          if (loadTimeoutRef.current) {
            clearTimeout(loadTimeoutRef.current);
          }
          setLoadTimeout(false);
        }}
        onLoadEnd={() => {
          console.log('[VideoCall] WebView: Carregamento finalizado');
          if (loadTimeoutRef.current) {
            clearTimeout(loadTimeoutRef.current);
          }
          setLoadTimeout(false);
        }}
        onShouldStartLoadWithRequest={(request) => {
          const url = request.url;
          console.log('[VideoCall] 🔍 Navegando para:', url);
          
          // Bloquear URLs de login/auth/app stores
          const blockedPatterns = [
            'login', 'auth', 'signin', 'sso', 'oauth',
            'play.google.com', 'apps.apple.com', 'itunes.apple.com'
          ];
          
          const isBlocked = blockedPatterns.some(pattern => url.toLowerCase().includes(pattern));
          
          if (isBlocked) {
            console.log('[VideoCall] ⛔ URL BLOQUEADA:', url);
            Alert.alert(
              'Ação Bloqueada',
              'Esta navegação não é permitida durante a videochamada.',
              [{ text: 'OK' }]
            );
            return false; // Bloquear navegação
          }
          
          // Permitir apenas URLs do Jitsi/8x8
          const isAllowed = url.includes('jit.si') || url.includes('8x8.vc') || url.includes('jitsi') || url.startsWith('data:') || url.startsWith('about:');
          
          if (!isAllowed) {
            console.log('[VideoCall] ⚠️ URL não permitida:', url);
            return false;
          }
          
          return true; // Permitir navegação
        }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('[VideoCall] WebView Error:', JSON.stringify(nativeEvent, null, 2));
          Alert.alert('Erro ao Carregar', `Não foi possível conectar à videochamada.\n\nDetalhes: ${nativeEvent.description || 'Erro desconhecido'}`);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('[VideoCall] HTTP Error:', nativeEvent.statusCode, nativeEvent.url);
        }}
        onMessage={(event) => {
          console.log('[VideoCall] Mensagem do WebView:', event.nativeEvent.data);
        }}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Conectando à videochamada...</Text>
            <Text style={[styles.loadingText, { fontSize: 12, marginTop: 8 }]}>
              Aguarde alguns segundos...
            </Text>
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
  retryButton: {
    marginTop: 20,
    backgroundColor: Colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
