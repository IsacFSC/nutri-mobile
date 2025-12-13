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
import { UserRole } from '@/src/types';
import api from '@/src/config/api';

export default function RegisterScreen() {
  const router = useRouter();
  const { isLoading } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.PATIENT);

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const validateForm = () => {
    let isValid = true;
    
    // Limpar erros
    setNameError('');
    setEmailError('');
    setPhoneError('');
    setPasswordError('');
    setConfirmPasswordError('');

    // Validar nome
    if (!name.trim()) {
      setNameError('Nome é obrigatório');
      isValid = false;
    } else if (name.trim().length < 3) {
      setNameError('Nome deve ter no mínimo 3 caracteres');
      isValid = false;
    }

    // Validar email
    if (!email) {
      setEmailError('Email é obrigatório');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Email inválido');
      isValid = false;
    }

    // Validar telefone (opcional mas com validação se preenchido)
    if (phone && !/^\(\d{2}\)\s?\d{4,5}-?\d{4}$/.test(phone)) {
      setPhoneError('Formato: (11) 98765-4321');
      isValid = false;
    }

    // Validar senha
    if (!password) {
      setPasswordError('Senha é obrigatória');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Senha deve ter no mínimo 6 caracteres');
      isValid = false;
    }

    // Validar confirmação de senha
    if (!confirmPassword) {
      setConfirmPasswordError('Confirme sua senha');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('As senhas não coincidem');
      isValid = false;
    }

    return isValid;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      // Registrar sem fazer login automático (mais seguro)
      const response = await api.post('/auth/register', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        password,
        role,
      });
      
      Alert.alert(
        'Sucesso!',
        'Conta criada com sucesso. Faça login para continuar.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/login'),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Erro ao Criar Conta',
        error.response?.data?.error || error.message || 'Não foi possível criar sua conta. Tente novamente.'
      );
    }
  };

  const formatPhone = (text: string) => {
    // Remove tudo que não é número
    const numbers = text.replace(/\D/g, '');
    
    // Formata (11) 98765-4321
    if (numbers.length <= 2) {
      return `(${numbers}`;
    } else if (numbers.length <= 6) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else if (numbers.length <= 10) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
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
          <Text style={styles.title}>Criar Conta</Text>
          <Text style={styles.subtitle}>
            Preencha os dados abaixo para se cadastrar
          </Text>
        </View>

        {/* Seletor de Tipo de Conta */}
        <View style={styles.roleSelector}>
          <Text style={styles.roleLabel}>Você é:</Text>
          <View style={styles.roleButtons}>
            <TouchableOpacity
              style={[
                styles.roleButton,
                role === UserRole.PATIENT && styles.roleButtonActive,
              ]}
              onPress={() => setRole(UserRole.PATIENT)}
            >
              <Ionicons
                name="person"
                size={24}
                color={role === UserRole.PATIENT ? '#FFFFFF' : Colors.primary}
              />
              <Text
                style={[
                  styles.roleButtonText,
                  role === UserRole.PATIENT && styles.roleButtonTextActive,
                ]}
              >
                Paciente
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleButton,
                role === UserRole.NUTRITIONIST && styles.roleButtonActive,
              ]}
              onPress={() => setRole(UserRole.NUTRITIONIST)}
            >
              <Ionicons
                name="medkit"
                size={24}
                color={role === UserRole.NUTRITIONIST ? '#FFFFFF' : Colors.primary}
              />
              <Text
                style={[
                  styles.roleButtonText,
                  role === UserRole.NUTRITIONIST && styles.roleButtonTextActive,
                ]}
              >
                Nutricionista
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.form}>
          <Input
            label="Nome completo *"
            placeholder="Seu nome"
            value={name}
            onChangeText={setName}
            error={nameError}
            icon="person-outline"
            autoCapitalize="words"
          />

          <Input
            label="Email *"
            placeholder="seu@email.com"
            value={email}
            onChangeText={setEmail}
            error={emailError}
            icon="mail-outline"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Telefone (opcional)"
            placeholder="(11) 98765-4321"
            value={phone}
            onChangeText={(text) => setPhone(formatPhone(text))}
            error={phoneError}
            icon="call-outline"
            keyboardType="phone-pad"
            maxLength={15}
          />

          <Input
            label="Senha *"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChangeText={setPassword}
            error={passwordError}
            icon="lock-closed-outline"
            isPassword
          />

          <Input
            label="Confirmar senha *"
            placeholder="Digite a senha novamente"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            error={confirmPasswordError}
            icon="lock-closed-outline"
            isPassword
          />

          <Button
            title="Criar Conta"
            onPress={handleRegister}
            loading={isLoading}
            style={styles.registerButton}
          />

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Já possui uma conta?</Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.loginLink}>Fazer login</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Termos */}
        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>
            Ao criar uma conta, você concorda com nossos{' '}
            <Text style={styles.termsLink}>Termos de Uso</Text> e{' '}
            <Text style={styles.termsLink}>Política de Privacidade</Text>
          </Text>
        </View>
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
  title: {
    ...Typography.h1,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body2,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  roleSelector: {
    marginBottom: Spacing.xl,
  },
  roleLabel: {
    ...Typography.body1,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
    textAlign: 'center',
    fontWeight: '600',
  },
  roleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: '#FFFFFF',
  },
  roleButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  roleButtonText: {
    ...Typography.body1,
    color: Colors.primary,
    marginLeft: Spacing.sm,
    fontWeight: '600',
  },
  roleButtonTextActive: {
    color: '#FFFFFF',
  },
  form: {
    width: '100%',
  },
  registerButton: {
    marginTop: Spacing.lg,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
    gap: Spacing.xs,
  },
  loginText: {
    ...Typography.body2,
    color: Colors.text.secondary,
  },
  loginLink: {
    ...Typography.body2,
    color: Colors.primary,
    fontWeight: '600',
  },
  termsContainer: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  termsText: {
    ...Typography.caption,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
