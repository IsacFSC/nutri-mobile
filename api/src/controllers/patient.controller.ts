import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Criar novo paciente
export const createPatient = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      nutritionistId,
      // Dados Pessoais
      cpf,
      rg,
      birthDate,
      gender,
      phone,
      emergencyContact,
      emergencyPhone,
      // Endereço
      address,
      city,
      state,
      zipCode,
      // Dados Antropométricos
      weight,
      height,
      bodyFat,
      muscleMass,
      waistCircumference,
      hipCircumference,
      // Dados Clínicos
      bloodType,
      allergies,
      chronicDiseases,
      medications,
      foodRestrictions,
      familyHistory,
      // Estilo de Vida
      physicalActivity,
      smokingStatus,
      alcoholConsumption,
      sleepHours,
      stressLevel,
      // Objetivos
      goals,
      observations,
    } = req.body;

    // Calcular IMC se tiver peso e altura
    let bmi = null;
    if (weight && height) {
      const heightInMeters = height / 100;
      bmi = weight / (heightInMeters * heightInMeters);
    }

    const patient = await prisma.patient.create({
      data: {
        userId,
        nutritionistId,
        cpf,
        rg,
        birthDate: birthDate ? new Date(birthDate) : null,
        gender,
        phone,
        emergencyContact,
        emergencyPhone,
        address,
        city,
        state,
        zipCode,
        weight,
        height,
        bmi,
        bodyFat,
        muscleMass,
        waistCircumference,
        hipCircumference,
        bloodType,
        allergies,
        chronicDiseases,
        medications,
        foodRestrictions,
        familyHistory,
        physicalActivity,
        smokingStatus,
        alcoholConsumption,
        sleepHours,
        stressLevel,
        goals,
        observations,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    res.status(201).json(patient);
  } catch (error: any) {
    console.error('Error creating patient:', error);
    res.status(500).json({ error: 'Failed to create patient', details: error.message });
  }
};

// Listar todos os pacientes do nutricionista
export const getPatients = async (req: Request, res: Response) => {
  try {
    const { nutritionistId } = req.params;
    const { search, page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Buscar o registro de nutricionista pelo userId
    const nutritionist = await prisma.nutritionist.findUnique({
      where: { userId: nutritionistId }
    });

    if (!nutritionist) {
      return res.status(404).json({ error: 'Nutricionista não encontrado' });
    }

    const where: any = {
      nutritionistId: nutritionist.id,
    };

    // Busca por nome ou CPF
    if (search) {
      where.OR = [
        { user: { name: { contains: search as string, mode: 'insensitive' } } },
        { cpf: { contains: search as string } },
      ];
    }

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              phone: true,
            },
          },
          appointments: {
            orderBy: { dateTime: 'desc' },
            take: 1,
            select: {
              id: true,
              dateTime: true,
              status: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.patient.count({ where }),
    ]);

    // Formatar dados para a tabela
    const formattedPatients = patients.map((patient) => ({
      id: patient.id,
      name: patient.user.name,
      email: patient.user.email,
      cpf: patient.cpf,
      phone: patient.phone || patient.user.phone,
      avatar: patient.user.avatar,
      weight: patient.weight,
      height: patient.height,
      bmi: patient.bmi,
      lastConsultation: patient.lastConsultationDate,
      lastAppointment: patient.appointments[0]?.dateTime,
      appointmentStatus: patient.appointments[0]?.status,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
    }));

    res.json({
      patients: formattedPatients,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Failed to fetch patients', details: error.message });
  }
};

// Obter detalhes completos de um paciente
export const getPatientById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            phone: true,
            createdAt: true,
          },
        },
        nutritionist: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        appointments: {
          orderBy: { dateTime: 'desc' },
          include: {
            nutritionist: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        consultationNotes: {
          orderBy: { createdAt: 'desc' },
        },
        progressEntries: {
          orderBy: { date: 'desc' },
          take: 10,
        },
      },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json(patient);
  } catch (error: any) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ error: 'Failed to fetch patient', details: error.message });
  }
};

// Atualizar paciente
export const updatePatient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Recalcular IMC se peso ou altura mudaram
    if (updateData.weight || updateData.height) {
      const patient = await prisma.patient.findUnique({ where: { id } });
      const weight = updateData.weight || patient?.weight;
      const height = updateData.height || patient?.height;

      if (weight && height) {
        const heightInMeters = height / 100;
        updateData.bmi = weight / (heightInMeters * heightInMeters);
      }
    }

    // Converter birthDate se existir
    if (updateData.birthDate) {
      updateData.birthDate = new Date(updateData.birthDate);
    }

    const patient = await prisma.patient.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    res.json(patient);
  } catch (error: any) {
    console.error('Error updating patient:', error);
    res.status(500).json({ error: 'Failed to update patient', details: error.message });
  }
};

// Deletar paciente
export const deletePatient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.patient.delete({
      where: { id },
    });

    res.json({ message: 'Patient deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting patient:', error);
    res.status(500).json({ error: 'Failed to delete patient', details: error.message });
  }
};

// Obter histórico de consultas
export const getPatientConsultationHistory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const consultations = await prisma.consultationNote.findMany({
      where: { patientId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        patient: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    res.json(consultations);
  } catch (error: any) {
    console.error('Error fetching consultation history:', error);
    res.status(500).json({ error: 'Failed to fetch consultation history', details: error.message });
  }
};

// Criar nota de consulta
export const createConsultationNote = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const noteData = req.body;

    // Calcular IMC atual se tiver peso e altura
    let currentBMI = null;
    if (noteData.currentWeight && noteData.currentHeight) {
      const heightInMeters = noteData.currentHeight / 100;
      currentBMI = noteData.currentWeight / (heightInMeters * heightInMeters);
    }

    const consultationNote = await prisma.consultationNote.create({
      data: {
        ...noteData,
        currentBMI,
        patientId,
        nextAppointment: noteData.nextAppointment ? new Date(noteData.nextAppointment) : null,
      },
    });

    // Atualizar data da última consulta do paciente
    await prisma.patient.update({
      where: { id: patientId },
      data: { lastConsultationDate: new Date() },
    });

    res.status(201).json(consultationNote);
  } catch (error: any) {
    console.error('Error creating consultation note:', error);
    res.status(500).json({ error: 'Failed to create consultation note', details: error.message });
  }
};

// Gerar PDF do formulário do paciente
export const generatePatientPDF = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        user: true,
        nutritionist: {
          include: {
            user: true,
          },
        },
        consultationNotes: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // TODO: Implementar geração de PDF usando biblioteca como pdfkit ou puppeteer
    // Por enquanto, retornar os dados estruturados

    res.json({
      message: 'PDF generation endpoint - to be implemented',
      data: patient,
    });
  } catch (error: any) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
  }
};
