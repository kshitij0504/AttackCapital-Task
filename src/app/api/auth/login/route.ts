import { NextResponse } from "next/server";

const TOKEN_ENDPOINT = process.env.MODMED_TOKEN_ENDPOINT;

export async function POST(request: Request) {
  try {
    const { username, password, apiKey } = await request.json();

    if (!username || !password || !apiKey) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    const params = new URLSearchParams();
    params.append("grant_type", "password");
    params.append("username", username);
    params.append("password", password);

    const response = await fetch(`${TOKEN_ENDPOINT}/ws/oauth2/grant`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "x-api-key": apiKey,
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData }, { status: response.status });
    }

    const tokenData = await response.json();

    const res = NextResponse.json(tokenData);
    res.cookies.set("modmed_token", tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: tokenData.expires_in || 3600,
      path: "/",
      sameSite: "lax",
    });

    res.cookies.set("api_key", apiKey, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600,
      path: "/",
      sameSite: "lax",
    })

    return res;
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
