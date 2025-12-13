import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/src/constants';
import api from '@/src/config/api';

interface Ingredient {
  foodId: string;
  name: string;
  quantity: number;
  unit: string;
}

export default function CreateRecipeScreen() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);

  // Estados para adicionar ingrediente
  const [showIngredientForm, setShowIngredientForm] = useState(false);
  const [newIngredientName, setNewIngredientName] = useState('');
  const [newIngredientQuantity, setNewIngredientQuantity] = useState('');
  const [newIngredientUnit, setNewIngredientUnit] = useState('g');

  const addIngredient = () => {
    if (!newIngredientName || !newIngredientQuantity) {
      Alert.alert('Erro', 'Preencha o nome e a quantidade do ingrediente');
      return;
    }

    const ingredient: Ingredient = {
      foodId: Date.now().toString(), // Temporário - em produção seria um ID real
      name: newIngredientName,
      quantity: parseFloat(newIngredientQuantity),
      unit: newIngredientUnit,
    };

    setIngredients([...ingredients, ingredient]);
    setNewIngredientName('');
    setNewIngredientQuantity('');
    setNewIngredientUnit('g');
    setShowIngredientForm(false);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name || !description || !instructions || !prepTime) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setLoading(true);

      const recipeData = {
        name,
        description,
        instructions,
        prepTime: parseInt(prepTime),
        category: categoryMap[category as keyof typeof categoryMap] || 'LUNCH',
        imageUrl: imageUrl || null,
        nutrition: {
          calories: calories ? parseFloat(calories) : 0,
          protein: protein ? parseFloat(protein) : 0,
          carbs: carbs ? parseFloat(carbs) : 0,
          fats: fats ? parseFloat(fats) : 0,
        },
        ingredients: ingredients.map(ing => ({
          foodId: ing.foodId,
          quantity: ing.quantity,
          unit: ing.unit,
        })),
      };

      await api.post('/recipes', recipeData);
      Alert.alert('Sucesso', 'Receita criada com sucesso!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Erro ao criar receita:', error);
      Alert.alert('Erro', error.response?.data?.error || 'Não foi possível criar a receita');
    } finally {
      setLoading(false);
    }
  };

  const categoryMap = {
    'Café da Manhã': 'BREAKFAST',
    'Lanche da Manhã': 'MORNING_SNACK',
    'Almoço': 'LUNCH',
    'Lanche da Tarde': 'AFTERNOON_SNACK',
    'Jantar': 'DINNER',
    'Lanche Noturno': 'EVENING_SNACK',
  };
  const categories = Object.keys(categoryMap);
  const units = ['g', 'kg', 'ml', 'l', 'unidade', 'xícara', 'colher'];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.inverse} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nova Receita</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          <Text style={[styles.saveButton, loading && styles.saveButtonDisabled]}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Informações Básicas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Básicas</Text>

          <Text style={styles.label}>Nome da Receita *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ex: Smoothie de Frutas Vermelhas"
            placeholderTextColor={Colors.text.secondary}
          />

          <Text style={styles.label}>Descrição *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Breve descrição da receita"
            placeholderTextColor={Colors.text.secondary}
            multiline
            numberOfLines={3}
          />

          <Text style={styles.label}>Categoria</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Tempo de Preparo (minutos) *</Text>
          <TextInput
            style={styles.input}
            value={prepTime}
            onChangeText={setPrepTime}
            placeholder="Ex: 30"
            placeholderTextColor={Colors.text.secondary}
            keyboardType="numeric"
          />

          <Text style={styles.label}>URL da Imagem (opcional)</Text>
          <TextInput
            style={styles.input}
            value={imageUrl}
            onChangeText={setImageUrl}
            placeholder="https://..."
            placeholderTextColor={Colors.text.secondary}
            autoCapitalize="none"
          />
        </View>

        {/* Ingredientes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ingredientes</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowIngredientForm(!showIngredientForm)}
            >
              <Ionicons name="add-circle" size={24} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {showIngredientForm && (
            <View style={styles.ingredientForm}>
              <TextInput
                style={[styles.input, styles.ingredientInput]}
                value={newIngredientName}
                onChangeText={setNewIngredientName}
                placeholder="Nome do ingrediente"
                placeholderTextColor={Colors.text.secondary}
              />
              <View style={styles.ingredientRow}>
                <TextInput
                  style={[styles.input, styles.quantityInput]}
                  value={newIngredientQuantity}
                  onChangeText={setNewIngredientQuantity}
                  placeholder="Quantidade"
                  placeholderTextColor={Colors.text.secondary}
                  keyboardType="numeric"
                />
                <View style={styles.unitPicker}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {units.map((unit) => (
                      <TouchableOpacity
                        key={unit}
                        style={[
                          styles.unitChip,
                          newIngredientUnit === unit && styles.unitChipActive,
                        ]}
                        onPress={() => setNewIngredientUnit(unit)}
                      >
                        <Text
                          style={[
                            styles.unitText,
                            newIngredientUnit === unit && styles.unitTextActive,
                          ]}
                        >
                          {unit}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
              <TouchableOpacity style={styles.addIngredientButton} onPress={addIngredient}>
                <Text style={styles.addIngredientText}>Adicionar Ingrediente</Text>
              </TouchableOpacity>
            </View>
          )}

          {ingredients.map((ingredient, index) => (
            <View key={index} style={styles.ingredientItem}>
              <View style={styles.ingredientInfo}>
                <Text style={styles.ingredientName}>{ingredient.name}</Text>
                <Text style={styles.ingredientQuantity}>
                  {ingredient.quantity} {ingredient.unit}
                </Text>
              </View>
              <TouchableOpacity onPress={() => removeIngredient(index)}>
                <Ionicons name="close-circle" size={24} color={Colors.error} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Modo de Preparo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Modo de Preparo *</Text>
          <TextInput
            style={[styles.input, styles.textArea, styles.instructionsInput]}
            value={instructions}
            onChangeText={setInstructions}
            placeholder="Descreva passo a passo como preparar a receita..."
            placeholderTextColor={Colors.text.secondary}
            multiline
            numberOfLines={8}
          />
        </View>

        {/* Informações Nutricionais */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Nutricionais (opcional)</Text>

          <Text style={styles.label}>Calorias (kcal)</Text>
          <TextInput
            style={styles.input}
            value={calories}
            onChangeText={setCalories}
            placeholder="Ex: 250"
            placeholderTextColor={Colors.text.secondary}
            keyboardType="numeric"
          />

          <View style={styles.macrosRow}>
            <View style={styles.macroItem}>
              <Text style={styles.label}>Proteínas (g)</Text>
              <TextInput
                style={styles.input}
                value={protein}
                onChangeText={setProtein}
                placeholder="Ex: 15"
                placeholderTextColor={Colors.text.secondary}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.label}>Carboidratos (g)</Text>
              <TextInput
                style={styles.input}
                value={carbs}
                onChangeText={setCarbs}
                placeholder="Ex: 30"
                placeholderTextColor={Colors.text.secondary}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.label}>Gorduras (g)</Text>
              <TextInput
                style={styles.input}
                value={fats}
                onChangeText={setFats}
                placeholder="Ex: 10"
                placeholderTextColor={Colors.text.secondary}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingTop: 40,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.text.inverse,
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    ...Typography.button,
    color: Colors.text.inverse,
    padding: Spacing.xs,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: Colors.surface,
    marginTop: Spacing.md,
    padding: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.body2,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: Spacing.md,
    ...Typography.body1,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  instructionsInput: {
    minHeight: 150,
  },
  categoryScroll: {
    marginTop: Spacing.xs,
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.background,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryText: {
    ...Typography.body2,
    color: Colors.text.secondary,
  },
  categoryTextActive: {
    color: Colors.text.inverse,
  },
  addButton: {
    padding: Spacing.xs,
  },
  ingredientForm: {
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.md,
  },
  ingredientInput: {
    marginBottom: Spacing.sm,
  },
  ingredientRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  quantityInput: {
    flex: 1,
  },
  unitPicker: {
    flex: 2,
  },
  unitChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  unitChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  unitText: {
    ...Typography.body2,
    color: Colors.text.secondary,
  },
  unitTextActive: {
    color: Colors.text.inverse,
  },
  addIngredientButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  addIngredientText: {
    ...Typography.button,
    color: Colors.text.inverse,
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.sm,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    ...Typography.body1,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  ingredientQuantity: {
    ...Typography.body2,
    color: Colors.text.secondary,
  },
  macrosRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  macroItem: {
    flex: 1,
  },
  bottomSpacing: {
    height: Spacing.xl,
  },
});
