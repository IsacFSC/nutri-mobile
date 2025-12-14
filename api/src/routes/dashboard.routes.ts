import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import * as dashboardController from '../controllers/dashboard.controller';

const router = Router();

router.use(authenticateToken);

// GET /api/dashboard/nutritionist-stats - Estatísticas do nutricionista
router.get(
  '/nutritionist-stats',
  authorizeRoles('NUTRITIONIST'),
  dashboardController.getNutritionistStats
);

// GET /api/dashboard/patient-stats - Estatísticas do paciente
router.get(
  '/patient-stats',
  authorizeRoles('PATIENT'),
  dashboardController.getPatientStats
);

// GET /api/dashboard/admin-stats - Estatísticas do admin
router.get(
  '/admin-stats',
  authorizeRoles('ADMIN'),
  dashboardController.getAdminStats
);

export default router;
