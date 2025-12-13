import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/src/components/common';
import { Colors, Typography, Spacing } from '@/src/constants';
import { Patient } from '@/src/types';

interface PatientCardProps {
  patient: Patient;
  onPress: () => void;
  onManageFeatures?: () => void;
}

export const PatientCard: React.FC<PatientCardProps> = ({
  patient,
  onPress,
  onManageFeatures,
}) => {
  const enabledCount = Object.values(patient.enabledFeatures).filter(Boolean).length;
  const totalFeatures = Object.keys(patient.enabledFeatures).length;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={24} color={Colors.primary} />
          </View>
          
          <View style={styles.info}>
            <Text style={styles.name}>{patient.name}</Text>
            <Text style={styles.email}>{patient.email}</Text>
            <Text style={styles.plan}>Plano: {patient.planType}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.featuresInfo}>
            <Ionicons name="apps" size={16} color={Colors.text.secondary} />
            <Text style={styles.featuresText}>
              {enabledCount}/{totalFeatures} recursos ativos
            </Text>
          </View>

          {onManageFeatures && (
            <TouchableOpacity onPress={onManageFeatures} style={styles.manageButton}>
              <Text style={styles.manageText}>Gerenciar</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  info: {
    flex: 1,
  },
  name: {
    ...Typography.h4,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  email: {
    ...Typography.body2,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  plan: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  featuresInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuresText: {
    ...Typography.body2,
    color: Colors.text.secondary,
    marginLeft: Spacing.xs,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  manageText: {
    ...Typography.body2,
    color: Colors.primary,
    fontWeight: '600',
    marginRight: 4,
  },
});
