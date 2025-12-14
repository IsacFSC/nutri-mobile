import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugAppointments() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log('=== DEBUG: Verificando Consultas ===');
    console.log('Data de hoje (início):', today.toISOString());
    console.log('Data de amanhã (início):', tomorrow.toISOString());
    console.log('Hora local:', new Date().toLocaleString('pt-BR'));
    console.log('');

    // Buscar todos os nutricionistas
    const nutritionists = await prisma.nutritionist.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });

    console.log(`Total de nutricionistas: ${nutritionists.length}`);
    console.log('');

    for (const nutritionist of nutritionists) {
      console.log(`--- Nutricionista: ${nutritionist.user.name} ---`);
      console.log(`ID: ${nutritionist.id}`);
      console.log(`Email: ${nutritionist.user.email}`);
      
      // Buscar TODAS as consultas deste nutricionista
      const allAppointments = await prisma.appointment.findMany({
        where: {
          nutritionistId: nutritionist.id,
        },
        include: {
          patient: {
            include: {
              user: { select: { name: true } }
            }
          }
        },
        orderBy: { dateTime: 'desc' }
      });

      console.log(`Total de consultas: ${allAppointments.length}`);

      if (allAppointments.length > 0) {
        console.log('\nTodas as consultas:');
        allAppointments.forEach((apt, index) => {
          const aptDate = new Date(apt.dateTime);
          const isToday = aptDate >= today && aptDate < tomorrow;
          console.log(`${index + 1}. ${aptDate.toLocaleString('pt-BR')} ${isToday ? '👈 HOJE' : ''}`);
          console.log(`   Paciente: ${apt.patient?.user?.name || 'N/A'}`);
          console.log(`   Status: ${apt.status}`);
          console.log(`   Tipo: ${apt.type}`);
          console.log(`   ID: ${apt.id}`);
        });
      }

      // Buscar consultas de hoje especificamente
      const todayAppointments = await prisma.appointment.findMany({
        where: {
          nutritionistId: nutritionist.id,
          dateTime: {
            gte: today,
            lt: tomorrow,
          },
        }
      });

      console.log(`\nConsultas marcadas para HOJE: ${todayAppointments.length}`);
      
      // Buscar consultas de hoje (não canceladas)
      const todayActiveAppointments = await prisma.appointment.count({
        where: {
          nutritionistId: nutritionist.id,
          dateTime: {
            gte: today,
            lt: tomorrow,
          },
          status: {
            notIn: ['CANCELLED', 'NO_SHOW'],
          },
        },
      });

      console.log(`Consultas ativas hoje (não canceladas): ${todayActiveAppointments}`);
      console.log('');
    }

  } catch (error) {
    console.error('Erro ao verificar consultas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAppointments();
