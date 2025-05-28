import { getSpotifyAccessToken } from '@/lib/getSpotifyToken';
import { cleanTrackInput } from '@/lib/cleanTrackInput';
import { searchSpotifyTrack } from '@/lib/searchSpotifyTrack';
import { getSpotifyRecommendations } from '@/lib/getSpotifyRecommendations';

export async function POST(req: Request) {
  const { title, artist } = await req.json();
  const token = await getSpotifyAccessToken();

  const cleaned = await cleanTrackInput(title, artist);
  console.log('🔍 Cleaned Input:', cleaned);

    const seedId = await searchSpotifyTrack(cleaned.title, cleaned.artist, token);
  console.log("🎯 Found seed track ID:", seedId);
  console.log(`🛰️ Fetching Spotify recommendations for seed ID: ${seedId}`);

  if (!seedId) {
    console.warn("⚠️ No valid seedId found, skipping recommendations");
    return Response.json({ results: [] });
  }
  const recommendations = await getSpotifyRecommendations(seedId, token);
  return Response.json({ results: recommendations });
}
