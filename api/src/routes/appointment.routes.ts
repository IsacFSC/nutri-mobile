import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import * as appointmentController from '../controllers/appointment.controller';

const router = Router();

router.use(authenticateToken);

// GET /api/appointments - Listar consultas
router.get('/', appointmentController.getAppointments);

// GET /api/appointments/:id - Buscar consulta
router.get('/:id', appointmentController.getAppointmentById);

// POST /api/appointments - Criar consulta
router.post('/', appointmentController.createAppointment);

// PUT /api/appointments/:id - Atualizar consulta
router.put('/:id', appointmentController.updateAppointment);

// DELETE /api/appointments/:id - Cancelar consulta
router.delete('/:id', appointmentController.cancelAppointment);

// POST /api/appointments/:id/conversation - Criar conversa para consulta
router.post('/:id/conversation', appointmentController.createConversationForAppointment);

// GET /api/appointments/available/:nutritionistId/:date - Horários disponíveis
router.get('/available/:nutritionistId/:date', appointmentController.getAvailableSlots);

export default router;
