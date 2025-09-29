/**
 * Role-based access control utilities
 */

import { getCurrentSessionUser } from "./auth";

export type UserRole = 'admin' | 'manager' | 'user';

/**
 * Checks if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentSessionUser();
  return user?.role === 'admin';
}

/**
 * Checks if the current user is a manager or admin
 */
export async function isManagerOrAdmin(): Promise<boolean> {
  const user = await getCurrentSessionUser();
  return user?.role === 'admin' || user?.role === 'manager';
}

/**
 * Checks if the current user is a regular user, manager, or admin
 */
export async function isUserOrHigher(): Promise<boolean> {
  const user = await getCurrentSessionUser();
  return !!user; // Any authenticated user
}

/**
 * Checks if the current user can manage work orders (creator, manager, or admin)
 */
export async function canManageWorkOrder(workOrderId: string): Promise<boolean> {
  const user = await getCurrentSessionUser();
  if (!user) return false;
  
  // Admins can manage all work orders
  if (user.role === 'admin') return true;
  
  // Managers can manage all work orders (for now)
  if (user.role === 'manager') return true;
  
  // Regular users can only manage their own work orders
  try {
    const { db } = await import('./db');
    const workOrder = await db.workOrder.findUnique({
      where: { id: workOrderId },
      select: { userId: true }
    });
    
    return workOrder?.userId === user.id;
  } catch (error) {
    console.error('Error checking work order access:', error);
    return false;
  }
}

/**
 * Checks if the current user can mark work order as OK TO SHIP (creator, manager, or admin)
 */
export async function canMarkWorkOrderOkToShip(workOrderId: string): Promise<boolean> {
  const user = await getCurrentSessionUser();
  if (!user) return false;
  
  // Admins and managers can mark any work order as OK TO SHIP
  if (user.role === 'admin' || user.role === 'manager') return true;
  
  // Regular users can only mark their own work orders as OK TO SHIP
  try {
    const { db } = await import('./db');
    const workOrder = await db.workOrder.findUnique({
      where: { id: workOrderId },
      select: { userId: true }
    });
    
    return workOrder?.userId === user.id;
  } catch (error) {
    console.error('Error checking work order OK TO SHIP access:', error);
    return false;
  }
}

/**
 * Checks if the current user can mark invoice as paid (manager or admin)
 */
export async function canMarkInvoicePaid(): Promise<boolean> {
  const user = await getCurrentSessionUser();
  return user?.role === 'admin' || user?.role === 'manager';
}

/**
 * Checks if the current user can access user management (admin only)
 */
export async function canAccessUserManagement(): Promise<boolean> {
  return isAdmin();
}

/**
 * Checks if the current user can access company settings (admin only)
 */
export async function canAccessCompanySettings(): Promise<boolean> {
  return isAdmin();
}

/**
 * Checks if the current user can reset passwords (admin only)
 */
export async function canResetUserPassword(): Promise<boolean> {
  return isAdmin();
}