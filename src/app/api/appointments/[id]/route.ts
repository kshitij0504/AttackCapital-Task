import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BASE_URL = process.env.MODMED_TOKEN_ENDPOINT; // Corrected to BASE_URL for FHIR endpoints

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await context.params;
    const { id } = resolvedParams;

    const cookieStore = await cookies();
    const apiKey = cookieStore.get("api_key")?.value;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API key" }, { status: 400 });
    }

    const token = cookieStore.get("modmed_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json();

    // Optional: Check for conflicts on new times (similar to POST)

    const modmedUrl = `${BASE_URL}/fhir/v2/Appointment/${id}`;

    const response = await fetch(modmedUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "x-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
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
    console.error("PUT /appointments/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await context.params;
    const { id } = resolvedParams;

    const cookieStore = await cookies();
    const apiKey = cookieStore.get("api_key")?.value;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API key" }, { status: 400 });
    }

    const token = cookieStore.get("modmed_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const modmedUrl = `${BASE_URL}/fhir/v2/Appointment/${id}`;

    const response = await fetch(modmedUrl, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "x-api-key": apiKey,
      },
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    return NextResponse.json({ message: "Appointment canceled" });
  } catch (error) {
    console.error("DELETE /appointments/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
