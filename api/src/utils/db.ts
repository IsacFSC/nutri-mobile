import { PrismaClient } from '@prisma/client';

/**
 * Singleton do Prisma Client com retry logic para cold starts
 */
class DatabaseConnection {
  private static instance: PrismaClient | null = null;
  private static isConnecting = false;

  static getInstance(): PrismaClient {
    if (!this.instance) {
      this.instance = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
      });
    }
    return this.instance;
  }

  /**
   * Tenta conectar ao banco com retry para cold starts do Neon
   */
  static async connect(maxRetries = 3, delayMs = 2000): Promise<void> {
    if (this.isConnecting) return;
    
    this.isConnecting = true;
    const prisma = this.getInstance();
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Database] Tentando conectar... (tentativa ${attempt}/${maxRetries})`);
        await prisma.$connect();
        console.log('✅ [Database] Conectado ao PostgreSQL (Neon)');
        this.isConnecting = false;
        return;
      } catch (error: any) {
        console.error(`❌ [Database] Erro na tentativa ${attempt}:`, error.message);
        
        if (attempt < maxRetries) {
          console.log(`[Database] Aguardando ${delayMs}ms antes de tentar novamente...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        } else {
          this.isConnecting = false;
          console.error('❌ [Database] Falha ao conectar após todas as tentativas');
          console.error('⚠️  O banco Neon pode estar em cold start. Aguarde alguns segundos e tente novamente.');
          throw new Error('Não foi possível conectar ao banco de dados');
        }
      }
    }
  }

  /**
   * Desconecta do banco
   */
  static async disconnect(): Promise<void> {
    if (this.instance) {
      await this.instance.$disconnect();
      console.log('[Database] Desconectado');
    }
  }
}

export default DatabaseConnection;
export const prisma = DatabaseConnection.getInstance();
