import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Typography, Spacing } from '@/src/constants';
import api from '@/src/config/api';

interface Patient {
  id: string;
  user: {
    name: string;
  };
}

export default function RegisterPaymentScreen() {
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [showPatientPicker, setShowPatientPicker] = useState(false);
  
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    amount: '',
    paymentMethod: 'PIX',
    proofNumber: '',
    category: 'CONSULTATION',
    description: '',
    notes: '',
  });

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const response = await api.get('/patients');
      setPatients(response.data);
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.patientId) {
        Alert.alert('Atenção', 'Selecione um paciente');
        return;
      }

      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        Alert.alert('Atenção', 'Informe um valor válido');
        return;
      }

      setLoading(true);

      const dataToSend = {
        patientId: formData.patientId,
        amount: parseFloat(formData.amount),
        paymentMethod: formData.paymentMethod,
        proofNumber: formData.proofNumber || null,
        category: formData.category,
        description: formData.description || null,
        notes: formData.notes || null,
      };

      const response = await api.post('/financial/transactions', dataToSend);

      Alert.alert('Sucesso', 'Pagamento registrado com sucesso!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Erro ao registrar pagamento:', error);
      Alert.alert('Erro', error.response?.data?.error || 'Não foi possível registrar o pagamento');
    } finally {
      setLoading(false);
    }
  };

  const selectPatient = (patient: Patient) => {
    setFormData({
      ...formData,
      patientId: patient.id,
      patientName: patient.user.name,
    });
    setShowPatientPicker(false);
  };

  const paymentMethods = [
    { value: 'PIX', label: 'PIX', icon: 'flash' },
    { value: 'CREDIT_CARD', label: 'Cartão de Crédito', icon: 'card' },
    { value: 'DEBIT_CARD', label: 'Cartão de Débito', icon: 'card-outline' },
    { value: 'CASH', label: 'Dinheiro', icon: 'cash' },
    { value: 'BANK_TRANSFER', label: 'Transferência', icon: 'swap-horizontal' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.inverse} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Registrar Pagamento</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados do Pagamento</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Paciente *</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowPatientPicker(!showPatientPicker)}
            >
              <Text style={formData.patientName ? styles.pickerButtonText : styles.pickerButtonPlaceholder}>
                {formData.patientName || 'Selecione o paciente'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={Colors.text.secondary} />
            </TouchableOpacity>
            
            {showPatientPicker && (
              <View style={styles.pickerList}>
                <ScrollView style={styles.pickerListScroll} nestedScrollEnabled>
                  {patients.map((patient) => (
                    <TouchableOpacity
                      key={patient.id}
                      style={styles.pickerItem}
                      onPress={() => selectPatient(patient)}
                    >
                      <Text style={styles.pickerItemText}>{patient.user.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Valor (R$) *</Text>
            <TextInput
              style={styles.input}
              value={formData.amount}
              onChangeText={(text) => setFormData({ ...formData, amount: text })}
              placeholder="0.00"
              placeholderTextColor={Colors.text.secondary}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Categoria</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={[styles.radioButton, formData.category === 'CONSULTATION' && styles.radioButtonActive]}
                onPress={() => setFormData({ ...formData, category: 'CONSULTATION' })}
              >
                <Text style={[styles.radioButtonText, formData.category === 'CONSULTATION' && styles.radioButtonTextActive]}>
                  Consulta
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.radioButton, formData.category === 'MEAL_PLAN' && styles.radioButtonActive]}
                onPress={() => setFormData({ ...formData, category: 'MEAL_PLAN' })}
              >
                <Text style={[styles.radioButtonText, formData.category === 'MEAL_PLAN' && styles.radioButtonTextActive]}>
                  Plano Alimentar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Método de Pagamento</Text>
          
          <View style={styles.paymentMethodsGrid}>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.value}
                style={[
                  styles.paymentMethodCard,
                  formData.paymentMethod === method.value && styles.paymentMethodCardActive,
                ]}
                onPress={() => setFormData({ ...formData, paymentMethod: method.value })}
              >
                <Ionicons
                  name={method.icon as any}
                  size={24}
                  color={formData.paymentMethod === method.value ? Colors.primary : Colors.text.secondary}
                />
                <Text style={[
                  styles.paymentMethodText,
                  formData.paymentMethod === method.value && styles.paymentMethodTextActive,
                ]}>
                  {method.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comprovante (Opcional)</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Número do Comprovante</Text>
            <TextInput
              style={styles.input}
              value={formData.proofNumber}
              onChangeText={(text) => setFormData({ ...formData, proofNumber: text })}
              placeholder="Ex: 123456789"
              placeholderTextColor={Colors.text.secondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descrição</Text>
            <TextInput
              style={styles.input}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Ex: Consulta retorno"
              placeholderTextColor={Colors.text.secondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Observações</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              placeholder="Observações adicionais"
              placeholderTextColor={Colors.text.secondary}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        <View style={styles.feeInfo}>
          <Ionicons name="information-circle" size={20} color={Colors.info} />
          <Text style={styles.feeInfoText}>
            10% do valor será destinado à taxa administrativa da plataforma
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Registrando...' : 'Registrar Pagamento'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </View>
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
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.text.inverse,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.body2,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
    fontWeight: '600',
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body1,
    color: Colors.text.primary,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: Spacing.sm,
  },
  pickerButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerButtonText: {
    ...Typography.body1,
    color: Colors.text.primary,
  },
  pickerButtonPlaceholder: {
    ...Typography.body1,
    color: Colors.text.secondary,
  },
  pickerList: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    marginTop: Spacing.xs,
    maxHeight: 200,
  },
  pickerListScroll: {
    maxHeight: 200,
  },
  pickerItem: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pickerItemText: {
    ...Typography.body1,
    color: Colors.text.primary,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  radioButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    alignItems: 'center',
  },
  radioButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  radioButtonText: {
    ...Typography.body2,
    color: Colors.text.secondary,
  },
  radioButtonTextActive: {
    color: Colors.text.inverse,
    fontWeight: '600',
  },
  paymentMethodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  paymentMethodCard: {
    width: '48%',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  paymentMethodCardActive: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: '#E3F2FD',
  },
  paymentMethodText: {
    ...Typography.body2,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  paymentMethodTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  feeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  feeInfoText: {
    flex: 1,
    ...Typography.body2,
    color: Colors.info,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    margin: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    ...Typography.button,
    color: Colors.text.inverse,
  },
});
