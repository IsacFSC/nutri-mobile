import api from '@/src/config/api';
import {
  Recipe,
  DailyMealPlan,
  MealPlanItem,
} from '@/src/types';

export class MealPlanService {
  /**
   * RF 3.0 - Cadastra uma nova receita
   */
  static async createRecipe(
    name: string,
    description: string,
    ingredients: Array<{ name: string; quantity: number; unit: string }>,
    instructions: string,
    calories: number,
    protein: number,
    carbs: number,
    fat: number
  ): Promise<Recipe> {
    try {
      const response = await api.post<Recipe>('/recipes', {
        name,
        description,
        ingredients,
        instructions,
        calories,
        protein,
        carbs,
        fat,
      });
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao cadastrar receita';
      throw new Error(message);
    }
  }

  /**
   * Busca todas as receitas
   */
  static async getAllRecipes(): Promise<Recipe[]> {
    try {
      const response = await api.get<Recipe[]>('/recipes');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao buscar receitas';
      throw new Error(message);
    }
  }

  /**
   * Busca receita por ID
   */
  static async getRecipeById(recipeId: string): Promise<Recipe> {
    try {
      const response = await api.get<Recipe>(`/recipes/${recipeId}`);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao buscar receita';
      throw new Error(message);
    }
  }

  /**
   * RF 3.1 - Cria um plano alimentar diário
   */
  static async createDailyMealPlan(
    patientId: string,
    date: Date,
    meals: Array<{
      mealType: string;
      time: string;
      recipeId?: string;
      description?: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    }>
  ): Promise<DailyMealPlan> {
    try {
      const response = await api.post<DailyMealPlan>('/meal-plans', {
        patientId,
        date: date.toISOString(),
        meals,
      });
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao criar plano diário';
      throw new Error(message);
    }
  }

  /**
   * RF 3.2 - Busca plano diário do paciente
   */
  static async getTodayMealPlan(patientId: string): Promise<DailyMealPlan | null> {
    try {
      const response = await api.get<DailyMealPlan>(`/meal-plans/${patientId}/today`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      const message = error.response?.data?.error || 'Erro ao buscar plano diário';
      throw new Error(message);
    }
  }

  /**
   * RF 3.2 - Marca refeição como consumida
   */
  static async markMealAsConsumed(
    planId: string,
    mealId: string
  ): Promise<DailyMealPlan> {
    try {
      const response = await api.patch<DailyMealPlan>(
        `/meal-plans/${planId}/meals/${mealId}/consume`
      );
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao marcar refeição';
      throw new Error(message);
    }
  }

  /**
   * Busca todos os planos de um paciente
   */
  static async getPatientMealPlans(patientId: string): Promise<DailyMealPlan[]> {
    try {
      const response = await api.get<DailyMealPlan[]>(`/meal-plans/${patientId}`);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao buscar planos';
      throw new Error(message);
    }
  }

  /**
   * Deleta um plano alimentar
   */
  static async deleteMealPlan(planId: string): Promise<void> {
    try {
      await api.delete(`/meal-plans/${planId}`);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao deletar plano';
      throw new Error(message);
    }
  }
}
