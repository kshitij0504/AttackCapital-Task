import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BASE_URL = process.env.MODMED_FHIR_BASE_URL;

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;
    const payload = await request.json();

    if (payload.start && payload.end) {
      const providerParticipant = payload.participant.find((p: any) => p.actor.reference.startsWith("Practitioner/"));
      const providerId = providerParticipant?.actor.reference.split("/")[1];
      if (providerId) {
        const availabilityUrl = `${BASE_URL}/Slot?actor=Practitioner/${providerId}&start=le${payload.start}&end=ge${payload.end}&status=free`;
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
              { error: "No availability for new time - conflict detected" },
              { status: 409 }
            );
          }
        } else {
          console.warn("Availability check failed, proceeding anyway");
        }
      }
    }

    const modmedUrl = `${BASE_URL}/Appointment/${id}`;

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
      console.error(`ModMed Appointment PUT error: ${errorMessage}`);
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
