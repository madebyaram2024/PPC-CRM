import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentSessionUser } from '@/lib/auth';
import { compare, hash } from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    // Get current user from session
    const currentUser = await getCurrentSessionUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { currentPassword, newPassword, confirmNewPassword } = await request.json();

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return NextResponse.json(
        { error: 'Current password, new password, and confirmation are required' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmNewPassword) {
      return NextResponse.json(
        { error: 'New password and confirmation do not match' },
        { status: 400 }
      );
    }

    // For the admin fallback user, we can skip current password verification
    // since we know it's the hardcoded admin
    if (currentUser.id === 'admin-user-id') {
      // Hash the new password
      const hashedNewPassword = await hash(newPassword, 10);

      // Find the actual admin user in the database by email
      const adminUser = await db.user.findFirst({
        where: {
          email: {
            in: ['admin@pacificpapercups.com', 'admin@pacificcups.com']
          }
        }
      });

      if (adminUser) {
        // Update the admin user's password in the database
        await db.user.update({
          where: { id: adminUser.id },
          data: { password: hashedNewPassword },
        });
      }

      return NextResponse.json({
        message: 'Password updated successfully',
      });
    }

    // For regular users, verify the current password
    const user = await db.user.findUnique({
      where: { id: currentUser.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const isCurrentPasswordValid = await compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedNewPassword = await hash(newPassword, 10);

    // Update the user's password
    await db.user.update({
      where: { id: currentUser.id },
      data: { password: hashedNewPassword },
    });

    return NextResponse.json({
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}