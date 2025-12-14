import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';

const prisma = new PrismaClient();

// GET /api/meal-plans
export const getMealPlans = async (req: AuthRequest, res: Response) => {
  try {
    const { patientId } = req.query;

    const where: any = {};
    if (patientId) {
      where.patientId = patientId as string;
    } else if (req.userRole === 'PATIENT') {
      const patient = await prisma.patient.findFirst({
        where: { userId: req.userId },
      });
      where.patientId = patient?.id;
    }

    const mealPlans = await prisma.dailyMealPlan.findMany({
      where,
      include: {
        meals: {
          include: {
            recipe: true,
          },
        },
        patient: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    res.json(mealPlans);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar planos alimentares' });
  }
};

// GET /api/meal-plans/:patientId/today
export const getTodayMealPlan = async (req: AuthRequest, res: Response) => {
  try {
    const { patientId } = req.params;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const mealPlan = await prisma.dailyMealPlan.findFirst({
      where: {
        patientId,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        meals: {
          include: {
            recipe: {
              include: {
                ingredients: {
                  include: {
                    food: true,
                  },
                },
              },
            },
          },
          orderBy: { time: 'asc' },
        },
      },
    });

    if (!mealPlan) {
      return res.status(404).json({ error: 'Nenhum plano encontrado para hoje' });
    }

    res.json(mealPlan);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar plano do dia' });
  }
};

// GET /api/meal-plans/:id
export const getMealPlanById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const mealPlan = await prisma.dailyMealPlan.findUnique({
      where: { id },
      include: {
        meals: {
          include: {
            recipe: {
              include: {
                ingredients: {
                  include: {
                    food: true,
                  },
                },
              },
            },
          },
        },
        patient: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!mealPlan) {
      return res.status(404).json({ error: 'Plano não encontrado' });
    }

    res.json(mealPlan);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar plano' });
  }
};

// POST /api/meal-plans
export const createMealPlan = async (req: AuthRequest, res: Response) => {
  try {
    const { patientId, date, meals, totalNutrition, notes } = req.body;

    const mealPlan = await prisma.dailyMealPlan.create({
      data: {
        patientId,
        date: new Date(date),
        totalNutrition,
        notes,
        meals: {
          create: meals?.map((meal: any) => ({
            recipeId: meal.recipeId,
            category: meal.category,
            time: meal.time,
          })),
        },
      },
      include: {
        meals: {
          include: {
            recipe: true,
          },
        },
      },
    });

    res.status(201).json(mealPlan);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar plano alimentar' });
  }
};

// PUT /api/meal-plans/:id
export const updateMealPlan = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { totalNutrition, notes } = req.body;

    const mealPlan = await prisma.dailyMealPlan.update({
      where: { id },
      data: {
        totalNutrition,
        notes,
      },
      include: {
        meals: {
          include: {
            recipe: true,
          },
        },
      },
    });

    res.json(mealPlan);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar plano' });
  }
};

// PUT /api/meal-plans/:planId/meals/:mealId/consume
export const markMealAsConsumed = async (req: AuthRequest, res: Response) => {
  try {
    const { mealId } = req.params;
    const { isConsumed } = req.body;

    const meal = await prisma.mealPlanItem.update({
      where: { id: mealId },
      data: {
        isConsumed,
        consumedAt: isConsumed ? new Date() : null,
      },
      include: {
        recipe: true,
      },
    });

    res.json(meal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao marcar refeição' });
  }
};

// POST /api/meal-plans/:patientId/add-recipe - Adicionar receita ao plano alimentar do paciente
export const addRecipeToMealPlan = async (req: AuthRequest, res: Response) => {
  try {
    const { patientId } = req.params;
    const { recipeId, date, mealCategory, time } = req.body;

    // Verificar se a receita existe
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
    });

    if (!recipe) {
      return res.status(404).json({ error: 'Receita não encontrada' });
    }

    // Verificar se o paciente existe
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    const planDate = new Date(date);
    planDate.setHours(0, 0, 0, 0);

    // Buscar ou criar plano alimentar para o dia
    let mealPlan = await prisma.dailyMealPlan.findFirst({
      where: {
        patientId,
        date: planDate,
      },
    });

    if (!mealPlan) {
      // Criar plano com totalNutrition inicial vazio
      mealPlan = await prisma.dailyMealPlan.create({
        data: {
          patientId,
          date: planDate,
          totalNutrition: {
            calories: 0,
            protein: 0,
            carbs: 0,
            fats: 0,
            fiber: 0,
            sodium: 0,
          },
        },
      });
    }

    // Adicionar receita ao plano
    const mealItem = await prisma.mealPlanItem.create({
      data: {
        planId: mealPlan.id,
        recipeId,
        category: mealCategory || 'LUNCH',
        time: time || '12:00',
        isConsumed: false,
      },
      include: {
        recipe: {
          include: {
            ingredients: {
              include: {
                food: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json(mealItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao adicionar receita ao plano alimentar' });
  }
};
