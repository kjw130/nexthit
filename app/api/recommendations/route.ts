// apps/web/app/api/recommendations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { getValidYouTubeVideoId } from '@/lib/getValidYoutubeVideo';

function getOpenAIClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
}

async function generateSongSuggestions(title: string, artist: string): Promise<{ title: string; artist: string; }[]> {
  const prompt = `Suggest 3 songs that are similar to "${title}" by "${artist}". The context is that this song is inputted by the user as one of (Those) songs where you encounter once a month and it causes you to keep replaying and replaying because it clicks and they love it so much. This query is to find new songs that fit that bill. Respond as a JSON array of { "title": string, "artist": string }.`;
  const openai = getOpenAIClient();
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = completion.choices[0].message.content || '';
  return raw.split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [songTitle, ...rest] = line.split(' - ');
      return { title: songTitle.trim(), artist: rest.join(' - ').trim() };
    });
}

export async function POST(req: NextRequest) {
  const { title, artist } = await req.json();
  console.log('🎵 Request received:', title, artist);

  const suggestions = await generateSongSuggestions(title, artist);
  console.log('📜 GPT suggestions:', suggestions);

  const results = [];
  for (const song of suggestions) {
    const query = `${song.title} ${song.artist}`;
    const embedUrl = await getValidYouTubeVideoId(query);

    if (embedUrl) {
      results.push({
        id: embedUrl,
        title: song.title,
        artist: song.artist,
        youtubeEmbedUrl: embedUrl,
      });
      console.log(`✅ Found embed: ${embedUrl} for ${song.title} - ${song.artist}`);
    } else {
      console.warn(`❌ No valid YouTube video found for ${song.title} - ${song.artist}`);
    }

    if (results.length >= 10) break;
  }

  return NextResponse.json({ results });
}
