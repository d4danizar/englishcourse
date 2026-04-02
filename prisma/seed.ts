import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Hash the default password for all seed users
  const hashedPassword = await bcrypt.hash('kampunginggris123', 10)

  // 1. Create Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@test.com',
      passwordHash: hashedPassword,
      role: Role.CS,
    },
  })

  const tutor = await prisma.user.upsert({
    where: { email: 'tutor@test.com' },
    update: {},
    create: {
      name: 'Tutor One',
      email: 'tutor@test.com',
      passwordHash: hashedPassword,
      role: Role.TUTOR,
    },
  })

  const student = await prisma.user.upsert({
    where: { email: 'student@test.com' },
    update: {},
    create: {
      name: 'Student One',
      email: 'student@test.com',
      passwordHash: hashedPassword,
      role: Role.STUDENT,
      activeProgram: 'Regular',
    },
  })

  // 2. Create 15 dummy Conversation students
  const programs = ['Regular', 'Fullday', 'Asrama']
  for (let i = 1; i <= 15; i++) {
    const program = programs[(i - 1) % 3] // Alternating: Regular, Fullday, Asrama
    const phone = `08${Math.floor(1000000000 + Math.random() * 9000000000).toString().slice(0, 10)}`
    await prisma.user.upsert({
      where: { email: `student${i}@test.com` },
      update: {},
      create: {
        name: `Student Convo ${i}`,
        email: `student${i}@test.com`,
        passwordHash: hashedPassword,
        role: Role.STUDENT,
        activeProgram: program,
        phoneNumber: phone,
      },
    })
  }
  console.log('15 dummy students created.')

  // 3. Create Sessions (yesterday and today) — Open Pool model
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const today = new Date()

  const session1 = await prisma.session.create({
    data: {
      title: 'Conversation - Room A',
      date: yesterday,
      timeSlot: '10:00 - 11:30',
      programType: 'Conversation',
      tutorId: tutor.id,
      isCompleted: true,
    },
  })

  const session2 = await prisma.session.create({
    data: {
      title: 'Grammar Intensif - Room B',
      date: today,
      timeSlot: '08:00 - 09:30',
      programType: 'Grammar',
      tutorId: tutor.id,
      isCompleted: false,
    },
  })

  // 3. Create Attendance records (student "tickets" into sessions)
  await prisma.attendance.create({
    data: {
      sessionId: session1.id,
      studentId: student.id,
      status: 'PRESENT',
      pronunciation: 4,
      fluency: 3,
      vocabulary: 4,
      tutorNotes: 'Good progress! Keep practicing pronunciation.',
    },
  })

  await prisma.attendance.create({
    data: {
      sessionId: session2.id,
      studentId: student.id,
      status: 'PRESENT',
    },
  })

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
