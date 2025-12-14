import { Router } from 'express';
import { videoCallController } from '../controllers/videoCall.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Iniciar videochamada
router.post('/start', videoCallController.startVideoCall);

// Entrar em uma videochamada
router.post('/:id/join', videoCallController.joinVideoCall);

// Encerrar videochamada
router.post('/:id/end', videoCallController.endVideoCall);

// Buscar videochamada ativa de uma conversa
router.get('/conversation/:conversationId/active', videoCallController.getActiveVideoCall);

// Histórico de chamadas
router.get('/conversation/:conversationId/history', videoCallController.getVideoCallHistory);

export default router;
