import { NextRequest, NextResponse } from "next/server";
import { generateInvoiceNumber } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    console.log("Debug: Testing invoice number generation");

    // Test the function directly
    const invoiceNumber = await generateInvoiceNumber();

    console.log("Debug: Generated number:", invoiceNumber);

    return NextResponse.json({
      success: true,
      generatedNumber: invoiceNumber,
      timestamp: new Date().toISOString(),
      message: "This is a debug endpoint to test invoice number generation"
    });
  } catch (error) {
    console.error("Debug: Error generating invoice number:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}