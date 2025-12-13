import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Loading } from '@/src/components/common';
import { Colors, Typography, Spacing } from '@/src/constants';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ScheduleScreen() {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    loadAppointments();
  }, [selectedDate]);

  const loadAppointments = async () => {
    setIsLoading(true);
    // TODO: Implementar busca de consultas da API
    setTimeout(() => {
      setAppointments([]);
      setIsLoading(false);
    }, 1000);
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
        <TouchableOpacity style={styles.dateButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <View style={styles.dateInfo}>
          <Text style={styles.dateText}>
            {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </Text>
        </View>
        <TouchableOpacity style={styles.dateButton}>
          <Ionicons name="chevron-forward" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {appointments.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={64} color={Colors.text.secondary} />
            <Text style={styles.emptyTitle}>Nenhuma consulta agendada</Text>
            <Text style={styles.emptyText}>
              Você não tem consultas marcadas para esta data
            </Text>
          </Card>
        ) : (
          appointments.map((appointment: any) => (
            <Card key={appointment.id} style={styles.appointmentCard}>
              <View style={styles.timeContainer}>
                <Ionicons name="time" size={20} color={Colors.primary} />
                <Text style={styles.timeText}>{appointment.time}</Text>
              </View>
              <View style={styles.appointmentInfo}>
                <Text style={styles.patientName}>{appointment.patientName}</Text>
                <Text style={styles.appointmentType}>{appointment.type}</Text>
                {appointment.notes && (
                  <Text style={styles.notes}>{appointment.notes}</Text>
                )}
              </View>
              <View style={styles.appointmentActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="call" size={20} color={Colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="chatbubble" size={20} color={Colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="ellipsis-vertical" size={20} color={Colors.text.secondary} />
                </TouchableOpacity>
              </View>
            </Card>
          ))
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
