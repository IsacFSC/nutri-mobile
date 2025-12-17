/**
 * Configuração Centralizada do Jitsi Meet
 * 
 * Este arquivo centraliza todas as configurações de videochamada
 * para facilitar manutenção e customização futura.
 */

export const JITSI_CONFIG = {
  // Servidor Jitsi (8x8.vc é mais estável para guest mode)
  server: '8x8.vc', // Alternativas: 'meet.jit.si', 'jitsi.riot.im'
  
  // Configurações de URL
  urlConfig: {
    // === AUTENTICAÇÃO (CRÍTICO) ===
    'config.disableDeepLinking': 'true',              // Não abre app externo
    'config.requireDisplayName': 'false',             // Não exige nome
    'config.enableUserRolesBasedOnToken': 'false',    // Sem token
    'config.enableInsecureRoomNameWarning': 'false',  // Sem aviso de segurança
    'interfaceConfig.SHOW_JITSI_WATERMARK': 'false',  // Sem watermark
    'interfaceConfig.SHOW_WATERMARK_FOR_GUESTS': 'false', // Sem watermark para guests
    'interfaceConfig.AUTHENTICATION_ENABLE': 'false', // Desabilitar autenticação
    'interfaceConfig.DISABLE_JOIN_LEAVE_NOTIFICATIONS': 'true', // Sem notificações
    
    // === INTERFACE ===
    'config.prejoinPageEnabled': 'false',             // Pula tela de pré-entrada
    'config.hideConferenceSubject': 'true',           // Oculta nome da sala
    'config.hideConferenceTimer': 'false',            // Mostra timer
    'config.enableWelcomePage': 'false',              // Sem tela de boas-vindas
    'config.enableClosePage': 'false',                // Sem tela de saída
    
    // === FUNCIONALIDADES ===
    'config.disableInviteFunctions': 'true',          // Sem botão convidar
    'config.startWithAudioMuted': 'false',            // Áudio ligado
    'config.startWithVideoMuted': 'false',            // Vídeo ligado
    'config.remoteVideoMenu.disableKick': 'true',     // Sem expulsar
    'config.disableModeratorIndicator': 'true',       // Sem indicador moderador
    
    // === QUALIDADE ===
    'config.resolution': '720',                       // Resolução 720p
    'config.constraints.video.height.ideal': '720',
    'config.constraints.video.height.max': '720',
    'config.constraints.video.height.min': '180',
    
    // === OUTROS ===
    'config.disableProfile': 'true',                  // Sem editar perfil
    'config.disableRemoteMute': 'false',              // Permite mutar outros
    'config.enableLobbyChat': 'false',                // Sem chat de lobby
    'config.doNotStoreRoom': 'true',                  // Não salvar sala
  },
  
  // Funcionalidades adicionais (descomente para desabilitar)
  optionalFeatures: {
    // 'config.disableChat': 'true',                  // Desabilitar chat
    // 'config.disableScreenShare': 'true',           // Desabilitar compartilhar tela
    // 'config.fileRecordingsEnabled': 'false',       // Desabilitar gravação
    // 'config.liveStreamingEnabled': 'false',        // Desabilitar transmissão
    // 'config.disableReactions': 'true',             // Desabilitar reações (emoji)
    // 'config.disableSelfView': 'false',             // Desabilitar auto-visualização
  },
  
  // Script injetado no WebView
  injectedScript: `
    (function() {
      // 1. BLOQUEAR DEEP LINKS E REDIRECIONAMENTOS
      window.location.assign = function(url) {
        return false;
      };
      
      window.open = function(url) {
        return null;
      };
      
      // 2. INTERCEPTAR REQUISIÇÕES DE AUTENTICAÇÃO
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        const url = args[0];
        if (url && typeof url === 'string') {
          const blockedKeywords = ['auth', 'login', 'token', 'sso', 'oauth', 'signin'];
          if (blockedKeywords.some(keyword => url.toLowerCase().includes(keyword))) {
            return Promise.resolve(new Response('{}', {status: 200, headers: {'Content-Type': 'application/json'}}));
          }
        }
        return originalFetch.apply(this, args);
      };
      
      // 3. REMOVER BOTÕES E LINKS DE LOGIN
      function removeLoginElements() {
        const selectors = [
          '[class*="login"]', '[class*="Login"]',
          '[id*="login"]', '[id*="Login"]',
          'a[href*="login"]', 'button[title*="Log"]',
          '.auth-button', '#authButton'
        ];
        
        selectors.forEach(selector => {
          document.querySelectorAll(selector).forEach(el => {
            el.style.display = 'none';
            el.remove();
          });
        });
      }
      
      // Executar remoção após carregamento
      setTimeout(removeLoginElements, 1000);
      setTimeout(removeLoginElements, 3000);
      setTimeout(removeLoginElements, 5000);
    })();
    true;
  `,
  
  // Configurações do WebView
  webViewConfig: {
    mediaPlaybackRequiresUserAction: false,
    allowsInlineMediaPlayback: true,
    javaScriptEnabled: true,
    domStorageEnabled: true,
    startInLoadingState: true,
    thirdPartyCookiesEnabled: true,
    sharedCookiesEnabled: true,
    originWhitelist: ['*'],
    mixedContentMode: 'always' as const,
    allowsProtectedMedia: true,
    setSupportMultipleWindows: false, // CRÍTICO: não abre novas janelas
    allowFileAccess: true,
    allowFileAccessFromFileURLs: true,
    allowUniversalAccessFromFileURLs: true,
    geolocationEnabled: false,
    saveFormDataDisabled: true, // Não salva dados de formulário de login
  },
};

/**
 * Gera URL completa do Jitsi com todas as configurações
 */
export function generateJitsiUrl(roomName: string, userName: string): string {
  const { server, urlConfig, optionalFeatures } = JITSI_CONFIG;
  
  // Combinar configurações
  const allConfig = { ...urlConfig, ...optionalFeatures };
  
  // Montar query string
  const configParams = Object.entries(allConfig)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  
  // Encode do nome de usuário
  const encodedUserName = encodeURIComponent(userName);
  
  // URL final
  return `https://${server}/${roomName}?${configParams}#userInfo.displayName="${encodedUserName}"`;
}

/**
 * Configurações de customização visual (CSS)
 * Para usar: descomentar no injectedScript acima
 */
export const JITSI_CUSTOM_CSS = `
  /* Cores personalizadas */
  .toolbox-button {
    background-color: #4CAF50 !important;
  }
  
  .toolbox-button:hover {
    background-color: #45a049 !important;
  }
  
  /* Remover watermark/logo Jitsi */
  .watermark {
    display: none !important;
  }
  
  /* Fundo personalizado */
  body {
    background-color: #1a1a1a !important;
  }
  
  /* Controles de vídeo */
  .videocontainer__toolbar {
    background: rgba(74, 144, 226, 0.9) !important;
  }
`;

export default JITSI_CONFIG;
