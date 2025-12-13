import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import * as mealPlanController from '../controllers/mealPlan.controller';

const router = Router();

router.use(authenticateToken);

// GET /api/meal-plans - Listar planos
router.get('/', mealPlanController.getMealPlans);

// GET /api/meal-plans/:patientId/today - Plano do dia
router.get('/:patientId/today', mealPlanController.getTodayMealPlan);

// GET /api/meal-plans/:id - Buscar plano
router.get('/:id', mealPlanController.getMealPlanById);

// POST /api/meal-plans - Criar plano (Admin/Nutritionist)
router.post(
  '/',
  authorizeRoles('ADMIN', 'NUTRITIONIST'),
  mealPlanController.createMealPlan
);

// PUT /api/meal-plans/:id - Atualizar plano
router.put('/:id', mealPlanController.updateMealPlan);

// PUT /api/meal-plans/:planId/meals/:mealId/consume - Marcar refeição como consumida
router.put('/:planId/meals/:mealId/consume', mealPlanController.markMealAsConsumed);

export default router;
