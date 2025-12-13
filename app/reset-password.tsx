import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input } from '@/src/components/common';
import { useAuthStore } from '@/src/store/authStore';
import { Colors, Typography, Spacing } from '@/src/constants';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { resetPassword, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const validateForm = () => {
    setEmailError('');

    if (!email) {
      setEmailError('Email é obrigatório');
      return false;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Email inválido');
      return false;
    }

    return true;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) return;

    try {
      await resetPassword(email);
      setEmailSent(true);
      Alert.alert(
        'Email Enviado!',
        'Verifique sua caixa de entrada para redefinir sua senha.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Erro',
        error.message || 'Não foi possível enviar o email. Tente novamente.'
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Botão Voltar */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="lock-closed" size={48} color={Colors.primary} />
          </View>
          <Text style={styles.title}>Esqueceu sua senha?</Text>
          <Text style={styles.subtitle}>
            {emailSent
              ? 'Email enviado! Verifique sua caixa de entrada.'
              : 'Digite seu email para receber instruções de recuperação'}
          </Text>
        </View>

        {!emailSent && (
          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="seu@email.com"
              value={email}
              onChangeText={setEmail}
              error={emailError}
              icon="mail"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Button
              title="Enviar Link de Recuperação"
              onPress={handleResetPassword}
              loading={isLoading}
              style={styles.submitButton}
            />

            <View style={styles.infoContainer}>
              <Ionicons name="information-circle" size={20} color={Colors.info} />
              <Text style={styles.infoText}>
                Você receberá um email com instruções para redefinir sua senha.
              </Text>
            </View>
          </View>
        )}

        {emailSent && (
          <View style={styles.successContainer}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
            </View>
            <Text style={styles.successText}>
              Email enviado com sucesso para:
            </Text>
            <Text style={styles.emailText}>{email}</Text>
            <Text style={styles.instructionsText}>
              Verifique sua caixa de entrada e spam. O link expira em 1 hora.
            </Text>
            <Button
              title="Voltar ao Login"
              onPress={() => router.back()}
              style={styles.backToLoginButton}
            />
          </View>
        )}

        <TouchableOpacity
          style={styles.loginContainer}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back-circle" size={20} color={Colors.primary} />
          <Text style={styles.loginText}>Voltar para o login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.lg,
    paddingTop: Spacing.xl + 20,
  },
  backButton: {
    position: 'absolute',
    top: Spacing.lg,
    left: Spacing.lg,
    zIndex: 10,
    padding: Spacing.sm,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h1,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body1,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    width: '100%',
  },
  submitButton: {
    marginTop: Spacing.lg,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.info + '10',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.info,
  },
  infoText: {
    ...Typography.body2,
    color: Colors.text.secondary,
    flex: 1,
    marginLeft: Spacing.sm,
    lineHeight: 20,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  successIcon: {
    marginBottom: Spacing.lg,
  },
  successText: {
    ...Typography.body1,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  emailText: {
    ...Typography.h3,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  instructionsText: {
    ...Typography.body2,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  backToLoginButton: {
    marginTop: Spacing.lg,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  loginText: {
    ...Typography.body1,
    color: Colors.primary,
    marginLeft: Spacing.sm,
    fontWeight: '600',
  },
});
