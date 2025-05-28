// lib/getSpotifyToken.ts

export async function getSpotifyAccessToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
  const authString = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${authString}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await res.json();

  // 🔍 Debug: Log token and response shape
  console.log("🎟️ Spotify token:", data.access_token);
  if (!data.access_token) {
    console.error("❌ No access token returned:", data);
  }

  return data.access_token;
}
