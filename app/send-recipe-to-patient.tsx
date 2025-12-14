import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors, Typography, Spacing } from '@/src/constants';
import { useAuthStore } from '@/src/store/authStore';
import api from '@/src/config/api';

interface Patient {
  id: string;
  name: string;
  email: string;
  cpf: string;
}

const MEAL_CATEGORIES = [
  { value: 'BREAKFAST', label: 'Café da Manhã', time: '08:00', icon: 'sunny' },
  { value: 'MORNING_SNACK', label: 'Lanche da Manhã', time: '10:00', icon: 'cafe' },
  { value: 'LUNCH', label: 'Almoço', time: '12:00', icon: 'restaurant' },
  { value: 'AFTERNOON_SNACK', label: 'Lanche da Tarde', time: '15:00', icon: 'ice-cream' },
  { value: 'DINNER', label: 'Jantar', time: '19:00', icon: 'moon' },
  { value: 'EVENING_SNACK', label: 'Ceia', time: '21:00', icon: 'star' },
];

export default function SendRecipeToPatientScreen() {
  const { recipeId, recipeName } = useLocalSearchParams<{ recipeId: string; recipeName: string }>();
  const { user } = useAuthStore();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState('LUNCH');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      if (!user?.id) return;
      
      const response = await api.get(`/patients/nutritionist/${user.id}`);
      setPatients(response.data.patients || []);
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error);
      Alert.alert('Erro', 'Não foi possível carregar a lista de pacientes');
    }
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleSendRecipe = async () => {
    if (!selectedPatient) {
      Alert.alert('Atenção', 'Selecione um paciente');
      return;
    }

    try {
      setLoading(true);

      const selectedMeal = MEAL_CATEGORIES.find(m => m.value === selectedCategory);
      
      await api.post(`/meal-plans/${selectedPatient}/add-recipe`, {
        recipeId,
        date: selectedDate.toISOString(),
        mealCategory: selectedCategory,
        time: selectedMeal?.time || '12:00',
      });

      Alert.alert('Sucesso', 'Receita adicionada ao plano alimentar do paciente!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Erro ao enviar receita:', error);
      Alert.alert(
        'Erro',
        error.response?.data?.error || 'Não foi possível adicionar a receita ao plano'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Enviar Receita</Text>
          <Text style={styles.headerSubtitle}>{recipeName}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Selecione o Paciente</Text>
        {patients.map((patient) => (
          <TouchableOpacity
            key={patient.id}
            style={[
              styles.optionCard,
              selectedPatient === patient.id && styles.optionCardSelected,
            ]}
            onPress={() => setSelectedPatient(patient.id)}
          >
            <View style={styles.radioButton}>
              {selectedPatient === patient.id && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>{patient.name}</Text>
              <Text style={styles.optionSubtitle}>{patient.email}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {patients.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={Colors.text.secondary} />
            <Text style={styles.emptyText}>Nenhum paciente encontrado</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Refeição</Text>
        <View style={styles.mealCategoriesGrid}>
          {MEAL_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.value}
              style={[
                styles.categoryCard,
                selectedCategory === category.value && styles.categoryCardSelected,
              ]}
              onPress={() => setSelectedCategory(category.value)}
            >
              <Ionicons
                name={category.icon as any}
                size={24}
                color={
                  selectedCategory === category.value
                    ? Colors.primary
                    : Colors.text.secondary
                }
              />
              <Text
                style={[
                  styles.categoryLabel,
                  selectedCategory === category.value && styles.categoryLabelSelected,
                ]}
              >
                {category.label}
              </Text>
              <Text style={styles.categoryTime}>{category.time}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Data</Text>
        <TouchableOpacity
          style={styles.dateSelector}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar" size={24} color={Colors.primary} />
          <View style={styles.dateSelectorContent}>
            <Text style={styles.dateSelectorLabel}>Data da refeição</Text>
            <Text style={styles.dateSelectorValue}>
              {selectedDate.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={20} color={Colors.text.secondary} />
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={handleDateChange}
          />
        )}

        <TouchableOpacity
          style={[styles.sendButton, (!selectedPatient || loading) && styles.buttonDisabled]}
          onPress={handleSendRecipe}
          disabled={!selectedPatient || loading}
        >
          <Ionicons name="send" size={20} color="#FFFFFF" />
          <Text style={styles.sendButtonText}>
            {loading ? 'Enviando...' : 'Adicionar ao Plano'}
          </Text>
        </TouchableOpacity>
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
    paddingHorizontal: Spacing.md,
    paddingTop: 40,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    marginRight: Spacing.md,
    padding: Spacing.xs,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.text.primary,
  },
  headerSubtitle: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.text.primary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  optionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    ...Typography.body1,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  optionSubtitle: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    ...Typography.body2,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  },
  mealCategoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  categoryCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  categoryLabel: {
    ...Typography.body2,
    color: Colors.text.primary,
    marginTop: Spacing.xs,
    textAlign: 'center',
    fontWeight: '600',
  },
  categoryLabelSelected: {
    color: Colors.primary,
  },
  categoryTime: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateSelectorContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  dateSelectorLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  dateSelectorValue: {
    ...Typography.body1,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 2,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sendButtonText: {
    ...Typography.button,
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
