import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("modmed_token")?.value;
    console.log(token);
    

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({ authenticated: true });
  } catch (error) {
    return NextResponse.json(
      { authenticated: false, error: "Verification failed" },
      { status: 500 }
    );
  }
}
