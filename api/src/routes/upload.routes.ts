import { Router } from 'express';
import { authenticateToken, auditAction } from '../middlewares/auth.middleware';
import { uploadAvatar } from '../middlewares/upload.middleware';
import * as uploadController from '../controllers/upload.controller';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// POST /api/upload/avatar - Upload de avatar
router.post(
  '/avatar',
  uploadAvatar.single('avatar'),
  auditAction('AVATAR_UPLOAD'),
  uploadController.uploadAvatar
);

// DELETE /api/upload/avatar - Deletar avatar
router.delete(
  '/avatar',
  auditAction('AVATAR_DELETE'),
  uploadController.deleteAvatar
);

export default router;
