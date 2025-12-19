import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create a demo school
  const school = await prisma.school.upsert({
    where: { id: 'school-dev-1' },
    update: {},
    create: {
      id: 'school-dev-1',
      name: 'Demo School',
      district: 'Demo District',
    },
  });

  console.log('✅ School created:', school.name);

  // Create demo users
  const users = [
    {
      id: 'user-counselor-1',
      email: 'counselor@demo.com',
      name: 'Demo Counselor',
      role: 'COUNSELLOR' as const,
      password: 'password', // In production, hash this with bcrypt
      schoolId: school.id,
    },
    {
      id: 'user-student-1',
      email: 'student@demo.com',
      name: 'Demo Student',
      role: 'STUDENT' as const,
      password: 'password',
      schoolId: school.id,
    },
    {
      id: 'user-parent-1',
      email: 'parent@demo.com',
      name: 'Demo Parent',
      role: 'PARENT' as const,
      password: 'password',
      schoolId: school.id,
    },
    {
      id: 'user-admin-1',
      email: 'admin@demo.com',
      name: 'Demo Admin',
      role: 'ADMIN' as const,
      password: 'password',
      schoolId: school.id,
    },
  ];

  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        password: userData.password,
        role: userData.role,
        name: userData.name,
      },
      create: userData,
    });
    console.log(`✅ User created: ${user.email} (${user.role})`);
  }

  // Create a demo student record
  const student = await prisma.student.upsert({
    where: { id: 'student-dev-1' },
    update: {},
    create: {
      id: 'student-dev-1',
      schoolId: school.id,
      displayName: 'Demo Student',
      grade: 9,
      consentStatus: 'GRANTED',
    },
  });

  console.log('✅ Student created:', student.displayName);

  console.log('\n🎉 Seeding completed!');
  console.log('\nDemo accounts:');
  console.log('  Counselor: counselor@demo.com / password');
  console.log('  Student:   student@demo.com / password');
  console.log('  Parent:    parent@demo.com / password');
  console.log('  Admin:     admin@demo.com / password');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

