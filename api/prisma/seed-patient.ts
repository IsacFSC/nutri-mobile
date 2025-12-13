import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Criando usuários de teste...');

  // Criar paciente de teste
  const patientPassword = await bcrypt.hash('123456', 10);
  
  const patient = await prisma.user.upsert({
    where: { email: 'paciente@teste.com' },
    update: {},
    create: {
      email: 'paciente@teste.com',
      password: patientPassword,
      name: 'João Silva Paciente',
      role: 'PATIENT',
      phone: '(11) 98765-4321',
      emailVerified: true,
      lgpdConsent: true,
      lgpdConsentDate: new Date(),
      termsAcceptedAt: new Date(),
      privacyPolicyAcceptedAt: new Date(),
    },
  });

  const patientRecord = await prisma.patient.upsert({
    where: { userId: patient.id },
    update: {},
    create: {
      userId: patient.id,
      planType: 'PREMIUM',
      cpf: '123.456.789-00',
      birthDate: new Date('1990-05-15'),
      gender: 'MASCULINO',
      weight: 75.5,
      height: 175,
      goals: 'Perder peso e ganhar massa muscular',
      // Recursos habilitados (JSON)
      enabledFeatures: {
        ONLINE_CONSULTATIONS: true,
        DAILY_MEAL_PLAN: true,
        EXERCISE_LIBRARY: true,
        DIRECT_CHAT: true,
        PROGRESS_TRACKING: true,
        RECIPES: true,
        SHOPPING_LIST: true,
        WATER_REMINDER: true,
        MEAL_PHOTOS: true,
      },
    },
  });

  console.log('✅ Paciente criado:', {
    email: 'paciente@teste.com',
    password: '123456',
    role: 'PATIENT',
    id: patient.id,
    patientRecordId: patientRecord.id,
  });

  // Criar nutricionista de teste (se não existir)
  const nutritionistPassword = await bcrypt.hash('123456', 10);
  
  const nutritionist = await prisma.user.upsert({
    where: { email: 'nutricionista@teste.com' },
    update: {},
    create: {
      email: 'nutricionista@teste.com',
      password: nutritionistPassword,
      name: 'Dra. Maria Santos',
      role: 'NUTRITIONIST',
      phone: '(11) 91234-5678',
      emailVerified: true,
      lgpdConsent: true,
      lgpdConsentDate: new Date(),
      termsAcceptedAt: new Date(),
      privacyPolicyAcceptedAt: new Date(),
    },
  });

  const nutritionistRecord = await prisma.nutritionist.upsert({
    where: { userId: nutritionist.id },
    update: {},
    create: {
      userId: nutritionist.id,
      crn: 'CRN-3 12345',
      specialization: 'Nutrição Esportiva',
    },
  });

  console.log('✅ Nutricionista criado:', {
    email: 'nutricionista@teste.com',
    password: '123456',
    role: 'NUTRITIONIST',
    id: nutritionist.id,
    nutritionistRecordId: nutritionistRecord.id,
  });

  // Criar administrador do sistema (se não existir)
  const adminPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@nutrimobile.com' },
    update: {},
    create: {
      email: 'admin@nutrimobile.com',
      password: adminPassword,
      name: 'Administrador do Sistema',
      role: 'ADMIN',
      phone: '(11) 99999-9999',
      emailVerified: true,
      lgpdConsent: true,
      lgpdConsentDate: new Date(),
      termsAcceptedAt: new Date(),
      privacyPolicyAcceptedAt: new Date(),
    },
  });

  console.log('✅ Administrador criado:', {
    email: 'admin@nutrimobile.com',
    password: 'admin123',
    role: 'ADMIN',
    id: admin.id,
  });

  // Criar organização de exemplo
  const organization = await prisma.organization.upsert({
    where: { slug: 'clinica-saude-total' },
    update: {},
    create: {
      name: 'Clínica Saúde Total',
      slug: 'clinica-saude-total',
      cnpj: '12.345.678/0001-90',
      email: 'contato@saudetotal.com',
      phone: '(11) 3333-4444',
      address: 'Rua das Flores, 123',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567',
      description: 'Clínica especializada em nutrição e bem-estar',
      maxNutritionists: 10,
      maxPatients: 500,
      ownerId: admin.id,
    },
  });

  console.log('✅ Organização criada:', {
    name: 'Clínica Saúde Total',
    slug: 'clinica-saude-total',
    id: organization.id,
  });

  // Vincular nutricionista à organização
  await prisma.nutritionist.update({
    where: { id: nutritionistRecord.id },
    data: {
      organizationId: organization.id,
    },
  });

  console.log('✅ Nutricionista vinculado à organização');

  // Vincular paciente ao nutricionista
  await prisma.patient.update({
    where: { id: patientRecord.id },
    data: {
      nutritionistId: nutritionistRecord.id,
    },
  });

  console.log('✅ Paciente vinculado ao nutricionista');

  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('\n📋 Credenciais de teste:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔑 ADMINISTRADOR:');
  console.log('   Email: admin@nutrimobile.com');
  console.log('   Senha: admin123');
  console.log('\n👩‍⚕️ NUTRICIONISTA:');
  console.log('   Email: nutricionista@teste.com');
  console.log('   Senha: 123456');
  console.log('   Organização: Clínica Saúde Total');
  console.log('\n👤 PACIENTE:');
  console.log('   Email: paciente@teste.com');
  console.log('   Senha: 123456');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
