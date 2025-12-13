import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { Card } from '@/src/components/common';
import { Colors, Typography, Spacing, AppConstants } from '@/src/constants';
import { FeatureKey, EnabledFeatures } from '@/src/types';

interface FeatureToggleProps {
  featureKey: FeatureKey;
  isEnabled: boolean;
  onToggle: (featureKey: FeatureKey, isEnabled: boolean) => void;
  disabled?: boolean;
}

export const FeatureToggle: React.FC<FeatureToggleProps> = ({
  featureKey,
  isEnabled,
  onToggle,
  disabled = false,
}) => {
  const featureName = AppConstants.FEATURES[featureKey];

  return (
    <View style={styles.container}>
      <Text style={styles.featureName}>{featureName}</Text>
      <Switch
        value={isEnabled}
        onValueChange={(value) => onToggle(featureKey, value)}
        disabled={disabled}
        trackColor={{ false: Colors.border, true: Colors.primaryLight }}
        thumbColor={isEnabled ? Colors.primary : Colors.text.disabled}
      />
    </View>
  );
};

interface FeatureControlPanelProps {
  features: EnabledFeatures;
  onToggle: (featureKey: FeatureKey, isEnabled: boolean) => void;
  disabled?: boolean;
}

export const FeatureControlPanel: React.FC<FeatureControlPanelProps> = ({
  features,
  onToggle,
  disabled = false,
}) => {
  return (
    <Card>
      <Text style={styles.title}>Controle de Recursos</Text>
      <Text style={styles.subtitle}>
        Ative ou desative recursos para este paciente
      </Text>
      
      <View style={styles.featuresContainer}>
        {Object.keys(features).map((key) => (
          <FeatureToggle
            key={key}
            featureKey={key as FeatureKey}
            isEnabled={features[key as FeatureKey]}
            onToggle={onToggle}
            disabled={disabled}
          />
        ))}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  featureName: {
    ...Typography.body1,
    color: Colors.text.primary,
    flex: 1,
  },
  title: {
    ...Typography.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body2,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  featuresContainer: {
    marginTop: Spacing.sm,
  },
});
