import prisma from '../prisma/client';

async function testDbConnection() {
  try {
    const result = await prisma.$queryRawUnsafe(`SELECT NOW()`);
    console.log('Successful connection to the database :', result);
  } catch (error) {
    console.error('Database connection error :', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDbConnection();