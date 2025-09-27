import { db } from './db';
import { hash, compare } from 'bcryptjs';

// Default application users
export const DEFAULT_USERS = [
  {
    name: 'Vick',
    email: 'vick@pacificpapercups.com', // Added email for authentication
    role: 'user',
    password: 'default123' // Should be changed after first login
  },
  {
    name: 'Art',
    email: 'art@pacificpapercups.com',
    role: 'user',
    password: 'default123'
  },
  {
    name: 'Lilit',
    email: 'lilit@pacificpapercups.com',
    role: 'user',
    password: 'default123'
  }
];

// Admin user
export const ADMIN_USER = {
  name: 'Admin',
  email: 'admin@pacificpapercups.com',
  role: 'admin',
  password: 'admin123'
};

/**
 * Initializes default users in the database if they don't exist
 */
export async function initializeDefaultUsers() {
  // Check if admin user exists
  const existingAdmin = await db.user.findUnique({
    where: { email: ADMIN_USER.email },
  });

  if (!existingAdmin) {
    // Create admin user
    await db.user.create({
      data: {
        name: ADMIN_USER.name,
        email: ADMIN_USER.email,
        role: ADMIN_USER.role,
        password: await hash(ADMIN_USER.password, 10),
      },
    });
    console.log('Admin user created');
  }

  // Check and create default users if they don't exist
  for (const userData of DEFAULT_USERS) {
    const existingUser = await db.user.findUnique({
      where: { email: userData.email },
    });

    if (!existingUser) {
      await db.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          role: userData.role,
          password: await hash(userData.password, 10),
        },
      });
      console.log(`User ${userData.name} created`);
    }
  }
}

/**
 * Updates a user's password
 */
export async function updateUserPassword(userId: string, newPassword: string) {
  const hashedPassword = await hash(newPassword, 10);
  
  return await db.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
}

/**
 * Verifies if current password matches user's password
 */
export async function verifyPassword(userId: string, currentPassword: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return false;
  }

  return await compare(currentPassword, user.password);
}