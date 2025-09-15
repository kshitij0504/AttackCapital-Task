import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BASE_URL = process.env.MODMED_TOKEN_ENDPOINT;
const FIRM_URL_PREFIX = process.env.MODMED_FIRM_URL_PREFIX || "";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();

    // Check API key
    const apiKey = cookieStore.get("api_key")?.value;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing API key in header" },
        { status: 400 }
      );
    }

    // Check token
    const token = cookieStore.get("modmed_token")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized - missing token" },
        { status: 401 }
      );
    }

    // Parse payload
    const payload = await request.json();
    if (!payload) {
      return NextResponse.json(
        { error: "Missing or invalid payload" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!payload.subject || !payload.medicationCodeableConcept) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: subject and medicationCodeableConcept are required",
        },
        { status: 400 }
      );
    }

    // Default status if missing
    if (!payload.status) {
      payload.status = "active";
    }

    // Forward request to ModMed
    const modmedUrl = `${BASE_URL}/fhir/v2/MedicationStatement`;
    console.log("Forwarding to ModMed URL:", modmedUrl);

    const response = await fetch(modmedUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "x-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    console.log(response)

    console.log("ModMed Response Status:", response.status);

    // Try to parse the response
    let responseBody: any;
    try {
      responseBody = await response.json();
    } catch {
      responseBody = null;
    }

    if (!response.ok) {
      console.error("ModMed Error:", responseBody || response.statusText);
      return NextResponse.json(
        { error: responseBody || response.statusText },
        { status: response.status }
      );
    }

    console.log("Created MedicationStatement:", responseBody);
    return NextResponse.json(responseBody, { status: 201 });
  } catch (err) {
    console.error("POST /patients/medicationstatements error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
