import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Hash passwords for production use
  const saltRounds = 12;
  const adminPassword = await bcrypt.hash('admin123', saltRounds);
  const userPassword = await bcrypt.hash('user123', saltRounds);
  const managerPassword = await bcrypt.hash('manager123', saltRounds);

  // Create demo users with real passwords
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@pacificpapercups.com' },
    update: {
      password: adminPassword,
    },
    create: {
      email: 'admin@pacificpapercups.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'admin',
    },
  });

  const regularUser = await prisma.user.upsert({
    where: { email: 'user@pacificcups.com' },
    update: {
      password: userPassword,
    },
    create: {
      email: 'user@pacificcups.com',
      name: 'Regular User',
      password: userPassword,
      role: 'user',
    },
  });

  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@pacificcups.com' },
    update: {
      password: managerPassword,
    },
    create: {
      email: 'manager@pacificcups.com',
      name: 'Manager User',
      password: managerPassword,
      role: 'manager',
    },
  });

  // Create demo company
  const company = await prisma.company.upsert({
    where: { id: 'default-company' },
    update: {},
    create: {
      id: 'default-company',
      name: 'Pacific Paper Cups',
      email: 'info@pacificcups.com',
      phone: '+1 (555) 123-4567',
      address: '123 Business Ave, Suite 100, Business City, BC 12345',
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
      userId: regularUser.id,
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
  console.log('- Manager: manager@pacificcups.com / Password: manager123');
  console.log('- User: user@pacificcups.com / Password: user123');
  console.log('IMPORTANT: Change these passwords in production!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });