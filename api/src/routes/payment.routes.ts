import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import * as paymentController from '../controllers/payment.controller';

const router = Router();

router.use(authenticateToken);

// Rotas apenas para ADMIN
router.get(
  '/subscriptions',
  authorizeRoles('ADMIN'),
  paymentController.listSubscriptions
);

router.post(
  '/subscriptions',
  authorizeRoles('ADMIN'),
  paymentController.createSubscription
);

router.put(
  '/subscriptions/:id',
  authorizeRoles('ADMIN'),
  paymentController.updateSubscription
);

router.post(
  '/alerts',
  authorizeRoles('ADMIN'),
  paymentController.sendPaymentAlert
);

router.get(
  '/overdue',
  authorizeRoles('ADMIN'),
  paymentController.listOverduePayments
);

router.post(
  '/:id/mark-paid',
  authorizeRoles('ADMIN'),
  paymentController.markPaymentAsPaid
);

router.get(
  '/stats',
  authorizeRoles('ADMIN'),
  paymentController.getPaymentStats
);

export default router;
