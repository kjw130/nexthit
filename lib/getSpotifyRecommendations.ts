// lib/getSpotifyRecommendations.ts

export async function getSpotifyRecommendations(seedTrackId: string, token: string) {
  const url = `https://api.spotify.com/v1/recommendations?seed_tracks=${seedTrackId}&limit=10`;

  console.log(`🧪 Full fetch URL: ${url}`);
  console.log(`🔐 Using token: ${token.slice(0, 20)}...`);

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorBody = await res.text(); // Only read body ONCE
    console.error(`❌ Spotify recommendations fetch failed: ${res.status} ${res.statusText}`);
    console.error(`Response body: "${errorBody}"`);
    return []; // Exit early
  }

  const data = await res.json();

  const recommendations = data.tracks.map((track: any) => ({
    id: track.id,
    title: track.name,
    artist: track.artists.map((a: any) => a.name).join(", "),
    preview_url: track.preview_url,
    image: track.album?.images?.[0]?.url ?? null,
    external_url: track.external_urls?.spotify,
  }));

  return recommendations;
}
