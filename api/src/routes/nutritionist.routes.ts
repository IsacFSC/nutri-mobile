import { Router, Request, Response } from 'express';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const router = Router();
const prisma = new PrismaClient();

// GET /api/nutritionists - Listar nutricionistas (ADMIN only)
router.get('/', authenticateToken, authorizeRoles('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { organizationId, isActive } = req.query;
    const where: any = {};

    if (organizationId) where.organizationId = organizationId as string;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const nutritionists = await prisma.nutritionist.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
        organization: { select: { id: true, name: true, slug: true } },
        _count: { select: { patients: true, appointments: true, recipes: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(nutritionists);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Erro ao listar nutricionistas' });
  }
});

// POST /api/nutritionists - Criar nutricionista (ADMIN only)
router.post('/', authenticateToken, authorizeRoles('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone, organizationId, specialization, crn, bio } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'Email já cadastrado' });

    const hashedPassword = await bcrypt.hash(password, 10);

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
          user: { select: { id: true, name: true, email: true, phone: true } },
          organization: { select: { id: true, name: true } },
        },
      });

      return nutritionist;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Erro ao criar nutricionista' });
  }
});

// GET /api/nutritionists/:id/stats - Estatísticas do nutricionista
router.get('/:id/stats', authenticateToken, authorizeRoles('ADMIN', 'NUTRITIONIST'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const nutritionist = await prisma.nutritionist.findUnique({
      where: { id },
      include: {
        user: { select: { name: true } },
        _count: { select: { patients: true, appointments: true, recipes: true } },
      },
    });

    if (!nutritionist) return res.status(404).json({ error: 'Nutricionista não encontrado' });

    res.json({
      nutritionistId: id,
      nutritionistName: nutritionist.user.name,
      stats: {
        totalPatients: nutritionist._count.patients,
        totalAppointments: nutritionist._count.appointments,
        totalRecipes: nutritionist._count.recipes,
      },
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// POST /api/nutritionists/:id/transfer-patients - Transferir pacientes
router.post('/:id/transfer-patients', authenticateToken, authorizeRoles('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { targetNutritionistId, patientIds } = req.body;

    if (!targetNutritionistId || !patientIds || patientIds.length === 0) {
      return res.status(400).json({ error: 'targetNutritionistId e patientIds são obrigatórios' });
    }

    const targetNutritionist = await prisma.nutritionist.findUnique({ where: { id: targetNutritionistId } });
    if (!targetNutritionist) return res.status(404).json({ error: 'Nutricionista de destino não encontrado' });

    await prisma.patient.updateMany({
      where: { id: { in: patientIds }, nutritionistId: id },
      data: { nutritionistId: targetNutritionistId },
    });

    res.json({ message: `${patientIds.length} paciente(s) transferido(s) com sucesso` });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Erro ao transferir pacientes' });
  }
});

// GET /api/nutritionists/:id - Detalhes de um nutricionista
router.get('/:id', authenticateToken, authorizeRoles('ADMIN', 'NUTRITIONIST'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const nutritionist = await prisma.nutritionist.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
        organization: true,
        patients: { include: { user: { select: { name: true, email: true } } } },
        _count: { select: { patients: true, appointments: true, recipes: true } },
      },
    });

    if (!nutritionist) return res.status(404).json({ error: 'Nutricionista não encontrado' });
    res.json(nutritionist);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Erro ao buscar nutricionista' });
  }
});

// PUT /api/nutritionists/:id - Atualizar nutricionista
router.put('/:id', authenticateToken, authorizeRoles('ADMIN', 'NUTRITIONIST'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, phone, organizationId, specialization, crn, bio, isActive } = req.body;

    const nutritionist = await prisma.nutritionist.findUnique({ where: { id }, include: { user: true } });
    if (!nutritionist) return res.status(404).json({ error: 'Nutricionista não encontrado' });

    const result = await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: nutritionist.userId }, data: { name, phone } });
      const updated = await tx.nutritionist.update({
        where: { id },
        data: { organizationId, specialization, crn, bio, isActive },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          organization: { select: { id: true, name: true } },
        },
      });
      return updated;
    });

    res.json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Erro ao atualizar nutricionista' });
  }
});

// DELETE /api/nutritionists/:id - Desativar/Excluir nutricionista (ADMIN only)
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;

    const nutritionist = await prisma.nutritionist.findUnique({
      where: { id },
      include: { _count: { select: { patients: true } } },
    });

    if (!nutritionist) return res.status(404).json({ error: 'Nutricionista não encontrado' });

    if (permanent === 'true' && nutritionist._count.patients > 0) {
      return res.status(400).json({
        error: `Não é possível excluir permanentemente. Existem ${nutritionist._count.patients} paciente(s) vinculado(s).`,
      });
    }

    if (permanent === 'true') {
      await prisma.$transaction([
        prisma.nutritionist.delete({ where: { id } }),
        prisma.user.delete({ where: { id: nutritionist.userId } }),
      ]);
      res.json({ message: 'Nutricionista excluído permanentemente' });
    } else {
      await prisma.nutritionist.update({ where: { id }, data: { isActive: false } });
      res.json({ message: 'Nutricionista desativado com sucesso' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Erro ao excluir nutricionista' });
  }
});

export default router;
