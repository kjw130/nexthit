export async function searchSpotifyTrack(title: string, artist: string, token: string) {
  const query = encodeURIComponent(`track:${title} artist:${artist}`);
  const res = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  const track = data.tracks?.items?.[0];
  if (!data.tracks || data.tracks.items.length === 0) {
    console.warn(`❌ No tracks found on Spotify for "${title}" by "${artist}"`);
    return null;
  }

  return track.id;
}
