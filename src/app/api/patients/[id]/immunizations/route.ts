import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BASE_URL = process.env.MODMED_TOKEN_ENDPOINT; // Adjusted for FHIR; change if needed

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await context.params;
    const { id } = resolvedParams;
    if (!id) {
      return NextResponse.json(
        { error: "Missing patient ID in path" },
        { status: 400 }
      );
    }

    console.log("Patient ID:", id); // Debug log

    const cookieStore = await cookies();
    const apiKey = cookieStore.get("api_key")?.value;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing API key in header" },
        { status: 400 }
      );
    }

    const token = cookieStore.get("modmed_token")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized - missing token" },
        { status: 401 }
      );
    }

    const modmedUrl = `${BASE_URL}/fhir/v2/Immunization?patient=${id}`;

    const response = await fetch(modmedUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "x-api-key": apiKey,
        Accept: "application/json",
      },
    });
    console.log(response.ok);

    if (!response.ok) {
      let errorMessage;
      try {
        errorMessage = await response.json();
      } catch {
        errorMessage = await response.text();
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Immunization Data:", data); // Debug log

    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /patients/[id]/immunizations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
