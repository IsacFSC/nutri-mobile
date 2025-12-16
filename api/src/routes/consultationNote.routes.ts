import express from 'express';
import { consultationNoteController } from '../controllers/consultationNote.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Criar nova ficha de atendimento
router.post('/', consultationNoteController.create);

// Buscar fichas de um paciente
router.get('/patient/:patientId', consultationNoteController.getByPatient);

// Buscar ficha específica
router.get('/:id', consultationNoteController.getById);

// Atualizar ficha
router.put('/:id', consultationNoteController.update);

// Deletar ficha
router.delete('/:id', consultationNoteController.delete);

// Buscar paciente por número de protocolo
router.get('/protocol/:protocolNumber', consultationNoteController.searchByProtocol);

export default router;
