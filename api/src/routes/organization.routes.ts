import { Router, Request, Response } from 'express';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/organizations - Listar todas as organizações
router.get('/', authenticateToken, authorizeRoles('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { status, search } = req.query;
    const where: any = {};
    
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { cnpj: { contains: search as string } },
      ];
    }

    const organizations = await prisma.organization.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        nutritionists: { select: { id: true } },
        _count: { select: { nutritionists: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const orgsWithStats = await Promise.all(
      organizations.map(async (org) => {
        const patientsCount = await prisma.patient.count({
          where: { nutritionist: { organizationId: org.id } },
        });
        return { ...org, stats: { nutritionistsCount: org._count.nutritionists, patientsCount } };
      })
    );

    res.json(orgsWithStats);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Erro ao listar organizações' });
  }
});

// POST /api/organizations - Criar nova organização
router.post('/', authenticateToken, authorizeRoles('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { name, slug, cnpj, email, phone, address, city, state, zipCode, maxNutritionists, maxPatients, ownerId } = req.body;
    
    const existingOrg = await prisma.organization.findUnique({ where: { slug } });
    if (existingOrg) return res.status(400).json({ error: 'Slug já está em uso' });

    const organization = await prisma.organization.create({
      data: { name, slug, cnpj, email, phone, address, city, state, zipCode, maxNutritionists: maxNutritionists || 5, maxPatients: maxPatients || 100, ownerId },
      include: { owner: { select: { name: true, email: true } } },
    });

    res.status(201).json(organization);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Erro ao criar organização' });
  }
});

// GET /api/organizations/:id/stats - Estatísticas da organização
router.get('/:id/stats', authenticateToken, authorizeRoles('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const organization = await prisma.organization.findUnique({
      where: { id },
      include: { nutritionists: true },
    });

    if (!organization) return res.status(404).json({ error: 'Organização não encontrada' });

    const totalPatients = await prisma.patient.count({ where: { nutritionist: { organizationId: id } } });
    const totalAppointments = await prisma.appointment.count({ where: { nutritionist: { organizationId: id } } });

    res.json({
      organizationId: id,
      organizationName: organization.name,
      stats: {
        totalNutritionists: organization.nutritionists.length,
        totalPatients,
        totalAppointments,
      },
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// GET /api/organizations/:id - Detalhes de uma organização
router.get('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        nutritionists: { include: { user: { select: { name: true, email: true } } } },
      },
    });

    if (!organization) return res.status(404).json({ error: 'Organização não encontrada' });
    res.json(organization);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Erro ao buscar organização' });
  }
});

// PUT /api/organizations/:id - Atualizar organização
router.put('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, cnpj, email, phone, address, city, state, zipCode, status, maxNutritionists, maxPatients } = req.body;
    
    const organization = await prisma.organization.update({
      where: { id },
      data: { name, cnpj, email, phone, address, city, state, zipCode, status, maxNutritionists, maxPatients },
    });

    res.json(organization);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Erro ao atualizar organização' });
  }
});

// DELETE /api/organizations/:id - Excluir organização
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const nutritionistsCount = await prisma.nutritionist.count({ where: { organizationId: id } });
    
    if (nutritionistsCount > 0) {
      return res.status(400).json({ error: `Não é possível excluir. Existem ${nutritionistsCount} nutricionista(s) vinculado(s).` });
    }

    await prisma.organization.delete({ where: { id } });
    res.json({ message: 'Organização excluída com sucesso' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Erro ao excluir organização' });
  }
});

export default router;
