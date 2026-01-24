
import { createClerkClient } from '@clerk/backend';
import { prisma } from '../src/lib/prisma';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

async function main() {
  console.log('--- DEBUG: CLERK USERS ---');
  const clerkList = await clerk.users.getUserList({ limit: 100, orderBy: '-created_at' });
  console.log(`Clerk reports ${clerkList.data.length} users.`);
  clerkList.data.forEach(u => {
      console.log(`[CLERK] ${u.id} | ${u.firstName} ${u.lastName} | ${u.emailAddresses[0]?.emailAddress}`);
  });

  console.log('\n--- DEBUG: PRISMA USERS ---');
  const prismaUsers = await prisma.userSettings.findMany();
  console.log(`Prisma reports ${prismaUsers.length} users.`);
  prismaUsers.forEach(u => {
      // Check if this prisma user exists in Clerk
      const exists = clerkList.data.find(c => c.id === u.userId);
      console.log(`[PRISMA] ${u.userId} | Role: ${u.role} | Linked to Clerk? ${exists ? 'YES' : 'NO'}`);
  });

  console.log('\n--- DEBUG: TOP SURVEYS (Response Count) ---');
  const surveys = await prisma.survey.findMany({
      include: { _count: { select: { responses: true } } },
      orderBy: { responses: { _count: 'desc' } },
      take: 5
  });
  
  surveys.forEach(s => {
      console.log(`[SURVEY] ${s.id} | Title: ${s.title} | Responses: ${s._count.responses} | Owner: ${s.userId}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
