import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Card, Loading, Button } from '@/src/components/common';
import { Colors, Typography, Spacing } from '@/src/constants';
import { useAuthStore } from '@/src/store/authStore';
import api from '@/src/config/api';

interface Recipe {
  id: string;
  name: string;
  description: string;
  prepTime: number;
  category: string;
  imageUrl?: string;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  nutritionist: {
    user: {
      name: string;
    };
  };
}

const categoryTranslations: Record<string, string> = {
  BREAKFAST: 'Café da Manhã',
  MORNING_SNACK: 'Lanche da Manhã',
  LUNCH: 'Almoço',
  AFTERNOON_SNACK: 'Lanche da Tarde',
  DINNER: 'Jantar',
  EVENING_SNACK: 'Lanche Noturno',
};

export default function RecipesScreen() {
  const { user } = useAuthStore();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/recipes');
      setRecipes(response.data);
    } catch (error) {
      console.error('Erro ao carregar receitas:', error);
      Alert.alert('Erro', 'Não foi possível carregar as receitas');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRecipes();
  };

  const handleDeleteRecipe = (recipeId: string, recipeName: string) => {
    Alert.alert(
      'Confirmar exclusão',
      `Deseja realmente excluir a receita "${recipeName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/recipes/${recipeId}`);
              Alert.alert('Sucesso', 'Receita excluída com sucesso');
              loadRecipes();
            } catch (error) {
              console.error('Erro ao excluir receita:', error);
              Alert.alert('Erro', 'Não foi possível excluir a receita');
            }
          },
        },
      ]
    );
  };

  const filteredRecipes = recipes.filter((recipe) =>
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Receitas</Text>
        <Text style={styles.subtitle}>Gerencie suas receitas nutricionais</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.text.secondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar receitas..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholderTextColor={Colors.text.secondary}
        />
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredRecipes.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="restaurant-outline" size={64} color={Colors.text.secondary} />
            <Text style={styles.emptyTitle}>
              {searchTerm ? 'Nenhuma receita encontrada' : 'Nenhuma receita cadastrada'}
            </Text>
            <Text style={styles.emptyText}>
              {searchTerm 
                ? 'Tente buscar com outros termos'
                : 'Crie receitas personalizadas para seus pacientes'
              }
            </Text>
            {!searchTerm && (
              <Button 
                title="Criar Receita" 
                onPress={() => router.push('/create-recipe')} 
                style={styles.createButton} 
              />
            )}
          </Card>
        ) : (
          filteredRecipes.map((recipe: Recipe) => (
            <Card key={recipe.id} style={styles.recipeCard}>
              <View style={styles.recipeHeader}>
                <View style={styles.recipeTitleContainer}>
                  <Text style={styles.recipeName}>{recipe.name}</Text>
                  <Text style={styles.recipeCategory}>
                    {categoryTranslations[recipe.category] || recipe.category}
                  </Text>
                </View>
                <View style={styles.recipeActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleDeleteRecipe(recipe.id, recipe.name)}
                  >
                    <Ionicons name="trash" size={20} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.recipeDescription}>{recipe.description}</Text>
              <View style={styles.recipeInfo}>
                <View style={styles.infoItem}>
                  <Ionicons name="flame" size={16} color={Colors.text.secondary} />
                  <Text style={styles.infoText}>
                    {recipe.nutrition?.calories || 0} kcal
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="time" size={16} color={Colors.text.secondary} />
                  <Text style={styles.infoText}>{recipe.prepTime} min</Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="person" size={16} color={Colors.text.secondary} />
                  <Text style={styles.infoText}>{recipe.nutritionist.user.name}</Text>
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => router.push('/create-recipe')}
      >
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    margin: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.body1,
    color: Colors.text.primary,
    paddingVertical: Spacing.md,
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
    marginBottom: Spacing.lg,
  },
  createButton: {
    marginTop: Spacing.sm,
  },
  recipeCard: {
    marginBottom: Spacing.md,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  recipeTitleContainer: {
    flex: 1,
  },
  recipeName: {
    ...Typography.h4,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  recipeCategory: {
    ...Typography.body2,
    color: Colors.primary,
    fontWeight: '500',
  },
  recipeActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionButton: {
    marginLeft: Spacing.sm,
  },
  recipeDescription: {
    ...Typography.body2,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  recipeInfo: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  infoText: {
    ...Typography.caption,
    color: Colors.text.secondary,
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
