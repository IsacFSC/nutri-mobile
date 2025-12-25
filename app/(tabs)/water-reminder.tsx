import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Constants from 'expo-constants';
import { Colors, Spacing, Typography } from '@/src/constants';
import NotificationsService, { WaterReminderConfig } from '@/src/services/notifications.service';

export default function WaterReminderScreen() {
  const [config, setConfig] = useState<WaterReminderConfig>({
    enabled: false,
    startTime: '08:00',
    endTime: '22:00',
    intervalMinutes: 60,
    dailyGoalLiters: 2,
  });

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const isExpoGo = Constants.appOwnership === 'expo';

  useEffect(() => {
    loadConfig();
  }, []);

  // Limpar timeout ao desmontar componente
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);

  const loadConfig = async () => {
    try {
      const savedConfig = await NotificationsService.getWaterReminderConfig();
      if (savedConfig) {
        setConfig(savedConfig);
      }
      
      // Verificar quantas notificações estão agendadas
      const count = await NotificationsService.getScheduledWaterRemindersCount();
      setScheduledCount(count);
      
      // Limpar notificações duplicadas se houver
      const cleaned = await NotificationsService.cleanupWaterReminders();
      if (cleaned > 0) {
        console.log(`[WaterReminder] ${cleaned} notificações duplicadas foram limpas`);
        // Atualizar contagem após limpeza
        const newCount = await NotificationsService.getScheduledWaterRemindersCount();
        setScheduledCount(newCount);
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    }
  };

  const saveConfig = async (newConfig: WaterReminderConfig, showAlert: boolean = false) => {
    try {
      setLoading(true);
      await NotificationsService.saveWaterReminderConfig(newConfig);
      
      if (newConfig.enabled) {
        console.log('[WaterReminder] Agendando lembretes...', newConfig);
        await NotificationsService.scheduleWaterReminders(newConfig);
        const count = await NotificationsService.getScheduledWaterRemindersCount();
        setScheduledCount(count);
        console.log('[WaterReminder] Lembretes agendados:', count);
        
        // Mostrar alerta apenas quando explicitamente solicitado (ex: ao ativar)
        if (showAlert) {
          Alert.alert(
            'Sucesso!',
            `${count} lembretes de água foram agendados para você! 💧`,
            [{ text: 'OK' }]
          );
        }
      } else {
        console.log('[WaterReminder] Cancelando lembretes...');
        await NotificationsService.cancelWaterReminders();
        setScheduledCount(0);
      }
      
      setConfig(newConfig);
    } catch (error: any) {
      console.error('[WaterReminder] Erro ao salvar configuração:', error);
      Alert.alert(
        'Erro',
        error.message || 'Não foi possível salvar a configuração',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Função auxiliar para salvar configuração com debounce (para mudanças de tempo/intervalo)
  const saveConfigDebounced = (newConfig: WaterReminderConfig) => {
    // Limpar timeout anterior
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    // Atualizar estado local imediatamente
    setConfig(newConfig);

    // Agendar salvamento após 1 segundo (sem mostrar alerta)
    const timeout = setTimeout(() => {
      saveConfig(newConfig, false);
    }, 1000);

    setSaveTimeout(timeout);
  };

  const handleToggleEnabled = async (value: boolean) => {
    if (value && Platform.OS === 'android') {
      // Explicar ao usuário sobre as notificações
      Alert.alert(
        'Ativar Lembretes',
        'Você receberá notificações regulares para lembrar de beber água durante o dia.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Ativar',
            onPress: () => saveConfig({ ...config, enabled: value }, true),
          },
        ]
      );
    } else {
      await saveConfig({ ...config, enabled: value }, value);
    }
  };

  const handleStartTimeChange = (event: any, selectedDate?: Date) => {
    setShowStartPicker(false);
    if (selectedDate) {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      const newConfig = { ...config, startTime: `${hours}:${minutes}` };
      setConfig(newConfig);
      if (config.enabled) {
        saveConfigDebounced(newConfig);
      }
    }
  };

  const handleEndTimeChange = (event: any, selectedDate?: Date) => {
    setShowEndPicker(false);
    if (selectedDate) {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      const newConfig = { ...config, endTime: `${hours}:${minutes}` };
      setConfig(newConfig);
      if (config.enabled) {
        saveConfigDebounced(newConfig);
      }
    }
  };

  const handleIntervalChange = (minutes: number) => {
    const newConfig = { ...config, intervalMinutes: minutes };
    setConfig(newConfig);
    if (config.enabled) {
      saveConfigDebounced(newConfig);
    }
  };

  const handleGoalChange = (liters: number) => {
    const newConfig = { ...config, dailyGoalLiters: liters };
    setConfig(newConfig);
    // Meta não afeta notificações, só salvar localmente
    if (config.enabled) {
      NotificationsService.saveWaterReminderConfig(newConfig);
    }
  };

  const parseTime = (timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    return date;
  };

  const calculateRemindersPerDay = (): number => {
    const [startHour, startMinute] = config.startTime.split(':').map(Number);
    const [endHour, endMinute] = config.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    const totalMinutes = endMinutes - startMinutes;
    return Math.floor(totalMinutes / config.intervalMinutes) + 1;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="water" size={48} color={Colors.primary} />
        <Text style={styles.title}>Lembrete de Hidratação</Text>
        <Text style={styles.subtitle}>
          Configure lembretes para beber água durante o dia
        </Text>
      </View>

      {/* Warning for Expo Go */}
      {isExpoGo && (
        <View style={styles.warningCard}>
          <Ionicons name="warning" size={24} color={Colors.warning} />
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>Funcionalidade Limitada</Text>
            <Text style={styles.warningText}>
              Notificações não funcionam no Expo Go. Para usar lembretes de hidratação, você precisa compilar um development build do app.
            </Text>
            <TouchableOpacity 
              style={styles.warningButton}
              onPress={() => Linking.openURL('https://docs.expo.dev/develop/development-builds/introduction/')}
            >
              <Text style={styles.warningButtonText}>Saiba Mais</Text>
              <Ionicons name="open-outline" size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Status Card */}
      {config.enabled && !isExpoGo && (
        <View style={styles.statusCard}>
          <Ionicons name="notifications" size={24} color={Colors.success} />
          <Text style={styles.statusText}>
            {scheduledCount} lembretes ativos
          </Text>
          <Text style={styles.statusSubtext}>
            Você receberá {calculateRemindersPerDay()} lembretes por dia
          </Text>
        </View>
      )}

      {/* Enable/Disable */}
      <View style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Ativar Lembretes</Text>
            <Text style={styles.settingDescription}>
              Receba notificações para beber água
            </Text>
          </View>
          <Switch
            value={config.enabled}
            onValueChange={handleToggleEnabled}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={config.enabled ? Colors.white : Colors.text.secondary}
            disabled={loading || isExpoGo}
          />
        </View>
      </View>

      {/* Horário de Início */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Horário de Início</Text>
        <TouchableOpacity
          style={styles.timeButton}
          onPress={() => setShowStartPicker(true)}
          disabled={!config.enabled || isExpoGo}
        >
          <Ionicons name="time-outline" size={24} color={Colors.primary} />
          <Text style={[styles.timeText, !config.enabled && styles.disabledText]}>
            {config.startTime}
          </Text>
          <Ionicons name="chevron-down" size={20} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {showStartPicker && (
        <DateTimePicker
          value={parseTime(config.startTime)}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={handleStartTimeChange}
        />
      )}

      {/* Horário de Término */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Horário de Término</Text>
        <TouchableOpacity
          style={styles.timeButton}
          onPress={() => setShowEndPicker(true)}
          disabled={!config.enabled || isExpoGo}
        >
          <Ionicons name="time-outline" size={24} color={Colors.primary} />
          <Text style={[styles.timeText, !config.enabled && styles.disabledText]}>
            {config.endTime}
          </Text>
          <Ionicons name="chevron-down" size={20} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {showEndPicker && (
        <DateTimePicker
          value={parseTime(config.endTime)}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={handleEndTimeChange}
        />
      )}

      {/* Intervalo entre lembretes */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Intervalo entre Lembretes</Text>
        <View style={styles.optionsGrid}>
          {[30, 60, 90, 120, 180].map((minutes) => (
            <TouchableOpacity
              key={minutes}
              style={[
                styles.optionButton,
                config.intervalMinutes === minutes && styles.optionButtonActive,
                !config.enabled && styles.optionButtonDisabled,
              ]}
              onPress={() => handleIntervalChange(minutes)}
              disabled={!config.enabled || isExpoGo}
            >
              <Text
                style={[
                  styles.optionText,
                  config.intervalMinutes === minutes && styles.optionTextActive,
                ]}
              >
                {minutes < 60 ? `${minutes}min` : `${minutes / 60}h`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Meta Diária */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Meta Diária de Água</Text>
        <View style={styles.optionsGrid}>
          {[1, 1.5, 2, 2.5, 3, 3.5, 4].map((liters) => (
            <TouchableOpacity
              key={liters}
              style={[
                styles.optionButton,
                config.dailyGoalLiters === liters && styles.optionButtonActive,
                !config.enabled && styles.optionButtonDisabled,
              ]}
              onPress={() => handleGoalChange(liters)}
              disabled={!config.enabled || isExpoGo}
            >
              <Text
                style={[
                  styles.optionText,
                  config.dailyGoalLiters === liters && styles.optionTextActive,
                ]}
              >
                {liters}L
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={24} color={Colors.info} />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>Dica de Hidratação</Text>
          <Text style={styles.infoText}>
            Beber água regularmente ajuda na digestão, controle de peso e melhora
            o funcionamento do organismo. A quantidade ideal varia para cada pessoa.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: Spacing.xl,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    ...Typography.h2,
    marginTop: Spacing.md,
    color: Colors.text.primary,
  },
  subtitle: {
    ...Typography.body1,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  warningCard: {
    margin: Spacing.md,
    padding: Spacing.lg,
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.warning,
    gap: Spacing.md,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    ...Typography.body1,
    fontWeight: '600',
    color: '#856404',
    marginBottom: Spacing.xs,
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  warningButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  warningButtonText: {
    ...Typography.body1,
    color: Colors.primary,
    fontWeight: '600',
  },
  statusCard: {
    margin: Spacing.md,
    padding: Spacing.lg,
    backgroundColor: Colors.successLight,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.success,
  },
  statusText: {
    ...Typography.h3,
    color: Colors.success,
    marginTop: Spacing.sm,
  },
  statusSubtext: {
    fontSize: 14,
    color: Colors.text.primary,
    marginTop: Spacing.xs,
  },
  card: {
    margin: Spacing.md,
    marginTop: 0,
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    elevation: 2,
  },
  cardTitle: {
    ...Typography.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    ...Typography.body1,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  settingDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeText: {
    ...Typography.h3,
    color: Colors.text.primary,
    flex: 1,
    marginLeft: Spacing.md,
  },
  disabledText: {
    color: Colors.text.secondary,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  optionButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 70,
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionButtonDisabled: {
    opacity: 0.5,
  },
  optionText: {
    ...Typography.body1,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  optionTextActive: {
    color: Colors.white,
  },
  infoCard: {
    margin: Spacing.md,
    marginTop: 0,
    marginBottom: Spacing.xl,
    padding: Spacing.lg,
    backgroundColor: Colors.infoLight,
    borderRadius: 12,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.info,
  },
  infoContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  infoTitle: {
    ...Typography.body1,
    fontWeight: '600',
    color: Colors.info,
    marginBottom: Spacing.xs,
  },
  infoText: {
    fontSize: 14,
    color: Colors.text.primary,
    lineHeight: 20,
  },
});
