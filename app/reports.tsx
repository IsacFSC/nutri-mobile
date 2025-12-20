import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Typography, Spacing } from '@/src/constants';
import { useAuthStore } from '@/src/store/authStore';
import api from '@/src/config/api';

type ReportPeriod = 'day' | 'month' | 'year';

interface AppointmentStats {
  total: number;
  completed: number;
  cancelled: number;
  pending: number;
  patients: Array<{
    patientName: string;
    appointmentDate: string;
    status: string;
  }>;
}

export default function ReportsScreen() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<ReportPeriod>('month');
  const [stats, setStats] = useState<AppointmentStats | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    loadStats();
  }, [period, selectedDate]);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        period,
        date: selectedDate.toISOString(),
      });

      const response = await api.get(`/reports/appointments?${params}`);
      setStats(response.data);
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return Colors.success;
      case 'CANCELLED':
        return Colors.error;
      case 'SCHEDULED':
        return Colors.info;
      default:
        return Colors.text.secondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Realizada';
      case 'CANCELLED':
        return 'Cancelada';
      case 'SCHEDULED':
        return 'Agendada';
      default:
        return status;
    }
  };

  const getPeriodLabel = () => {
    const options: Intl.DateTimeFormatOptions = {};
    
    if (period === 'day') {
      return selectedDate.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      });
    } else if (period === 'month') {
      return selectedDate.toLocaleDateString('pt-BR', { 
        month: 'long', 
        year: 'numeric' 
      });
    } else {
      return selectedDate.getFullYear().toString();
    }
  };

  const changeDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    
    if (period === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (period === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else {
      newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
    }
    
    setSelectedDate(newDate);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.inverse} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Relatórios de Atendimento</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.periodSelector}>
        <TouchableOpacity
          style={[styles.periodButton, period === 'day' && styles.periodButtonActive]}
          onPress={() => setPeriod('day')}
        >
          <Text style={[styles.periodButtonText, period === 'day' && styles.periodButtonTextActive]}>
            Dia
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodButton, period === 'month' && styles.periodButtonActive]}
          onPress={() => setPeriod('month')}
        >
          <Text style={[styles.periodButtonText, period === 'month' && styles.periodButtonTextActive]}>
            Mês
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodButton, period === 'year' && styles.periodButtonActive]}
          onPress={() => setPeriod('year')}
        >
          <Text style={[styles.periodButtonText, period === 'year' && styles.periodButtonTextActive]}>
            Ano
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dateNavigation}>
        <TouchableOpacity onPress={() => changeDate('prev')} style={styles.navButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.dateLabel}>{getPeriodLabel()}</Text>
        <TouchableOpacity onPress={() => changeDate('next')} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : stats ? (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: Colors.primary }]}>
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: Colors.success }]}>
              <Text style={styles.statNumber}>{stats.completed}</Text>
              <Text style={styles.statLabel}>Realizadas</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: Colors.error }]}>
              <Text style={styles.statNumber}>{stats.cancelled}</Text>
              <Text style={styles.statLabel}>Canceladas</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: Colors.info }]}>
              <Text style={styles.statNumber}>{stats.pending}</Text>
              <Text style={styles.statLabel}>Agendadas</Text>
            </View>
          </View>

          <View style={styles.tableContainer}>
            <Text style={styles.tableTitle}>Detalhes dos Atendimentos</Text>
            
            {stats.patients.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color={Colors.text.secondary} />
                <Text style={styles.emptyStateText}>
                  Nenhum atendimento neste período
                </Text>
              </View>
            ) : (
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderText, { flex: 2 }]}>Paciente</Text>
                  <Text style={[styles.tableHeaderText, { flex: 2 }]}>Data/Hora</Text>
                  <Text style={[styles.tableHeaderText, { flex: 1 }]}>Status</Text>
                </View>
                
                {stats.patients.map((item, index) => (
                  <View key={index} style={[styles.tableRow, index % 2 === 0 && styles.tableRowEven]}>
                    <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>
                      {item.patientName}
                    </Text>
                    <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>
                      {formatDate(item.appointmentDate)}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                      <Text style={styles.statusText} numberOfLines={1}>
                        {getStatusLabel(item.status)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      ) : null}
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
  periodSelector: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  periodButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  periodButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  periodButtonText: {
    ...Typography.button,
    color: Colors.text.secondary,
  },
  periodButtonTextActive: {
    color: Colors.text.inverse,
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  navButton: {
    padding: Spacing.xs,
  },
  dateLabel: {
    ...Typography.h3,
    color: Colors.text.primary,
    textTransform: 'capitalize',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    ...Typography.h1,
    color: Colors.text.inverse,
    fontWeight: 'bold',
  },
  statLabel: {
    ...Typography.body2,
    color: Colors.text.inverse,
    marginTop: Spacing.xs,
  },
  tableContainer: {
    margin: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
  },
  tableTitle: {
    ...Typography.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  table: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    padding: Spacing.sm,
  },
  tableHeaderText: {
    ...Typography.body2,
    color: Colors.text.inverse,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    padding: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: 'center',
  },
  tableRowEven: {
    backgroundColor: Colors.background,
  },
  tableCell: {
    ...Typography.body2,
    color: Colors.text.primary,
  },
  statusBadge: {
    flex: 1,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 4,
    borderRadius: 4,
    alignItems: 'center',
  },
  statusText: {
    ...Typography.caption,
    color: Colors.text.inverse,
    fontWeight: '600',
    fontSize: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyStateText: {
    ...Typography.body1,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  },
});
