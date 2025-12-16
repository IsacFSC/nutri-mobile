import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Gera número de protocolo único para cada paciente
 * Formato: NUTRI-YYYYMM-XXXX (ex: NUTRI-202512-0001)
 */
export async function generateProtocolNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `NUTRI-${year}${month}`;

  // Buscar o último número do mês atual
  const lastPatient = await prisma.patient.findFirst({
    where: {
      protocolNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      protocolNumber: 'desc',
    },
  });

  let nextNumber = 1;
  if (lastPatient && lastPatient.protocolNumber) {
    const lastNumber = parseInt(lastPatient.protocolNumber.split('-')[2]);
    nextNumber = lastNumber + 1;
  }

  const sequentialNumber = String(nextNumber).padStart(4, '0');
  return `${prefix}-${sequentialNumber}`;
}

/**
 * Script para popular protocolos de pacientes existentes
 */
async function populateExistingProtocols() {
  try {
    console.log('[Protocol] Buscando pacientes sem protocolo...');
    
    const patientsWithoutProtocol = await prisma.patient.findMany({
      where: {
        protocolNumber: null,
      },
    });

    console.log(`[Protocol] Encontrados ${patientsWithoutProtocol.length} pacientes sem protocolo`);

    for (const patient of patientsWithoutProtocol) {
      const protocolNumber = await generateProtocolNumber();
      await prisma.patient.update({
        where: { id: patient.id },
        data: { protocolNumber },
      });
      console.log(`[Protocol] ✅ Paciente ${patient.id} recebeu protocolo: ${protocolNumber}`);
    }

    console.log('[Protocol] ✅ Todos os protocolos foram gerados!');
  } catch (error) {
    console.error('[Protocol] ❌ Erro ao popular protocolos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Se executado diretamente
if (require.main === module) {
  populateExistingProtocols();
}
