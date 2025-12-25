import AsyncStorage from '@react-native-async-storage/async-storage';

const SOUND_SETTINGS_KEY = '@nutri:soundSettings';

// Importação condicional de expo-av
let Audio: any = null;
let audioAvailable = false;

try {
  const expoAv = require('expo-av');
  Audio = expoAv.Audio;
  audioAvailable = true;
} catch (error) {
  console.warn('[SoundService] expo-av not available - sound features disabled');
  audioAvailable = false;
}

export interface SoundSettings {
  callSoundEnabled: boolean;
  notificationSoundEnabled: boolean;
  masterVolume: number; // 0-1
}

class SoundService {
  private outgoingCallSound: any = null;
  private incomingCallSound: any = null;
  private notificationSound: any = null;
  private settings: SoundSettings = {
    callSoundEnabled: true,
    notificationSoundEnabled: true,
    masterVolume: 1.0,
  };

  async initialize() {
    if (!audioAvailable) {
      console.warn('[SoundService] Cannot initialize - expo-av not available');
      return;
    }

    try {
      // Configurar modo de áudio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      // Carregar configurações salvas
      await this.loadSettings();

      console.log('[SoundService] Initialized with settings:', this.settings);
    } catch (error) {
      console.error('[SoundService] Failed to initialize:', error);
    }
  }

  async loadSettings(): Promise<SoundSettings> {
    try {
      const saved = await AsyncStorage.getItem(SOUND_SETTINGS_KEY);
      if (saved) {
        this.settings = JSON.parse(saved);
      }
      return this.settings;
    } catch (error) {
      console.error('[SoundService] Failed to load settings:', error);
      return this.settings;
    }
  }

  async saveSettings(settings: Partial<SoundSettings>): Promise<void> {
    try {
      this.settings = { ...this.settings, ...settings };
      await AsyncStorage.setItem(SOUND_SETTINGS_KEY, JSON.stringify(this.settings));
      console.log('[SoundService] Settings saved:', this.settings);
    } catch (error) {
      console.error('[SoundService] Failed to save settings:', error);
    }
  }

  getSettings(): SoundSettings {
    return { ...this.settings };
  }

  /**
   * Toca som de chamada saindo (ringing)
   */
  async playOutgoingCallSound() {
    if (!audioAvailable) {
      console.warn('[SoundService] Audio not available');
      return;
    }

    if (!this.settings.callSoundEnabled) {
      console.log('[SoundService] Call sound disabled');
      return;
    }

    try {
      // Parar som anterior se estiver tocando
      if (this.outgoingCallSound) {
        await this.outgoingCallSound.stopAsync();
        await this.outgoingCallSound.unloadAsync();
      }

      // Usar som do sistema - URI para tom de chamada padrão
      // Para Android, podemos usar notification/ringtone do sistema
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'asset:/sounds/outgoing_call.mp3' }, // Fallback para silêncio se não existir
        { 
          isLooping: true,
          volume: this.settings.masterVolume,
        },
        null,
        false // não baixar se não existir
      );
      this.outgoingCallSound = sound;
      await sound.playAsync();
      console.log('[SoundService] Playing outgoing call sound');
    } catch (error) {
      // Se falhar, apenas logar (som é opcional)
      console.warn('[SoundService] Could not play outgoing call sound (file may not exist):', error);
    }
  }

  /**
   * Para som de chamada saindo
   */
  async stopOutgoingCallSound() {
    if (!audioAvailable) return;

    try {
      if (this.outgoingCallSound) {
        await this.outgoingCallSound.stopAsync();
        await this.outgoingCallSound.unloadAsync();
        this.outgoingCallSound = null;
        console.log('[SoundService] Stopped outgoing call sound');
      }
    } catch (error) {
      console.error('[SoundService] Failed to stop outgoing call sound:', error);
    }
  }

  /**
   * Toca som de chamada entrando (ringtone)
   */
  async playIncomingCallSound() {
    if (!audioAvailable) {
      console.warn('[SoundService] Audio not available');
      return;
    }

    if (!this.settings.callSoundEnabled) {
      console.log('[SoundService] Call sound disabled');
      return;
    }

    try {
      // Parar som anterior se estiver tocando
      if (this.incomingCallSound) {
        await this.incomingCallSound.stopAsync();
        await this.incomingCallSound.unloadAsync();
      }

      // Criar novo som
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'asset:/sounds/incoming_call.mp3' },
        { 
          isLooping: true,
          volume: this.settings.masterVolume,
        },
        null,
        false
      );
      this.incomingCallSound = sound;
      await sound.playAsync();
      console.log('[SoundService] Playing incoming call sound');
    } catch (error) {
      console.warn('[SoundService] Could not play incoming call sound (file may not exist):', error);
    }
  }

  /**
   * Para som de chamada entrando
   */
  async stopIncomingCallSound() {
    if (!audioAvailable) return;

    try {
      if (this.incomingCallSound) {
        await this.incomingCallSound.stopAsync();
        await this.incomingCallSound.unloadAsync();
        this.incomingCallSound = null;
        console.log('[SoundService] Stopped incoming call sound');
      }
    } catch (error) {
      console.error('[SoundService] Failed to stop incoming call sound:', error);
    }
  }

  /**
   * Toca som de notificação
   */
  async playNotificationSound() {
    if (!audioAvailable) {
      console.warn('[SoundService] Audio not available');
      return;
    }

    if (!this.settings.notificationSoundEnabled) {
      console.log('[SoundService] Notification sound disabled');
      return;
    }

    try {
      // Não precisa parar sons anteriores de notificação (one-shot)
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'asset:/sounds/notification.mp3' },
        {
          volume: this.settings.masterVolume * 0.8, // Um pouco mais baixo
        },
        null,
        false
      );
      this.notificationSound = sound;
      await sound.playAsync();
      
      // Auto-cleanup após tocar
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
      
      console.log('[SoundService] Playing notification sound');
    } catch (error) {
      console.warn('[SoundService] Could not play notification sound (file may not exist):', error);
    }
  }

  /**
   * Para todos os sons
   */
  async stopAllSounds() {
    await Promise.all([
      this.stopOutgoingCallSound(),
      this.stopIncomingCallSound(),
    ]);
  }

  /**
   * Cleanup - liberar recursos
   */
  async cleanup() {
    await this.stopAllSounds();
    if (this.notificationSound) {
      await this.notificationSound.unloadAsync();
      this.notificationSound = null;
    }
  }
}

export default new SoundService();
