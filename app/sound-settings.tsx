import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Spacing, Typography } from '@/src/constants';
import soundService, { SoundSettings } from '@/src/services/sound.service';

export default function SoundSettingsScreen() {
  const [settings, setSettings] = useState<SoundSettings>({
    callSoundEnabled: true,
    notificationSoundEnabled: true,
    masterVolume: 1.0,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const saved = await soundService.loadSettings();
    setSettings(saved);
  };

  const handleToggleCallSound = async (value: boolean) => {
    const newSettings = { ...settings, callSoundEnabled: value };
    setSettings(newSettings);
    await soundService.saveSettings(newSettings);
  };

  const handleToggleNotificationSound = async (value: boolean) => {
    const newSettings = { ...settings, notificationSoundEnabled: value };
    setSettings(newSettings);
    await soundService.saveSettings(newSettings);
  };

  const testCallSound = async () => {
    await soundService.playOutgoingCallSound();
    setTimeout(() => {
      soundService.stopOutgoingCallSound();
    }, 2000);
  };

  const testNotificationSound = async () => {
    await soundService.playNotificationSound();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Configurações de Som</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sons de Chamada</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Ativar Sons de Chamada</Text>
            <Text style={styles.settingDescription}>
              Tocar som ao fazer e receber chamadas
            </Text>
          </View>
          <Switch
            value={settings.callSoundEnabled}
            onValueChange={handleToggleCallSound}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={settings.callSoundEnabled ? Colors.white : Colors.text.secondary}
          />
        </View>

        <TouchableOpacity
          style={[styles.testButton, !settings.callSoundEnabled && styles.testButtonDisabled]}
          onPress={testCallSound}
          disabled={!settings.callSoundEnabled}
        >
          <Ionicons 
            name="play-circle" 
            size={20} 
            color={settings.callSoundEnabled ? Colors.primary : Colors.text.secondary} 
          />
          <Text style={[styles.testButtonText, !settings.callSoundEnabled && styles.testButtonTextDisabled]}>
            Testar Som de Chamada
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sons de Notificação</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Ativar Sons de Notificação</Text>
            <Text style={styles.settingDescription}>
              Tocar som para lembretes e alertas
            </Text>
          </View>
          <Switch
            value={settings.notificationSoundEnabled}
            onValueChange={handleToggleNotificationSound}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={settings.notificationSoundEnabled ? Colors.white : Colors.text.secondary}
          />
        </View>

        <TouchableOpacity
          style={[styles.testButton, !settings.notificationSoundEnabled && styles.testButtonDisabled]}
          onPress={testNotificationSound}
          disabled={!settings.notificationSoundEnabled}
        >
          <Ionicons 
            name="play-circle" 
            size={20} 
            color={settings.notificationSoundEnabled ? Colors.primary : Colors.text.secondary} 
          />
          <Text style={[styles.testButtonText, !settings.notificationSoundEnabled && styles.testButtonTextDisabled]}>
            Testar Som de Notificação
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={24} color={Colors.info} />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>Sobre os Sons</Text>
          <Text style={styles.infoText}>
            Os sons de chamada tocam quando você inicia ou recebe uma videochamada.
            {'\n\n'}
            Os sons de notificação tocam para lembretes de hidratação e outras notificações do app.
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    marginRight: Spacing.md,
  },
  title: {
    ...Typography.h2,
    color: Colors.text.primary,
  },
  section: {
    margin: Spacing.md,
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  settingInfo: {
    flex: 1,
    marginRight: Spacing.md,
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
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    gap: Spacing.sm,
  },
  testButtonDisabled: {
    backgroundColor: Colors.background,
  },
  testButtonText: {
    ...Typography.body1,
    color: Colors.primary,
    fontWeight: '600',
  },
  testButtonTextDisabled: {
    color: Colors.text.secondary,
  },
  infoCard: {
    margin: Spacing.md,
    padding: Spacing.lg,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    flexDirection: 'row',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.info,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    ...Typography.body1,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: Spacing.xs,
  },
  infoText: {
    fontSize: 14,
    color: '#2E7D32',
    lineHeight: 20,
  },
});
