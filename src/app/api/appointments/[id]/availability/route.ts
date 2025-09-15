import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BASE_URL = process.env.MODMED_FHIR_BASE_URL;

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {

    const cookieStore = await cookies();
    const apiKey = cookieStore.get("api_key")?.value;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API key" }, { status: 400 });
    }

    const token = cookieStore.get("modmed_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
 const resolvedParams = await context.params;
    const id = resolvedParams.id;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date"); // e.g., 2025-09-15

    if (!date) {
      return NextResponse.json(
        { error: "Missing date parameter" },
        { status: 400 }
      );
    }

    // Calculate next day for full-day range
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayStr = nextDay.toISOString().split("T");

    const modmedUrl = `${BASE_URL}/fhir/v2/Slot?actor=Practitioner/${id}&start=ge${date}T00:00:00Z&start=lt${nextDayStr}T00:00:00Z&status=free`;

    const response = await fetch(modmedUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "x-api-key": apiKey,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /providers/[id]/availability error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
