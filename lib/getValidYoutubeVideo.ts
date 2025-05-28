export async function getValidYouTubeVideoId(query: string): Promise<string | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error("❌ Missing YOUTUBE_API_KEY");
    return null;
  }

  // 1. Search YouTube for videos matching the query
  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q=${encodeURIComponent(query)}&key=${apiKey}`;
  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json();

  if (!searchData.items || searchData.items.length === 0) return null;

  for (const item of searchData.items) {
    const videoId = item.id.videoId;

    // 2. Get video details to check embeddable flag
    const detailUrl = `https://www.googleapis.com/youtube/v3/videos?part=player,status&id=${videoId}&key=${apiKey}`;
    const detailRes = await fetch(detailUrl);
    const detailData = await detailRes.json();

    const video = detailData.items?.[0];
    const embeddable = video?.status?.embeddable;

    if (embeddable) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
  }

  return null;
}
