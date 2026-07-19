import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.user.findMany({
    where: { role: 'SUPER_ADMIN' }
  });
  console.log('Super Admins in DB:', admins.map(u => ({ id: u.id, email: u.email, name: u.name })));
}

main().catch(console.error);
