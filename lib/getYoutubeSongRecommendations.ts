export async function getYouTubeSongRecommendations(title: string, artist: string): Promise<{ title: string; artist: string; url: string }[]> {
  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: `Suggest 15 songs that are similar to "${title}" by "${artist}". The context is that this song is inputted by the user as one of (Those) songs where you encounter once a month and it causes you to keep replaying and replaying because it clicks and they love it so much. This query is to find new songs that fit that bill. Respond as a JSON array of { "title": string, "artist": string }.`,
        },
      ],
    }),
  });

  const json = await openaiRes.json();
  let raw = json.choices?.[0]?.message?.content || "[]";
  let songs: { title: string; artist: string }[] = [];

  try {
    songs = JSON.parse(raw);
  } catch (e) {
    console.error("Failed to parse GPT response:", raw);
    return [];
  }

  const verified: { title: string; artist: string; url: string }[] = [];

  for (const song of songs) {
    const searchQuery = encodeURIComponent(`${song.title} ${song.artist}`);
    const url = `https://www.youtube.com/results?search_query=${searchQuery}`;

    const res = await fetch(url);
    const text = await res.text();

    const videoMatch = text.match(/"videoId":"(.*?)"/);
    if (videoMatch?.[1]) {
      verified.push({
        ...song,
        url: `https://www.youtube.com/embed/${videoMatch[1]}`,
      });
    }

    if (verified.length >= 10) break;
  }

  return verified;
}
