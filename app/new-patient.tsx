import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/constants';
import { useAuthStore } from '../src/store/authStore';
import patientService from '../src/services/patient.service';

export default function NewPatientScreen() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // Dados Pessoais
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [rg, setRg] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  // Endereço
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');

  // Dados Antropométricos
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');

  // Dados Clínicos
  const [allergies, setAllergies] = useState('');
  const [medications, setMedications] = useState('');
  const [chronicDiseases, setChronicDiseases] = useState('');

  // Objetivos
  const [goals, setGoals] = useState('');
  const [observations, setObservations] = useState('');

  const handleSubmit = async () => {
    // Validações básicas
    if (!name || !email || !phone) {
      Alert.alert('Erro', 'Preencha os campos obrigatórios: Nome, E-mail e Telefone');
      return;
    }

    setLoading(true);

    try {
      // TODO: Primeiro criar o usuário, depois criar o paciente
      // Por enquanto, vamos supor que o userId existe
      const patientData = {
        userId: 'temp-user-id', // TODO: Criar usuário primeiro
        nutritionistId: user?.id || '',
        cpf,
        rg,
        birthDate,
        gender,
        phone,
        emergencyContact,
        emergencyPhone,
        address,
        city,
        state,
        zipCode,
        weight: weight ? parseFloat(weight) : undefined,
        height: height ? parseFloat(height) : undefined,
        allergies,
        medications,
        chronicDiseases,
        goals,
        observations,
      };

      await patientService.createPatient(patientData);
      Alert.alert('Sucesso', 'Paciente cadastrado com sucesso!');
      router.back();
    } catch (error: any) {
      console.error('Error creating patient:', error);
      Alert.alert('Erro', 'Falha ao cadastrar paciente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Novo Paciente</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Dados Pessoais */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados Pessoais</Text>

          <Text style={styles.label}>Nome Completo *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Digite o nome completo"
            placeholderTextColor={Colors.text.secondary}
          />

          <Text style={styles.label}>E-mail *</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Digite o e-mail"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={Colors.text.secondary}
          />

          <Text style={styles.label}>Telefone *</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="(00) 00000-0000"
            keyboardType="phone-pad"
            placeholderTextColor={Colors.text.secondary}
          />

          <Text style={styles.label}>CPF</Text>
          <TextInput
            style={styles.input}
            value={cpf}
            onChangeText={setCpf}
            placeholder="000.000.000-00"
            keyboardType="number-pad"
            placeholderTextColor={Colors.text.secondary}
          />

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>RG</Text>
              <TextInput
                style={styles.input}
                value={rg}
                onChangeText={setRg}
                placeholder="00.000.000-0"
                placeholderTextColor={Colors.text.secondary}
              />
            </View>

            <View style={styles.halfInput}>
              <Text style={styles.label}>Data de Nascimento</Text>
              <TextInput
                style={styles.input}
                value={birthDate}
                onChangeText={setBirthDate}
                placeholder="DD/MM/AAAA"
                placeholderTextColor={Colors.text.secondary}
              />
            </View>
          </View>
        </View>

        {/* Endereço */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Endereço</Text>

          <Text style={styles.label}>Endereço</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="Rua, número, complemento"
            placeholderTextColor={Colors.text.secondary}
          />

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Cidade</Text>
              <TextInput
                style={styles.input}
                value={city}
                onChangeText={setCity}
                placeholder="Cidade"
                placeholderTextColor={Colors.text.secondary}
              />
            </View>

            <View style={styles.quarterInput}>
              <Text style={styles.label}>UF</Text>
              <TextInput
                style={styles.input}
                value={state}
                onChangeText={setState}
                placeholder="UF"
                maxLength={2}
                autoCapitalize="characters"
                placeholderTextColor={Colors.text.secondary}
              />
            </View>

            <View style={styles.quarterInput}>
              <Text style={styles.label}>CEP</Text>
              <TextInput
                style={styles.input}
                value={zipCode}
                onChangeText={setZipCode}
                placeholder="00000-000"
                keyboardType="number-pad"
                placeholderTextColor={Colors.text.secondary}
              />
            </View>
          </View>
        </View>

        {/* Dados Antropométricos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados Antropométricos</Text>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Peso (kg)</Text>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                placeholder="0.0"
                keyboardType="decimal-pad"
                placeholderTextColor={Colors.text.secondary}
              />
            </View>

            <View style={styles.halfInput}>
              <Text style={styles.label}>Altura (cm)</Text>
              <TextInput
                style={styles.input}
                value={height}
                onChangeText={setHeight}
                placeholder="0.0"
                keyboardType="decimal-pad"
                placeholderTextColor={Colors.text.secondary}
              />
            </View>
          </View>
        </View>

        {/* Dados Clínicos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados Clínicos</Text>

          <Text style={styles.label}>Alergias</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={allergies}
            onChangeText={setAllergies}
            placeholder="Liste as alergias conhecidas"
            multiline
            numberOfLines={3}
            placeholderTextColor={Colors.text.secondary}
          />

          <Text style={styles.label}>Medicamentos em Uso</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={medications}
            onChangeText={setMedications}
            placeholder="Liste os medicamentos"
            multiline
            numberOfLines={3}
            placeholderTextColor={Colors.text.secondary}
          />

          <Text style={styles.label}>Doenças Crônicas</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={chronicDiseases}
            onChangeText={setChronicDiseases}
            placeholder="Liste as doenças crônicas"
            multiline
            numberOfLines={3}
            placeholderTextColor={Colors.text.secondary}
          />
        </View>

        {/* Objetivos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Objetivos e Observações</Text>

          <Text style={styles.label}>Objetivos</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={goals}
            onChangeText={setGoals}
            placeholder="Descreva os objetivos do paciente"
            multiline
            numberOfLines={4}
            placeholderTextColor={Colors.text.secondary}
          />

          <Text style={styles.label}>Observações</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={observations}
            onChangeText={setObservations}
            placeholder="Observações adicionais"
            multiline
            numberOfLines={4}
            placeholderTextColor={Colors.text.secondary}
          />
        </View>

        {/* Botão de Salvar */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Salvando...' : 'Salvar Paciente'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text.primary,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    backgroundColor: Colors.surface,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text.primary,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text.primary,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text.primary,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 1,
    marginRight: 8,
  },
  quarterInput: {
    flex: 0.45,
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    margin: 16,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
