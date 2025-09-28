import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { db } from "./db"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate next sequential invoice number (INV-10000, INV-10001, etc.)
 */
export async function generateInvoiceNumber(): Promise<string> {
  try {
    // Get the latest invoice with the new 5-digit format
    const latestNewFormatInvoice = await db.invoice.findFirst({
      where: {
        number: {
          startsWith: 'INV-',
          contains: '-10' // New format starts with INV-10000
        }
      },
      select: { number: true },
      orderBy: { createdAt: 'desc' }
    });

    let nextNumber = 10000;

    if (latestNewFormatInvoice?.number) {
      // Extract the number part (e.g., "INV-10001" -> "10001")
      const numberPart = latestNewFormatInvoice.number.replace('INV-', '');
      const currentNumber = parseInt(numberPart, 10);

      if (!isNaN(currentNumber) && currentNumber >= 10000) {
        nextNumber = currentNumber + 1;
      }
    }

    return `INV-${nextNumber.toString().padStart(5, '0')}`;
  } catch (error) {
    console.error('Error generating invoice number:', error);
    // Fallback to random number if database query fails
    return `INV-${Math.floor(Math.random() * 90000 + 10000)}`;
  }
}

/**
 * Generate next sequential work order number (WO-10000, WO-10001, etc.)
 */
export async function generateWorkOrderNumber(): Promise<string> {
  try {
    // Get the latest work order with the new 5-digit format
    const latestNewFormatWorkOrder = await db.workOrder.findFirst({
      where: {
        number: {
          startsWith: 'WO-',
          contains: '-10' // New format starts with WO-10000
        }
      },
      select: { number: true },
      orderBy: { createdAt: 'desc' }
    });

    let nextNumber = 10000;

    if (latestNewFormatWorkOrder?.number) {
      // Extract the number part (e.g., "WO-10001" -> "10001")
      const numberPart = latestNewFormatWorkOrder.number.replace('WO-', '');
      const currentNumber = parseInt(numberPart, 10);

      if (!isNaN(currentNumber) && currentNumber >= 10000) {
        nextNumber = currentNumber + 1;
      }
    }

    return `WO-${nextNumber.toString().padStart(5, '0')}`;
  } catch (error) {
    console.error('Error generating work order number:', error);
    // Fallback to random number if database query fails
    return `WO-${Math.floor(Math.random() * 90000 + 10000)}`;
  }
}

/**
 * Generate next sequential estimate number (EST-10000, EST-10001, etc.)
 */
export async function generateEstimateNumber(): Promise<string> {
  try {
    // Get estimates from the invoice table with number starting with EST-
    const latestNewFormatEstimate = await db.invoice.findFirst({
      where: {
        number: {
          startsWith: 'EST-',
          contains: '-10' // New format starts with EST-10000
        }
      },
      select: { number: true },
      orderBy: { createdAt: 'desc' }
    });

    let nextNumber = 10000;

    if (latestNewFormatEstimate?.number) {
      // Extract the number part (e.g., "EST-10001" -> "10001")
      const numberPart = latestNewFormatEstimate.number.replace('EST-', '');
      const currentNumber = parseInt(numberPart, 10);

      if (!isNaN(currentNumber) && currentNumber >= 10000) {
        nextNumber = currentNumber + 1;
      }
    }

    return `EST-${nextNumber.toString().padStart(5, '0')}`;
  } catch (error) {
    console.error('Error generating estimate number:', error);
    // Fallback to random number if database query fails
    return `EST-${Math.floor(Math.random() * 90000 + 10000)}`;
  }
}
