import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// LIST ALL ORGANIZATIONS (ADMIN only)
// ============================================
export const listOrganizations = async (req: Request, res: Response) => {
  try {
    const { status, search } = req.query;

    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { cnpj: { contains: search as string } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const organizations = await prisma.organization.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        nutritionists: {
          select: {
            id: true,
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
            nutritionists: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calcular total de pacientes por organização
    const orgsWithStats = await Promise.all(
      organizations.map(async (org) => {
        const patientsCount = await prisma.patient.count({
          where: {
            nutritionist: {
              organizationId: org.id,
            },
          },
        });

        return {
          ...org,
          stats: {
            nutritionistsCount: org._count.nutritionists,
            patientsCount,
          },
        };
      })
    );

    res.json(orgsWithStats);
  } catch (error) {
    console.error('Error listing organizations:', error);
    res.status(500).json({ error: 'Erro ao listar organizações' });
  }
};

// ============================================
// GET SINGLE ORGANIZATION
// ============================================
export const getOrganization = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        nutritionists: {
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
            _count: {
              select: {
                patients: true,
                appointments: true,
              },
            },
          },
        },
      },
    });

    if (!organization) {
      return res.status(404).json({ error: 'Organização não encontrada' });
    }

    res.json(organization);
  } catch (error) {
    console.error('Error fetching organization:', error);
    res.status(500).json({ error: 'Erro ao buscar organização' });
  }
};

// ============================================
// CREATE ORGANIZATION (ADMIN only)
// ============================================
export const createOrganization = async (req: Request, res: Response) => {
  try {
    const {
      name,
      slug,
      cnpj,
      email,
      phone,
      website,
      address,
      city,
      state,
      zipCode,
      description,
      maxNutritionists,
      maxPatients,
      ownerId,
    } = req.body;

    // Verificar se o slug já existe
    const existingOrg = await prisma.organization.findUnique({
      where: { slug },
    });

    if (existingOrg) {
      return res.status(400).json({ error: 'Slug já está em uso' });
    }

    // Verificar se o owner existe e é ADMIN
    const owner = await prisma.user.findUnique({
      where: { id: ownerId },
    });

    if (!owner || owner.role !== 'ADMIN') {
      return res.status(400).json({ error: 'Owner deve ser um usuário ADMIN' });
    }

    const organization = await prisma.organization.create({
      data: {
        name,
        slug,
        cnpj,
        email,
        phone,
        website,
        address,
        city,
        state,
        zipCode,
        description,
        maxNutritionists: maxNutritionists || 5,
        maxPatients: maxPatients || 100,
        ownerId,
      },
      include: {
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json(organization);
  } catch (error) {
    console.error('Error creating organization:', error);
    res.status(500).json({ error: 'Erro ao criar organização' });
  }
};

// ============================================
// UPDATE ORGANIZATION
// ============================================
export const updateOrganization = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      cnpj,
      email,
      phone,
      website,
      address,
      city,
      state,
      zipCode,
      description,
      status,
      maxNutritionists,
      maxPatients,
    } = req.body;

    const organization = await prisma.organization.update({
      where: { id },
      data: {
        name,
        cnpj,
        email,
        phone,
        website,
        address,
        city,
        state,
        zipCode,
        description,
        status,
        maxNutritionists,
        maxPatients,
      },
      include: {
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    res.json(organization);
  } catch (error) {
    console.error('Error updating organization:', error);
    res.status(500).json({ error: 'Erro ao atualizar organização' });
  }
};

// ============================================
// DELETE ORGANIZATION
// ============================================
export const deleteOrganization = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar se existem nutricionistas vinculados
    const nutritionistsCount = await prisma.nutritionist.count({
      where: { organizationId: id },
    });

    if (nutritionistsCount > 0) {
      return res.status(400).json({
        error: `Não é possível excluir. Existem ${nutritionistsCount} nutricionista(s) vinculado(s) a esta organização.`,
      });
    }

    await prisma.organization.delete({
      where: { id },
    });

    res.json({ message: 'Organização excluída com sucesso' });
  } catch (error) {
    console.error('Error deleting organization:', error);
    res.status(500).json({ error: 'Erro ao excluir organização' });
  }
};

// ============================================
// GET ORGANIZATION STATS
// ============================================
export const getOrganizationStats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        nutritionists: {
          include: {
            _count: {
              select: {
                patients: true,
                appointments: true,
              },
            },
          },
        },
      },
    });

    if (!organization) {
      return res.status(404).json({ error: 'Organização não encontrada' });
    }

    const totalPatients = await prisma.patient.count({
      where: {
        nutritionist: {
          organizationId: id,
        },
      },
    });

    const totalAppointments = await prisma.appointment.count({
      where: {
        nutritionist: {
          organizationId: id,
        },
      },
    });

    const activeNutritionists = organization.nutritionists.filter(
      (n) => n.isActive
    ).length;

    res.json({
      organizationId: id,
      organizationName: organization.name,
      stats: {
        totalNutritionists: organization.nutritionists.length,
        activeNutritionists,
        totalPatients,
        totalAppointments,
        maxNutritionists: organization.maxNutritionists,
        maxPatients: organization.maxPatients,
        utilizationNutritionists: `${Math.round(
          (organization.nutritionists.length / organization.maxNutritionists) * 100
        )}%`,
        utilizationPatients: `${Math.round((totalPatients / organization.maxPatients) * 100)}%`,
      },
    });
  } catch (error) {
    console.error('Error fetching organization stats:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
};
