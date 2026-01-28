import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Criar projeto exemplo
  const project = await prisma.project.upsert({
    where: { key: 'demo-project' },
    update: {},
    create: {
      key: 'demo-project',
      name: 'Demo Project',
    },
  });

  console.log('✅ Project created:', project.key);

  // Criar ambiente exemplo
  const apiKey = `ff_${Date.now()}`;
  const apiKeyHash = await bcrypt.hash(apiKey, 10);

  const environment = await prisma.environment.upsert({
    where: {
      projectId_key: {
        projectId: project.id,
        key: 'production',
      },
    },
    update: {},
    create: {
      projectId: project.id,
      key: 'production',
      name: 'Production',
      runtimeApiKeyHash: apiKeyHash,
    },
  });

  console.log('✅ Environment created:', environment.key);
  console.log('🔑 API Key (save this!):', apiKey);

  // Criar flag exemplo
  const flag = await prisma.flag.upsert({
    where: {
      environmentId_key: {
        environmentId: environment.id,
        key: 'new-feature',
      },
    },
    update: {},
    create: {
      environmentId: environment.id,
      key: 'new-feature',
      type: 'boolean',
      enabled: true,
      defaultValueJson: 'false',
      rolloutPercent: 50,
    },
  });

  console.log('✅ Flag created:', flag.key);

  // Criar segmento exemplo
  const segment = await prisma.segment.upsert({
    where: {
      environmentId_key: {
        environmentId: environment.id,
        key: 'beta-users',
      },
    },
    update: {},
    create: {
      environmentId: environment.id,
      key: 'beta-users',
      name: 'Beta Users',
    },
  });

  console.log('✅ Segment created:', segment.key);

  // Adicionar usuários ao segmento
  await prisma.segmentUser.createMany({
    data: [
      { segmentId: segment.id, userId: 'user123' },
      { segmentId: segment.id, userId: 'user456' },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Users added to segment');

  // Criar override exemplo
  await prisma.flagSegmentOverride.upsert({
    where: {
      flagId_segmentId: {
        flagId: flag.id,
        segmentId: segment.id,
      },
    },
    update: {},
    create: {
      flagId: flag.id,
      segmentId: segment.id,
      valueJson: 'true',
    },
  });

  console.log('✅ Override created');

  console.log('\n🎉 Seeding completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Use the API key above to test the runtime API');
  console.log('2. Login with admin/admin123 to access admin API');
  console.log('3. Visit http://localhost:3000/docs for Swagger documentation');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
