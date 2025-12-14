import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors, Typography, Spacing } from '@/src/constants';
import { useAuthStore } from '@/src/store/authStore';
import api from '@/src/config/api';

interface Nutritionist {
  id: string;
  specialties: string[];
  crn: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
}

interface TimeSlot {
  hour: string;
  available: boolean;
}

const APPOINTMENT_TYPES = [
  { value: 'ONLINE', label: 'Online', icon: 'videocam' },
  { value: 'PRESENCIAL', label: 'Presencial', icon: 'location' },
  { value: 'RETORNO', label: 'Retorno', icon: 'repeat' },
];

export default function ScheduleAppointmentScreen() {
  const { user } = useAuthStore();
  const [step, setStep] = useState(1);
  const [nutritionists, setNutritionists] = useState<Nutritionist[]>([]);
  const [selectedNutritionist, setSelectedNutritionist] = useState<string>('');
  const [selectedType, setSelectedType] = useState('ONLINE');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');

  // Horários disponíveis (8h às 18h, de hora em hora)
  const timeSlots: TimeSlot[] = [
    { hour: '08:00', available: true },
    { hour: '09:00', available: true },
    { hour: '10:00', available: true },
    { hour: '11:00', available: true },
    { hour: '12:00', available: false },
    { hour: '13:00', available: true },
    { hour: '14:00', available: true },
    { hour: '15:00', available: true },
    { hour: '16:00', available: true },
    { hour: '17:00', available: true },
    { hour: '18:00', available: true },
  ];

  useEffect(() => {
    loadNutritionists();
  }, []);

  const loadNutritionists = async () => {
    try {
      const response = await api.get('/nutritionists/list');
      setNutritionists(response.data);
    } catch (error) {
      console.error('Erro ao carregar nutricionistas:', error);
      Alert.alert('Erro', 'Não foi possível carregar a lista de nutricionistas');
    }
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleSchedule = async () => {
    if (!selectedNutritionist || !selectedDate || !selectedTime) {
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setLoading(true);

      // Combinar data e hora
      const [hours, minutes] = selectedTime.split(':');
      const appointmentDate = new Date(selectedDate);
      appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      await api.post('/appointments', {
        nutritionistId: selectedNutritionist,
        dateTime: appointmentDate.toISOString(),
        type: selectedType,
        notes: notes || undefined,
      });

      Alert.alert('Sucesso', 'Consulta agendada com sucesso!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Erro ao agendar consulta:', error);
      Alert.alert(
        'Erro',
        error.response?.data?.error || 'Não foi possível agendar a consulta'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Selecione o Nutricionista</Text>
      <Text style={styles.stepDescription}>
        Escolha o profissional para sua consulta
      </Text>

      {nutritionists.map((nutritionist) => (
        <TouchableOpacity
          key={nutritionist.id}
          style={[
            styles.optionCard,
            selectedNutritionist === nutritionist.id && styles.optionCardSelected,
          ]}
          onPress={() => setSelectedNutritionist(nutritionist.id)}
        >
          <View style={styles.radioButton}>
            {selectedNutritionist === nutritionist.id && (
              <View style={styles.radioButtonInner} />
            )}
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>{nutritionist.user.name}</Text>
            <Text style={styles.optionSubtitle}>CRN: {nutritionist.crn}</Text>
            {nutritionist.specialties && nutritionist.specialties.length > 0 && (
              <Text style={styles.optionDescription}>
                {nutritionist.specialties.join(', ')}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={[styles.nextButton, !selectedNutritionist && styles.buttonDisabled]}
        onPress={() => setStep(2)}
        disabled={!selectedNutritionist}
      >
        <Text style={styles.nextButtonText}>Continuar</Text>
        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Tipo de Consulta</Text>
      <Text style={styles.stepDescription}>Como deseja realizar a consulta?</Text>

      {APPOINTMENT_TYPES.map((type) => (
        <TouchableOpacity
          key={type.value}
          style={[
            styles.optionCard,
            selectedType === type.value && styles.optionCardSelected,
          ]}
          onPress={() => setSelectedType(type.value)}
        >
          <View style={styles.radioButton}>
            {selectedType === type.value && <View style={styles.radioButtonInner} />}
          </View>
          <Ionicons
            name={type.icon as any}
            size={24}
            color={selectedType === type.value ? Colors.primary : Colors.text.secondary}
            style={styles.optionIcon}
          />
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>{type.label}</Text>
          </View>
        </TouchableOpacity>
      ))}

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
          <Ionicons name="arrow-back" size={20} color={Colors.primary} />
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={() => setStep(3)}>
          <Text style={styles.nextButtonText}>Continuar</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Data e Horário</Text>
      <Text style={styles.stepDescription}>Escolha o melhor momento para você</Text>

      <TouchableOpacity
        style={styles.dateSelector}
        onPress={() => setShowDatePicker(true)}
      >
        <Ionicons name="calendar" size={24} color={Colors.primary} />
        <View style={styles.dateSelectorContent}>
          <Text style={styles.dateSelectorLabel}>Data</Text>
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

      <Text style={styles.timeSlotsTitle}>Horários Disponíveis</Text>
      <View style={styles.timeSlotsGrid}>
        {timeSlots.map((slot) => (
          <TouchableOpacity
            key={slot.hour}
            style={[
              styles.timeSlot,
              selectedTime === slot.hour && styles.timeSlotSelected,
              !slot.available && styles.timeSlotDisabled,
            ]}
            onPress={() => slot.available && setSelectedTime(slot.hour)}
            disabled={!slot.available}
          >
            <Text
              style={[
                styles.timeSlotText,
                selectedTime === slot.hour && styles.timeSlotTextSelected,
                !slot.available && styles.timeSlotTextDisabled,
              ]}
            >
              {slot.hour}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => setStep(2)}>
          <Ionicons name="arrow-back" size={20} color={Colors.primary} />
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.nextButton, !selectedTime && styles.buttonDisabled]}
          onPress={handleSchedule}
          disabled={!selectedTime || loading}
        >
          <Text style={styles.nextButtonText}>
            {loading ? 'Agendando...' : 'Confirmar'}
          </Text>
          <Ionicons name="checkmark" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Agendar Consulta</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.progressBar}>
        {[1, 2, 3].map((s) => (
          <View
            key={s}
            style={[styles.progressStep, step >= s && styles.progressStepActive]}
          />
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
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
    paddingHorizontal: Spacing.md,
    paddingTop: 40,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.text.primary,
  },
  progressBar: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: Colors.primary,
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    padding: Spacing.md,
  },
  stepTitle: {
    ...Typography.h2,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  stepDescription: {
    ...Typography.body2,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
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
  optionIcon: {
    marginRight: Spacing.sm,
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
  optionDescription: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 4,
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
  timeSlotsTitle: {
    ...Typography.body1,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  timeSlot: {
    width: '30%',
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  timeSlotSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  timeSlotDisabled: {
    backgroundColor: Colors.background,
    borderColor: Colors.border,
    opacity: 0.5,
  },
  timeSlotText: {
    ...Typography.body2,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  timeSlotTextSelected: {
    color: '#FFFFFF',
  },
  timeSlotTextDisabled: {
    color: Colors.text.secondary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    gap: Spacing.sm,
  },
  nextButtonText: {
    ...Typography.button,
    color: '#FFFFFF',
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: Spacing.sm,
  },
  backButtonText: {
    ...Typography.button,
    color: Colors.primary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
