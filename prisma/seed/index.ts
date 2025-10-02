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
    where: { email: 'admin@uspapercupfactory.com' },
    update: {
      password: adminPassword,
    },
    create: {
      email: 'admin@uspapercupfactory.com',
      name: 'Admin',
      password: adminPassword,
      role: 'admin',
    },
  });

  // Create the three specified users: Vick, Art, Lilit
  const vickUser = await prisma.user.upsert({
    where: { email: 'vick@uspapercupfactory.com' },
    update: {
      password: defaultUserPassword,
    },
    create: {
      email: 'vick@uspapercupfactory.com',
      name: 'Vick',
      password: defaultUserPassword,
      role: 'user',
    },
  });

  const artUser = await prisma.user.upsert({
    where: { email: 'art@uspapercupfactory.com' },
    update: {
      password: defaultUserPassword,
    },
    create: {
      email: 'art@uspapercupfactory.com',
      name: 'Art',
      password: defaultUserPassword,
      role: 'user',
    },
  });

  const lilitUser = await prisma.user.upsert({
    where: { email: 'lilit@uspapercupfactory.com' },
    update: {
      password: defaultUserPassword,
    },
    create: {
      email: 'lilit@uspapercupfactory.com',
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

  // Create cup products for different sizes and quantities

  // 8oz Cups
  await prisma.product.upsert({
    where: { sku: '8OZ-25' },
    update: {},
    create: {
      name: '8oz Paper Cups - 25 Count',
      description: 'Standard 8oz paper cup with custom logo printing - 25 count',
      price: 50.00,
      sku: '8OZ-25',
      category: 'Paper Cups',
      isActive: true,
    },
  });

  await prisma.product.upsert({
    where: { sku: '8OZ-100' },
    update: {},
    create: {
      name: '8oz Paper Cups - 100 Count',
      description: 'Standard 8oz paper cup with custom logo printing - 100 count',
      price: 100.00,
      sku: '8OZ-100',
      category: 'Paper Cups',
      isActive: true,
    },
  });

  await prisma.product.upsert({
    where: { sku: '8OZ-500' },
    update: {},
    create: {
      name: '8oz Paper Cups - 500 Count',
      description: 'Standard 8oz paper cup with custom logo printing - 500 count',
      price: 250.00,
      sku: '8OZ-500',
      category: 'Paper Cups',
      isActive: true,
    },
  });

  await prisma.product.upsert({
    where: { sku: '8OZ-1000' },
    update: {},
    create: {
      name: '8oz Paper Cups - 1000 Count',
      description: 'Standard 8oz paper cup with custom logo printing - 1000 count',
      price: 350.00,
      sku: '8OZ-1000',
      category: 'Paper Cups',
      isActive: true,
    },
  });

  await prisma.product.upsert({
    where: { sku: '8OZ-5000' },
    update: {},
    create: {
      name: '8oz Paper Cups - 5000 Count',
      description: 'Standard 8oz paper cup with custom logo printing - 5000 count',
      price: 750.00,
      sku: '8OZ-5000',
      category: 'Paper Cups',
      isActive: true,
    },
  });

  await prisma.product.upsert({
    where: { sku: '8OZ-10000' },
    update: {},
    create: {
      name: '8oz Paper Cups - 10000 Count',
      description: 'Standard 8oz paper cup with custom logo printing - 10000 count',
      price: 1000.00,
      sku: '8OZ-10000',
      category: 'Paper Cups',
      isActive: true,
    },
  });

  // 10oz Cups
  await prisma.product.upsert({
    where: { sku: '10OZ-25' },
    update: {},
    create: {
      name: '10oz Paper Cups - 25 Count',
      description: 'Medium 10oz paper cup with custom logo printing - 25 count',
      price: 50.00,
      sku: '10OZ-25',
      category: 'Paper Cups',
      isActive: true,
    },
  });

  await prisma.product.upsert({
    where: { sku: '10OZ-100' },
    update: {},
    create: {
      name: '10oz Paper Cups - 100 Count',
      description: 'Medium 10oz paper cup with custom logo printing - 100 count',
      price: 100.00,
      sku: '10OZ-100',
      category: 'Paper Cups',
      isActive: true,
    },
  });

  await prisma.product.upsert({
    where: { sku: '10OZ-500' },
    update: {},
    create: {
      name: '10oz Paper Cups - 500 Count',
      description: 'Medium 10oz paper cup with custom logo printing - 500 count',
      price: 250.00,
      sku: '10OZ-500',
      category: 'Paper Cups',
      isActive: true,
    },
  });

  await prisma.product.upsert({
    where: { sku: '10OZ-1000' },
    update: {},
    create: {
      name: '10oz Paper Cups - 1000 Count',
      description: 'Medium 10oz paper cup with custom logo printing - 1000 count',
      price: 350.00,
      sku: '10OZ-1000',
      category: 'Paper Cups',
      isActive: true,
    },
  });

  await prisma.product.upsert({
    where: { sku: '10OZ-5000' },
    update: {},
    create: {
      name: '10oz Paper Cups - 5000 Count',
      description: 'Medium 10oz paper cup with custom logo printing - 5000 count',
      price: 750.00,
      sku: '10OZ-5000',
      category: 'Paper Cups',
      isActive: true,
    },
  });

  await prisma.product.upsert({
    where: { sku: '10OZ-10000' },
    update: {},
    create: {
      name: '10oz Paper Cups - 10000 Count',
      description: 'Medium 10oz paper cup with custom logo printing - 10000 count',
      price: 1000.00,
      sku: '10OZ-10000',
      category: 'Paper Cups',
      isActive: true,
    },
  });

  // 12oz Cups
  await prisma.product.upsert({
    where: { sku: '12OZ-25' },
    update: {},
    create: {
      name: '12oz Paper Cups - 25 Count',
      description: 'Large 12oz paper cup with custom logo printing - 25 count',
      price: 50.00,
      sku: '12OZ-25',
      category: 'Paper Cups',
      isActive: true,
    },
  });

  await prisma.product.upsert({
    where: { sku: '12OZ-100' },
    update: {},
    create: {
      name: '12oz Paper Cups - 100 Count',
      description: 'Large 12oz paper cup with custom logo printing - 100 count',
      price: 100.00,
      sku: '12OZ-100',
      category: 'Paper Cups',
      isActive: true,
    },
  });

  await prisma.product.upsert({
    where: { sku: '12OZ-500' },
    update: {},
    create: {
      name: '12oz Paper Cups - 500 Count',
      description: 'Large 12oz paper cup with custom logo printing - 500 count',
      price: 250.00,
      sku: '12OZ-500',
      category: 'Paper Cups',
      isActive: true,
    },
  });

  await prisma.product.upsert({
    where: { sku: '12OZ-1000' },
    update: {},
    create: {
      name: '12oz Paper Cups - 1000 Count',
      description: 'Large 12oz paper cup with custom logo printing - 1000 count',
      price: 350.00,
      sku: '12OZ-1000',
      category: 'Paper Cups',
      isActive: true,
    },
  });

  await prisma.product.upsert({
    where: { sku: '12OZ-5000' },
    update: {},
    create: {
      name: '12oz Paper Cups - 5000 Count',
      description: 'Large 12oz paper cup with custom logo printing - 5000 count',
      price: 750.00,
      sku: '12OZ-5000',
      category: 'Paper Cups',
      isActive: true,
    },
  });

  await prisma.product.upsert({
    where: { sku: '12OZ-10000' },
    update: {},
    create: {
      name: '12oz Paper Cups - 10000 Count',
      description: 'Large 12oz paper cup with custom logo printing - 10000 count',
      price: 1000.00,
      sku: '12OZ-10000',
      category: 'Paper Cups',
      isActive: true,
    },
  });

  // Keep lid product
  await prisma.product.upsert({
    where: { sku: 'PPC-LID' },
    update: {},
    create: {
      name: 'Paper Cup Lid',
      description: 'Fits 8oz, 10oz and 12oz paper cups',
      price: 0.05,
      sku: 'PPC-LID',
      category: 'Lids',
      isActive: true,
    },
  });

  console.log('Database seeded successfully!');
  console.log('Production users created:');
  console.log('- Admin: admin@uspapercupfactory.com / Password: admin123');
  console.log('- Vick: vick@uspapercupfactory.com / Password: default123');
  console.log('- Art: art@uspapercupfactory.com / Password: default123');
  console.log('- Lilit: lilit@uspapercupfactory.com / Password: default123');
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