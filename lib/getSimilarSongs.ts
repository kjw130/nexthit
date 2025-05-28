export async function getSimilarSongsFromGPT(title: string, artist: string) {
  const prompt = `Suggest 10 songs that are emotionally or sonically similar to "${title}" by "${artist}". Respond as a JSON array of { "title": string, "artist": string }.`;

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

  const json = await res.json();
  const text = json.choices[0].message.content;

  try {
    return JSON.parse(text);
  } catch {
    console.error("Failed to parse GPT response:", text);
    return [];
  }
}