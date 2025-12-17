import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const WATER_REMINDER_KEY = '@nutri:waterReminder';

export interface WaterReminderConfig {
  enabled: boolean;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  intervalMinutes: number;
  dailyGoalLiters: number;
}

// Verificar se está rodando no Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Importação condicional de expo-notifications
let Notifications: any = null;
if (!isExpoGo) {
  try {
    Notifications = require('expo-notifications');
    // Configurar como as notificações devem ser tratadas quando o app está em primeiro plano
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (error) {
    console.warn('expo-notifications não disponível:', error);
  }
}

class NotificationsService {
  async requestPermissions(): Promise<boolean> {
    if (!Notifications || isExpoGo) {
      console.warn('Notificações não disponíveis no Expo Go. Use um development build.');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return false;
    }

    // Configurar canal de notificação para Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('water-reminders', {
        name: 'Lembretes de Água',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4A90E2',
      });
    }

    return true;
  }

  async saveWaterReminderConfig(config: WaterReminderConfig): Promise<void> {
    await AsyncStorage.setItem(WATER_REMINDER_KEY, JSON.stringify(config));
  }

  async getWaterReminderConfig(): Promise<WaterReminderConfig | null> {
    const data = await AsyncStorage.getItem(WATER_REMINDER_KEY);
    return data ? JSON.parse(data) : null;
  }

  async scheduleWaterReminders(config: WaterReminderConfig): Promise<void> {
    if (!Notifications || isExpoGo) {
      throw new Error('Notificações não disponíveis no Expo Go. Para usar esta funcionalidade, compile um development build do app.');
    }

    // Cancelar notificações anteriores
    await this.cancelWaterReminders();

    if (!config.enabled) {
      return;
    }

    // Verificar permissões
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error('Permissão de notificação necessária');
    }

    // Parsear horários
    const [startHour, startMinute] = config.startTime.split(':').map(Number);
    const [endHour, endMinute] = config.endTime.split(':').map(Number);

    // Calcular quantos lembretes por dia
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    const totalMinutes = endMinutes - startMinutes;
    const remindersPerDay = Math.floor(totalMinutes / config.intervalMinutes);

    const messages = [
      '💧 Hora de beber água! Hidrate-se agora.',
      '🚰 Lembrete: Beba um copo de água!',
      '💦 Que tal um copo de água agora?',
      '🌊 Hidratação é saúde! Beba água.',
      '💧 Seu corpo precisa de água! Beba agora.',
    ];

    // Agendar notificações
    for (let i = 0; i <= remindersPerDay; i++) {
      const minutesFromStart = i * config.intervalMinutes;
      const notificationMinutes = startMinutes + minutesFromStart;
      
      if (notificationMinutes > endMinutes) break;

      const hour = Math.floor(notificationMinutes / 60);
      const minute = notificationMinutes % 60;

      const message = messages[i % messages.length];

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Lembrete de Hidratação',
          body: message,
          data: { type: 'water_reminder' },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          hour,
          minute,
          repeats: true,
          channelId: 'water-reminders',
        },
      });
    }
  }

  async cancelWaterReminders(): Promise<void> {
    if (!Notifications || isExpoGo) {
      return;
    }

    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    
    // Cancelar apenas notificações de água
    for (const notification of scheduledNotifications) {
      if (notification.content.data?.type === 'water_reminder') {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  }

  async enableWaterReminders(enabled: boolean): Promise<void> {
    const config = await this.getWaterReminderConfig();
    if (config) {
      config.enabled = enabled;
      await this.saveWaterReminderConfig(config);
      
      if (enabled) {
        await this.scheduleWaterReminders(config);
      } else {
        await this.cancelWaterReminders();
      }
    }
  }

  async getScheduledWaterRemindersCount(): Promise<number> {
    if (!Notifications || isExpoGo) {
      return 0;
    }

    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    return scheduledNotifications.filter(n => n.content.data?.type === 'water_reminder').length;
  }
}

export default new NotificationsService();
