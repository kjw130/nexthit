// apps/web/app/api/recommendations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { getValidYouTubeVideoId } from '@/lib/getValidYoutubeVideo';

function getOpenAIClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
}

async function generateSongSuggestions(title: string, artist: string): Promise<{ title: string; artist: string; }[]> {
  const prompt = `Suggest 3 songs that are similar to "${title}" by "${artist}". The context is that this song is inputted by the user as one of those emotionally resonant "replay for weeks" tracks. Return ONLY a JSON array of {"title": string, "artist": string}, no other text.`;

  const openai = getOpenAIClient();
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = completion.choices[0].message.content ?? '';
  console.log('🧠 GPT raw output:', raw);

  let parsed: { title: string; artist: string }[] = [];

  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.warn('⚠️ GPT output not valid JSON. Trying fallback parse...');

    parsed = raw
      .split('\n')
      .map((line) => line.replace(/^[-*\d.]+\s*/, '').trim())
      .filter(Boolean)
      .map((line) => {
        const [titlePart, ...artistParts] = line.split(' - ');
        return {
          title: titlePart.trim(),
          artist: artistParts.join(' - ').trim(),
        };
      })
      .filter((s) => s.title && s.artist);
  }

  return parsed;
}

export async function POST(req: NextRequest) {
  const { title, artist } = await req.json();
  console.log('🎵 Request received:', title, artist);

  const suggestions = await generateSongSuggestions(title, artist);
  console.log('📜 Cleaned suggestions:', suggestions);

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
