// apps/web/app/api/recommendations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { getValidYouTubeVideoId } from '@/lib/getValidYoutubeVideo';

function getOpenAIClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
}

async function generateSongSuggestions(title: string, artist: string): Promise<{ title: string; artist: string; }[]> {
  const prompt = `Give me a list of 10 songs similar to "${title}" by "${artist}". Format each as: Title - Artist.`;
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
