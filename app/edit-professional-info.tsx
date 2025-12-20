import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '@/src/store/authStore';
import { Colors, Typography, Spacing } from '@/src/constants';
import api from '@/src/config/api';

export default function EditProfessionalInfoScreen() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [isNutritionist, setIsNutritionist] = useState(false);
  
  const [formData, setFormData] = useState({
    specialization: '',
    crn: '',
    bio: '',
    graduationInstitution: '',
    graduationYear: '',
    postGraduations: '',
    certifications: '',
    professionalExperience: '',
    serviceAreas: '',
    clinicalAddress: '',
  });

  useEffect(() => {
    checkAndLoadData();
  }, []);

  const checkAndLoadData = async () => {
    // Verificar se o usuário é nutricionista
    if (user?.role !== 'NUTRITIONIST' && user?.role !== 'ADMIN') {
      Alert.alert(
        'Acesso Negado',
        'Apenas nutricionistas podem acessar esta funcionalidade',
        [{ text: 'OK', onPress: () => router.back() }]
      );
      setLoadingData(false);
      return;
    }

    // Admin pode não ter dados de nutricionista
    if (user?.role === 'ADMIN') {
      Alert.alert(
        'Informação',
        'Perfil de administrador não possui dados profissionais de nutricionista. Esta tela é apenas para nutricionistas.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
      setLoadingData(false);
      return;
    }

    setIsNutritionist(true);
    await loadProfessionalData();
  };

  const loadProfessionalData = async () => {
    try {
      setLoadingData(true);
      const response = await api.get('/nutritionists/me');
      const data = response.data;
      
      setFormData({
        specialization: data.specialization || '',
        crn: data.crn || '',
        bio: data.bio || '',
        graduationInstitution: data.graduationInstitution || '',
        graduationYear: data.graduationYear?.toString() || '',
        postGraduations: data.postGraduations || '',
        certifications: data.certifications || '',
        professionalExperience: data.professionalExperience || '',
        serviceAreas: data.serviceAreas || '',
        clinicalAddress: data.clinicalAddress || '',
      });
    } catch (error: any) {
      console.error('Erro ao carregar dados profissionais:', error);
      const errorMsg = error.response?.status === 404 
        ? 'Nutricionista não encontrado no sistema' 
        : 'Não foi possível carregar os dados profissionais';
      
      Alert.alert('Erro', errorMsg, [
        { text: 'Voltar', onPress: () => router.back() }
      ]);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // Validações básicas
      if (!formData.crn.trim()) {
        Alert.alert('Atenção', 'CRN é obrigatório');
        return;
      }

      // Preparar dados
      const dataToSend = {
        ...formData,
        graduationYear: formData.graduationYear ? parseInt(formData.graduationYear) : null,
      };

      // Atualizar no backend
      await api.put('/nutritionists/professional-info', dataToSend);

      Alert.alert('Sucesso', 'Dados profissionais atualizados com sucesso!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Erro ao atualizar dados profissionais:', error);
      Alert.alert('Erro', error.response?.data?.error || 'Não foi possível atualizar os dados profissionais');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.inverse} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dados Profissionais</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Registro e Especialização</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>CRN (Registro Profissional) *</Text>
            <TextInput
              style={styles.input}
              value={formData.crn}
              onChangeText={(text) => setFormData({ ...formData, crn: text })}
              placeholder="Ex: CRN 12345/SP"
              placeholderTextColor={Colors.text.secondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Especialização</Text>
            <TextInput
              style={styles.input}
              value={formData.specialization}
              onChangeText={(text) => setFormData({ ...formData, specialization: text })}
              placeholder="Ex: Nutrição Esportiva, Clínica"
              placeholderTextColor={Colors.text.secondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Biografia Profissional</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.bio}
              onChangeText={(text) => setFormData({ ...formData, bio: text })}
              placeholder="Descreva sua experiência e abordagem profissional"
              placeholderTextColor={Colors.text.secondary}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Formação Acadêmica</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Instituição de Graduação</Text>
            <TextInput
              style={styles.input}
              value={formData.graduationInstitution}
              onChangeText={(text) => setFormData({ ...formData, graduationInstitution: text })}
              placeholder="Nome da universidade"
              placeholderTextColor={Colors.text.secondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ano de Conclusão</Text>
            <TextInput
              style={styles.input}
              value={formData.graduationYear}
              onChangeText={(text) => setFormData({ ...formData, graduationYear: text })}
              placeholder="2020"
              placeholderTextColor={Colors.text.secondary}
              keyboardType="numeric"
              maxLength={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pós-Graduações</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.postGraduations}
              onChangeText={(text) => setFormData({ ...formData, postGraduations: text })}
              placeholder="Liste suas pós-graduações (uma por linha)"
              placeholderTextColor={Colors.text.secondary}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Certificações</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.certifications}
              onChangeText={(text) => setFormData({ ...formData, certifications: text })}
              placeholder="Certificados, cursos e especializações"
              placeholderTextColor={Colors.text.secondary}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experiência e Atendimento</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Experiência Profissional</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.professionalExperience}
              onChangeText={(text) => setFormData({ ...formData, professionalExperience: text })}
              placeholder="Descreva sua experiência profissional"
              placeholderTextColor={Colors.text.secondary}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Áreas de Atendimento</Text>
            <TextInput
              style={styles.input}
              value={formData.serviceAreas}
              onChangeText={(text) => setFormData({ ...formData, serviceAreas: text })}
              placeholder="Ex: Emagrecimento, Hipertrofia, Diabetes"
              placeholderTextColor={Colors.text.secondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Endereço do Consultório</Text>
            <TextInput
              style={styles.input}
              value={formData.clinicalAddress}
              onChangeText={(text) => setFormData({ ...formData, clinicalAddress: text })}
              placeholder="Endereço completo do consultório"
              placeholderTextColor={Colors.text.secondary}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Salvando...' : 'Salvar Alterações'}
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
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: Spacing.sm,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    margin: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    ...Typography.button,
    color: Colors.text.inverse,
  },
});
