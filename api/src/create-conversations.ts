import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createMissingConversations() {
  try {
    console.log('🔍 Verificando consultas sem conversa...\n');

    // Buscar consultas que não têm conversa
    const appointmentsWithoutConversation = await prisma.appointment.findMany({
      where: {
        conversation: null,
        status: {
          notIn: ['CANCELLED', 'NO_SHOW'],
        },
      },
      include: {
        patient: {
          include: {
            user: { select: { name: true } }
          }
        },
        nutritionist: {
          include: {
            user: { select: { name: true } }
          }
        }
      }
    });

    console.log(`📊 Encontradas ${appointmentsWithoutConversation.length} consultas sem conversa\n`);

    if (appointmentsWithoutConversation.length === 0) {
      console.log('✅ Todas as consultas já possuem conversa!');
      return;
    }

    // Criar conversas para cada consulta
    for (const appointment of appointmentsWithoutConversation) {
      console.log(`📝 Criando conversa para consulta:`);
      console.log(`   Paciente: ${appointment.patient.user.name}`);
      console.log(`   Nutricionista: ${appointment.nutritionist.user.name}`);
      console.log(`   Data: ${appointment.dateTime.toLocaleString('pt-BR')}`);

      const conversation = await prisma.conversation.create({
        data: {
          patientId: appointment.patientId,
          nutritionistId: appointment.nutritionistId,
          appointmentId: appointment.id,
          status: 'ACTIVE',
        },
      });

      console.log(`   ✅ Conversa criada: ${conversation.id}\n`);
    }

    console.log(`\n✨ Processo concluído! ${appointmentsWithoutConversation.length} conversas criadas.`);

  } catch (error) {
    console.error('❌ Erro ao criar conversas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createMissingConversations();
