import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
  user?: any;
}

/**
 * Middleware de autenticação JWT com verificação MFA
 * TODO ENDPOINT REQUER ESTE MIDDLEWARE (exceto /auth/login e /auth/register)
 */
export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Token não fornecido',
      message: 'Autenticação requerida. Por favor, faça login.'
    });
  }

  try {
    // Verificar token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Buscar usuário completo no banco
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        mfaEnabled: true,
        emailVerified: true,
        lockedUntil: true,
        lgpdConsent: true,
        termsAcceptedAt: true,
      }
    });

    if (!user) {
      return res.status(403).json({ error: 'Usuário não encontrado' });
    }

    // Verificar se conta está bloqueada
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return res.status(423).json({ 
        error: 'Conta bloqueada',
        message: `Conta temporariamente bloqueada até ${user.lockedUntil.toLocaleString('pt-BR')}`
      });
    }

    // Verificar se email foi verificado (apenas em produção)
    if (process.env.NODE_ENV === 'production' && !user.emailVerified) {
      return res.status(403).json({ 
        error: 'Email não verificado',
        message: 'Por favor, verifique seu email antes de continuar'
      });
    }

    // Verificar consentimento LGPD (apenas em produção)
    if (process.env.NODE_ENV === 'production' && (!user.lgpdConsent || !user.termsAcceptedAt)) {
      return res.status(403).json({ 
        error: 'Consentimento LGPD requerido',
        message: 'Por favor, aceite os termos de uso e política de privacidade'
      });
    }

    // Verificar MFA se habilitado
    if (user.mfaEnabled && !decoded.mfaVerified) {
      return res.status(403).json({ 
        error: 'MFA requerido',
        message: 'Por favor, complete a autenticação de dois fatores',
        requireMfa: true
      });
    }

    // Anexar dados do usuário à requisição
    req.userId = user.id;
    req.userRole = user.role;
    req.user = user;

    // Registrar acesso em auditoria (async, não bloqueia)
    createAuditLog(user.id, 'ACCESS', req.path, req.method, req.ip, req.get('user-agent'))
      .catch(err => console.error('Erro ao criar audit log:', err));

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expirado',
        message: 'Sua sessão expirou. Por favor, faça login novamente.'
      });
    }
    
    return res.status(403).json({ 
      error: 'Token inválido',
      message: 'Autenticação inválida. Por favor, faça login novamente.'
    });
  }
};

/**
 * Middleware de autorização por roles
 */
export const authorizeRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      // Registrar tentativa de acesso não autorizado
      if (req.userId) {
        createAuditLog(
          req.userId, 
          'UNAUTHORIZED_ACCESS', 
          req.path, 
          req.method, 
          req.ip, 
          req.get('user-agent'),
          { requiredRoles: roles, userRole: req.userRole }
        ).catch(err => console.error('Erro ao criar audit log:', err));
      }
      
      return res.status(403).json({ 
        error: 'Acesso negado',
        message: 'Você não tem permissão para acessar este recurso'
      });
    }
    next();
  };
};

/**
 * Middleware para verificar MFA em endpoints sensíveis
 */
export const requireMfaVerification = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { mfaEnabled: true }
  });

  if (user?.mfaEnabled) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      if (!decoded.mfaVerified) {
        return res.status(403).json({ 
          error: 'MFA requerido',
          message: 'Este recurso requer autenticação de dois fatores',
          requireMfa: true
        });
      }
    }
  }

  next();
};

/**
 * Função auxiliar para criar logs de auditoria (LGPD)
 */
async function createAuditLog(
  userId: string,
  action: string,
  resource: string,
  method: string,
  ipAddress?: string,
  userAgent?: string,
  metadata?: any
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        resourceId: metadata?.resourceId || null,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        metadata: metadata || null,
      }
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Middleware para registrar ações em auditoria
 */
export const auditAction = (action: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.userId) {
      await createAuditLog(
        req.userId,
        action,
        req.path,
        req.method,
        req.ip,
        req.get('user-agent'),
        { body: req.body, params: req.params }
      );
    }
    next();
  };
};

