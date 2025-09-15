import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BASE_URL = process.env.MODMED_TOKEN_ENDPOINT;

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
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

    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { error: "Missing patient ID in path" },
        { status: 400 }
      );
    }

    const modmedUrl = `${BASE_URL}/fhir/v2/AllergyIntolerance?patient=${id}`;

    const response = await fetch(modmedUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "x-api-key": apiKey,
        Accept: "application/json",
      },
    });
    

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
    console.log(data);
    

    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /patients/[id]/allergies error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
