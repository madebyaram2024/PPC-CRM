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
    // Look for numbers that start with INV- and have 5 digits after (like INV-10000)
    const latestNewFormatInvoice = await db.invoice.findFirst({
      where: {
        number: {
          startsWith: 'INV-'
        }
      },
      select: { number: true },
      orderBy: { createdAt: 'desc' }
    });

    let nextNumber = 10000;

    if (latestNewFormatInvoice?.number) {
      // Extract the number part (e.g., "INV-10001" -> "10001")
      const fullNumber = latestNewFormatInvoice.number.replace('INV-', '');
      const currentNumber = parseInt(fullNumber, 10);

      // Only use the number if it's in the new 5-digit format (10000 or higher)
      // This correctly handles the transition from old long numbers to new 5-digit format
      if (!isNaN(currentNumber)) {
        if (currentNumber >= 10000) {
          // We're in the new format, so increment by 1
          nextNumber = currentNumber + 1;
        } else if (currentNumber > 999999) { // If it's a very long number like 12345678901234
          // This might be an old long format number, start from 10000
          nextNumber = 10000;
        } else {
          // For other cases, start from 10000
          nextNumber = 10000;
        }
      } else {
        // If parsing fails, start from 10000
        nextNumber = 10000;
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
          startsWith: 'WO-'
        }
      },
      select: { number: true },
      orderBy: { createdAt: 'desc' }
    });

    let nextNumber = 10000;

    if (latestNewFormatWorkOrder?.number) {
      // Extract the number part (e.g., "WO-10001" -> "10001")
      const fullNumber = latestNewFormatWorkOrder.number.replace('WO-', '');
      const currentNumber = parseInt(fullNumber, 10);

      // Only use the number if it's in the new 5-digit format (10000 or higher)
      if (!isNaN(currentNumber)) {
        if (currentNumber >= 10000) {
          // We're in the new format, so increment by 1
          nextNumber = currentNumber + 1;
        } else if (currentNumber > 999999) { // If it's a very long number
          // This might be an old long format number, start from 10000
          nextNumber = 10000;
        } else {
          // For other cases, start from 10000
          nextNumber = 10000;
        }
      } else {
        // If parsing fails, start from 10000
        nextNumber = 10000;
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
          startsWith: 'EST-'
        }
      },
      select: { number: true },
      orderBy: { createdAt: 'desc' }
    });

    let nextNumber = 10000;

    if (latestNewFormatEstimate?.number) {
      // Extract the number part (e.g., "EST-10001" -> "10001")
      const fullNumber = latestNewFormatEstimate.number.replace('EST-', '');
      const currentNumber = parseInt(fullNumber, 10);

      // Only use the number if it's in the new 5-digit format (10000 or higher)
      if (!isNaN(currentNumber)) {
        if (currentNumber >= 10000) {
          // We're in the new format, so increment by 1
          nextNumber = currentNumber + 1;
        } else if (currentNumber > 999999) { // If it's a very long number
          // This might be an old long format number, start from 10000
          nextNumber = 10000;
        } else {
          // For other cases, start from 10000
          nextNumber = 10000;
        }
      } else {
        // If parsing fails, start from 10000
        nextNumber = 10000;
      }
    }

    return `EST-${nextNumber.toString().padStart(5, '0')}`;
  } catch (error) {
    console.error('Error generating estimate number:', error);
    // Fallback to random number if database query fails
    return `EST-${Math.floor(Math.random() * 90000 + 10000)}`;
  }
}
