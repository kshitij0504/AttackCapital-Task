import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BASE_URL = process.env.MODMED_TOKEN_ENDPOINT;
interface Participant {
  actor: {
    reference: string;
  };
}
interface AppointmentPayload {
  start: string;
  end: string;
  participant: Participant[];
}

export async function POST(request: Request) {
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
    
    const payload: AppointmentPayload = await request.json();
    if (!payload) {
      return NextResponse.json({ error: "Missing payload" }, { status: 400 });
    }
    
    const start = payload.start;
    const end = payload.end;
    const providerParticipant = payload.participant.find((p) => p.actor.reference.startsWith("Practitioner/"));
    const providerId = providerParticipant?.actor.reference.split("/")[1];
    
    if (!providerId || !start || !end) {
      return NextResponse.json({ error: "Invalid payload: missing start, end, or provider" }, { status: 400 });
    }
    
    const availabilityUrl = `${BASE_URL}/fhir/v2/Slot?actor=Practitioner/${providerId}&start=le${start}&end=ge${end}&status=free`;
    const availRes = await fetch(availabilityUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        "x-api-key": apiKey,
      },
    });
    
    if (availRes.ok) {
      const availData = await availRes.json();
      if (availData.total === 0) {
        return NextResponse.json(
          { error: "No availability - conflict detected" },
          { status: 409 }
        );
      }
    } else {
      console.warn("Availability check failed, proceeding anyway");
    }
    
    const modmedUrl = `${BASE_URL}/fhir/v2/Appointment`;
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
    
    if (!response.ok) {
      const errorMessage = await response.text();
      console.error(`ModMed Appointment POST error: ${errorMessage}`);
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("POST /appointments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
