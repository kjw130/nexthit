export async function getSimilarSongsFromGPT(title: string, artist: string) {
    const prompt = `Suggest 3 songs that are similar to "${title}" by "${artist}". The context is that this song is inputted by the user as one of (Those) songs where you encounter once a month and it causes you to keep replaying and replaying because it clicks and they love it so much. This query is to find new songs that fit that bill. Respond as a JSON array of { "title": string, "artist": string }.`;


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
 
    return [];
  }
}