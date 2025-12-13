import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import * as conversationController from '../controllers/conversation.controller';

const router = Router();

router.use(authenticateToken);

// Rotas para NUTRITIONIST e PATIENT
router.get(
  '/',
  authorizeRoles('NUTRITIONIST', 'PATIENT'),
  conversationController.listConversations
);

router.get(
  '/:id',
  authorizeRoles('NUTRITIONIST', 'PATIENT'),
  conversationController.getConversation
);

router.post(
  '/',
  authorizeRoles('NUTRITIONIST', 'PATIENT'),
  conversationController.createConversation
);

router.post(
  '/:id/messages',
  authorizeRoles('NUTRITIONIST', 'PATIENT'),
  conversationController.sendMessage
);

router.put(
  '/:id/end',
  authorizeRoles('NUTRITIONIST'),
  conversationController.endConversation
);

router.get(
  '/:id/can-start',
  authorizeRoles('NUTRITIONIST', 'PATIENT'),
  conversationController.canStartConversation
);

export default router;
