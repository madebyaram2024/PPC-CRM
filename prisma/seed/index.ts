import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Hash passwords for production use
  const saltRounds = 12;
  const adminPassword = await bcrypt.hash('admin123', saltRounds);
  const defaultUserPassword = await bcrypt.hash('default123', saltRounds);

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@pacificpapercups.com' },
    update: {
      password: adminPassword,
    },
    create: {
      email: 'admin@pacificpapercups.com',
      name: 'Admin',
      password: adminPassword,
      role: 'admin',
    },
  });

  // Create the three specified users: Vick, Art, Lilit
  const vickUser = await prisma.user.upsert({
    where: { email: 'vick@pacificpapercups.com' },
    update: {
      password: defaultUserPassword,
    },
    create: {
      email: 'vick@pacificpapercups.com',
      name: 'Vick',
      password: defaultUserPassword,
      role: 'user',
    },
  });

  const artUser = await prisma.user.upsert({
    where: { email: 'art@pacificpapercups.com' },
    update: {
      password: defaultUserPassword,
    },
    create: {
      email: 'art@pacificpapercups.com',
      name: 'Art',
      password: defaultUserPassword,
      role: 'user',
    },
  });

  const lilitUser = await prisma.user.upsert({
    where: { email: 'lilit@pacificpapercups.com' },
    update: {
      password: defaultUserPassword,
    },
    create: {
      email: 'lilit@pacificpapercups.com',
      name: 'Lilit',
      password: defaultUserPassword,
      role: 'user',
    },
  });

  // Create demo company with hardcoded settings
  const company = await prisma.company.upsert({
    where: { id: 'default-company' },
    update: {
      name: 'US PAPER CUP FACTORY',
      email: 'info@uspapercupfactory.com',
      phone: '818.355.0103',
      address: '11183 Condor Ave, Huntington Beach, CA 92708',
      logo: '/logo.png', // Using the logo.png file from public folder
    },
    create: {
      id: 'default-company',
      name: 'US PAPER CUP FACTORY',
      email: 'info@uspapercupfactory.com',
      phone: '818.355.0103',
      address: '11183 Condor Ave, Huntington Beach, CA 92708',
      logo: '/logo.png', // Using the logo.png file from public folder
    },
  });

  // Create demo customers
  const customer1 = await prisma.customer.create({
    data: {
      name: 'ABC Restaurant',
      email: 'orders@abcrestaurant.com',
      phone: '+1 (555) 234-5678',
      address: '456 Food Street, Dining City, DC 67890',
      status: 'customer',
      userId: adminUser.id,
      companyId: company.id,
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: 'XYZ Coffee Shop',
      email: 'contact@xyzcoffee.com',
      phone: '+1 (555) 345-6789',
      address: '789 Coffee Lane, Brew City, BC 90123',
      status: 'prospect',
      userId: vickUser.id, // Assign to Vick
      companyId: company.id,
    },
  });

  // Create demo products
  const product1 = await prisma.product.upsert({
    where: { sku: 'PPC-8OZ' },
    update: {},
    create: {
      name: '8oz Paper Cup',
      description: 'Standard 8oz paper cup with custom logo printing',
      price: 0.15,
      sku: 'PPC-8OZ',
      category: 'Paper Cups',
      isActive: true,
    },
  });

  const product2 = await prisma.product.upsert({
    where: { sku: 'PPC-12OZ' },
    update: {},
    create: {
      name: '12oz Paper Cup',
      description: 'Large 12oz paper cup with custom logo printing',
      price: 0.20,
      sku: 'PPC-12OZ',
      category: 'Paper Cups',
      isActive: true,
    },
  });

  const product3 = await prisma.product.upsert({
    where: { sku: 'PPC-LID' },
    update: {},
    create: {
      name: 'Paper Cup Lid',
      description: 'Fits 8oz and 12oz paper cups',
      price: 0.05,
      sku: 'PPC-LID',
      category: 'Lids',
      isActive: true,
    },
  });

  console.log('Database seeded successfully!');
  console.log('Production users created:');
  console.log('- Admin: admin@pacificpapercups.com / Password: admin123');
  console.log('- Vick: vick@pacificpapercups.com / Password: default123');
  console.log('- Art: art@pacificpapercups.com / Password: default123');
  console.log('- Lilit: lilit@pacificcups.com / Password: default123');
  console.log('IMPORTANT: Users should change default passwords after first login!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });