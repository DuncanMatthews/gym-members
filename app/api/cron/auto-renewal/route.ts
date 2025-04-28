// app/api/cron/auto-renewal/route.ts
import { processRecurringPayments } from "@/app/(dashboard)/payments/invoices/actions";
import { NextResponse } from "next/server";

// Add additional headers to control caching - helps with Vercel edge functions
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await processRecurringPayments();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      { error: "Failed to process membership renewals" },
      { status: 500 }
    );
  }
}