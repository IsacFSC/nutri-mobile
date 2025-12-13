import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ============================================
// LIST ALL NUTRITIONISTS (ADMIN)
// ============================================
export const listNutritionists = async (req: Request, res: Response) => {
  try {
    const { organizationId, isActive, search } = req.query;

    const where: any = {};

    if (organizationId) {
      where.organizationId = organizationId as string;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const nutritionists = await prisma.nutritionist.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            createdAt: true,
            lastLoginAt: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            patients: true,
            appointments: true,
            recipes: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Filtrar por busca se fornecido
    let filteredNutritionists = nutritionists;
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filteredNutritionists = nutritionists.filter(
        (n) =>
          n.user.name.toLowerCase().includes(searchLower) ||
          n.user.email.toLowerCase().includes(searchLower) ||
          (n.crn && n.crn.toLowerCase().includes(searchLower))
      );
    }

    res.json(filteredNutritionists);
  } catch (error) {
    console.error('Error listing nutritionists:', error);
    res.status(500).json({ error: 'Erro ao listar nutricionistas' });
  }
};

// ============================================
// GET SINGLE NUTRITIONIST
// ============================================
export const getNutritionist = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const nutritionist = await prisma.nutritionist.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            createdAt: true,
            lastLoginAt: true,
            mfaEnabled: true,
          },
        },
        organization: true,
        patients: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            patients: true,
            appointments: true,
            recipes: true,
            exercises: true,
          },
        },
      },
    });

    if (!nutritionist) {
      return res.status(404).json({ error: 'Nutricionista não encontrado' });
    }

    res.json(nutritionist);
  } catch (error) {
    console.error('Error fetching nutritionist:', error);
    res.status(500).json({ error: 'Erro ao buscar nutricionista' });
  }
};

// ============================================
// CREATE NUTRITIONIST (ADMIN)
// ============================================
export const createNutritionist = async (req: Request, res: Response) => {
  try {
    const {
      email,
      password,
      name,
      phone,
      organizationId,
      specialization,
      crn,
      bio,
    } = req.body;

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Verificar se organização existe
    if (organizationId) {
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        include: {
          _count: {
            select: {
              nutritionists: true,
            },
          },
        },
      });

      if (!organization) {
        return res.status(404).json({ error: 'Organização não encontrada' });
      }

      // Verificar limite de nutricionistas
      if (organization._count.nutritionists >= organization.maxNutritionists) {
        return res.status(400).json({
          error: `Limite de ${organization.maxNutritionists} nutricionista(s) atingido para esta organização`,
        });
      }
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário e nutricionista em transação
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          phone,
          role: 'NUTRITIONIST',
          emailVerified: true,
          lgpdConsent: true,
          lgpdConsentDate: new Date(),
          termsAcceptedAt: new Date(),
          privacyPolicyAcceptedAt: new Date(),
        },
      });

      const nutritionist = await tx.nutritionist.create({
        data: {
          userId: user.id,
          organizationId,
          specialization,
          crn,
          bio,
          isActive: true,
          hiredDate: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return nutritionist;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating nutritionist:', error);
    res.status(500).json({ error: 'Erro ao criar nutricionista' });
  }
};

// ============================================
// UPDATE NUTRITIONIST
// ============================================
export const updateNutritionist = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      phone,
      organizationId,
      specialization,
      crn,
      bio,
      isActive,
    } = req.body;

    const nutritionist = await prisma.nutritionist.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!nutritionist) {
      return res.status(404).json({ error: 'Nutricionista não encontrado' });
    }

    // Atualizar em transação
    const result = await prisma.$transaction(async (tx) => {
      // Atualizar dados do usuário
      await tx.user.update({
        where: { id: nutritionist.userId },
        data: {
          name,
          phone,
        },
      });

      // Atualizar dados do nutricionista
      const updated = await tx.nutritionist.update({
        where: { id },
        data: {
          organizationId,
          specialization,
          crn,
          bio,
          isActive,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return updated;
    });

    res.json(result);
  } catch (error) {
    console.error('Error updating nutritionist:', error);
    res.status(500).json({ error: 'Erro ao atualizar nutricionista' });
  }
};

// ============================================
// DELETE NUTRITIONIST (Soft delete - isActive = false)
// ============================================
export const deleteNutritionist = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;

    const nutritionist = await prisma.nutritionist.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            patients: true,
            appointments: true,
          },
        },
      },
    });

    if (!nutritionist) {
      return res.status(404).json({ error: 'Nutricionista não encontrado' });
    }

    // Se tiver pacientes, não permitir exclusão permanente
    if (permanent === 'true' && nutritionist._count.patients > 0) {
      return res.status(400).json({
        error: `Não é possível excluir permanentemente. Existem ${nutritionist._count.patients} paciente(s) vinculado(s).`,
      });
    }

    if (permanent === 'true') {
      // Exclusão permanente
      await prisma.$transaction([
        prisma.nutritionist.delete({ where: { id } }),
        prisma.user.delete({ where: { id: nutritionist.userId } }),
      ]);

      res.json({ message: 'Nutricionista excluído permanentemente' });
    } else {
      // Soft delete
      await prisma.nutritionist.update({
        where: { id },
        data: { isActive: false },
      });

      res.json({ message: 'Nutricionista desativado com sucesso' });
    }
  } catch (error) {
    console.error('Error deleting nutritionist:', error);
    res.status(500).json({ error: 'Erro ao excluir nutricionista' });
  }
};

