import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Card, Loading } from '@/src/components/common';
import { Colors, Typography, Spacing } from '@/src/constants';
import { format, addDays, subDays, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppointmentService } from '@/src/services/appointment.service';
import { Appointment } from '@/src/types';

export default function ScheduleScreen() {
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    loadAppointments();
  }, []);

  useEffect(() => {
    filterAppointmentsByDate();
  }, [selectedDate, allAppointments]);

  const loadAppointments = async () => {
    try {
      setIsLoading(true);
      const data = await AppointmentService.getAppointments();
      console.log('Appointments loaded:', data?.length || 0, 'appointments');
      setAllAppointments(data || []);
    } catch (error: any) {
      console.error('Error loading appointments:', error);
      console.error('Error details:', error?.response?.data || error?.message);
      if (!error?.isAuthError) {
        Alert.alert(
          'Erro', 
          error?.response?.data?.error || error?.message || 'Não foi possível carregar as consultas'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const filterAppointmentsByDate = () => {
    const filtered = allAppointments.filter((appointment) => {
      const appointmentDate = parseISO(appointment.dateTime);
      return isSameDay(appointmentDate, selectedDate);
    });
    
    // Ordenar por horário
    filtered.sort((a, b) => {
      const dateA = parseISO(a.dateTime);
      const dateB = parseISO(b.dateTime);
      return dateA.getTime() - dateB.getTime();
    });
    
    setFilteredAppointments(filtered);
  };

  const handlePreviousDay = () => {
    setSelectedDate((prev) => subDays(prev, 1));
  };

  const handleNextDay = () => {
    setSelectedDate((prev) => addDays(prev, 1));
  };

  const getAppointmentTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      ONLINE: 'Online',
      PRESENCIAL: 'Presencial',
      RETORNO: 'Retorno',
    };
    return types[type] || type;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      SCHEDULED: Colors.info,
      CONFIRMED: Colors.success,
      IN_PROGRESS: Colors.warning,
      COMPLETED: Colors.text.secondary,
      CANCELLED: Colors.error,
      NO_SHOW: Colors.error,
    };
    return colors[status] || Colors.text.secondary;
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Agenda</Text>
        <Text style={styles.subtitle}>Gerencie suas consultas</Text>
      </View>

      <View style={styles.dateSelector}>
        <TouchableOpacity style={styles.dateButton} onPress={handlePreviousDay}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <View style={styles.dateInfo}>
          <Text style={styles.dateText}>
            {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </Text>
        </View>
        <TouchableOpacity style={styles.dateButton} onPress={handleNextDay}>
          <Ionicons name="chevron-forward" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredAppointments.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={64} color={Colors.text.secondary} />
            <Text style={styles.emptyTitle}>Nenhuma consulta agendada</Text>
            <Text style={styles.emptyText}>
              Você não tem consultas marcadas para esta data
            </Text>
          </Card>
        ) : (
          filteredAppointments.map((appointment) => {
            const appointmentDate = parseISO(appointment.dateTime);
            const statusColor = getStatusColor(appointment.status);
            const patientName = appointment.patient?.user?.name || 'Paciente não identificado';
            
            return (
              <Card key={appointment.id} style={styles.appointmentCard}>
                <View style={styles.timeContainer}>
                  <Ionicons name="time" size={20} color={Colors.primary} />
                  <Text style={styles.timeText}>
                    {format(appointmentDate, 'HH:mm')}
                  </Text>
                </View>
                <View style={styles.appointmentInfo}>
                  <Text style={styles.patientName}>
                    {patientName}
                  </Text>
                  <View style={styles.appointmentMeta}>
                    <View style={[styles.typeBadge, { backgroundColor: Colors.primaryLight }]}>
                      <Text style={styles.typeBadgeText}>
                        {getAppointmentTypeLabel(appointment.type)}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
                      <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                      <Text style={[styles.statusText, { color: statusColor }]}>
                        {appointment.status}
                      </Text>
                    </View>
                  </View>
                  {appointment.notes && (
                    <Text style={styles.notes} numberOfLines={2}>
                      {appointment.notes}
                    </Text>
                  )}
                </View>
                <View style={styles.appointmentActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={async () => {
                      try {
                        // Se já tem conversa, navegar diretamente
                        if (appointment.conversation) {
                          router.push(`/chat/${appointment.conversation.id}`);
                        } else {
                          // Criar conversa para a consulta
                          Alert.alert(
                            'Iniciar Consulta',
                            'Deseja abrir a sala de conversa para esta consulta?',
                            [
                              { text: 'Cancelar', style: 'cancel' },
                              {
                                text: 'Abrir',
                                onPress: async () => {
                                  try {
                                    const response = await AppointmentService.createConversationForAppointment(appointment.id);
                                    if (response.conversationId) {
                                      router.push(`/chat/${response.conversationId}`);
                                    }
                                  } catch (error: any) {
                                    Alert.alert('Erro', 'Não foi possível abrir a conversa');
                                  }
                                },
                              },
                            ]
                          );
                        }
                      } catch (error) {
                        console.error('Error opening chat:', error);
                      }
                    }}
                  >
                    <Ionicons 
                      name={appointment.conversation ? "chatbubble" : "chatbubble-outline"} 
                      size={20} 
                      color={appointment.conversation ? Colors.primary : Colors.text.secondary} 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => router.push('/(tabs)/appointments')}
                  >
                    <Ionicons name="ellipsis-vertical" size={20} color={Colors.text.secondary} />
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={28} color={Colors.text.inverse} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.primary,
    padding: Spacing.lg,
    paddingTop: Spacing.xl + 20,
  },
  title: {
    ...Typography.h2,
    color: Colors.text.inverse,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body2,
    color: Colors.text.inverse,
    opacity: 0.9,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    margin: Spacing.md,
    padding: Spacing.md,
    borderRadius: 8,
    elevation: 2,
  },
  dateButton: {
    padding: Spacing.xs,
  },
  dateInfo: {
    flex: 1,
    alignItems: 'center',
  },
  dateText: {
    ...Typography.h4,
    color: Colors.text.primary,
    textTransform: 'capitalize',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  emptyCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    marginTop: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.text.primary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    ...Typography.body2,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  appointmentCard: {
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginRight: Spacing.md,
    minWidth: 80,
  },
  timeText: {
    ...Typography.h4,
    color: Colors.text.primary,
  },
  appointmentInfo: {
    flex: 1,
  },
  patientName: {
    ...Typography.h4,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  appointmentMeta: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
    flexWrap: 'wrap',
  },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 11,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    ...Typography.caption,
    fontWeight: '600',
    fontSize: 11,
  },
  appointmentType: {
    ...Typography.body2,
    color: Colors.text.secondary,
  },
  notes: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  appointmentActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    padding: Spacing.xs,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.lg,
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
