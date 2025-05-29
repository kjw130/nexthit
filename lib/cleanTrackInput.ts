export async function cleanTrackInput(title: string, artist: string) {
  const prompt = `The user entered the song title "${title}" and artist "${artist}". Clean this up to match Spotify's naming conventions. Respond ONLY as JSON: { "title": "...", "artist": "..." }`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await res.json();
  try {
    return JSON.parse(data.choices[0].message.content);
  } catch {

    return { title, artist }; // fallback to user input
  }
}
