import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import * as userController from '../controllers/user.controller';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// GET /api/users/me
router.get('/me', userController.getCurrentUser);

// PUT /api/users/me
router.put('/me', userController.updateCurrentUser);

// PUT /api/users/profile - Atualizar perfil completo
router.put('/profile', userController.updateProfile);

// GET /api/users/:id
router.get('/:id', userController.getUserById);

export default router;
