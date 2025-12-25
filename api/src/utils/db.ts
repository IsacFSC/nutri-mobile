import { PrismaClient } from '@prisma/client';

/**
 * Singleton do Prisma Client com retry logic e reconnection
 */
class DatabaseConnection {
  private static instance: PrismaClient | null = null;
  private static isConnecting = false;
  private static reconnectTimer: NodeJS.Timeout | null = null;

  static getInstance(): PrismaClient {
    if (!this.instance) {
      this.instance = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
        // Configurações de connection pool para Render.com
        datasources: {
          db: {
            url: process.env.DATABASE_URL,
          },
        },
      });

      // Middleware para retry automático em caso de connection reset
      this.instance.$use(async (params, next) => {
        const maxRetries = 3;
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            return await next(params);
          } catch (error: any) {
            lastError = error;
            
            // Verificar se é erro de conexão (P1017, P1001, P1002)
            const isConnectionError = 
              error.code === 'P1017' || // Server closed connection
              error.code === 'P1001' || // Can't reach database
              error.code === 'P1002' || // Database timeout
              error.message?.includes('Connection reset') ||
              error.message?.includes('ECONNRESET');

            if (isConnectionError && attempt < maxRetries) {
              console.warn(`[Prisma] Connection error on attempt ${attempt}, retrying...`);
              
              // Tentar reconectar
              try {
                await this.instance?.$disconnect();
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                await this.instance?.$connect();
              } catch (reconnectError) {
                console.error('[Prisma] Reconnection failed:', reconnectError);
              }
              
              continue;
            }
            
            throw error;
          }
        }

        throw lastError;
      });

      // Handler para eventos de desconexão
      process.on('beforeExit', async () => {
        await this.disconnect();
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
