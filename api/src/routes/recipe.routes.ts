import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import * as recipeController from '../controllers/recipe.controller';

const router = Router();

router.use(authenticateToken);

// GET /api/recipes - Listar receitas
router.get('/', recipeController.getRecipes);

// GET /api/recipes/:id - Buscar receita
router.get('/:id', recipeController.getRecipeById);

// POST /api/recipes - Criar receita (Admin/Nutritionist)
router.post(
  '/',
  authorizeRoles('ADMIN', 'NUTRITIONIST'),
  recipeController.createRecipe
);

// PUT /api/recipes/:id - Atualizar receita (Admin/Nutritionist)
router.put(
  '/:id',
  authorizeRoles('ADMIN', 'NUTRITIONIST'),
  recipeController.updateRecipe
);

// DELETE /api/recipes/:id - Deletar receita (Admin/Nutritionist)
router.delete(
  '/:id',
  authorizeRoles('ADMIN', 'NUTRITIONIST'),
  recipeController.deleteRecipe
);

export default router;
