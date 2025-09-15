import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BASE_URL = process.env.MODMED_TOKEN_ENDPOINT;

export async function GET(request: Request) {
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

    const modmedUrl = `${BASE_URL}/fhir/v2/Patient`;

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

    return NextResponse.json(data);
  } catch (err) {
    console.error("GET /patients error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
