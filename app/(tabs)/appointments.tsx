import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Loading } from '@/src/components/common';
import { Colors, Typography, Spacing } from '@/src/constants';
import { useAuthStore } from '@/src/store/authStore';
import api from '@/src/config/api';

interface Appointment {
  id: string;
  dateTime: string;
  type: string;
  status: string;
  notes?: string;
  nutritionist: {
    user: {
      name: string;
    };
  };
}

export default function AppointmentsScreen() {
  const { user } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/appointments');
      
      // Garantir que response.data é um array
      const data = Array.isArray(response.data) ? response.data : [];
      setAppointments(data);
    } catch (error: any) {
      console.error('Erro ao carregar consultas:', error);
      console.error('Detalhes:', error.response?.data);
      
      // Não mostrar alert se for 404 (sem consultas)
      if (error.response?.status !== 404) {
        Alert.alert(
          'Erro',
          error.response?.data?.error || 'Não foi possível carregar as consultas'
        );
      }
      
      // Definir array vazio em caso de erro
      setAppointments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadAppointments();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
      case 'AGENDADA':
        return Colors.info;
      case 'CONFIRMED':
      case 'CONFIRMADA':
        return Colors.success;
      case 'COMPLETED':
      case 'CONCLUIDA':
        return Colors.primary;
      case 'CANCELLED':
      case 'CANCELADA':
        return Colors.error;
      default:
        return Colors.text.secondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'Agendada';
      case 'CONFIRMED':
        return 'Confirmada';
      case 'COMPLETED':
        return 'Concluída';
      case 'CANCELLED':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const getTypeIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'ONLINE':
        return 'videocam';
      case 'PRESENCIAL':
        return 'location';
      case 'RETORNO':
        return 'repeat';
      default:
        return 'calendar';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const upcomingAppointments = appointments.filter(
    (apt) =>
      new Date(apt.dateTime) >= new Date() &&
      apt.status !== 'CANCELLED' &&
      apt.status !== 'COMPLETED'
  );

  const pastAppointments = appointments.filter(
    (apt) =>
      new Date(apt.dateTime) < new Date() ||
      apt.status === 'CANCELLED' ||
      apt.status === 'COMPLETED'
  );

  if (loading && !refreshing) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Minhas Consultas</Text>
          <Text style={styles.subtitle}>Acompanhe seus agendamentos</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {appointments.length === 0 ? (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyState}>
              <Ionicons
                name="calendar-outline"
                size={64}
                color={Colors.text.secondary}
              />
              <Text style={styles.emptyTitle}>Nenhuma Consulta</Text>
              <Text style={styles.emptyText}>
                Você ainda não possui consultas agendadas.
              </Text>
              <TouchableOpacity style={styles.scheduleButton}>
                <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                <Text style={styles.scheduleButtonText}>Agendar Consulta</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ) : (
          <>
            {/* Próximas Consultas */}
            {upcomingAppointments.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Próximas Consultas</Text>
                {upcomingAppointments.map((appointment) => (
                  <Card key={appointment.id} style={styles.appointmentCard}>
                    <View style={styles.appointmentHeader}>
                      <View
                        style={[
                          styles.iconContainer,
                          { backgroundColor: Colors.primary + '20' },
                        ]}
                      >
                        <Ionicons
                          name={getTypeIcon(appointment.type)}
                          size={24}
                          color={Colors.primary}
                        />
                      </View>
                      <View style={styles.appointmentInfo}>
                        <Text style={styles.appointmentType}>
                          Consulta {appointment.type}
                        </Text>
                        <Text style={styles.nutritionistName}>
                          {appointment.nutritionist.user.name}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor:
                              getStatusColor(appointment.status) + '20',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            { color: getStatusColor(appointment.status) },
                          ]}
                        >
                          {getStatusLabel(appointment.status)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.appointmentDetails}>
                      <View style={styles.detailRow}>
                        <Ionicons
                          name="calendar"
                          size={16}
                          color={Colors.text.secondary}
                        />
                        <Text style={styles.detailText}>
                          {formatDate(appointment.dateTime)}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Ionicons
                          name="time"
                          size={16}
                          color={Colors.text.secondary}
                        />
                        <Text style={styles.detailText}>
                          {formatTime(appointment.dateTime)}
                        </Text>
                      </View>
                    </View>

                    {appointment.notes && (
                      <View style={styles.notesContainer}>
                        <Text style={styles.notesLabel}>Observações:</Text>
                        <Text style={styles.notesText}>{appointment.notes}</Text>
                      </View>
                    )}

                    <View style={styles.appointmentActions}>
                      <TouchableOpacity style={styles.actionButton}>
                        <Ionicons
                          name="videocam"
                          size={18}
                          color={Colors.primary}
                        />
                        <Text style={styles.actionButtonText}>Entrar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionButton}>
                        <Ionicons
                          name="calendar-clear"
                          size={18}
                          color={Colors.error}
                        />
                        <Text style={[styles.actionButtonText, { color: Colors.error }]}>
                          Remarcar
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </Card>
                ))}
              </>
            )}

            {/* Histórico */}
            {pastAppointments.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Histórico</Text>
                {pastAppointments.map((appointment) => (
                  <Card key={appointment.id} style={styles.appointmentCard}>
                    <View style={styles.appointmentHeader}>
                      <View
                        style={[
                          styles.iconContainer,
                          { backgroundColor: Colors.text.secondary + '20' },
                        ]}
                      >
                        <Ionicons
                          name={getTypeIcon(appointment.type)}
                          size={24}
                          color={Colors.text.secondary}
                        />
                      </View>
                      <View style={styles.appointmentInfo}>
                        <Text style={styles.appointmentType}>
                          Consulta {appointment.type}
                        </Text>
                        <Text style={styles.nutritionistName}>
                          {appointment.nutritionist.user.name}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor:
                              getStatusColor(appointment.status) + '20',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            { color: getStatusColor(appointment.status) },
                          ]}
                        >
                          {getStatusLabel(appointment.status)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.appointmentDetails}>
                      <View style={styles.detailRow}>
                        <Ionicons
                          name="calendar"
                          size={16}
                          color={Colors.text.secondary}
                        />
                        <Text style={styles.detailText}>
                          {formatDate(appointment.dateTime)}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Ionicons
                          name="time"
                          size={16}
                          color={Colors.text.secondary}
                        />
                        <Text style={styles.detailText}>
                          {formatTime(appointment.dateTime)}
                        </Text>
                      </View>
                    </View>
                  </Card>
                ))}
              </>
            )}
          </>
        )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    ...Typography.h2,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body2,
    color: Colors.text.secondary,
  },
  refreshButton: {
    padding: Spacing.sm,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  appointmentCard: {
    marginBottom: Spacing.md,
  },
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentType: {
    ...Typography.h4,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  nutritionistName: {
    ...Typography.body2,
    color: Colors.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  statusText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  appointmentDetails: {
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  detailText: {
    ...Typography.body2,
    color: Colors.text.secondary,
    marginLeft: Spacing.sm,
    textTransform: 'capitalize',
  },
  notesContainer: {
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.md,
  },
  notesLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
    fontWeight: '600',
  },
  notesText: {
    ...Typography.body2,
    color: Colors.text.primary,
    lineHeight: 20,
  },
  appointmentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionButtonText: {
    ...Typography.body2,
    color: Colors.primary,
    marginLeft: Spacing.xs,
    fontWeight: '600',
  },
  emptyCard: {
    marginTop: Spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.text.primary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    ...Typography.body1,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 8,
  },
  scheduleButtonText: {
    ...Typography.button,
    color: '#FFFFFF',
    marginLeft: Spacing.sm,
  },
});
