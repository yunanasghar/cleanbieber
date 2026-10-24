import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { INITIAL_STUDENTS, INITIAL_SETTINGS } from '../src/lib/initial-data.ts';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting CleanBieber database seeding for Kelas 10 SIJA B...');

  // 1. Seed or Upsert Initial Admin
  const username = process.env.ADMIN_INITIAL_USERNAME || 'admin';
  const plainPassword = process.env.ADMIN_INITIAL_PASSWORD || 'admin123';
  const passwordHash = await bcrypt.hash(plainPassword, 10);
  const adminPhone = process.env.ADMIN_WHATSAPP_NUMBER || '081234567890';

  const admin = await prisma.admin.upsert({
    where: { username },
    update: {
      phoneNumber: adminPhone,
    },
    create: {
      username,
      name: 'Administrator',
      passwordHash,
      phoneNumber: adminPhone,
    },
  });
  console.log(`✅ Admin seeded: ${admin.username} (ID: ${admin.id})`);

  // 2. Seed 36 Students idempotently
  let studentCount = 0;
  for (const s of INITIAL_STUDENTS) {
    await prisma.student.upsert({
      where: {
        dayOfWeek_orderIndex: {
          dayOfWeek: s.dayOfWeek,
          orderIndex: s.orderIndex,
        },
      },
      update: {
        name: s.name,
        phoneNumber: s.phoneNumber || null,
      },
      create: {
        name: s.name,
        dayOfWeek: s.dayOfWeek,
        orderIndex: s.orderIndex,
        phoneNumber: s.phoneNumber || null,
      },
    });
    studentCount++;
  }
  console.log(`✅ Exactly ${studentCount} students seeded across Monday to Friday.`);

  // 3. Seed System Settings
  for (const [key, value] of Object.entries(INITIAL_SETTINGS)) {
    await prisma.systemSetting.upsert({
      where: { key },
      update: { value: String(value) },
      create: {
        key,
        value: String(value),
        description: `Pengaturan sistem: ${key}`,
      },
    });
  }
  console.log('✅ System settings seeded.');

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