// ============================================
// GET NUTRITIONIST STATS
// ============================================
export const getNutritionistStats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const nutritionist = await prisma.nutritionist.findUnique({
      where: { id },
      include: {
        user: { select: { name: true } },
        _count: {
          select: {
            patients: true,
            appointments: true,
            recipes: true,
            exercises: true,
          },
        },
      },
    });

    if (!nutritionist) {
      return res.status(404).json({ error: 'Nutricionista não encontrado' });
    }

    // Contar consultas por status
    const appointmentsByStatus = await prisma.appointment.groupBy({
      by: ['status'],
      where: { nutritionistId: id },
      _count: true,
    });

    // Contar pacientes ativos (com consulta nos últimos 90 dias)
    const activePatients = await prisma.patient.count({
      where: {
        nutritionistId: id,
        appointments: {
          some: {
            dateTime: {
              gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
            },
          },
        },
      },
    });

    res.json({
      nutritionistId: id,
      nutritionistName: nutritionist.user.name,
      stats: {
        totalPatients: nutritionist._count.patients,
        activePatients,
        totalAppointments: nutritionist._count.appointments,
        appointmentsByStatus,
        totalRecipes: nutritionist._count.recipes,
        totalExercises: nutritionist._count.exercises,
      },
    });
  } catch (error) {
    console.error('Error fetching nutritionist stats:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
};

// ============================================
// TRANSFER PATIENTS (mover pacientes para outro nutricionista)
// ============================================
export const transferPatients = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // ID do nutricionista de origem
    const { targetNutritionistId, patientIds } = req.body;

    if (!targetNutritionistId || !patientIds || patientIds.length === 0) {
      return res.status(400).json({
        error: 'targetNutritionistId e patientIds são obrigatórios',
      });
    }

    // Verificar se o nutricionista de destino existe
    const targetNutritionist = await prisma.nutritionist.findUnique({
      where: { id: targetNutritionistId },
    });

    if (!targetNutritionist) {
      return res.status(404).json({ error: 'Nutricionista de destino não encontrado' });
    }

    // Transferir pacientes
    await prisma.patient.updateMany({
      where: {
        id: { in: patientIds },
        nutritionistId: id,
      },
      data: {
        nutritionistId: targetNutritionistId,
      },
    });

    res.json({
      message: `${patientIds.length} paciente(s) transferido(s) com sucesso`,
      transferredCount: patientIds.length,
    });
  } catch (error) {
    console.error('Error transferring patients:', error);
    res.status(500).json({ error: 'Erro ao transferir pacientes' });
  }
};
