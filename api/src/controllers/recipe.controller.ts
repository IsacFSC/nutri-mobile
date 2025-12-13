import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';

const prisma = new PrismaClient();

// GET /api/recipes
export const getRecipes = async (req: AuthRequest, res: Response) => {
  try {
    const { category } = req.query;

    const where: any = {};
    if (category) {
      where.category = category;
    }

    const recipes = await prisma.recipe.findMany({
      where,
      include: {
        ingredients: {
          include: {
            food: true,
          },
        },
        nutritionist: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(recipes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar receitas' });
  }
};

// GET /api/recipes/:id
export const getRecipeById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        ingredients: {
          include: {
            food: true,
          },
        },
        nutritionist: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!recipe) {
      return res.status(404).json({ error: 'Receita não encontrada' });
    }

    res.json(recipe);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar receita' });
  }
};

// POST /api/recipes
export const createRecipe = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      description,
      instructions,
      prepTime,
      category,
      imageUrl,
      nutrition,
      ingredients,
    } = req.body;

    // Buscar nutricionista
    const nutritionist = await prisma.nutritionist.findFirst({
      where: { userId: req.userId },
    });

    if (!nutritionist) {
      return res.status(403).json({ error: 'Apenas nutricionistas podem criar receitas' });
    }

    const recipe = await prisma.recipe.create({
      data: {
        name,
        description,
        instructions,
        prepTime,
        category,
        imageUrl,
        nutrition,
        createdBy: nutritionist.id,
        ingredients: {
          create: ingredients?.map((ing: any) => ({
            foodId: ing.foodId,
            quantity: ing.quantity,
            unit: ing.unit,
          })),
        },
      },
      include: {
        ingredients: {
          include: {
            food: true,
          },
        },
      },
    });

    res.status(201).json(recipe);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar receita' });
  }
};

// PUT /api/recipes/:id
export const updateRecipe = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      instructions,
      prepTime,
      category,
      imageUrl,
      nutrition,
    } = req.body;

    const recipe = await prisma.recipe.update({
      where: { id },
      data: {
        name,
        description,
        instructions,
        prepTime,
        category,
        imageUrl,
        nutrition,
      },
      include: {
        ingredients: {
          include: {
            food: true,
          },
        },
      },
    });

    res.json(recipe);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar receita' });
  }
};

// DELETE /api/recipes/:id
export const deleteRecipe = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.recipe.delete({
      where: { id },
    });

    res.json({ message: 'Receita deletada com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao deletar receita' });
  }
};
