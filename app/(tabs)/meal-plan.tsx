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

interface MealPlanItem {
  id: string;
  category: string;
  time: string;
  isConsumed: boolean;
  recipe: {
    id: string;
    name: string;
    description: string;
    nutrition: {
      calories: number;
      protein: number;
      carbs: number;
      fats: number;
      fiber?: number;
      sodium?: number;
    };
    ingredients: Array<{
      id: string;
      quantity: number;
      unit: string;
      food: {
        name: string;
      };
    }>;
  };
}

interface MealPlan {
  id: string;
  date: string;
  totalNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  meals: MealPlanItem[];
}

export default function MealPlanScreen() {
  const { user } = useAuthStore();
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMealPlan = async () => {
    try {
      setLoading(true);
      
      if (!user?.id) {
        setMealPlan(null);
        return;
      }
      
      // Buscar plano do dia usando o endpoint correto
      // A API já filtra automaticamente pelo usuário logado
      const response = await api.get('/meal-plans');
      
      // Se retornou array, pegar o primeiro (mais recente)
      const data = Array.isArray(response.data) ? response.data[0] : response.data;
      setMealPlan(data || null);
    } catch (error: any) {
      console.error('Erro ao carregar plano alimentar:', error);
      console.error('Detalhes:', error.response?.data);
      
      // Não mostrar alert se for 404 (sem planos)
      if (error.response?.status !== 404) {
        Alert.alert(
          'Erro',
          error.response?.data?.error || 'Não foi possível carregar o plano alimentar'
        );
      }
      
      setMealPlan(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMealPlan();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadMealPlan();
  };

  if (loading && !refreshing) {
    return <Loading />;
  }

  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      BREAKFAST: 'Café da Manhã',
      MORNING_SNACK: 'Lanche da Manhã',
      LUNCH: 'Almoço',
      AFTERNOON_SNACK: 'Lanche da Tarde',
      DINNER: 'Jantar',
      EVENING_SNACK: 'Ceia',
    };
    return labels[category] || category;
  };

  const getMealIcon = (category?: string): keyof typeof Ionicons.glyphMap => {
    if (!category) return 'nutrition';
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      BREAKFAST: 'sunny',
      MORNING_SNACK: 'cafe',
      LUNCH: 'restaurant',
      AFTERNOON_SNACK: 'ice-cream',
      DINNER: 'moon',
      EVENING_SNACK: 'star',
    };
    return iconMap[category] || 'nutrition';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Meu Plano Alimentar</Text>
          <Text style={styles.subtitle}>
            {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </Text>
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
        {!mealPlan ? (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyState}>
              <Ionicons name="restaurant-outline" size={64} color={Colors.text.secondary} />
              <Text style={styles.emptyTitle}>Nenhum Plano Disponível</Text>
              <Text style={styles.emptyText}>
                Seu nutricionista ainda não criou um plano alimentar para hoje.
              </Text>
              <Text style={styles.emptyHint}>
                Entre em contato para solicitar seu cardápio personalizado.
              </Text>
            </View>
          </Card>
        ) : (
          <>
            {/* Resumo Nutricional */}
            <Card style={styles.summaryCard}>
              <Text style={styles.cardTitle}>Resumo do Dia</Text>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Ionicons name="flame" size={24} color={Colors.primary} />
                  <Text style={styles.summaryValue}>
                    {Math.round(mealPlan.totalNutrition?.calories || 0)}
                  </Text>
                  <Text style={styles.summaryLabel}>kcal</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Ionicons name="fitness" size={24} color={Colors.accent} />
                  <Text style={styles.summaryValue}>
                    {mealPlan.meals.length}
                  </Text>
                  <Text style={styles.summaryLabel}>refeições</Text>
                </View>
              </View>
            </Card>

            {/* Refeições */}
            {mealPlan.meals && mealPlan.meals.length > 0 ? (
              mealPlan.meals.map((mealItem, index) => (
                <Card key={mealItem.id || index} style={styles.mealCard}>
                  <View style={styles.mealHeader}>
                    <View style={styles.mealIconContainer}>
                      <Ionicons
                        name={getMealIcon(mealItem.category)}
                        size={24}
                        color={Colors.primary}
                      />
                    </View>
                    <View style={styles.mealInfo}>
                      <Text style={styles.mealName}>{getCategoryLabel(mealItem.category)}</Text>
                      <Text style={styles.mealTime}>{mealItem.time}</Text>
                    </View>
                    {mealItem.recipe.nutrition.calories && (
                      <View style={styles.caloriesTag}>
                        <Text style={styles.caloriesText}>{Math.round(mealItem.recipe.nutrition.calories)} kcal</Text>
                      </View>
                    )}
                  </View>

                  {/* Nome e descrição da receita */}
                  <View style={styles.recipeSection}>
                    <Text style={styles.recipeName}>{mealItem.recipe.name}</Text>
                    {mealItem.recipe.description && (
                      <Text style={styles.recipeDescription}>{mealItem.recipe.description}</Text>
                    )}
                  </View>

                  {/* Ingredientes */}
                  {mealItem.recipe.ingredients && mealItem.recipe.ingredients.length > 0 && (
                    <View style={styles.mealItems}>
                      <Text style={styles.ingredientsTitle}>Ingredientes:</Text>
                      {mealItem.recipe.ingredients.map((ingredient, idx) => (
                        <View key={ingredient.id || idx} style={styles.mealItem}>
                          <Ionicons
                            name="checkmark-circle"
                            size={16}
                            color={Colors.success}
                          />
                          <Text style={styles.mealItemText}>
                            {ingredient.quantity} {ingredient.unit} de {ingredient.food.name}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Macros */}
                  <View style={styles.macros}>
                    <View style={styles.macroItem}>
                      <Text style={styles.macroLabel}>Proteína</Text>
                      <Text style={styles.macroValue}>{Math.round(mealItem.recipe.nutrition.protein)}g</Text>
                    </View>
                    <View style={styles.macroItem}>
                      <Text style={styles.macroLabel}>Carboidrato</Text>
                      <Text style={styles.macroValue}>{Math.round(mealItem.recipe.nutrition.carbs)}g</Text>
                    </View>
                    <View style={styles.macroItem}>
                      <Text style={styles.macroLabel}>Gordura</Text>
                      <Text style={styles.macroValue}>{Math.round(mealItem.recipe.nutrition.fats)}g</Text>
                    </View>
                  </View>
                </Card>
              ))
            ) : (
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyText}>
                  Nenhuma refeição cadastrada para hoje.
                </Text>
              </Card>
            )}

            {/* Dica do Dia */}
            <Card style={styles.tipCard}>
              <View style={styles.tipHeader}>
                <Ionicons name="bulb" size={20} color={Colors.warning} />
                <Text style={styles.tipTitle}>Dica do Nutricionista</Text>
              </View>
              <Text style={styles.tipText}>
                Lembre-se de beber pelo menos 2 litros de água ao longo do dia!
              </Text>
            </Card>
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
    textTransform: 'capitalize',
  },
  refreshButton: {
    padding: Spacing.sm,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  summaryCard: {
    marginBottom: Spacing.md,
  },
  cardTitle: {
    ...Typography.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    ...Typography.h2,
    color: Colors.text.primary,
    marginTop: Spacing.xs,
  },
  summaryLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  mealCard: {
    marginBottom: Spacing.md,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  mealIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    ...Typography.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  mealTime: {
    ...Typography.body2,
    color: Colors.text.secondary,
  },
  caloriesTag: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  caloriesText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  mealItems: {
    marginTop: Spacing.sm,
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  mealItemText: {
    ...Typography.body1,
    color: Colors.text.primary,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  macros: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  macroItem: {
    alignItems: 'center',
  },
  macroLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  macroValue: {
    ...Typography.body1,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  recipeSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  recipeName: {
    ...Typography.h4,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  recipeDescription: {
    ...Typography.body2,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  ingredientsTitle: {
    ...Typography.body1,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
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
    marginBottom: Spacing.sm,
  },
  emptyHint: {
    ...Typography.body2,
    color: Colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  tipCard: {
    backgroundColor: Colors.warning + '10',
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
    marginBottom: Spacing.md,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  tipTitle: {
    ...Typography.h4,
    color: Colors.text.primary,
    marginLeft: Spacing.sm,
  },
  tipText: {
    ...Typography.body2,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
});
