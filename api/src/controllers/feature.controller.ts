import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';

const prisma = new PrismaClient();

// GET /api/features/patient/:patientId
export const getPatientFeatures = async (req: AuthRequest, res: Response) => {
  try {
    const { patientId } = req.params;

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { enabledFeatures: true },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    res.json(patient.enabledFeatures);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar recursos' });
  }
};

// PUT /api/features/patient/:patientId
export const updatePatientFeatures = async (req: AuthRequest, res: Response) => {
  try {
    const { patientId } = req.params;
    const features = req.body;

    const patient = await prisma.patient.update({
      where: { id: patientId },
      data: { enabledFeatures: features },
      select: { enabledFeatures: true },
    });

    res.json(patient.enabledFeatures);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar recursos' });
  }
};

// POST /api/features/schedule
export const scheduleFeatureRelease = async (req: AuthRequest, res: Response) => {
  try {
    const { patientId, featureKey, releaseDate, note } = req.body;

    const scheduled = await prisma.scheduledFeature.create({
      data: {
        patientId,
        featureKey,
        releaseDate: new Date(releaseDate),
        note,
      },
    });

    res.status(201).json(scheduled);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao agendar liberação' });
  }
};

// GET /api/features/scheduled/:patientId
export const getScheduledFeatures = async (req: AuthRequest, res: Response) => {
  try {
    const { patientId } = req.params;

    const scheduled = await prisma.scheduledFeature.findMany({
      where: {
        patientId,
        isReleased: false,
      },
      orderBy: { releaseDate: 'asc' },
    });

    res.json(scheduled);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar agendamentos' });
  }
};
