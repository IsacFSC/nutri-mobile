import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';

const prisma = new PrismaClient();

export const consultationNoteController = {
  // Criar nova ficha de atendimento
  async create(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const {
        patientId,
        appointmentId,
        currentWeight,
        currentHeight,
        currentBMI,
        bloodPressure,
        heartRate,
        bodyComposition,
        complaints,
        symptoms,
        dietaryRecall,
        physicalActivity,
        diagnosis,
        nutritionalPlan,
        recommendations,
        goals,
        restrictions,
        dietPrescription,
        supplementation,
        recommendedExercises,
        recommendedFoods,
        foodsToAvoid,
        supplements,
        waterIntake,
        sleepRecommendations,
        lifestyleChanges,
        nextAppointment,
        followUpNotes,
        attachments,
      } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      // Verificar se o nutricionista tem acesso ao paciente
      const nutritionist = await prisma.nutritionist.findUnique({
        where: { userId },
        include: { patients: true },
      });

      if (!nutritionist) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const hasAccess = nutritionist.patients.some(p => p.id === patientId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Você não tem acesso a este paciente' });
      }

      // Criar ficha de atendimento
      const consultationNote = await prisma.consultationNote.create({
        data: {
          patientId,
          appointmentId,
          nutritionistId: nutritionist.id,
          currentWeight,
          currentHeight,
          currentBMI,
          bloodPressure,
          heartRate,
          bodyComposition,
          complaints,
          symptoms,
          dietaryRecall,
          physicalActivity,
          diagnosis,
          nutritionalPlan,
          recommendations,
          goals,
          restrictions,
          dietPrescription,
          supplementation,
          recommendedExercises,
          recommendedFoods,
          foodsToAvoid,
          supplements,
          waterIntake,
          sleepRecommendations,
          lifestyleChanges,
          nextAppointment: nextAppointment ? new Date(nextAppointment) : null,
          followUpNotes,
          attachments,
        },
      });

      res.status(201).json(consultationNote);
    } catch (error) {
      console.error('Erro ao criar ficha de atendimento:', error);
      res.status(500).json({ error: 'Erro ao criar ficha de atendimento' });
    }
  },

  // Buscar fichas de um paciente
  async getByPatient(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { patientId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      // Verificar acesso
      const nutritionist = await prisma.nutritionist.findUnique({
        where: { userId },
        include: { patients: true },
      });

      const isPatient = await prisma.patient.findFirst({
        where: { userId, id: patientId },
      });

      if (!nutritionist && !isPatient) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      if (nutritionist) {
        const hasAccess = nutritionist.patients.some(p => p.id === patientId);
        if (!hasAccess) {
          return res.status(403).json({ error: 'Você não tem acesso a este paciente' });
        }
      }

      // Buscar fichas
      const notes = await prisma.consultationNote.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
      });

      res.json(notes);
    } catch (error) {
      console.error('Erro ao buscar fichas:', error);
      res.status(500).json({ error: 'Erro ao buscar fichas de atendimento' });
    }
  },

  // Buscar ficha específica
  async getById(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      const note = await prisma.consultationNote.findUnique({
        where: { id },
        include: {
          patient: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!note) {
        return res.status(404).json({ error: 'Ficha não encontrada' });
      }

      // Verificar acesso
      const nutritionist = await prisma.nutritionist.findUnique({
        where: { userId },
      });

      const isPatient = note.patient.userId === userId;

      if (!nutritionist && !isPatient) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      if (nutritionist && note.nutritionistId !== nutritionist.id) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      res.json(note);
    } catch (error) {
      console.error('Erro ao buscar ficha:', error);
      res.status(500).json({ error: 'Erro ao buscar ficha de atendimento' });
    }
  },

  // Atualizar ficha
  async update(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      const note = await prisma.consultationNote.findUnique({
        where: { id },
      });

      if (!note) {
        return res.status(404).json({ error: 'Ficha não encontrada' });
      }

      // Verificar se é o nutricionista que criou
      const nutritionist = await prisma.nutritionist.findUnique({
        where: { userId },
      });

      if (!nutritionist || note.nutritionistId !== nutritionist.id) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const updatedNote = await prisma.consultationNote.update({
        where: { id },
        data: {
          ...req.body,
          nextAppointment: req.body.nextAppointment ? new Date(req.body.nextAppointment) : undefined,
        },
      });

      res.json(updatedNote);
    } catch (error) {
      console.error('Erro ao atualizar ficha:', error);
      res.status(500).json({ error: 'Erro ao atualizar ficha de atendimento' });
    }
  },

  // Deletar ficha
  async delete(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      const note = await prisma.consultationNote.findUnique({
        where: { id },
      });

      if (!note) {
        return res.status(404).json({ error: 'Ficha não encontrada' });
      }

      // Verificar se é o nutricionista que criou
      const nutritionist = await prisma.nutritionist.findUnique({
        where: { userId },
      });

      if (!nutritionist || note.nutritionistId !== nutritionist.id) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      await prisma.consultationNote.delete({
        where: { id },
      });

      res.json({ message: 'Ficha deletada com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar ficha:', error);
      res.status(500).json({ error: 'Erro ao deletar ficha de atendimento' });
    }
  },

  // Buscar paciente por número de protocolo
  async searchByProtocol(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { protocolNumber } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      // Verificar se é nutricionista
      const nutritionist = await prisma.nutritionist.findUnique({
        where: { userId },
      });

      if (!nutritionist) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      // Buscar paciente pelo protocolo
      const patient = await prisma.patient.findUnique({
        where: { protocolNumber },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          consultationNotes: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          appointments: {
            orderBy: { dateTime: 'desc' },
            take: 5,
          },
        },
      });

      if (!patient) {
        return res.status(404).json({ error: 'Paciente não encontrado com este protocolo' });
      }

      // Verificar se o nutricionista tem acesso
      if (patient.nutritionistId !== nutritionist.id) {
        return res.status(403).json({ error: 'Você não tem acesso a este paciente' });
      }

      res.json(patient);
    } catch (error) {
      console.error('Erro ao buscar por protocolo:', error);
      res.status(500).json({ error: 'Erro ao buscar paciente' });
    }
  },
};
