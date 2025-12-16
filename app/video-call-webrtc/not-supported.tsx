import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '@/src/constants';
import { router } from 'expo-router';

export default function WebRTCNotSupported() {
  return (
    <View style={styles.container}>
      <Ionicons name="videocam-off" size={80} color={Colors.error} />
      
      <Text style={styles.title}>Videochamada Não Disponível</Text>
      
      <Text style={styles.description}>
        A videochamada WebRTC requer módulos nativos e não funciona com Expo Go.
      </Text>
      
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Para usar videochamada:</Text>
        <Text style={styles.infoText}>1. Feche o Expo Go</Text>
        <Text style={styles.infoText}>2. Execute no terminal:</Text>
        <View style={styles.codeBox}>
          <Text style={styles.code}>npx expo run:android</Text>
        </View>
        <Text style={styles.infoText}>3. O app será compilado e instalado</Text>
      </View>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={() => router.back()}
      >
        <Text style={styles.buttonText}>Voltar</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.linkButton}
        onPress={() => Linking.openURL('https://github.com/react-native-webrtc/react-native-webrtc')}
      >
        <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
        <Text style={styles.linkText}>Saiba mais sobre WebRTC</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.background,
  },
  title: {
    ...Typography.h2,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    textAlign: 'center',
    color: Colors.text.primary,
  },
  description: {
    ...Typography.body1,
    textAlign: 'center',
    color: Colors.text.secondary,
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  infoBox: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: 12,
    width: '100%',
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoTitle: {
    ...Typography.h4,
    marginBottom: Spacing.md,
    color: Colors.text.primary,
  },
  infoText: {
    ...Typography.body2,
    marginBottom: Spacing.xs,
    color: Colors.text.secondary,
  },
  codeBox: {
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: 8,
    marginVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: Colors.primary,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl * 2,
    borderRadius: 8,
    marginBottom: Spacing.md,
  },
  buttonText: {
    ...Typography.button,
    color: Colors.text.inverse,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    padding: Spacing.sm,
  },
  linkText: {
    ...Typography.body2,
    color: Colors.primary,
  },
});
