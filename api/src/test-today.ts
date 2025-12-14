import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testToday() {
  const nutritionistId = '0a8eb088-5180-499c-9b65-c49b54f5313e'; // Dra. Maria Santos
  
  console.log('=== Testando lógica de "hoje" ===\n');
  
  // Lógica ANTIGA (com bug de timezone)
  const oldToday = new Date();
  oldToday.setHours(0, 0, 0, 0);
  const oldTomorrow = new Date(oldToday);
  oldTomorrow.setDate(oldTomorrow.getDate() + 1);
  
  console.log('ANTIGA Lógica:');
  console.log('  Hoje:', oldToday.toISOString());
  console.log('  Amanhã:', oldTomorrow.toISOString());
  
  const oldCount = await prisma.appointment.count({
    where: {
      nutritionistId,
      dateTime: {
        gte: oldToday,
        lt: oldTomorrow,
      },
      status: { notIn: ['CANCELLED', 'NO_SHOW'] },
    },
  });
  console.log('  Consultas encontradas:', oldCount);
  
  console.log('\n---\n');
  
  // Lógica NOVA (corrigida com UTC)
  const now = new Date();
  const newToday = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
  const newTomorrow = new Date(newToday);
  newTomorrow.setUTCDate(newTomorrow.getUTCDate() + 1);
  
  console.log('NOVA Lógica (UTC):');
  console.log('  Hoje:', newToday.toISOString());
  console.log('  Amanhã:', newTomorrow.toISOString());
  
  const newCount = await prisma.appointment.count({
    where: {
      nutritionistId,
      dateTime: {
        gte: newToday,
        lt: newTomorrow,
      },
      status: { notIn: ['CANCELLED', 'NO_SHOW'] },
    },
  });
  console.log('  Consultas encontradas:', newCount);
  
  // Mostrar as consultas
  const appointments = await prisma.appointment.findMany({
    where: { nutritionistId },
    select: {
      dateTime: true,
      status: true,
      patient: {
        select: {
          user: { select: { name: true } }
        }
      }
    },
    orderBy: { dateTime: 'desc' }
  });
  
  console.log('\n---\n');
  console.log('Todas as consultas deste nutricionista:');
  appointments.forEach(apt => {
    console.log(`  ${apt.dateTime.toISOString()} (${apt.dateTime.toLocaleString('pt-BR')}) - ${apt.patient.user.name}`);
  });
  
  await prisma.$disconnect();
}

testToday();
