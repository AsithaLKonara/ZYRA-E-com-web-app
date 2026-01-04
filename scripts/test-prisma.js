require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ log: ['error'] });
p.user.count().then(c => {
  console.log('Success! Count:', c);
  p.$disconnect();
}).catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
